/**
 * Country extensions (client). A country pack can replace this file (packs/<code>/root/client/src/extensions)
 * to add its own sections, e.g. SaudiYP's "Saudi Life" portal. The template adds nothing.
 *
 *   EXTENSION_ROUTES  routes registered before the directory's catch-all routes
 *   EXTENSION_NAV     extra main-menu items (label, href)
 *   HomeExtension     optional block rendered on the home page
 */
import type { ComponentType } from "react";

export interface ExtensionRoute { path: string; component: ComponentType<any> }
export interface ExtensionNavItem { name: string; href: string }

export const EXTENSION_ROUTES: ExtensionRoute[] = [];
export const EXTENSION_NAV: ExtensionNavItem[] = [];
export const HomeExtension: ComponentType | null = null;
