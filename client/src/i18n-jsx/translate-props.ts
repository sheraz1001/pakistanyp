/**
 * JSX runtime wrapper: on second-language pages, text children and text props
 * (placeholder, title, aria-label, alt, label) are translated through the site dictionary
 * when React elements are created, and numbers are shown in the language's digits.
 * Covers text that is not wrapped in t(): menus built from constants, form errors, toasts...
 * English pages pass through unchanged.
 */
import { isSecondLang, translateNode, langPath } from "@shared/i18n";

const TEXT_PROPS = ["placeholder", "title", "aria-label", "alt", "label"];
const SKIP = new Set(["script", "style", "code", "pre", "kbd", "samp"]);

const child = (c: unknown): unknown =>
  typeof c === "string" ? translateNode(c) : typeof c === "number" ? translateNode(String(c)) : c;

export function translateProps(type: unknown, props: any): any {
  if (!props || typeof props !== "object" || !isSecondLang() || (typeof type === "string" && SKIP.has(type))) return props;
  if (props.dangerouslySetInnerHTML) return props;
  let out = props;
  const set = (k: string, v: unknown) => { if (out === props) out = { ...props }; out[k] = v; };
  const c = props.children;
  if (typeof c === "string" || typeof c === "number") set("children", child(c));
  else if (Array.isArray(c) && c.some((x) => typeof x === "string" || typeof x === "number")) set("children", c.map(child));
  for (const k of TEXT_PROPS) if (typeof props[k] === "string") set(k, translateNode(props[k]));
  // internal links stay in the page's language (wouter <Link> already does; langPath is idempotent)
  if (type === "a" && typeof props.href === "string" && props.href.startsWith("/") && !props.href.startsWith("//")) {
    const href = langPath(props.href);
    if (href !== props.href) set("href", href);
  }
  return out;
}
