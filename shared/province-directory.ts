/** Public geographic identity must not depend on editable CMS display names. */
export const provinceDirectory = [
  { code: "AUH", name: "Lahore", slug: "lahore" },
  { code: "DXB", name: "Karachi", slug: "karachi" },
  { code: "SHJ", name: "Islamabad", slug: "islamabad" },
  { code: "AJM", name: "Rawalpindi", slug: "rawalpindi" },
  { code: "RAK", name: "Faisalabad", slug: "faisalabad" },
  { code: "FUJ", name: "Peshawar", slug: "peshawar" },
  { code: "UAQ", name: "Multan", slug: "multan" },
] as const;

export function publicProvince<T extends { code: string; name: string }>(record: T): T & { slug: string } {
  const identity = provinceDirectory.find(item => item.code === record.code?.toUpperCase());
  return {
    ...record,
    name: identity?.name ?? record.name,
    slug: identity?.slug ?? record.name.toLowerCase().trim().replace(/\s+/g, "-"),
  };
}
