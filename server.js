const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");

const root = __dirname;
const host = "127.0.0.1";
const port = Number(process.env.PORT || 5173);
const maxBodySize = 220_000;
const maxOutputSize = 120_000;

const mimeTypes = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "application/javascript;charset=utf-8",
  ".json": "application/json;charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function sendJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json;charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

function sendText(response, status, text) {
  response.writeHead(status, { "Content-Type": "text/plain;charset=utf-8" });
  response.end(text);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBodySize) {
        reject(new Error("Code is too large for this local runner."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const requested = decoded === "/" ? "/index.html" : decoded;
  const normalized = path.normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(root, normalized);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

async function serveStatic(request, response) {
  const filePath = safeJoin(request.url);
  if (!filePath) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fsp.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    response.end(file);
  } catch (error) {
    sendText(response, 404, "Not found");
  }
}

function trimOutput(value) {
  const text = String(value || "");
  if (text.length <= maxOutputSize) return text;
  return `${text.slice(0, maxOutputSize)}\n\n[Output trimmed]`;
}

function runProcess(command, args, cwd, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = trimOutput(stdout + chunk.toString());
    });

    child.stderr.on("data", (chunk) => {
      stderr = trimOutput(stderr + chunk.toString());
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code, timedOut });
    });
  });
}

async function runFirstAvailable(candidates, cwd) {
  let missing = [];

  for (const candidate of candidates) {
    try {
      return await runProcess(candidate.command, candidate.args, cwd);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      missing.push(candidate.command);
    }
  }

  return {
    stdout: "",
    stderr: "",
    code: 127,
    timedOut: false,
    error: `Runner not found. Tried: ${missing.join(", ")}`,
  };
}

async function runPython(code, dir) {
  const file = path.join(dir, "program.py");
  await fsp.writeFile(file, code, "utf8");
  return runFirstAvailable(
    [
      { command: "python", args: [file] },
      { command: "py", args: ["-3", file] },
      { command: "python3", args: [file] },
    ],
    dir
  );
}

function detectJavaClassName(code) {
  const publicClass = code.match(/\bpublic\s+class\s+([A-Za-z_]\w*)/);
  if (publicClass) return publicClass[1];
  const anyClass = code.match(/\bclass\s+([A-Za-z_]\w*)/);
  return anyClass ? anyClass[1] : "Main";
}

async function runJava(code, dir) {
  const className = detectJavaClassName(code);
  const file = path.join(dir, `${className}.java`);
  await fsp.writeFile(file, code, "utf8");

  try {
    const compile = await runProcess("javac", [file], dir);
    if (compile.code !== 0 || compile.timedOut) return compile;
    return runProcess("java", ["-cp", dir, className], dir);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        stdout: "",
        stderr: "",
        code: 127,
        timedOut: false,
        error: "Java runner not found. Install JDK so javac and java are available.",
      };
    }
    throw error;
  }
}

async function runCompiled(code, dir, language) {
  const isCpp = language === "cpp";
  const sourceFile = path.join(dir, isCpp ? "program.cpp" : "program.c");
  const outputFile = path.join(dir, process.platform === "win32" ? "program.exe" : "program");
  const compiler = isCpp ? "g++" : "gcc";
  await fsp.writeFile(sourceFile, code, "utf8");

  try {
    const compile = await runProcess(compiler, [sourceFile, "-o", outputFile], dir);
    if (compile.code !== 0 || compile.timedOut) return compile;
    return runProcess(outputFile, [], dir);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        stdout: "",
        stderr: "",
        code: 127,
        timedOut: false,
        error: `${compiler} runner not found. Install a C/C++ compiler and try again.`,
      };
    }
    throw error;
  }
}

async function runCode(language, code) {
  const dir = path.join(os.tmpdir(), `code-converter-${crypto.randomUUID()}`);
  await fsp.mkdir(dir, { recursive: true });

  try {
    if (language === "python") return await runPython(code, dir);
    if (language === "java") return await runJava(code, dir);
    if (language === "c" || language === "cpp") return await runCompiled(code, dir, language);
    return { stdout: "", stderr: "", code: 400, timedOut: false, error: "Unsupported language." };
  } finally {
    await fsp.rm(dir, { recursive: true, force: true });
  }
}

async function handleRun(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body || "{}");
    const language = String(payload.language || "").toLowerCase();
    const code = String(payload.code || "");

    if (!["python", "java", "c", "cpp"].includes(language)) {
      sendJson(response, 400, { error: "Unsupported language." });
      return;
    }

    if (!code.trim()) {
      sendJson(response, 200, { stdout: "", stderr: "", code: 0, timedOut: false });
      return;
    }

    const result = await runCode(language, code);
    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 500, {
      stdout: "",
      stderr: "",
      code: 1,
      timedOut: false,
      error: error.message || "Runner failed.",
    });
  }
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/run") {
    handleRun(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    serveStatic(request, response);
    return;
  }

  sendText(response, 405, "Method not allowed");
});

server.listen(port, host, () => {
  console.log(`Code Converter Studio is running at http://${host}:${port}`);
});
