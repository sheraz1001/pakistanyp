/**
 * Country extensions (client) — SaudiYP: the "Saudi Life" consumer portal.
 * This file comes from the country pack (tools/country-kit/packs/sa/root); the template's version adds nothing.
 * English pages at "/<path>", Arabic at "/ar/<path>" (the site's language convention).
 */
import type { ComponentType } from "react";
import { lazy } from "@/lib/lazy-route";
import LifeHomeBlock from "./saudi-life/home-block";
import "./saudi-life/life.css";

export interface ExtensionRoute { path: string; component: ComponentType<any> }
export interface ExtensionNavItem { name: string; href: string }

const page = (name: string) => lazy(() => import("./saudi-life/pages").then((m: any) => ({ default: m[name] })), `ext/saudi-life/${name}`);
const section = (id: string) => lazy(() => import("./saudi-life/pages").then((m: any) => ({ default: m.sectionComponent(id) })), `ext/saudi-life/section-${id}`);

export const EXTENSION_ROUTES: ExtensionRoute[] = [
  { path: "/admin/saudi-life", component: lazy(() => import("./saudi-life/admin"), "ext/saudi-life/admin") },
  { path: "/saudi-life", component: page("LifeHub") },
  { path: "/calculators", component: section("calculators") },
  { path: "/calculators/:slug", component: page("CalculatorPage") },
  { path: "/holidays/hijri-converter", component: page("HijriConverter") },
  { path: "/holidays", component: page("HolidaysPage") },
  { path: "/cost-of-living/compare", component: page("CityCompare") },
  { path: "/expat-guide/:slug", component: page("GuidePage") },
  ...["education", "expat-guide", "cars-driving", "home-utilities", "family-kids", "travel-tourism", "shopping-prices", "cost-of-living"]
    .map((id) => ({ path: `/${id}`, component: section(id) })),
];

/** "Saudi Life" in the main menu (translated through the site dictionary on Arabic pages). */
export const EXTENSION_NAV: ExtensionNavItem[] = [{ name: "Saudi Life", href: "/saudi-life" }];
export const HomeExtension: ComponentType | null = LifeHomeBlock;
