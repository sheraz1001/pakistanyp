/**
 * Helmet Compatibility Layer
 * Handles ESM/CommonJS import issues with react-helmet-async for SSR.
 *
 * Multi-country: on non-Pakistani deploys every string inside <Helmet> (title text,
 * meta content, link hrefs, JSON-LD) is passed through localize(), so page
 * metadata written for Pakistan reads correctly for the active country.
 * On Pakistan site the original Helmet is exported unchanged.
 */
import * as React from "react";
import * as ReactHelmetAsync from "react-helmet-async";
import { country, localize } from "@shared/country";

const mod = ReactHelmetAsync as any;

const BaseHelmet = mod.Helmet || mod.default?.Helmet;

function localizeNode(node: any): any {
  if (typeof node === "string") return localize(node);
  if (Array.isArray(node)) return node.map(localizeNode);
  if (React.isValidElement(node)) {
    const props: any = node.props || {};
    const next: Record<string, unknown> = {};
    for (const key of ["content", "href", "title"]) {
      if (typeof props[key] === "string") next[key] = localize(props[key]);
    }
    if (props.children !== undefined) next.children = localizeNode(props.children);
    return React.cloneElement(node, next);
  }
  return node;
}

function LocalizedHelmet(props: any) {
  return React.createElement(BaseHelmet, props, localizeNode(props.children));
}

export const Helmet = LocalizedHelmet;
export const HelmetProvider = mod.HelmetProvider || mod.default?.HelmetProvider;
export type HelmetServerState = ReactHelmetAsync.HelmetServerState;
