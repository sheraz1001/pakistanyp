/**
 * Names of categories and localities in the site's second language (shared/country.ts
 * `secondLanguage`), loaded into the database by server/catalogSync.ts.
 * CATEGORY_NAMES: category slug -> name. LOCALITY_NAMES: "<City>|<Locality>" -> name.
 * This site has no second language.
 */
export const CATEGORY_NAMES: Record<string, string> = {};
export const LOCALITY_NAMES: Record<string, string> = {};
