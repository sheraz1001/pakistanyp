/**
 * Country-specific code for this site (Saudi Arabia). Each country pack supplies its own copy of this file;
 * everything else in the codebase is shared.
 */

// ---------------------------------------------------------------- phone numbers
// Saudi numbers: mobiles 05X XXX XXXX, landlines 01X XXX XXXX (9 digits after the trunk 0),
// unified numbers 9200 XXXXX and toll-free 800 XXX XXXX.
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  // Do not merge extensions or multiple phone numbers into a fictional number.
  const first = value.split(/[,;/]|\s+(?:or|ext\.?|x)\s*/i)[0].trim();
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0[1-9]\d{8}$/.test(digits)) return `966${digits.slice(1)}`;
  if (/^5\d{8}$/.test(digits)) return `966${digits}`;
  return digits;
}

export function formatPhone(value: unknown): string {
  const digits = normalizePhone(value);
  if (/^9665\d{8}$/.test(digits)) return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  if (/^966[1-9]\d{7,8}$/.test(digits)) return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  if (/^9200\d{5}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (/^800\d{7}$/.test(digits)) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  return typeof value === "string" ? value : "";
}

/** Valid national number (for forms and click-to-call). */
export function isValidPhone(value: unknown): boolean {
  const d = normalizePhone(value);
  return /^966[1-9]\d{7,8}$/.test(d) || /^9200\d{5}$/.test(d) || /^800\d{7}$/.test(d);
}

/** Mobile number (normalised digits) – used for WhatsApp buttons. */
export const isMobilePhone = (digits: string) => /^9665\d{8}$/.test(digits);

export const PHONE_HELP = "Enter a Saudi phone number, e.g. 050 123 4567, 011 123 4567 or 9200 12345.";

// ---------------------------------------------------------------- business names
/** Words kept in capitals when business names are title-cased. */
export const UPPERCASE_WORDS = /^(LLC|CJSC|JSC|KSA|CR|VAT|MEP|HVAC|IT|LPG|ATM|GOSI|ZATCA|MISA|SFDA|PRO)$/i;

/** Legal forms offered on the add-business form. */
export const LEGAL_FORMS: { value: string; label: string }[] = [
  { value: "Sole Establishment", label: "Sole Establishment (Muassasa)" },
  { value: "LLC", label: "Limited Liability Company (LLC)" },
  { value: "One Person LLC", label: "One-Person LLC" },
  { value: "Simplified JSC", label: "Simplified Joint Stock Company" },
  { value: "JSC", label: "Joint Stock Company" },
  { value: "General Partnership", label: "General Partnership" },
  { value: "Limited Partnership", label: "Limited Partnership" },
  { value: "Branch", label: "Branch of a Foreign Company" },
  { value: "Professional Company", label: "Professional Company" },
  { value: "Non-profit", label: "Non-profit / Charity" },
];

// ---------------------------------------------------------------- content helpers (admin page generators)
export const COUNTRY_FACTS: string[] = [
  "Saudi Arabia is the largest economy in the Middle East",
  "Riyadh is the capital and the main business centre",
  "Vision 2030 is diversifying the economy beyond oil",
  "Jeddah is the main port on the Red Sea and the gateway to Makkah",
  "Businesses register with the Ministry of Commerce and receive a commercial registration (CR)",
  "VAT and Zakat are administered by ZATCA",
  "Foreign investors are licensed by the Ministry of Investment (MISA)",
  "The Eastern Province is the centre of the oil and petrochemical industry"
];

/** Facts per region, keyed by its name. */
export const REGION_FACTS: Record<string, string[]> = {
  'Riyadh': [
    "Riyadh is the capital of Saudi Arabia",
    "King Abdullah Financial District is a major business hub",
    "Diriyah, the birthplace of the first Saudi state, is on the edge of the city",
    "Most ministries and many company headquarters are in Riyadh",
    "Al Kharj is an important farming and industrial town in the region"
  ],
  'Makkah': [
    "Makkah is the holiest city in Islam and welcomes millions of pilgrims each year",
    "Jeddah is the region's commercial centre and main Red Sea port",
    "Taif is known for its mountain climate and roses",
    "Hospitality, retail and transport serve the Hajj and Umrah seasons",
    "King Abdullah Economic City lies on the coast north of Jeddah"
  ],
  'Madinah': [
    "Madinah is home to the Prophet's Mosque",
    "Yanbu is a major industrial city and Red Sea port",
    "AlUla is known for its heritage sites and tourism",
    "Hospitality and retail serve visitors throughout the year",
    "Dates from Madinah are famous across the Muslim world"
  ],
  'Eastern Province': [
    "The Eastern Province is the heart of the Saudi oil industry",
    "Dammam, Khobar and Dhahran form one large urban area",
    "Jubail is one of the largest industrial cities in the world",
    "Al Ahsa is one of the largest date-palm oases in the world",
    "King Fahd Causeway links the province with Bahrain"
  ],
  'Asir': [
    "Abha is the capital of the Asir region",
    "The region's mountains have a cooler climate and attract summer visitors",
    "Khamis Mushait is the region's largest city and a commercial hub",
    "Agriculture and tourism are key local industries",
    "Asir is known for its traditional architecture and crafts"
  ]
};

/** Example FAQ text in the admin FAQ editor. */
export const SAMPLE_FAQ = `1. How do I register a business in Saudi Arabia?
Businesses register with the Ministry of Commerce, usually online through the Saudi Business Center, and receive a commercial registration (CR).

2. Do foreign investors need a licence?
Yes. Foreign-owned companies need an investment licence from the Ministry of Investment (MISA) before they register.

3. Do I need to register for VAT?
Businesses with taxable supplies above the mandatory threshold must register for VAT with ZATCA and issue electronic invoices.

4. Which documents are usually needed?
Owner or partner IDs, the trade name, the articles of association for companies, a business address and the licences required for the activity.`;
