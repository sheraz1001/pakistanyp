// Replace user-facing "Province"/"Provinces" wording with the country's region term, only inside
// string literals, template text and JSX text (never identifiers, API paths or SQL).
// Usage: node region-terms.cjs <dir> <Singular> <Plural> "<Phrase Title>" "<phrase lower>"
const fs = require("fs");
const path = require("path");
const ts = require(require.resolve("typescript", { paths: [process.cwd(), path.join(process.argv[2], "node_modules"), "/home/user/UAEYP/node_modules"] }));

const [dir, one, many, phraseTitle, phraseLower] = process.argv.slice(2);
if (one === "Province") { console.log("region-terms: Province is the template term, nothing to do"); process.exit(0); }

const SQLISH = /\b(select|insert|update|delete|from|where|join|alter|create|returning|coalesce|order by|group by)\b/i;
const rules = [
  [/\bAll Provinces & Territories\b/g, `All ${phraseTitle}`],
  [/\bProvinces & Territories\b/g, phraseTitle],
  [/\bprovinces and territories\b/g, phraseLower],
  [/\bProvinces and Territories\b/g, phraseTitle],
  [/\bprovinces & territories\b/g, phraseLower],
  [/\bProvinces\b/g, many],
  [/\bProvince\b/g, one],
  [/\bprovinces\b/g, many.toLowerCase()],
  [/\bprovince\b/g, one.toLowerCase()],
];
const convert = (s) => rules.reduce((acc, [re, to]) => acc.replace(re, to), s);
const userFacing = (text) => {
  if (!/[Pp]rovince/.test(text)) return false;
  if (SQLISH.test(text) || text.includes("/api/") || /^\s*\//.test(text)) return false;
  if (/^[a-z][A-Za-z0-9_.-]*$/.test(text.trim())) return false; // keys / identifiers
  if (!/\s/.test(text.trim()) && /[/@#?=]/.test(text)) return false; // paths, module specifiers, URLs, selectors
  if (/[a-z]Province|province[A-Z_]|_province|province_|province-/.test(text)) return false; // camelCase, snake, css
  return true;
};

let files = 0, edits = 0;
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(e.name)) continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(tsx?|cjs|mjs|js)$/.test(e.name) && !p.includes(`${path.sep}countries${path.sep}`)) handle(p);
  }
};
function handle(file) {
  const text = fs.readFileSync(file, "utf8");
  if (!/[Pp]rovince/.test(text)) return;
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const changes = [];
  const visit = (n) => {
    let start = null, end = null;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { start = n.getStart(sf) + 1; end = n.getEnd() - 1; }
    else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) {
      start = n.getStart(sf) + 1; end = n.getEnd() - (ts.isTemplateTail(n) ? 1 : 2);
    } else if (ts.isJsxText(n)) { start = n.getStart(sf); end = n.getEnd(); }
    if (start !== null) {
      const raw = text.slice(start, end);
      if (userFacing(raw)) {
        // keep import paths and module specifiers untouched
        if (!(ts.isStringLiteral(n) && (ts.isImportDeclaration(n.parent) || ts.isExportDeclaration(n.parent) || (ts.isCallExpression(n.parent) && n.parent.expression.kind === ts.SyntaxKind.ImportKeyword)))) {
          const out = convert(raw);
          if (out !== raw) changes.push([start, end, out]);
        }
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  if (!changes.length) return;
  let out = text;
  for (const [s, e, r] of changes.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + r + out.slice(e);
  fs.writeFileSync(file, out);
  files++; edits += changes.length;
}
for (const sub of ["client/src", "server", "shared"]) if (fs.existsSync(path.join(dir, sub))) walk(path.join(dir, sub));
console.log(`region-terms: ${edits} strings in ${files} files`);
