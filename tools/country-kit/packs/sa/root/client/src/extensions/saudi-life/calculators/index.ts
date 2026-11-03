/** All Saudi Life calculators, by slug. */
import type { Calculator } from "./types";
import { EMPLOYMENT } from "./employment";
import { UTILITIES } from "./utilities";
import { CARS } from "./cars";
import { EDUCATION } from "./education";
import { FAMILY } from "./family";

export const CALCULATORS: Calculator[] = [...EMPLOYMENT, ...UTILITIES, ...CARS, ...EDUCATION, ...FAMILY];
export const CALCULATOR_BY_SLUG = new Map(CALCULATORS.map((c) => [c.slug, c]));
export const CALCULATOR_GROUPS = [
  { id: "employment", items: EMPLOYMENT },
  { id: "home", items: UTILITIES },
  { id: "cars", items: CARS },
  { id: "education", items: EDUCATION },
  { id: "family", items: FAMILY },
];
export type { Calculator };
