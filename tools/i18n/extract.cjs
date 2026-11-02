// Collect the UI text that the second-language dictionary has to cover.
// Usage: node tools/i18n/extract.cjs <repo dir> > strings.json
// Output: sorted JSON array of English strings (keys of shared/countries/dictionary.<lang>.json).
const fs = require("fs");
const path = require("path");
const ts = require(require.resolve("typescript", { paths: [process.cwd(), "/home/user/UAEYP/node_modules"] }));

const repo = path.resolve(process.argv[2] || ".");
const ADMIN = /(^|\/)(admin|super-admin|moderator|content-dashboard|cache-control|test-admin|email-test|mascot|interactive-scanner|video-pitch|create-blog-post|create-news-article|social-media|i18n-jsx)/i;
const SKIP_ATTR = /^(canonicalUrl|canonical|url|image|ogImage|ogUrl|aria-labelledby|aria-describedby|aria-controls|aria-owns|headers|list|className|class|href|src|srcSet|key|id|style|to|type|name|value|role|rel|target|method|action|htmlFor|as|variant|size|lang|dir|hrefLang|data-.*|on[A-Z].*|ref|path|queryKey|pattern|autoComplete|inputMode|accept|sizes|loading|decoding|fetchPriority|itemProp|itemType|itemScope|property|httpEquiv|charSet|media|form|tabIndex|d|viewBox|fill|stroke|xmlns|width|height|side|align|orientation|mode|icon|color|defaultValue|testId|slug|category|province|locality|city)$/;
const TEXT_KEYS = /^(lead|noun|nouns|kicker|heading|title|description|metaTitle|metaDescription|subtitle|heading|label|placeholder|text|message|summary|caption|tooltip|alt|cta|ctaText|ctaLabel|buttonText|emptyText|emptyMessage|eyebrow|intro|answer|question|name|badge|hint|helper|helperText|error|success|status|tagline|benefit|feature|features|benefits|note|unit|period)$/;
const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", rarr: "→", larr: "←", middot: "·", mdash: "—", ndash: "–", hellip: "…", bull: "•", times: "×", rsquo: "’", ldquo: "“", rdquo: "”" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => (e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] ?? m));

const out = new Set();
const add = (s, strict) => {
  if (typeof s !== "string") return;
  s = s.replace(/\s+/g, " ").trim();
  if (!s || s.length > 600 || !/[A-Za-z]{2,}/.test(s)) return;
  if (/^(https?:|\/|#|www\.|mailto:|tel:|data:|@)/.test(s) || /^[\w.+-]+@[\w-]+\.\w+$/.test(s)) return;
  if (/^[a-z0-9]+([-_:./][a-z0-9[\]/.%#]+)+( [a-z0-9]+([-_:./][a-z0-9[\]/.%#]+)*)*$/.test(s)) return; // class lists, keys, paths
  if (/^[a-z][a-zA-Z0-9]*$/.test(s) && strict) return; // identifiers
  if (/^(GET|POST|PUT|PATCH|DELETE)$/.test(s) || /\b(select|insert|update|delete)\b.*\b(from|into|set)\b/i.test(s)) return;
  if (strict && !/^[A-Z0-9"'(¿¡€$£#&+@✓✔•→]/.test(s) && !/\s/.test(s)) return;
  out.add(s);
};

function cleanJsxText(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) last = i; });
  let str = "";
  lines.forEach((line, i) => {
    let t = line.replace(/\t/g, " ");
    if (i) t = t.replace(/^[ ]+/, "");
    if (i < lines.length - 1) t = t.replace(/[ ]+$/, "");
    if (t) { if (i !== last) t += " "; str += t; }
  });
  return decode(str);
}

const T_CALL = /^(t|tx|tj)$/;
const ZOD = /^(min|max|length|email|url|regex|refine|nonempty|superRefine|uuid|startsWith|endsWith|includes|positive|nonnegative|int|gte|lte|gt|lt)$/;

function scan(file) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const inJsxChild = (n) => {
    for (let p = n.parent; p; p = p.parent) {
      if (ts.isJsxAttribute(p)) return !SKIP_ATTR.test(p.name.getText(sf));
      if (ts.isCallExpression(p) && /^(cn|clsx|cva|twMerge|useQuery|fetch|apiRequest|navigate|setLocation|encodeURIComponent|JSON\.\w+|console\.\w+|localStorage\.\w+|new Date|format)$/.test(p.expression.getText(sf))) return false;
      if (ts.isBinaryExpression(p) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken].includes(p.operatorToken.kind)) return false;
      if (ts.isCaseClause(p) || ts.isElementAccessExpression(p)) return false;
      if (ts.isJsxExpression(p) && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent))) return true;
      if (ts.isJsxElement(p) || ts.isSourceFile(p)) return false;
    }
    return false;
  };
  const visit = (n) => {
    if (ts.isJsxText(n)) add(cleanJsxText(n.text), false);
    else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && !SKIP_ATTR.test(n.name.getText(sf))) add(n.initializer.text, false);
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const p = n.parent;
      if (ts.isCallExpression(p) && p.arguments[0] === n && T_CALL.test(p.expression.getText(sf))) add(n.text, false);
      else if (ts.isPropertyAssignment(p) && p.initializer === n && TEXT_KEYS.test(p.name.getText(sf).replace(/["']/g, ""))) add(n.text, true);
      else if (ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && ZOD.test(p.expression.name.text)) add(n.text, true);
      else if (ts.isCallExpression(p) && /^(toast|alert|confirm|setError|setMessage|setStatus)$/.test(p.expression.getText(sf))) add(n.text, true);
      else if (ts.isArrayLiteralExpression(p) && ts.isVariableDeclaration(p.parent) && /(SEARCHES|LABELS|STEPS|TIPS|FEATURES|BENEFITS|OPTIONS|ITEMS|FAQ|QUESTIONS|TABS|NAV|LINKS|MENU|STATS|PERKS|REASONS)/i.test(p.parent.name.getText(sf))) add(n.text, true);
      else if (inJsxChild(n)) add(n.text, true);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}

const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(repo, p);
    if (/node_modules|dist|\.git/.test(e.name) || ADMIN.test(path.relative(path.join(repo, "client/src"), p))) continue;
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(e.name) && !/\.d\.ts$/.test(e.name)) scan(p);
  }
};
walk(path.join(repo, "client/src"));
// site config strings (tagline, popular searches, verification document names, region term...)
scan(path.join(repo, "shared/country.ts"));
for (const s of ["Province", "Provinces", "City", "Cities", "Locality", "Localities", "Region", "Regions", "District", "Districts"]) add(s, false);
process.stdout.write(JSON.stringify([...out].sort(), null, 0));
