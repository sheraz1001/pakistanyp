// i18n codemod: make text that mixes words and values translatable as whole sentences.
//   <p>Showing {n} of {total} results</p>      -> <p>{tj("Showing {0} of {1} results", n, total)}</p>
//   description={`Businesses in ${city}`}      -> description={tx("Businesses in {0}", city)}
// Plain text (no values) is left alone: the JSX runtime (client/src/i18n-jsx) translates it.
// Admin files are skipped (the admin panel is English only). Safe to re-run.
// Usage: node tools/i18n/wrap.cjs <client/src dir>
const fs = require("fs");
const path = require("path");
const ts = require(require.resolve("typescript", { paths: [process.cwd(), "/home/user/UAEYP/node_modules"] }));

const root = path.resolve(process.argv[2] || "client/src");
const ADMIN = /(^|\/)(admin|super-admin|moderator|content-dashboard|cache-control|test-admin|email-test|mascot|interactive-scanner|video-pitch|create-blog-post|create-news-article|social-media|i18n-jsx)/i;
const SKIP_ATTR = /^(canonicalUrl|canonical|url|image|ogImage|ogUrl|aria-labelledby|aria-describedby|aria-controls|aria-owns|headers|list|className|class|href|src|srcSet|key|id|style|to|type|name|value|role|rel|target|method|action|htmlFor|as|variant|size|lang|dir|hrefLang|data-.*|on[A-Z].*|ref|path|queryKey|pattern|autoComplete|inputMode|accept|sizes|loading|decoding|fetchPriority|itemProp|itemType|itemScope|property|httpEquiv|charSet|media|form|tabIndex|d|viewBox|fill|stroke|xmlns|width|height)$/;
const TEXT_KEYS = /^(title|description|metaTitle|metaDescription|ogTitle|ogDescription|subtitle|heading|label|placeholder|text|message|summary|caption|tooltip|alt|cta|ctaText|ctaLabel|buttonText|emptyText|emptyMessage|eyebrow|intro|answer|question)$/;
const words = (s) => /[A-Za-z]{2,}/.test(s) && /\s/.test(s.trim());

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", copy: "©", reg: "®", trade: "™", rarr: "→", larr: "←", middot: "·", mdash: "—", ndash: "–", hellip: "…", bull: "•", times: "×", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", laquo: "«", raquo: "»", deg: "°" };
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENTITIES[e] ?? m);
function cleanJsxText(raw) { return decode(cleanJsxText0(raw)); }
function cleanJsxText0(raw) {
  // React/Babel JSX whitespace rules
  const lines = raw.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((l, i) => { if (/[^ \t]/.test(l)) last = i; });
  let str = "";
  lines.forEach((line, i) => {
    const isFirst = i === 0, isLast = i === lines.length - 1, isLastNonEmpty = i === last;
    let t = line.replace(/\t/g, " ");
    if (!isFirst) t = t.replace(/^[ ]+/, "");
    if (!isLast) t = t.replace(/[ ]+$/, "");
    if (t) { if (!isLastNonEmpty) t += " "; str += t; }
  });
  return str;
}

const simpleExpr = (e) => {
  if (!e) return false;
  if (ts.isIdentifier(e) || ts.isPropertyAccessExpression(e) || ts.isElementAccessExpression(e) || ts.isNumericLiteral(e)) return true;
  if (ts.isNonNullExpression(e) || ts.isParenthesizedExpression(e)) return simpleExpr(e.expression);
  if (ts.isCallExpression(e)) return !e.arguments.some((a) => ts.isArrowFunction(a) || ts.isFunctionExpression(a)) && !containsJsx(e);
  if (ts.isBinaryExpression(e) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.PlusToken, ts.SyntaxKind.MinusToken, ts.SyntaxKind.AsteriskToken, ts.SyntaxKind.SlashToken].includes(e.operatorToken.kind)) return !containsJsx(e);
  if (ts.isConditionalExpression(e)) return !containsJsx(e);
  return false;
};
function containsJsx(n) {
  let found = false;
  const v = (x) => { if (found) return; if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) found = true; else ts.forEachChild(x, v); };
  v(n);
  return found;
}

function processFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  let needT = false, needTj = false;
  const insideJsxFile = true;
  const src = (n) => text.slice(n.getStart(sf), n.getEnd());

  const templateToT = (tpl) => {
    // `A ${x} B` -> t("A {0} B", x)
    let fmt = tpl.head.text.replace(/[{}]/g, "");
    const args = [];
    tpl.templateSpans.forEach((sp, i) => { fmt += `{${i}}` + sp.literal.text.replace(/[{}]/g, ""); args.push(src(sp.expression)); });
    return { fmt, args };
  };

  const visit = (n) => {
    // 1. children runs of text + simple values
    if (ts.isJsxElement(n) || ts.isJsxFragment(n)) {
      const kids = n.children;
      let run = [];
      const flush = () => {
        const hasText = run.some((k) => ts.isJsxText(k) && /[A-Za-z]{2,}/.test(k.text));
        const exprs = run.filter((k) => ts.isJsxExpression(k) && k.expression && !ts.isStringLiteral(k.expression));
        if (hasText && exprs.length) {
          let fmt = "";
          const args = [];
          for (const k of run) {
            if (ts.isJsxText(k)) fmt += cleanJsxText(k.text);
            else if (k.expression && ts.isStringLiteral(k.expression)) fmt += k.expression.text;
            else if (k.expression) { fmt += `{${args.length}}`; args.push(src(k.expression)); }
          }
          fmt = fmt.replace(/[{](?!\d+})/g, "(").replace(/(?<!{\d+)}/g, ")");
          const core = fmt.trim();
          if (/[A-Za-z]{2,}/.test(core.replace(/\{\d+\}/g, ""))) {
            const lead = /^\s/.test(fmt) ? `{" "}` : "";
            const trail = /\s$/.test(fmt) ? `{" "}` : "";
            const start = run[0].pos, end = run[run.length - 1].end;
            edits.push([start, end, `${lead}{tj(${JSON.stringify(core)}${args.map((a) => ", " + a).join("")})}${trail}`]);
            needTj = true;
          }
        }
        run = [];
      };
      for (const k of kids) {
        if (ts.isJsxText(k)) run.push(k);
        else if (ts.isJsxExpression(k) && (!k.expression || ts.isStringLiteral(k.expression) || simpleExpr(k.expression))) run.push(k);
        else flush();
      }
      flush();
    }
    // 2. template literals in text attributes / text object keys / JSX children
    if (ts.isTemplateExpression(n) && /[A-Za-z]{2,}/.test(n.head.text + n.templateSpans.map((s) => s.literal.text).join(" "))) {
      const p = n.parent;
      let ok = false;
      // climb through ternaries, ||/??, parentheses and localize() to the JSX container or text property
      let q = p, via = n;
      while (q && (ts.isConditionalExpression(q) && q.condition !== via || ts.isParenthesizedExpression(q) || (ts.isBinaryExpression(q) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(q.operatorToken.kind) && q.right === via) || (ts.isCallExpression(q) && /^localize$/.test(q.expression.getText(sf))))) { via = q; q = q.parent; }
      if (q !== p && ts.isJsxExpression(q)) ok = ts.isJsxAttribute(q.parent) ? !SKIP_ATTR.test(q.parent.name.getText(sf)) : true;
      else if (q !== p && ts.isPropertyAssignment(q) && q.initializer === via) ok = TEXT_KEYS.test(q.name.getText(sf)) && insideFunction(q);
      else if (q !== p && (ts.isReturnStatement(q) || ts.isArrowFunction(q)) && insideJsxFile) ok = false;
      if (ok) {}
      else if (ts.isJsxExpression(p) && ts.isJsxAttribute(p.parent)) ok = !SKIP_ATTR.test(p.parent.name.getText(sf));
      else if (ts.isJsxExpression(p) && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent))) ok = true;
      else if (ts.isPropertyAssignment(p) && p.initializer === n) ok = TEXT_KEYS.test(p.name.getText(sf)) && insideFunction(p);
      else if (ts.isCallExpression(p) && /^(toast|setError|alert|confirm)$/.test(p.expression.getText(sf))) ok = true;
      if (ok) {
        const { fmt, args } = templateToT(n);
        edits.push([n.getStart(sf), n.getEnd(), `tx(${JSON.stringify(fmt)}${args.map((a) => ", " + a).join("")})`]);
        needT = true;
        return; // nested templates are inside the args, leave them
      }
    }
    ts.forEachChild(n, visit);
  };
  const insideFunction = (n) => { for (let p = n.parent; p; p = p.parent) if (ts.isFunctionLike(p)) return true; return false; };
  visit(sf);
  if (!edits.length) return 0;
  // apply from the end; drop overlapping edits (keep the outer one)
  edits.sort((a, b) => b[0] - a[0]);
  let out = text, lastStart = Infinity;
  for (const [s, e, r] of edits) { if (e > lastStart) continue; out = out.slice(0, s) + r + out.slice(e); lastStart = s; }
  const imports = [];
  if (needT && !/import \{ t as tx \} from "@shared\/i18n"/.test(out)) imports.push(`import { t as tx } from "@shared/i18n";`);
  if (needTj && !/from "@\/i18n-jsx\/tj"/.test(out)) imports.push(`import { tj } from "@/i18n-jsx/tj";`);
  if (imports.length) {
    // after the last import statement
    const sf2 = ts.createSourceFile(file, out, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lastImport = sf2.statements.filter(ts.isImportDeclaration).pop();
    const at = lastImport ? lastImport.getEnd() : 0;
    out = out.slice(0, at) + (at ? "\n" : "") + imports.join("\n") + (at ? "" : "\n") + out.slice(at);
  }
  fs.writeFileSync(file, out);
  return edits.length;
}

let files = 0, total = 0;
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    const rel = path.relative(root, p);
    if (e.isDirectory()) { if (!ADMIN.test(rel)) walk(p); }
    else if (p.endsWith(".tsx") && !ADMIN.test(rel)) { const n = processFile(p); if (n) { files++; total += n; } }
  }
};
walk(root);
console.log(`i18n wrap: ${total} edits in ${files} files`);
