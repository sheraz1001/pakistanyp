# Data brief: country places and category files (YP directory sites)

These sites (IndiaYP / SaudiYP, same design as PakistanYP) are business directories organised
Province/State/Region > City > Locality. Reference implementation (read it first):
- Places:     /home/user/pakistanyp/shared/countries/pakistan-places.ts
- Categories: /home/user/pakistanyp/shared/countries/pakistan-categories.ts

## Places file format (exactly like the Pakistan file, but generic export names)
- `import type { Region } from "../country";`
- Local types `City = { name; nameAr?; localities?: string[] }` and
  `RegionDef = { slug; code; name; nameAr; capital?: boolean; territory?: boolean; cities: City[] }`.
- Export `REGIONS: Region[]` built exactly like PAKISTAN_REGIONS (cities first with `nameAr: c.nameAr || ""`,
  then `"<Locality>, <City>"` entries with `locality: true`, `nameAr: ""`) and
  `TERRITORIES = new Set(<slugs of regions with territory: true>)`.
- `nameAr` = the local-script name (India: Hindi in Devanagari; Saudi: Arabic). Omit when not sure.
- Locality names short, without the city suffix (the helper adds ", <City>").
- No duplicate city names within a region, no duplicate localities within a city, no slug collisions
  after lowercasing+hyphenating "<Locality>, <City>".
- CRITICAL: keep every region (slug, code, name) and every existing city and locality from the current data
  EXACTLY as spelled (live databases already contain them); only add.

## Categories file format (exactly like the Pakistan file)
- Text constant `CATEGORY_TREE` with "# Sector" lines and "## Group: item; item; ..." lines,
  plus the same `CategoryRow` interface, `slugify` and `parseCategoryTree(tree = CATEGORY_TREE)` copied unchanged.
- Main category = sector (level 1), sub-category = group (level 2), specialised = items (level 3).
- No duplicate names anywhere in the tree (a group may not share a name with an item).
- No brand/company names. Words people in that country actually search.

## Verification (run before reporting)
`cd /home/user/pakistanyp && npx tsx -e '...'` importing your file by absolute path: print per-region city and
locality counts, assert no duplicate (region, name) and no slug collisions; for categories print
total / level-1 / level-2 / level-3 counts and assert unique slugs. (node_modules is available there.)
Write only the file(s) you were asked to write. Report counts and anything left out for lack of confidence.
