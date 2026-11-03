/**
 * Country extensions (server) — SaudiYP: the "Saudi Life" consumer portal (calculators, guides, holidays).
 * This file comes from the country pack (tools/country-kit/packs/sa/root); the template's version adds nothing.
 */
import type { Express } from "express";
import { registerSaudiLifeRoutes, startSaudiLife, lifeSitemap } from "./saudi-life/server";

export interface ExtensionSitemap { file: string; lastmod: () => Promise<string>; generate: () => Promise<string> }

export function registerExtensionRoutes(app: Express): void { registerSaudiLifeRoutes(app); }
export const EXTENSION_SITEMAPS: ExtensionSitemap[] = [lifeSitemap];
export async function startExtensions(): Promise<void> { await startSaudiLife(); }
