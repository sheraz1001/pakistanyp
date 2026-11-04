/**
 * Markdown to HTML for editorial content (content/blog, content/news).
 *
 * Standard: ## / ### headings, paragraphs, - and 1. lists (one nested level), **bold**, *italic*, `code`,
 * [links](/path), tables (| a | b | with a | --- | row), > quotes, --- dividers.
 * Callouts: a quote starting with [!TIP], [!NOTE] or [!WARNING].
 * Blocks (between ":::name" and ":::"):
 *   takeaways  list -> "Key takeaways" box
 *   checklist  list -> checklist
 *   cta        title: / text: / button: / href: [/ eyebrow:] -> banner with a button
 *   faq        "### Question" + answer paragraphs -> FAQ section (the article page adds FAQPage structured data)
 * Raw HTML in the source is escaped.
 */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slugId = (s: string) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function safeUrl(url: string): string | null {
  const u = url.trim();
  if (/^(https?:\/\/|\/|#|mailto:|tel:)/i.test(u)) return u;
  return null;
}

export function inline(s: string): string {
  const codes: string[] = [];
  let out = s.replace(/`([^`]+)`/g, (_m, c) => { codes.push(`<code>${esc(c)}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  out = esc(out);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const href = safeUrl(url.replace(/&amp;/g, "&"));
    if (!href) return text;
    const ext = /^https?:\/\//i.test(href);
    return `<a href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${text}</a>`;
  });
  // bare https://… addresses become links (outside existing links)
  out = out.split(/(<a [^>]*>[\s\S]*?<\/a>)/).map((part) => (part.startsWith("<a ") ? part :
    part.replace(/(^|[\s(])(https?:\/\/[^\s<)]*[^\s<).,;:!?])/g, (_m, pre: string, url: string) => `${pre}<a href="${url}" target="_blank" rel="noopener noreferrer">${url.replace(/^https?:\/\/(www\.)?/, "")}</a>`))).join("");
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, "$1<em>$2</em>");
  return out.replace(/\u0000(\d+)\u0000/g, (_m, i) => codes[Number(i)]);
}

const CALLOUTS: Record<string, string> = { TIP: "Tip", NOTE: "Note", WARNING: "Important", INFO: "Good to know" };
const cells = (row: string) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function listHtml(lines: string[], cls = ""): string {
  // lines: "- item" / "1. item" / "  - sub"
  const items: { text: string; sub: string[] }[] = [];
  let tag: "ul" | "ol" = "ul";
  for (const line of lines) {
    if (/^\s{2,}[-*] /.test(line) && items.length) { items[items.length - 1].sub.push(line.trim().slice(2)); continue; }
    const t = line.trim();
    const ol = t.match(/^\d+\. (.*)$/);
    if (ol && !items.length) tag = "ol";
    items.push({ text: ol ? ol[1] : t.replace(/^[-*] /, ""), sub: [] });
  }
  const li = items.map((it) => `<li>${inline(it.text)}${it.sub.length ? `<ul>${it.sub.map((s) => `<li>${inline(s)}</li>`).join("")}</ul>` : ""}</li>`).join("");
  return `<${tag}${cls ? ` class="${cls}"` : ""}>${li}</${tag}>`;
}

function kv(lines: string[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const l of lines) { const i = l.indexOf(":"); if (i > 0) o[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim(); }
  return o;
}

function block(name: string, arg: string, body: string[]): string {
  const lines = body.filter((l) => l.trim());
  switch (name) {
    case "takeaways":
      return `<aside class="yp-box yp-takeaways not-prose"><p class="yp-box-title">${esc(arg || "Key takeaways")}</p>${listHtml(lines)}</aside>`;
    case "checklist":
      return `<div class="yp-box yp-checklist-box not-prose">${arg ? `<p class="yp-box-title">${esc(arg)}</p>` : ""}${listHtml(lines, "yp-checklist")}</div>`;
    case "cta": {
      const c = kv(lines);
      const href = safeUrl(c.href || "/add-business") || "/add-business";
      return `<aside class="yp-cta not-prose" aria-label="${esc(c.title || "Promotion")}"><div class="yp-cta-copy">${c.eyebrow ? `<p class="yp-cta-eyebrow">${inline(c.eyebrow)}</p>` : ""}` +
        `<p class="yp-cta-title">${inline(c.title || "")}</p>${c.text ? `<p class="yp-cta-text">${inline(c.text)}</p>` : ""}</div>` +
        `<a class="yp-cta-btn" href="${esc(href)}">${inline(c.button || "Get started")}</a></aside>`;
    }
    case "faq": {
      const qs: { q: string; a: string[] }[] = [];
      for (const l of body) {
        const m = l.trim().match(/^###\s+(.*)$/);
        if (m) qs.push({ q: m[1], a: [] });
        else if (qs.length) qs[qs.length - 1].a.push(l);
      }
      const items = qs.map((x, i) => `<details class="yp-faq-item"${i === 0 ? " open" : ""}><summary>${inline(x.q)}</summary><div class="yp-faq-a">${render(x.a.join("\n"))}</div></details>`).join("");
      return `<section class="yp-faq not-prose" aria-labelledby="faq"><h2 id="faq">${esc(arg || "Frequently asked questions")}</h2><div class="yp-faq-list">${items}</div></section>`;
    }
    // ---- infographics (HTML/CSS: crisp on every screen, readable by search engines, themed per site)
    case "stats": {
      const items = lines.map((l) => l.trim().replace(/^[-*] /, "").split("|").map((s) => s.trim()));
      return `<figure class="yp-ig yp-stats not-prose">${arg ? `<figcaption class="yp-ig-title">${inline(arg)}</figcaption>` : ""}` +
        `<ul class="yp-stats-grid" style="--n:${Math.min(items.length, 4)}">${items.map(([v, label]) => `<li><span class="yp-stat-value">${inline(v || "")}</span><span class="yp-stat-label">${inline(label || "")}</span></li>`).join("")}</ul></figure>`;
    }
    case "steps": {
      const items = lines.map((l) => l.trim().replace(/^([-*]|\d+\.) /, "").split("|").map((s) => s.trim()));
      return `<figure class="yp-ig yp-steps not-prose">${arg ? `<figcaption class="yp-ig-title">${inline(arg)}</figcaption>` : ""}` +
        `<ol class="yp-steps-list">${items.map(([title, text], i) => `<li><span class="yp-step-num" aria-hidden="true">${i + 1}</span><div><p class="yp-step-title">${inline(title || "")}</p>${text ? `<p class="yp-step-text">${inline(text)}</p>` : ""}</div></li>`).join("")}</ol></figure>`;
    }
    case "bars": {
      const items = lines.map((l) => l.trim().replace(/^[-*] /, "").split("|").map((s) => s.trim()));
      const max = Math.max(...items.map(([, v]) => Number(String(v).replace(/[^0-9.]/g, "")) || 0), 1);
      return `<figure class="yp-ig yp-bars not-prose">${arg ? `<figcaption class="yp-ig-title">${inline(arg)}</figcaption>` : ""}<ul class="yp-bars-list">` +
        items.map(([label, v, shown]) => {
          const n = Number(String(v).replace(/[^0-9.]/g, "")) || 0;
          const pct = Math.max(2, Math.round((n / max) * 100));
          return `<li><span class="yp-bar-label">${inline(label || "")}</span><span class="yp-bar-track"><span class="yp-bar-fill" style="width:${pct}%"></span></span><span class="yp-bar-value">${inline(shown || v || "")}</span></li>`;
        }).join("") + `</ul></figure>`;
    }
    default:
      return render(body.join("\n"));
  }
}

function render(md: string): string {
  const lines = md.replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list.length) { out.push(listHtml(list)); list = []; } };
  const flush = () => { flushPara(); flushList(); };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\s+$/, "");
    const t = line.trim();
    if (!t) { flushPara(); if (list.length && !/^(\s{2,}[-*] |[-*] |\d+\. )/.test(lines[i + 1] || "")) flushList(); continue; }

    const open = t.match(/^:::([a-z]+)\s*(.*)$/);
    if (open) {
      flush();
      const body: string[] = [];
      while (++i < lines.length && lines[i].trim() !== ":::") body.push(lines[i]);
      out.push(block(open[1], open[2], body));
      continue;
    }
    if (t.startsWith(">")) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; }
      i--;
      const m = (q[0] || "").match(/^\[!([A-Z]+)\]\s*(.*)$/);
      if (m && CALLOUTS[m[1]]) {
        const rest = [m[2], ...q.slice(1)].join("\n").trim();
        out.push(`<aside class="yp-callout yp-callout-${m[1].toLowerCase()} not-prose" role="note"><p class="yp-callout-label">${CALLOUTS[m[1]]}</p>${render(rest)}</aside>`);
      } else out.push(`<blockquote>${render(q.join("\n"))}</blockquote>`);
      continue;
    }
    if (t.startsWith("|") && /^\|?\s*:?-{3,}/.test((lines[i + 1] || "").trim())) {
      flush();
      const head = cells(t);
      i++;
      const rows: string[][] = [];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) rows.push(cells(lines[++i]));
      out.push(`<div class="yp-table-wrap not-prose"><table class="yp-table"><thead><tr>${head.map((h) => `<th scope="col">${inline(h)}</th>`).join("")}</tr></thead>` +
        `<tbody>${rows.map((r) => `<tr>${r.map((c, j) => (j === 0 ? `<th scope="row">${inline(c)}</th>` : `<td>${inline(c)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(t)) { flush(); out.push("<hr>"); continue; }
    const h = t.match(/^(#{2,4})\s+(.*)$/);
    if (h) {
      flush();
      const lvl = h[1].length, text = h[2], id = slugId(text);
      out.push(`<h${lvl}${id ? ` id="${id}"` : ""}>${inline(text)}</h${lvl}>`);
      continue;
    }
    if (/^([-*] |\d+\. )/.test(t) || (/^\s{2,}[-*] /.test(line) && list.length)) { flushPara(); list.push(line); continue; }
    flushList();
    para.push(t);
  }
  flush();
  return out.join("\n");
}

export const richMarkdownToHtml = (md: string) => render(md);
