import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const { PDFDocument, PDFName, PDFArray } = require("pdf-lib");

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const dataPath = path.join(here, "cv-data.json");
const outDir = path.join(here, "out");
await fs.mkdir(outDir, { recursive: true });

const data = JSON.parse(await fs.readFile(dataPath, "utf8"));
const resolveFromTemplate = (value) => path.resolve(here, value);
let photoMarkup = "";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const linkOrText = (item, className = "") => {
  const label = escapeHtml(item.label ?? item.organization ?? "");
  const cls = className ? ` class="${className}"` : "";
  return item.url || item.organizationUrl
    ? `<a${cls} href="${escapeHtml(item.url ?? item.organizationUrl)}">${label}</a>`
    : `<span${cls}>${label}</span>`;
};

const bullets = (items) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

if (data.photoPath) {
  const photoPath = path.isAbsolute(data.photoPath) ? data.photoPath : resolveFromTemplate(data.photoPath);
  const photoUri = `data:image/jpeg;base64,${(await fs.readFile(photoPath)).toString("base64")}`;
  photoMarkup = `<img class="photo" src="${photoUri}" alt="">`;
} else {
  const initials = `${data.name?.first?.[0] ?? "Y"}${data.name?.last?.[0] ?? "N"}`.toUpperCase();
  photoMarkup = `<div class="photo-placeholder">${escapeHtml(initials)}</div>`;
}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(data.name.first)} ${escapeHtml(data.name.last)} CV</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #f3efe7; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 16px;
      color: #2d2b28;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20px;
      background: #fffdf9;
      display: grid;
      grid-template-columns: 35% 65%;
      overflow: hidden;
    }
    .left {
      background: linear-gradient(180deg, #dcd5c7 0%, #d7cfbf 100%);
      padding: 20px 18px 22px;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .photo-wrap {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      overflow: hidden;
      margin: 0 auto 16px;
      border: 5px solid rgba(255, 253, 249, 0.9);
      box-shadow: 0 10px 22px rgba(59, 47, 29, 0.12);
      flex: 0 0 auto;
    }
    .photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: 50% 38%;
      transform: scale(1.16);
    }
    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: grid;
      place-items: center;
      background: #fffdf9;
      color: #8d5f3a;
      font-size: 2.4rem;
      letter-spacing: .08em;
    }
    h1 {
      margin: 0;
      text-align: center;
      font-size: 1.95rem;
      line-height: 1.02;
      font-weight: 500;
      letter-spacing: .02em;
    }
    .title {
      margin: 8px auto 34px;
      max-width: 190px;
      text-align: center;
      font-size: .64rem;
      line-height: 1.42;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: #8d5f3a;
      font-weight: 700;
    }
    .title-line, .nowrap { white-space: nowrap; }
    .section-title {
      margin: 24px 0 10px;
      font-size: .96rem;
      line-height: 1;
      font-weight: 500;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: #8d5f3a;
      text-align: center;
    }
    .contact {
      display: grid;
      gap: 5px;
      font-size: .76rem;
      line-height: 1.56;
      margin: 0;
      width: 100%;
    }
    a {
      color: #1268b3;
      text-decoration: underline;
      text-decoration-thickness: .7px;
      text-underline-offset: 1.5px;
    }
    .about {
      margin: 0;
      font-size: .76rem;
      line-height: 1.56;
    }
    .skills {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 5px;
      font-size: .76rem;
      line-height: 1.56;
    }
    .skills li {
      position: relative;
      padding-left: 12px;
    }
    .skills li::before {
      content: "";
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #8d5f3a;
      position: absolute;
      left: 0;
      top: .65em;
    }
    .right {
      padding: 16px 20px 24px;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .right .section-title {
      margin: 0 0 6px;
      font-size: .9rem;
      text-align: left;
      border-bottom: 1px solid rgba(45, 43, 40, 0.12);
      padding-bottom: 4px;
    }
    .experience { display: grid; gap: 0; }
    .job {
      display: grid;
      grid-template-columns: 1fr 94px;
      column-gap: 10px;
      page-break-inside: avoid;
      border-bottom: 1px solid rgba(45, 43, 40, 0.12);
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .role, .degree {
      font-size: 1.23rem;
      line-height: 1.1;
      font-weight: 700;
      color: #2d2b28;
    }
    .org, .school {
      margin-top: 3px;
      font-size: .78rem;
      line-height: 1.08;
      color: #8d5f3a;
      font-weight: 400;
      font-style: italic;
    }
    .date {
      text-align: right;
      font-size: .68rem;
      line-height: 1;
      color: #655f55;
      white-space: nowrap;
      padding-top: 1px;
    }
    .job ul, .edu-notes {
      grid-column: 1 / -1;
      margin: 2px 0 0;
      padding-left: 12px;
      font-size: .78rem;
      line-height: 1.44;
      color: #2d2b28;
    }
    .job li, .edu-notes li { margin: 0; }
    .job:last-child { border-bottom: 0; margin-bottom: 0; }
    .bottom {
      margin-top: auto;
      display: grid;
      grid-template-columns: 1fr;
      gap: 28px;
    }
    .education-grid {
      display: grid;
      gap: 8px;
    }
    .edu {
      display: grid;
      grid-template-columns: 1fr 78px;
      column-gap: 8px;
      border-bottom: 1px solid rgba(45, 43, 40, 0.12);
      padding-bottom: 6px;
    }
    .edu:last-child { border-bottom: 0; padding-bottom: 0; }
    .languages {
      columns: 2;
      column-gap: 26px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: .78rem;
      line-height: 1.44;
    }
    .languages li {
      break-inside: avoid;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <main class="page">
    <aside class="left">
      <div class="photo-wrap">${photoMarkup}</div>
      <h1>${escapeHtml(data.name.first)}<br>${escapeHtml(data.name.last)}</h1>
      <div class="title">${data.subtitleLines.map((line) => `<span class="title-line">${escapeHtml(line)}</span>`).join("<br>")}</div>
      <div class="section-title">Contact</div>
      <div class="contact">${data.contact.map((item) => `<div>${linkOrText(item)}</div>`).join("")}</div>
      <div class="section-title">About Me</div>
      <p class="about">${escapeHtml(data.about)}</p>
      <div class="section-title">Skills</div>
      <ul class="skills">${data.skills.map((skill) => `<li>${escapeHtml(skill)}</li>`).join("")}</ul>
    </aside>
    <section class="right">
      <div class="section-title">Experience</div>
      <div class="experience">
        ${data.experience.map((job) => `
        <article class="job">
          <div><div class="role">${escapeHtml(job.title)}</div><div class="org">${job.organizationUrl ? `<a href="${escapeHtml(job.organizationUrl)}">${escapeHtml(job.organization)}</a>` : escapeHtml(job.organization)}</div></div>
          <div class="date">${escapeHtml(job.date)}</div>
          ${bullets(job.bullets)}
        </article>`).join("")}
      </div>
      <div class="bottom">
        <section>
          <div class="section-title">Education</div>
          <div class="education-grid">
            ${data.education.map((edu) => `
            <div class="edu">
              <div><div class="degree">${edu.degreeHtml}</div><div class="school">${escapeHtml(edu.school)}</div></div>
              <div class="date">${escapeHtml(edu.date)}</div>
              <ul class="edu-notes">${edu.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
            </div>`).join("")}
          </div>
        </section>
        <section>
          <div class="section-title">Languages</div>
          <ul class="languages">${data.languages.map((lang) => `<li>${escapeHtml(lang)}</li>`).join("")}</ul>
        </section>
      </div>
    </section>
  </main>
</body>
</html>`;

const htmlPath = path.join(outDir, "template-preview.html");
const pdfPath = path.isAbsolute(data.outputPdf) ? data.outputPdf : resolveFromTemplate(data.outputPdf);
const screenshotPath = path.join(outDir, "template-pdf-viewer.png");
await fs.writeFile(htmlPath, html, "utf8");

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "0", right: "0", bottom: "0", left: "0" },
  preferCSSPageSize: true,
});
await browser.close();

const pdfBytes = await fs.readFile(pdfPath);
const pdfDoc = await PDFDocument.load(pdfBytes);
const firstPage = pdfDoc.getPages()[0];
const annots = firstPage.node.Annots();
const uris = [];
if (annots instanceof PDFArray) {
  for (let i = 0; i < annots.size(); i++) {
    const annot = pdfDoc.context.lookup(annots.get(i));
    const action = pdfDoc.context.lookup(annot.get(PDFName.of("A")));
    const uri = action?.get?.(PDFName.of("URI"));
    if (uri) uris.push(uri.decodeText());
  }
}

const verifyBrowser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const verifyPage = await verifyBrowser.newPage({ viewport: { width: 1000, height: 1280 }, deviceScaleFactor: 1 });
await verifyPage.goto(pathToFileURL(pdfPath).href, { waitUntil: "networkidle" }).catch(async () => {
  await verifyPage.waitForTimeout(2500);
});
await verifyPage.waitForTimeout(1800);
await verifyPage.screenshot({ path: screenshotPath, fullPage: true });
await verifyBrowser.close();

const report = {
  pdfPath,
  htmlPath,
  screenshotPath,
  pageCount: pdfDoc.getPageCount(),
  pageSize: firstPage.getSize(),
  annotationUris: uris,
};
await fs.writeFile(path.join(outDir, "verification.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
