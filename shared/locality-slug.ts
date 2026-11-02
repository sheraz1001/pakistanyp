/** Keep public locality URLs stable without rewriting geographic records. */
export function normalizeLocalitySlug(slug: string): string {
  return slug.replace(/-{2,}/g, "-");
}

export function publicLocality<T extends { slug: string; canonicalUrl?: string | null }>(locality: T): T {
  return {
    ...locality,
    slug: normalizeLocalitySlug(locality.slug),
    ...(locality.canonicalUrl
      ? { canonicalUrl: locality.canonicalUrl.replace(/(\/localities\/[^?#]*)/, (path) => normalizeLocalitySlug(path)) }
      : {}),
  };
}
