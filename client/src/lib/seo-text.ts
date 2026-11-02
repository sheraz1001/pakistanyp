/** Keep titles ≤ 65 chars and descriptions ≤ 158 chars (what Google shows), cutting cleanly. */
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

export function clampTitle(title: string, max = 65): string {
  let t = decode(title || "");
  if (t.length <= max) return t;
  const parts = t.split(/\s*\|\s*/);
  // drop middle segments first, always keep the first segment and the brand at the end
  while (parts.length > 2 && parts.join(" | ").length > max) parts.splice(parts.length - 2, 1);
  t = parts.join(" | ");
  if (t.length <= max) return t;
  if (parts.length === 2 && (parts[0].length + 8) <= max) return parts[0].slice(0, max - 8).trim() + " | PakistanYP";
  return t.slice(0, max - 1).replace(/\s+\S*$/, "").trim() + "…";
}

export function clampDescription(desc: string, max = 158): string {
  const d = decode(desc || "");
  if (d.length <= max) return d;
  const cut = d.slice(0, max - 1);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(", "), cut.lastIndexOf(" "));
  return (end > max * 0.6 ? cut.slice(0, end) : cut).replace(/[,;\s]+$/, "") + (/[.!?]$/.test(cut.slice(0, end)) ? "" : "…");
}
