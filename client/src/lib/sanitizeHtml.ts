/**
 * Minimal HTML sanitizer for user/AI-generated rich text (blog posts, news).
 * Removes executable content: <script>/<iframe>/<object>/<embed>/<style>/<form>,
 * inline event handlers (onclick=...), and javascript:/vbscript:/data:text/html URLs.
 * Works identically on the server (SSR) and in the browser, so hydration matches.
 */
const BLOCKED_TAGS = "script|iframe|object|embed|style|form|link|meta|base|frame|frameset|applet";

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  let out = String(html);
  // paired blocked tags with their content
  out = out.replace(new RegExp(`<(${BLOCKED_TAGS})\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>`, "gi"), "");
  // stray / self-closing blocked tags
  out = out.replace(new RegExp(`<\\/?(${BLOCKED_TAGS})\\b[^>]*>`, "gi"), "");
  // inline event handlers
  out = out.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // dangerous URL schemes in href/src/action/xlink:href
  out = out.replace(
    /\s(href|src|action|xlink:href|formaction)\s*=\s*("|')?\s*(javascript|vbscript|data:text\/html)[^"'\s>]*("|')?/gi,
    ' $1="#"'
  );
  return out;
}

export default sanitizeHtml;
