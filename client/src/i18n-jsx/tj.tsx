import { Fragment, createElement, isValidElement, type ReactNode } from "react";
import { t } from "@shared/i18n";

/**
 * t() for text mixed with values inside JSX ("Showing {0} of {1}"). Values may be elements:
 * then the parts are returned as a fragment list instead of one string.
 */
export function tj(text: string, ...vars: ReactNode[]): ReactNode {
  if (!vars.some((v) => v !== null && typeof v === "object")) return t(text, ...(vars as unknown[]));
  const template = t(text);
  const parts: ReactNode[] = [];
  let last = 0;
  template.replace(/\{(\d+)\}/g, (m, i, at) => {
    if (at > last) parts.push(template.slice(last, at));
    parts.push(vars[Number(i)]);
    last = at + m.length;
    return m;
  });
  if (last < template.length) parts.push(template.slice(last));
  return parts.map((p, k) => (isValidElement(p) || (p && typeof p === "object") ? createElement(Fragment, { key: k }, p) : p));
}
