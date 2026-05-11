const codeInput = document.getElementById("codeInput");
const lineGutter = document.getElementById("lineGutter");
const detectedLanguage = document.getElementById("detectedLanguage");
const languageSelect = document.getElementById("languageSelect");
const runBtn = document.getElementById("runBtn");
const sampleBtn = document.getElementById("sampleBtn");
const engineStatus = document.getElementById("engineStatus");
const htmlPreview = document.getElementById("htmlPreview");
const consoleOutput = document.getElementById("consoleOutput");
const reportOutput = document.getElementById("reportOutput");
const reportTemplate = document.getElementById("reportTemplate");
const workspace = document.getElementById("workspace");
const splitter = document.getElementById("splitter");
const sharePanelToggle = document.getElementById("sharePanelToggle");
const sharePanel = document.getElementById("sharePanel");
const shareContent = document.getElementById("shareContent");
const shareFormat = document.getElementById("shareFormat");
const systemShareBtn = document.getElementById("systemShareBtn");
const whatsappShareBtn = document.getElementById("whatsappShareBtn");
const tabs = Array.from(document.querySelectorAll(".tab"));
const exportButtons = Array.from(document.querySelectorAll(".export-btn"));

const languageNames = {
  html: "HTML / CSS / JS",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  text: "Plain text",
};

const sampleCode = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      color: #15202b;
      background:
        linear-gradient(120deg, rgba(20, 118, 111, 0.08), transparent 36%),
        #f6f8f4;
    }

    .sheet {
      max-width: 860px;
      margin: 18px auto;
      padding: 24px;
      border: 1px solid #dce3da;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 18px 48px rgba(20, 33, 61, 0.1);
    }

    .hero {
      padding: 24px;
      border-radius: 14px;
      color: white;
      background: linear-gradient(130deg, #14766f, #315f9d 56%, #df6546);
    }

    h1 {
      margin: 0;
      font-size: 40px;
      line-height: 1;
    }

    p {
      max-width: 690px;
      margin: 12px 0 0;
      font-size: 16px;
      line-height: 1.55;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin: 18px 0;
    }

    .metric {
      padding: 14px;
      border: 1px solid #e2e8df;
      border-radius: 12px;
      background: #fbfcf9;
    }

    .metric span {
      display: block;
      color: #14766f;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .metric strong {
      display: block;
      margin-top: 7px;
      font-size: 22px;
    }

    table {
      width: 100%;
      margin-top: 8px;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8df;
      text-align: left;
    }

    th {
      color: #14766f;
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main class="sheet">
    <section class="hero">
      <h1>Project Output</h1>
      <p>This rendered page can be exported as PDF, Word, Excel, CSV, or TXT from your new workspace.</p>
    </section>

    <section class="metrics">
      <div class="metric">
        <span>Formats</span>
        <strong>5</strong>
      </div>
      <div class="metric">
        <span>Share</span>
        <strong>Ready</strong>
      </div>
      <div class="metric">
        <span>Mode</span>
        <strong>Auto</strong>
      </div>
    </section>

    <table>
      <tr>
        <th>Format</th>
        <th>Status</th>
        <th>Use</th>
      </tr>
      <tr>
        <td>PDF</td>
        <td>Ready</td>
        <td>Printable rendered output</td>
      </tr>
      <tr>
        <td>XLS / CSV</td>
        <td>Ready</td>
        <td>Spreadsheet-friendly result data</td>
      </tr>
      <tr>
        <td>DOC / TXT</td>
        <td>Ready</td>
        <td>Shareable code run report</td>
      </tr>
    </table>
  </main>

  <script>
    console.log("Export pipeline ready");
  <\/script>
</body>
</html>`;

const state = {
  activeTab: "preview",
  code: "",
  consoleLines: [],
  htmlDocument: "",
  language: "html",
  lineCount: 1,
  outputText: "",
  runId: 0,
};

let runTimer = 0;
let toastTimer = 0;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripQuotes(value) {
  const text = String(value ?? "").trim();
  const first = text[0];
  const last = text[text.length - 1];
  if ((first === '"' || first === "'" || first === "`") && first === last) {
    return text.slice(1, -1).replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return text;
}

function detectLanguage(code) {
  const source = code.trim();
  if (!source) return "text";
  if (/<!doctype|<html[\s>]|<style[\s>]|<script[\s>]|<\/[a-z][\w-]*>/i.test(source)) return "html";
  if (/public\s+class|System\.out\.print|static\s+void\s+main\s*\(/.test(source)) return "java";
  if (/#include\s*<iostream>|std::|cout\s*<</.test(source)) return "cpp";
  if (/#include\s*<stdio\.h>|printf\s*\(|scanf\s*\(/.test(source)) return "c";
  if (/\bdef\s+\w+\s*\(|\bprint\s*\(|\bfrom\s+\w+\s+import\b|\bimport\s+\w+|if\s+__name__\s*==/.test(source)) return "python";
  if (/\bconsole\.log\s*\(|\bfunction\s+\w+\s*\(|=>|\bconst\s+\w+|\blet\s+\w+|\bdocument\.|\bwindow\./.test(source)) return "javascript";
  if (/<[a-z][\s\S]*>/i.test(source)) return "html";
  return "text";
}

function getRunLanguage() {
  return languageSelect.value === "auto" ? detectLanguage(codeInput.value) : languageSelect.value;
}

function updateLanguageDisplay() {
  const detected = detectLanguage(codeInput.value);
  const selected = languageSelect.value;
  detectedLanguage.textContent = selected === "auto" ? languageNames[detected] : languageNames[selected];
}

function setStatus(text) {
  engineStatus.textContent = text;
}

function updateGutter() {
  const lines = codeInput.value.split("\n").length || 1;
  state.lineCount = lines;
  lineGutter.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
}

function syncGutterScroll() {
  lineGutter.scrollTop = codeInput.scrollTop;
}

function clearConsole() {
  state.consoleLines = [];
  consoleOutput.textContent = "";
}

function appendConsole(level, message) {
  const prefix = level === "log" || level === "info" ? "" : `${level.toUpperCase()}: `;
  state.consoleLines.push(`${prefix}${message}`);
  consoleOutput.textContent = state.consoleLines.join("\n");
  state.outputText = collectOutputText();
  updateReport();
}

function collectOutputText() {
  const previewText = getPreviewText();
  const consoleText = state.consoleLines.join("\n").trim();
  if (previewText && consoleText) return `${previewText}\n\nConsole:\n${consoleText}`;
  return previewText || consoleText || state.outputText || "";
}

function getPreviewText() {
  try {
    return htmlPreview.contentDocument?.body?.innerText?.trim() || "";
  } catch (error) {
    return "";
  }
}

function getLanguageLabel() {
  return languageNames[state.language] || languageNames[getRunLanguage()] || "Code";
}

function getOutputText() {
  return collectOutputText() || state.outputText || "No output yet.";
}

function getSourceCode() {
  return state.code || codeInput.value || "";
}

function makeConsoleHook(runId) {
  return `<script>
    (() => {
      const runId = ${JSON.stringify(runId)};
      const send = (level, args) => {
        const message = args.map((item) => {
          if (item instanceof Error) return item.stack || item.message;
          if (typeof item === "object") {
            try { return JSON.stringify(item, null, 2); } catch (error) { return String(item); }
          }
          return String(item);
        }).join(" ");
        parent.postMessage({ source: "converter-console", runId, level, message }, "*");
      };

      ["log", "info", "warn", "error"].forEach((level) => {
        const original = console[level];
        console[level] = (...args) => {
          send(level, args);
          original.apply(console, args);
        };
      });

      window.addEventListener("error", (event) => send("error", [event.message]));
      window.addEventListener("unhandledrejection", (event) => send("error", [event.reason || "Unhandled promise rejection"]));
    })();
  <\/script>`;
}

function injectHookIntoHtml(code, hook) {
  if (/<\/head>/i.test(code)) return code.replace(/<\/head>/i, `${hook}</head>`);
  if (/<script[\s>]/i.test(code)) return code.replace(/<script/i, `${hook}<script`);
  if (/<body[^>]*>/i.test(code)) return code.replace(/<body[^>]*>/i, (match) => `${match}${hook}`);
  if (/<html[\s>]/i.test(code) || /<!doctype/i.test(code)) return `${hook}${code}`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${hook}
</head>
<body>
  ${code}
</body>
</html>`;
}

function normalizeHtmlDocument(code) {
  const source = String(code || "");
  if (/<html[\s>]/i.test(source) || /<!doctype/i.test(source)) return source;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  ${source}
</body>
</html>`;
}

function hasVisiblePreviewContent() {
  try {
    const doc = htmlPreview.contentDocument;
    const body = doc?.body;
    if (!body) return false;
    if (body.children.length > 0) return true;
    return Boolean(body.innerText.trim());
  } catch (error) {
    return false;
  }
}

function renderSourcePreviewFallback(code) {
  renderIframeDocument(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 28px;
      color: #15171d;
      background: #fbfcf9;
      font-family: Inter, Arial, sans-serif;
    }

    .fallback {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px;
      border: 1px solid #d9ded6;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 18px 48px rgba(21, 23, 29, 0.08);
    }

    span {
      color: #14766f;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 8px 0 14px;
      font-size: 34px;
      line-height: 1;
    }

    p {
      margin: 0 0 16px;
      color: #667085;
      line-height: 1.6;
    }

    pre {
      margin: 0;
      padding: 18px;
      overflow: auto;
      border-radius: 14px;
      color: #d9f7e8;
      background: #111417;
      font: 13px/1.65 "JetBrains Mono", Consolas, monospace;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <main class="fallback">
    <span>Preview fallback</span>
    <h1>Source preview</h1>
    <p>The browser could not render this HTML as a visual document, so the source is shown safely.</p>
    <pre>${escapeHtml(code)}</pre>
  </main>
</body>
</html>`);
}

function renderIframeDocument(html) {
  const documentHtml = String(html || "");
  htmlPreview.onload = null;

  try {
    htmlPreview.removeAttribute("src");
    htmlPreview.srcdoc = "";
    const frameDocument = htmlPreview.contentWindow?.document;
    if (!frameDocument) throw new Error("Preview frame is not ready.");
    frameDocument.open();
    frameDocument.write(documentHtml);
    frameDocument.close();
    return true;
  } catch (error) {
    htmlPreview.srcdoc = documentHtml;
    return false;
  }
}

function runHtml(code) {
  clearConsole();
  state.runId += 1;
  state.language = "html";
  state.htmlDocument = normalizeHtmlDocument(code);
  renderIframeDocument(state.htmlDocument);
  window.setTimeout(() => {
    if (!hasVisiblePreviewContent() && code.trim()) {
      renderSourcePreviewFallback(code);
      setStatus("Preview fallback");
      return;
    }

    state.outputText = collectOutputText();
    updateReport();
    setStatus("Rendered");
  }, 120);
  setActiveTab("preview");
}

function runJavaScript(code) {
  clearConsole();
  state.runId += 1;
  state.language = "javascript";
  const hook = makeConsoleHook(state.runId);
  const safeCode = code.replace(/<\/script>/gi, "<\\/script>");
  state.htmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 28px;
      color: #15171d;
      background: #fbfcf9;
      font-family: Inter, Arial, sans-serif;
    }

    #app {
      min-height: 180px;
      padding: 24px;
      border: 1px solid #d9ded6;
      border-radius: 14px;
      background: #fff;
    }
  </style>
  ${hook}
</head>
<body>
  <div id="app"></div>
  <script>
    (async () => {
      try {
        const result = await (async () => {
          ${safeCode}
        })();
        if (result !== undefined) console.log(result);
      } catch (error) {
        console.error(error && (error.stack || error.message) ? (error.stack || error.message) : error);
      }
    })();
  <\/script>
</body>
</html>`;

  htmlPreview.onload = () => {
    state.outputText = collectOutputText();
    updateReport();
    setStatus("Rendered");
  };
  htmlPreview.srcdoc = state.htmlDocument;
  setActiveTab("console");
}

function splitArguments(value) {
  const parts = [];
  let current = "";
  let quote = "";
  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if (quote) {
      current += char;
      if (char === quote && previous !== "\\") quote = "";
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") depth += 1;
    if (char === ")" || char === "]" || char === "}") depth -= 1;

    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function splitConcat(value) {
  const parts = [];
  let current = "";
  let quote = "";
  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const previous = value[index - 1];

    if (quote) {
      current += char;
      if (char === quote && previous !== "\\") quote = "";
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;

    if (char === "+" && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function buildVariableMap(code, language) {
  const variables = {};
  const patterns = [
    /^\s*([A-Za-z_]\w*)\s*=\s*(.+)$/gm,
    /\b(?:let|const|var|String|int|double|float|boolean|char|long|short|auto)\s+([A-Za-z_]\w*)\s*=\s*([^;]+);/g,
  ];

  patterns.forEach((pattern) => {
    let match = pattern.exec(code);
    while (match) {
      const name = match[1];
      const raw = match[2].trim().replace(/;$/, "");
      if (!/\s/.test(name)) variables[name] = evaluateValue(raw, variables, language);
      match = pattern.exec(code);
    }
  });

  return variables;
}

function evaluateValue(value, variables = {}, language = "text") {
  let text = String(value ?? "").trim().replace(/;$/, "");
  if (!text) return "";

  if (/^f["']/.test(text) && language === "python") {
    const quote = text[1];
    text = text.slice(2, text.lastIndexOf(quote));
    return text.replace(/\{([A-Za-z_]\w*)\}/g, (_, key) => variables[key] ?? `{${key}}`);
  }

  if (variables[text] !== undefined) return variables[text];
  if (/^["'`][\s\S]*["'`]$/.test(text)) return stripQuotes(text);

  const concatParts = splitConcat(text);
  if (concatParts.length > 1) {
    return concatParts.map((part) => evaluateValue(part, variables, language)).join("");
  }

  if (/^[\d\s+\-*/().%]+$/.test(text)) {
    try {
      return String(Function(`"use strict"; return (${text});`)());
    } catch (error) {
      return text;
    }
  }

  return text;
}

function inferPython(code) {
  const variables = buildVariableMap(code, "python");
  const lines = [];

  code.split("\n").forEach((line) => {
    const match = line.match(/^\s*print\s*\(([\s\S]*)\)\s*$/);
    if (!match) return;
    const output = splitArguments(match[1]).map((item) => evaluateValue(item, variables, "python")).join(" ");
    lines.push(output);
  });

  return lines;
}

function inferJava(code) {
  const variables = buildVariableMap(code, "java");
  const lines = [];
  const pattern = /System\.out\.(print|println)\s*\(([\s\S]*?)\)\s*;/g;
  let match = pattern.exec(code);

  while (match) {
    lines.push(evaluateValue(match[2], variables, "java"));
    match = pattern.exec(code);
  }

  return lines;
}

function formatPrintf(formatValue, args, variables, language) {
  let index = 0;
  let output = stripQuotes(formatValue);
  output = output.replace(/%[-+0-9.]*[sdifc]/g, () => evaluateValue(args[index++] ?? "", variables, language));
  return output.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function inferC(code) {
  const variables = buildVariableMap(code, "c");
  const lines = [];
  const pattern = /printf\s*\(([\s\S]*?)\)\s*;/g;
  let match = pattern.exec(code);

  while (match) {
    const args = splitArguments(match[1]);
    if (args.length) lines.push(formatPrintf(args[0], args.slice(1), variables, "c"));
    match = pattern.exec(code);
  }

  return lines;
}

function inferCpp(code) {
  const variables = buildVariableMap(code, "cpp");
  const lines = [];

  code.split("\n").forEach((line) => {
    const match = line.match(/cout\s*<<\s*([\s\S]*);/);
    if (!match) return;
    const output = match[1]
      .split("<<")
      .map((part) => part.trim())
      .filter((part) => part && part !== "endl" && part !== "std::endl")
      .map((part) => evaluateValue(part, variables, "cpp"))
      .join("");
    lines.push(output);
  });

  return lines;
}

function inferOutput(language, code) {
  if (language === "python") return inferPython(code);
  if (language === "java") return inferJava(code);
  if (language === "c") return inferC(code);
  if (language === "cpp") return inferCpp(code);
  return code.trim() ? [code.trim()] : [];
}

function renderTextPreview(language, output) {
  const title = languageNames[language] || "Output";
  const body = output.trim()
    ? `<pre>${escapeHtml(output)}</pre>`
    : `<p class="empty">No printed output was detected.</p>`;

  htmlPreview.srcdoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 34px;
      color: #15171d;
      background: #fbfcf9;
      font-family: Inter, Arial, sans-serif;
    }

    .page {
      max-width: 920px;
      margin: 0 auto;
      padding: 30px;
      border: 1px solid #d9ded6;
      border-radius: 18px;
      background: white;
      box-shadow: 0 22px 60px rgba(21, 23, 29, 0.1);
    }

    span {
      color: #14766f;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1 {
      margin: 8px 0 20px;
      font-size: 42px;
      line-height: 1;
    }

    pre {
      min-height: 180px;
      margin: 0;
      padding: 20px;
      overflow: auto;
      border-radius: 14px;
      color: #d9f7e8;
      background: #111417;
      font: 15px/1.7 "JetBrains Mono", Consolas, monospace;
      white-space: pre-wrap;
    }

    .empty {
      margin: 0;
      padding: 20px;
      border: 1px dashed #d9ded6;
      border-radius: 14px;
      color: #667085;
      background: #fbfcf9;
    }
  </style>
</head>
<body>
  <main class="page">
    <span>${escapeHtml(title)}</span>
    <h1>Run Output</h1>
    ${body}
  </main>
</body>
</html>`;
}

function runStaticLanguage(language, code) {
  clearConsole();
  state.language = language;
  const inferred = inferOutput(language, code);
  const output = inferred.join("\n");
  const fallback = output || "No printed output was detected.";
  state.outputText = fallback;
  consoleOutput.textContent = fallback;
  renderTextPreview(language, fallback);
  updateReport();
  setStatus("Previewed");
  setActiveTab("preview");
}

async function runServerLanguage(language, code) {
  if (location.protocol === "file:") return false;
  if (!["python", "java", "c", "cpp"].includes(language)) return false;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
      signal: controller.signal,
    });

    if (!response.ok) return false;
    const result = await response.json();
    clearConsole();
    state.language = language;
    const parts = [result.stdout, result.stderr, result.error].filter(Boolean);
    const output = parts.join("\n").trim() || "Program finished with no output.";
    state.outputText = output;
    consoleOutput.textContent = output;
    renderTextPreview(language, output);
    updateReport();
    setStatus(result.timedOut ? "Timed out" : "Ran");
    setActiveTab("preview");
    return true;
  } catch (error) {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

async function runCode() {
  const code = codeInput.value;
  const language = getRunLanguage();
  state.code = code;
  updateLanguageDisplay();
  setStatus("Running");

  if (!code.trim()) {
    clearConsole();
    state.outputText = "";
    renderTextPreview("text", "");
    updateReport();
    setStatus("Ready");
    return;
  }

  if (language === "html") {
    runHtml(code);
    return;
  }

  if (language === "javascript") {
    runJavaScript(code);
    return;
  }

  if (await runServerLanguage(language, code)) return;
  runStaticLanguage(language, code);
}

function scheduleRun() {
  window.clearTimeout(runTimer);
  updateGutter();
  updateLanguageDisplay();
  setStatus("Detecting");
  runTimer = window.setTimeout(() => {
    runCode();
  }, 650);
}

function setActiveTab(tabName) {
  state.activeTab = tabName;
  htmlPreview.hidden = tabName !== "preview";
  consoleOutput.hidden = tabName !== "console";
  reportOutput.hidden = tabName !== "report";
  tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  if (tabName === "report") updateReport();
}

function updateReport() {
  const fragment = reportTemplate.content.cloneNode(true);
  const language = languageNames[state.language] || languageNames[getRunLanguage()];
  const output = collectOutputText() || state.outputText || "No output yet.";

  fragment.getElementById("reportSummary").textContent = `${language} output generated from ${state.lineCount} line${state.lineCount === 1 ? "" : "s"} of source code.`;
  fragment.getElementById("reportLanguage").textContent = language;
  fragment.getElementById("reportLines").textContent = String(state.lineCount);
  fragment.getElementById("reportDate").textContent = new Date().toLocaleString();
  fragment.getElementById("reportRenderedOutput").innerHTML = `<pre>${escapeHtml(output)}</pre>`;
  fragment.getElementById("reportSourceCode").textContent = state.code || codeInput.value || "";

  reportOutput.innerHTML = "";
  reportOutput.appendChild(fragment);
}

function buildReportHtml() {
  const language = getLanguageLabel();
  const output = getOutputText();
  const generated = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Code Run Report</title>
  <style>
    body {
      margin: 0;
      padding: 32px;
      color: #15171d;
      font-family: Arial, sans-serif;
      background: #ffffff;
    }

    .hero {
      padding: 28px;
      border-radius: 14px;
      color: #ffffff;
      background: #14766f;
    }

    h1 {
      margin: 0;
      font-size: 38px;
    }

    .meta {
      display: table;
      width: 100%;
      margin: 22px 0;
      border-collapse: collapse;
    }

    .meta div {
      display: table-cell;
      padding: 13px;
      border: 1px solid #d9ded6;
    }

    pre {
      padding: 18px;
      border: 1px solid #d9ded6;
      border-radius: 10px;
      background: #f7f9f5;
      white-space: pre-wrap;
      font-family: Consolas, monospace;
    }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Code Run Report</h1>
    <p>Generated output from the Code Converter Studio workspace.</p>
  </section>
  <section class="meta">
    <div><strong>Language</strong><br>${escapeHtml(language)}</div>
    <div><strong>Lines</strong><br>${state.lineCount}</div>
    <div><strong>Generated</strong><br>${escapeHtml(generated)}</div>
  </section>
  <h2>Output</h2>
  <pre>${escapeHtml(output)}</pre>
  <h2>Source Code</h2>
  <pre>${escapeHtml(state.code || codeInput.value)}</pre>
</body>
</html>`;
}

function getExportData(mode = "report") {
  const language = getLanguageLabel();
  const output = getOutputText();
  const preview = getPreviewText() || output || "No preview yet.";
  const code = getSourceCode();
  const generated = new Date().toLocaleString();
  const modeLabel = {
    all: "All",
    report: "Output + code",
    preview: "Preview only",
    output: "Output only",
    code: "Code only",
  }[mode] || "Output + code";

  return {
    code,
    generated,
    language,
    lineCount: state.lineCount,
    mode,
    modeLabel,
    output,
    preview,
    title: mode === "code"
      ? "Source Code"
      : mode === "preview"
        ? "Preview"
        : mode === "all"
          ? "Full Code Package"
          : "Code Run Report",
  };
}

function buildPlainPayload(data) {
  if (data.mode === "all") {
    return [
      "FULL CODE RUN PACKAGE",
      "",
      `Language: ${data.language}`,
      `Lines: ${data.lineCount}`,
      `Generated: ${data.generated}`,
      "",
      "PREVIEW",
      data.preview,
      "",
      "OUTPUT",
      data.output,
      "",
      "SOURCE CODE",
      data.code,
    ].join("\n");
  }

  if (data.mode === "code") {
    return [
      "SOURCE CODE",
      "",
      `Language: ${data.language}`,
      `Lines: ${data.lineCount}`,
      `Generated: ${data.generated}`,
      "",
      data.code,
    ].join("\n");
  }

  if (data.mode === "preview") {
    return [
      "PREVIEW",
      "",
      `Language: ${data.language}`,
      `Generated: ${data.generated}`,
      "",
      data.preview,
    ].join("\n");
  }

  if (data.mode === "output") {
    return [
      "RUN OUTPUT",
      "",
      `Language: ${data.language}`,
      `Generated: ${data.generated}`,
      "",
      data.output,
    ].join("\n");
  }

  return [
    "CODE RUN REPORT",
    "",
    `Language: ${data.language}`,
    `Lines: ${data.lineCount}`,
    `Generated: ${data.generated}`,
    "",
    "OUTPUT",
    data.output,
    "",
    "SOURCE CODE",
    data.code,
  ].join("\n");
}

function buildDocumentPayload(data) {
  const previewSection = ["all", "preview"].includes(data.mode)
    ? `<h2>Preview</h2><pre>${escapeHtml(data.preview)}</pre>`
    : "";
  const outputSection = ["all", "report", "output"].includes(data.mode)
    ? `<h2>Output</h2><pre>${escapeHtml(data.output)}</pre>`
    : "";
  const codeSection = ["all", "report", "code"].includes(data.mode)
    ? `<h2>Source Code</h2><pre>${escapeHtml(data.code)}</pre>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(data.title)}</title>
  <style>
    body { margin: 0; padding: 32px; color: #15171d; font-family: Arial, sans-serif; background: #ffffff; }
    .hero { padding: 28px; border-radius: 14px; color: #ffffff; background: #14766f; }
    h1 { margin: 0; font-size: 38px; }
    .meta { display: table; width: 100%; margin: 22px 0; border-collapse: collapse; }
    .meta div { display: table-cell; padding: 13px; border: 1px solid #d9ded6; }
    pre { padding: 18px; border: 1px solid #d9ded6; border-radius: 10px; background: #f7f9f5; white-space: pre-wrap; font-family: Consolas, monospace; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>${escapeHtml(data.title)}</h1>
    <p>${escapeHtml(data.modeLabel)}</p>
  </section>
  <section class="meta">
    <div><strong>Language</strong><br>${escapeHtml(data.language)}</div>
    <div><strong>Lines</strong><br>${data.lineCount}</div>
    <div><strong>Generated</strong><br>${escapeHtml(data.generated)}</div>
  </section>
  ${previewSection}
  ${outputSection}
  ${codeSection}
</body>
</html>`;
}

function buildSheetPayload(data) {
  const rows = [
    ["Field", "Value"],
    ["Content", data.modeLabel],
    ["Language", data.language],
    ["Lines", data.lineCount],
    ["Generated", data.generated],
  ];

  if (["all", "preview"].includes(data.mode)) rows.push(["Preview", data.preview]);
  if (["all", "report", "output"].includes(data.mode)) rows.push(["Output", data.output]);
  if (["all", "report", "code"].includes(data.mode)) rows.push(["Source Code", data.code]);

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
  <table border="1">
    ${rows.map((row) => `<tr><th>${escapeHtml(row[0])}</th><td><pre>${escapeHtml(row[1])}</pre></td></tr>`).join("")}
  </table>
</body>
</html>`;
}

function buildCsvPayload(data) {
  const rows = [
    ["Field", "Value"],
    ["Content", data.modeLabel],
    ["Language", data.language],
    ["Lines", data.lineCount],
    ["Generated", data.generated],
  ];

  if (["all", "preview"].includes(data.mode)) rows.push(["Preview", data.preview]);
  if (["all", "report", "output"].includes(data.mode)) rows.push(["Output", data.output]);
  if (["all", "report", "code"].includes(data.mode)) rows.push(["Source Code", data.code]);
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function pdfEscape(value) {
  return String(value ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapPdfText(text, width = 88) {
  const wrapped = [];
  String(text || "").replace(/\r/g, "").split("\n").forEach((line) => {
    const value = line.replace(/\t/g, "    ");
    if (!value) {
      wrapped.push("");
      return;
    }

    for (let index = 0; index < value.length; index += width) {
      wrapped.push(value.slice(index, index + width));
    }
  });
  return wrapped;
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function getPreviewCaptureSize(doc) {
  const body = doc.body;
  const root = doc.documentElement;
  const width = Math.max(
    root?.scrollWidth || 0,
    body?.scrollWidth || 0,
    htmlPreview.clientWidth || 800,
    800
  );
  const height = Math.max(
    root?.scrollHeight || 0,
    body?.scrollHeight || 0,
    htmlPreview.clientHeight || 1000,
    1000
  );

  return {
    width: Math.ceil(Math.min(width, 1800)),
    height: Math.ceil(Math.min(height, 18000)),
  };
}

async function capturePreviewCanvas() {
  const doc = htmlPreview.contentDocument;
  if (!doc || !doc.documentElement) throw new Error("Preview is not ready.");

  const { width, height } = getPreviewCaptureSize(doc);
  const clone = doc.documentElement.cloneNode(true);
  const style = doc.createElement("style");
  style.textContent = `
    html, body {
      width: ${width}px !important;
      min-height: ${height}px !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `;
  clone.querySelector("head")?.appendChild(style);

  let html = new XMLSerializer().serializeToString(clone);
  if (!/^<html[^>]+xmlns=/i.test(html)) {
    html = html.replace(/^<html/i, '<html xmlns="http://www.w3.org/1999/xhtml"');
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <foreignObject width="100%" height="100%">
    ${html}
  </foreignObject>
</svg>`;

  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(svgUrl);
    const maxPixels = 18_000_000;
    const scale = Math.min(2, Math.max(0.7, Math.sqrt(maxPixels / (width * height))));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(width * scale));
    canvas.height = Math.max(1, Math.floor(height * scale));
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

function createPdfFromCanvas(canvas) {
  const encoder = new TextEncoder();
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 18;
  const drawWidth = pageWidth - margin * 2;
  const scale = drawWidth / canvas.width;
  const maxSliceHeight = Math.floor((pageHeight - margin * 2) / scale);
  const slices = [];

  for (let y = 0; y < canvas.height; y += maxSliceHeight) {
    const sliceHeight = Math.min(maxSliceHeight, canvas.height - y);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const context = slice.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, slice.width, slice.height);
    context.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
    slices.push({
      bytes: dataUrlToBytes(slice.toDataURL("image/jpeg", 0.95)),
      height: sliceHeight,
      width: canvas.width,
    });
  }

  const pages = slices.map((slice, index) => ({
    pageId: 3 + index * 3,
    contentId: 4 + index * 3,
    imageId: 5 + index * 3,
    imageName: `Im${index}`,
    ...slice,
  }));

  const parts = [];
  const offsets = [0];
  let byteLength = 0;

  function add(part) {
    parts.push(part);
    byteLength += typeof part === "string" ? encoder.encode(part).length : part.byteLength;
  }

  function addObject(id, content) {
    offsets[id] = byteLength;
    add(`${id} 0 obj\n${content}\nendobj\n`);
  }

  add("%PDF-1.4\n");
  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(2, `<< /Type /Pages /Kids [${pages.map((page) => `${page.pageId} 0 R`).join(" ")}] /Count ${pages.length} >>`);

  pages.forEach((page) => {
    const drawHeight = page.height * scale;
    const drawY = pageHeight - margin - drawHeight;
    const stream = `q\n${drawWidth} 0 0 ${drawHeight} ${margin} ${drawY} cm\n/${page.imageName} Do\nQ`;

    addObject(
      page.pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /${page.imageName} ${page.imageId} 0 R >> >> /Contents ${page.contentId} 0 R >>`
    );
    addObject(page.contentId, `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`);

    offsets[page.imageId] = byteLength;
    add(`${page.imageId} 0 obj\n`);
    add(`<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.byteLength} >>\nstream\n`);
    add(page.bytes);
    add("\nendstream\nendobj\n");
  });

  const xrefOffset = byteLength;
  const size = Math.max(...Object.keys(offsets).map(Number)) + 1;
  add(`xref\n0 ${size}\n`);
  add("0000000000 65535 f \n");
  for (let id = 1; id < size; id += 1) {
    add(`${String(offsets[id] || 0).padStart(10, "0")} 00000 n \n`);
  }
  add(`trailer\n<< /Size ${size} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

async function createPreviewSnapshotPdfBlob() {
  const canvas = await capturePreviewCanvas();
  return createPdfFromCanvas(canvas);
}

function textWidth(value, fontSize) {
  return String(value || "").length * fontSize * 0.52;
}

function wrapPdfTextByWidth(text, maxWidth, fontSize) {
  const maxChars = Math.max(18, Math.floor(maxWidth / (fontSize * 0.52)));
  const output = [];

  String(text || "").replace(/\r/g, "").split("\n").forEach((paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      output.push("");
      return;
    }

    let line = "";
    words.forEach((word) => {
      if (!line) {
        line = word;
        return;
      }

      if ((line + " " + word).length <= maxChars) {
        line += " " + word;
      } else {
        output.push(line);
        line = word;
      }
    });

    if (line) output.push(line);
  });

  return output;
}

function pdfTextCommand(text, x, y, size = 11, font = "F1", color = [0.09, 0.09, 0.11]) {
  return [
    "BT",
    `${color.join(" ")} rg`,
    `/${font} ${size} Tf`,
    `${x} ${y} Td`,
    `(${pdfEscape(text)}) Tj`,
    "ET",
  ].join("\n");
}

function pdfRectCommand(x, y, width, height, color) {
  return `${color.join(" ")} rg\n${x} ${y} ${width} ${height} re f`;
}

function pdfStrokeRectCommand(x, y, width, height, color = [0.85, 0.87, 0.84]) {
  return `${color.join(" ")} RG\n0.8 w\n${x} ${y} ${width} ${height} re S`;
}

function createStyledPdfBlob(data) {
  const encoder = new TextEncoder();
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 42;
  const pageBottom = 42;
  const usableWidth = pageWidth - margin * 2;
  const brandTeal = [0.08, 0.46, 0.43];
  const brandBlue = [0.19, 0.37, 0.62];
  const brandClay = [0.87, 0.4, 0.27];
  const paper = [0.96, 0.97, 0.94];
  const ink = [0.08, 0.09, 0.12];
  const muted = [0.4, 0.44, 0.52];
  const outputText = data.mode === "code" ? "" : data.mode === "preview" ? data.preview : data.output;
  const codeText = data.mode === "output" || data.mode === "preview" ? "" : data.code;
  const bodySections = [];

  if (data.mode === "all" || data.mode === "preview") {
    bodySections.push({ title: "Preview", text: data.preview });
  }

  if (data.mode === "all" || data.mode === "report" || data.mode === "output") {
    bodySections.push({ title: "Output", text: outputText });
  }

  if (data.mode === "all" || data.mode === "report" || data.mode === "code") {
    bodySections.push({ title: "Source Code", text: codeText, mono: true });
  }

  if (!bodySections.length) {
    bodySections.push({ title: "Content", text: buildPlainPayload(data) });
  }

  const pages = [];
  let commands = [];
  let y = pageHeight - margin;

  function newPage() {
    if (commands.length) pages.push(commands);
    commands = [
      pdfRectCommand(0, 0, pageWidth, pageHeight, [1, 1, 1]),
      pdfRectCommand(0, pageHeight - 88, pageWidth, 88, paper),
      pdfTextCommand("Code Converter Studio", margin, pageHeight - 48, 20, "F2", ink),
      pdfTextCommand("Generated code run document", margin, pageHeight - 70, 10, "F1", muted),
    ];
    y = pageHeight - 118;
  }

  function ensureSpace(height) {
    if (y - height < pageBottom) newPage();
  }

  function addWrappedText(text, x, width, fontSize, lineHeightValue, font = "F1", color = ink) {
    const lines = wrapPdfTextByWidth(text, width, fontSize);
    lines.forEach((line) => {
      ensureSpace(lineHeightValue + 4);
      commands.push(pdfTextCommand(line, x, y, fontSize, font, color));
      y -= lineHeightValue;
    });
  }

  newPage();
  commands.push(pdfRectCommand(margin, y - 116, usableWidth, 116, brandTeal));
  commands.push(pdfRectCommand(margin + usableWidth * 0.42, y - 116, usableWidth * 0.35, 116, brandBlue));
  commands.push(pdfRectCommand(margin + usableWidth * 0.75, y - 116, usableWidth * 0.25, 116, brandClay));
  commands.push(pdfTextCommand(data.modeLabel.toUpperCase(), margin + 24, y - 34, 10, "F2", [1, 1, 1]));
  commands.push(pdfTextCommand(data.title, margin + 24, y - 72, 32, "F2", [1, 1, 1]));
  commands.push(pdfTextCommand("Styled export with preview, output, and code content.", margin + 24, y - 96, 12, "F1", [1, 1, 1]));
  y -= 144;

  const cardWidth = (usableWidth - 18) / 3;
  [
    ["Language", data.language],
    ["Lines", String(data.lineCount)],
    ["Generated", data.generated],
  ].forEach((card, index) => {
    const x = margin + index * (cardWidth + 9);
    commands.push(pdfRectCommand(x, y - 54, cardWidth, 54, [0.98, 0.99, 0.97]));
    commands.push(pdfStrokeRectCommand(x, y - 54, cardWidth, 54));
    commands.push(pdfTextCommand(card[0].toUpperCase(), x + 12, y - 21, 8, "F2", brandTeal));
    commands.push(pdfTextCommand(card[1], x + 12, y - 40, 11, "F2", ink));
  });
  y -= 84;

  bodySections.forEach((section) => {
    ensureSpace(70);
    commands.push(pdfTextCommand(section.title, margin, y, 18, "F2", ink));
    y -= 13;
    commands.push(pdfRectCommand(margin, y - 3, usableWidth, 3, brandBlue));
    y -= 22;

    const isCode = section.mono;
    const boxX = margin;
    const boxWidth = usableWidth;
    const textX = margin + 14;
    const textWidthValue = usableWidth - 28;
    const lines = wrapPdfTextByWidth(section.text || "No content available.", textWidthValue, isCode ? 8.5 : 11);
    const lineHeightValue = isCode ? 11 : 15;
    let index = 0;

    while (index < lines.length) {
      const availableLines = Math.max(4, Math.floor((y - pageBottom - 34) / lineHeightValue));
      if (availableLines < 4) {
        newPage();
        commands.push(pdfTextCommand(section.title, margin, y, 16, "F2", ink));
        y -= 24;
      }

      const chunk = lines.slice(index, index + availableLines);
      const boxHeight = chunk.length * lineHeightValue + 24;
      commands.push(pdfRectCommand(boxX, y - boxHeight + 7, boxWidth, boxHeight, isCode ? [0.07, 0.08, 0.09] : [0.98, 0.99, 0.97]));
      commands.push(pdfStrokeRectCommand(boxX, y - boxHeight + 7, boxWidth, boxHeight));
      y -= 11;
      chunk.forEach((line) => {
        commands.push(pdfTextCommand(line, textX, y, isCode ? 8.5 : 11, isCode ? "F3" : "F1", isCode ? [0.85, 0.97, 0.91] : ink));
        y -= lineHeightValue;
      });
      y -= 22;
      index += chunk.length;
    }
  });

  if (commands.length) {
    pages.push(commands);
  }

  const objects = [];
  const pageIds = [];
  const contentIds = [];
  const fontId = 3;
  const boldFontId = 4;
  const monoFontId = 5;

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>";

  pages.forEach((pageCommands, index) => {
    const pageId = 6 + index * 2;
    const contentId = pageId + 1;
    pageIds.push(pageId);
    contentIds.push(contentId);

    const stream = pageCommands.join("\n");

    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R /F3 ${monoFontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = encoder.encode(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id < objects.length; id += 1) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function createPdfBlob(title, bodyText) {
  return createStyledPdfBlob({
    code: "",
    generated: new Date().toLocaleString(),
    language: getLanguageLabel(),
    lineCount: state.lineCount,
    mode: "output",
    modeLabel: title,
    output: bodyText,
    preview: bodyText,
    title,
  });
}

async function buildExportFile(format, mode = "report") {
  const data = getExportData(mode);
  const normalized = String(format || "txt").toLowerCase();
  const stamp = new Date().toISOString().slice(0, 10);
  const stem = data.mode === "code"
    ? "source-code"
    : data.mode === "output"
      ? "run-output"
      : data.mode === "preview"
        ? "preview"
        : data.mode === "all"
          ? "full-code-package"
          : "code-run-report";
  const filename = `${stem}-${stamp}.${normalized}`;

  if (normalized === "pdf") {
    const text = buildPlainPayload(data);
    let blob;
    if (data.mode === "preview") {
      try {
        blob = await createPreviewSnapshotPdfBlob();
      } catch (error) {
        blob = createStyledPdfBlob(data);
        showToast("Preview capture was blocked, so a styled PDF was created.");
      }
    } else {
      blob = createStyledPdfBlob(data);
    }

    return {
      blob,
      filename,
      mime: "application/pdf",
      text,
      title: data.title,
    };
  }

  if (normalized === "doc") {
    const html = buildDocumentPayload(data);
    return {
      blob: new Blob([html], { type: "application/msword;charset=utf-8" }),
      filename,
      mime: "application/msword",
      text: buildPlainPayload(data),
      title: data.title,
    };
  }

  if (normalized === "xls") {
    const html = buildSheetPayload(data);
    return {
      blob: new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" }),
      filename,
      mime: "application/vnd.ms-excel",
      text: buildPlainPayload(data),
      title: data.title,
    };
  }

  if (normalized === "csv") {
    const csv = buildCsvPayload(data);
    return {
      blob: new Blob([csv], { type: "text/csv;charset=utf-8" }),
      filename,
      mime: "text/csv",
      text: buildPlainPayload(data),
      title: data.title,
    };
  }

  const text = buildPlainPayload(data);
  return {
    blob: new Blob([text], { type: "text/plain;charset=utf-8" }),
    filename: `${stem}-${stamp}.txt`,
    mime: "text/plain",
    text,
    title: data.title,
  };
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function exportCsv() {
  const output = collectOutputText() || state.outputText || "";
  const rows = [
    ["Field", "Value"],
    ["Language", languageNames[state.language] || languageNames[getRunLanguage()]],
    ["Lines", state.lineCount],
    ["Generated", new Date().toLocaleString()],
    ["Output", output],
    ["Source Code", state.code || codeInput.value],
  ];
  downloadBlob(rows.map((row) => row.map(csvCell).join(",")).join("\n"), "code-output.csv", "text/csv;charset=utf-8");
}

function exportTxt() {
  const output = collectOutputText() || state.outputText || "";
  const text = [
    "CODE RUN REPORT",
    "",
    `Language: ${languageNames[state.language] || languageNames[getRunLanguage()]}`,
    `Lines: ${state.lineCount}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "OUTPUT",
    output,
    "",
    "SOURCE CODE",
    state.code || codeInput.value,
  ].join("\n");
  downloadBlob(text, "code-output.txt", "text/plain;charset=utf-8");
}

function exportDoc() {
  downloadBlob(buildReportHtml(), "code-output.doc", "application/msword;charset=utf-8");
}

function exportXls() {
  const output = collectOutputText() || state.outputText || "";
  const language = languageNames[state.language] || languageNames[getRunLanguage()];
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body>
  <table border="1">
    <tr><th>Field</th><th>Value</th></tr>
    <tr><td>Language</td><td>${escapeHtml(language)}</td></tr>
    <tr><td>Lines</td><td>${state.lineCount}</td></tr>
    <tr><td>Generated</td><td>${escapeHtml(new Date().toLocaleString())}</td></tr>
    <tr><td>Output</td><td><pre>${escapeHtml(output)}</pre></td></tr>
    <tr><td>Source Code</td><td><pre>${escapeHtml(state.code || codeInput.value)}</pre></td></tr>
  </table>
</body>
</html>`;
  downloadBlob(html, "code-output.xls", "application/vnd.ms-excel;charset=utf-8");
}

function exportPdf() {
  const language = getRunLanguage();

  try {
    if (language === "html" && htmlPreview.contentWindow) {
      showToast("Use Save as PDF in the print window.");
      htmlPreview.contentWindow.focus();
      htmlPreview.contentWindow.print();
      return;
    }
  } catch (error) {
    // Fall through to report printing.
  }

  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  frame.contentDocument.open();
  frame.contentDocument.write(buildReportHtml());
  frame.contentDocument.close();
  showToast("Use Save as PDF in the print window.");
  window.setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 250);
}

function buildWhatsAppMessage(fileData, target) {
  const intro = `${fileData.title}: ${fileData.filename}`;
  const text = fileData.text || "";
  const shortLimit = 5500;

  if (target === "whatsapp" && text.length <= shortLimit) {
    return `${intro}\n\n${text}`;
  }

  return `${intro}\n\nThe selected format has been prepared as a file.`;
}

async function sharePreparedFile(target = "system") {
  state.code = codeInput.value;
  state.language = getRunLanguage();
  updateGutter();
  updateLanguageDisplay();
  updateReport();

  const fileData = await buildExportFile(shareFormat.value, shareContent.value);
  const file = new File([fileData.blob], fileData.filename, { type: fileData.mime });
  const filePayload = {
    title: fileData.title,
    text: `${fileData.title} - ${fileData.filename}`,
    files: [file],
  };
  const textPayload = {
    title: fileData.title,
    text: fileData.text.length > 9000
      ? `${fileData.title}\n\n${fileData.text.slice(0, 9000)}\n\n[Text shortened by browser share limit. Use Share file for the full file when supported.]`
      : fileData.text,
  };

  if (navigator.share) {
    try {
      await navigator.share(filePayload);
      showToast("Share sheet opened.");
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  if (target === "whatsapp") {
    if (navigator.share) {
      try {
        await navigator.share(textPayload);
        showToast("Share sheet opened.");
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    const message = buildWhatsAppMessage(fileData, target);
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
    showToast("WhatsApp opened.");
    return;
  }

  if (navigator.share) {
    try {
      await navigator.share(textPayload);
      showToast("Share sheet opened.");
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }

  if (navigator.clipboard && fileData.text.length < 500_000) {
    try {
      await navigator.clipboard.writeText(fileData.text);
      showToast("File downloaded and text copied.");
      return;
    } catch (error) {
      showToast("File downloaded for sharing.");
      return;
    }
  }

  downloadBlob(fileData.blob, fileData.filename, fileData.mime);
  showToast("Sharing is blocked here, so the file was downloaded.");
}

function toggleSharePanel() {
  sharePanel.hidden = !sharePanel.hidden;
  sharePanelToggle.classList.toggle("active", !sharePanel.hidden);
}

function setEditorWidthFromPoint(clientX) {
  const rect = workspace.getBoundingClientRect();
  const minEditor = 320;
  const minPreview = 340;
  const splitterWidth = splitter.getBoundingClientRect().width || 12;
  const maxEditor = rect.width - minPreview - splitterWidth;
  const nextWidth = Math.min(Math.max(clientX - rect.left, minEditor), maxEditor);
  workspace.style.setProperty("--editor-width", `${nextWidth}px`);
}

function nudgeEditorWidth(delta) {
  const editorWidth = document.querySelector(".editor-pane").getBoundingClientRect().width;
  const rect = workspace.getBoundingClientRect();
  setEditorWidthFromPoint(rect.left + editorWidth + delta);
}

function initSplitter() {
  let dragging = false;

  splitter.addEventListener("pointerdown", (event) => {
    dragging = true;
    splitter.setPointerCapture(event.pointerId);
    workspace.classList.add("resizing");
    setEditorWidthFromPoint(event.clientX);
  });

  splitter.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    setEditorWidthFromPoint(event.clientX);
  });

  splitter.addEventListener("pointerup", (event) => {
    dragging = false;
    splitter.releasePointerCapture(event.pointerId);
    workspace.classList.remove("resizing");
  });

  splitter.addEventListener("pointercancel", () => {
    dragging = false;
    workspace.classList.remove("resizing");
  });

  splitter.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeEditorWidth(-32);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeEditorWidth(32);
    }
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.source !== "converter-console" || data.runId !== state.runId) return;
  appendConsole(data.level, data.message);
});

codeInput.addEventListener("input", scheduleRun);
codeInput.addEventListener("scroll", syncGutterScroll);
languageSelect.addEventListener("change", runCode);
runBtn.addEventListener("click", runCode);
sampleBtn.addEventListener("click", () => {
  codeInput.value = sampleCode;
  scheduleRun();
  codeInput.focus();
});
sharePanelToggle.addEventListener("click", toggleSharePanel);
systemShareBtn.addEventListener("click", () => {
  sharePreparedFile("system").catch(() => showToast("Sharing was not available."));
});
whatsappShareBtn.addEventListener("click", () => {
  sharePreparedFile("whatsapp").catch(() => showToast("Sharing was not available."));
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
});

exportButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await runCode();
    const type = button.dataset.export;
    window.setTimeout(() => {
      if (type === "pdf") exportPdf();
      if (type === "doc") exportDoc();
      if (type === "xls") exportXls();
      if (type === "csv") exportCsv();
      if (type === "txt") exportTxt();
    }, 220);
  });
});

codeInput.value = sampleCode;
updateGutter();
updateLanguageDisplay();
initSplitter();
runCode();
