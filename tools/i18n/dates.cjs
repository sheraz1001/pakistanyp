// i18n codemod: dates follow the page language. x.toLocaleDateString("en-US", o) -> x.toLocaleDateString(dateLocale("en-US"), o)
// (English pages keep their exact format). Admin files are skipped. Safe to re-run.
const fs = require("fs"), path = require("path");
const root = path.resolve(process.argv[2] || "client/src");
const ADMIN = /(^|\/)(admin|super-admin|moderator|content-dashboard|cache-control|test-admin|email-test|mascot|interactive-scanner|video-pitch|create-blog-post|create-news-article|social-media|i18n-jsx)/i;
let n = 0;
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
  const p = path.join(d, e.name), rel = path.relative(root, p);
  if (ADMIN.test(rel)) continue;
  if (e.isDirectory()) walk(p);
  else if (/\.tsx?$/.test(e.name)) {
    let s = fs.readFileSync(p, "utf8"); const o = s;
    s = s.replace(/\.(toLocaleDateString|toLocaleTimeString)\((?!dateLocale\()(\s*\))?/g, (m, fn, empty) => { n++; return empty ? `.${fn}(dateLocale())` : `.${fn}(dateLocale(`; });
    // close the dateLocale( call after the first argument
    s = s.replace(/dateLocale\((\s*(?:"[^"]*"|'[^']*'|`[^`]*`|[\w.]+))\s*(,|\))/g, (m, a, end) => (a.trim() ? `dateLocale(${a.trim()})${end}` : m));
    if (s !== o) {
      if (!/import \{[^}]*\bdateLocale\b[^}]*\} from "@shared\/i18n"/.test(s)) s = `import { dateLocale } from "@shared/i18n";\n` + s;
      fs.writeFileSync(p, s);
    }
  }
} };
walk(root);
console.log(`dates: ${n} calls`);
