(() => {
  const codeInput = document.getElementById("codeInput");
  const languageSelect = document.getElementById("languageSelect");
  const htmlPreview = document.getElementById("htmlPreview");
  const detectedLanguage = document.getElementById("detectedLanguage");
  const engineStatus = document.getElementById("engineStatus");
  const runBtn = document.getElementById("runBtn");

  if (!codeInput || !languageSelect || !htmlPreview) return;

  const languageNames = {
    html: "HTML / CSS / JS",
    javascript: "JavaScript",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    text: "Plain text",
  };

  function detectLanguage(code) {
    const source = String(code || "").trim();
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

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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

  function fallbackDocument(code) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 28px; color: #15171d; background: #fbfcf9; font-family: Inter, Arial, sans-serif; }
    main { max-width: 960px; margin: 0 auto; padding: 24px; border: 1px solid #d9ded6; border-radius: 16px; background: #fff; box-shadow: 0 18px 48px rgba(21,23,29,.08); }
    span { color: #14766f; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 8px 0 14px; font-size: 34px; line-height: 1; }
    p { margin: 0 0 16px; color: #667085; line-height: 1.6; }
    pre { margin: 0; padding: 18px; overflow: auto; border-radius: 14px; color: #d9f7e8; background: #111417; font: 13px/1.65 Consolas, monospace; white-space: pre-wrap; }
  </style>
</head>
<body>
  <main>
    <span>Preview fallback</span>
    <h1>Source preview</h1>
    <p>The browser could not render this as a visual HTML document, so the source is shown safely.</p>
    <pre>${escapeHtml(code)}</pre>
  </main>
</body>
</html>`;
  }

  function renderIframe(html) {
    try {
      htmlPreview.removeAttribute("src");
      htmlPreview.srcdoc = "";
      const doc = htmlPreview.contentWindow && htmlPreview.contentWindow.document;
      if (!doc) throw new Error("Frame document is not ready");
      doc.open();
      doc.write(html);
      doc.close();
      return true;
    } catch (error) {
      htmlPreview.srcdoc = html;
      return false;
    }
  }

  function hasVisibleContent() {
    try {
      const body = htmlPreview.contentDocument && htmlPreview.contentDocument.body;
      if (!body) return false;
      return body.children.length > 0 || Boolean(body.innerText.trim());
    } catch (error) {
      return false;
    }
  }

  function currentLanguage() {
    return languageSelect.value === "auto" ? detectLanguage(codeInput.value) : languageSelect.value;
  }

  function renderLivePreview() {
    const code = codeInput.value || "";
    const language = currentLanguage();
    if (detectedLanguage) detectedLanguage.textContent = languageNames[language] || languageNames.text;
    if (language !== "html") return;

    renderIframe(normalizeHtmlDocument(code));
    window.setTimeout(() => {
      if (!hasVisibleContent() && code.trim()) {
        renderIframe(fallbackDocument(code));
        if (engineStatus) engineStatus.textContent = "Preview fallback";
        return;
      }
      if (engineStatus) engineStatus.textContent = "Rendered";
    }, 80);
  }

  let timer = 0;
  function schedulePreview() {
    window.clearTimeout(timer);
    timer = window.setTimeout(renderLivePreview, 120);
  }

  window.__codeConverterRenderPreview = renderLivePreview;
  codeInput.addEventListener("input", schedulePreview);
  languageSelect.addEventListener("change", schedulePreview);
  runBtn?.addEventListener("click", () => window.setTimeout(renderLivePreview, 0));
  window.addEventListener("load", () => window.setTimeout(renderLivePreview, 250));
  window.setTimeout(renderLivePreview, 500);
})();
