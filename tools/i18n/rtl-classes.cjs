// RTL codemod: physical Tailwind classes -> logical ones (identical in LTR, mirrored in RTL).
//   ml-2 -> ms-2, pr-4 -> pe-4, left-0 -> start-0, text-right -> text-end, border-l -> border-s,
//   rounded-r-lg -> rounded-e-lg, space-x-2 -> space-x-2 rtl:space-x-reverse ...
// Centering (left-1/2 with -translate-x-1/2) is left alone. Admin files are skipped. Safe to re-run.
const fs = require("fs");
const path = require("path");
const root = path.resolve(process.argv[2] || "client/src");
const ADMIN = /(^|\/)(admin|super-admin|moderator|content-dashboard|cache-control|test-admin|email-test|mascot|interactive-scanner|video-pitch|create-blog-post|create-news-article|social-media)/i;
const B = "(?<=^|[\\s\"'`:{(,])"; // token start (also after a variant prefix like md:)
const rules = [
  [new RegExp(B + "(-?)ml-(?=[\\w\\[.])", "g"), "$1ms-"],
  [new RegExp(B + "(-?)mr-(?=[\\w\\[.])", "g"), "$1me-"],
  [new RegExp(B + "pl-(?=[\\w\\[.])", "g"), "ps-"],
  [new RegExp(B + "pr-(?=[\\w\\[.])", "g"), "pe-"],
  [new RegExp(B + "(-?)left-(?!1\\/2)(?=[\\w\\[.])", "g"), "$1start-"],
  [new RegExp(B + "(-?)right-(?!1\\/2)(?=[\\w\\[.])", "g"), "$1end-"],
  [new RegExp(B + "text-left(?=[\\s\"'`]|$)", "g"), "text-start"],
  [new RegExp(B + "text-right(?=[\\s\"'`]|$)", "g"), "text-end"],
  [new RegExp(B + "border-l(?=[\\s\"'`-]|$)", "g"), "border-s"],
  [new RegExp(B + "border-r(?=[\\s\"'`-]|$)", "g"), "border-e"],
  [new RegExp(B + "rounded-tl(?=[\\s\"'`-]|$)", "g"), "rounded-ss"],
  [new RegExp(B + "rounded-tr(?=[\\s\"'`-]|$)", "g"), "rounded-se"],
  [new RegExp(B + "rounded-bl(?=[\\s\"'`-]|$)", "g"), "rounded-es"],
  [new RegExp(B + "rounded-br(?=[\\s\"'`-]|$)", "g"), "rounded-ee"],
  [new RegExp(B + "rounded-l(?=[\\s\"'`-]|$)", "g"), "rounded-s"],
  [new RegExp(B + "rounded-r(?=[\\s\"'`-]|$)", "g"), "rounded-e"],
  [new RegExp(B + "float-left(?=[\\s\"'`]|$)", "g"), "float-start"],
  [new RegExp(B + "float-right(?=[\\s\"'`]|$)", "g"), "float-end"],
  [new RegExp(B + "(space-x-(?!reverse)[\\w.]+)(?![\\w-])(?! rtl:space-x-reverse)", "g"), "$1 rtl:space-x-reverse"],
];
let files = 0, edits = 0;
const handle = (p) => {
  const src = fs.readFileSync(p, "utf8");
  let out = src;
  for (const [re, to] of rules) out = out.replace(re, (...m) => { edits++; return to.replace("$1", typeof m[1] === "string" ? m[1] : ""); });
  if (out !== src) { fs.writeFileSync(p, out); files++; }
};
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(root, p);
    if (ADMIN.test(rel)) continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name) && !rel.startsWith("i18n-jsx")) handle(p);
  }
};
walk(root);
console.log(`rtl classes: ${edits} replacements in ${files} files`);
