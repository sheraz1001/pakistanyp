/**
 * Country extensions (server). A country pack can replace this file (packs/<code>/root/server/extensions)
 * to add API routes, sitemap sections and start-up tasks. The template adds nothing.
 */
import type { Express } from "express";

export interface ExtensionSitemap { file: string; lastmod: () => Promise<string>; generate: () => Promise<string> }

export function registerExtensionRoutes(_app: Express): void {}
export const EXTENSION_SITEMAPS: ExtensionSitemap[] = [];
export async function startExtensions(): Promise<void> {}
