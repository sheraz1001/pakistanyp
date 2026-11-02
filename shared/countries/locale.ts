/**
 * Country-specific code for this site (Pakistan). Each country pack supplies its own copy of this file;
 * everything else in the codebase is shared.
 */

// ---------------------------------------------------------------- phone numbers
// Pakistani numbers. Mobiles: 03XX XXXXXXX (10 digits after the trunk 0).
// Landlines: 0 + area code (2 digits for the big cities, e.g. 21 Karachi, 42 Lahore,
// 51 Islamabad/Rawalpindi; 3 digits elsewhere) + local number.
const PK_TWO_DIGIT_AREA = /^(21|22|41|42|51|52|55|61|71|81|91)/;

export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  // Do not merge extensions or multiple phone numbers into a fictional number.
  const first = value.split(/[,;/]|\s+(?:or|ext\.?|x)\s*/i)[0].trim();
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^03\d{9}$/.test(digits)) return `92${digits.slice(1)}`;
  if (/^3\d{9}$/.test(digits)) return `92${digits}`;
  if (/^0[1-9]\d{8,9}$/.test(digits)) return `92${digits.slice(1)}`;
  return digits;
}

export function formatPhone(value: unknown): string {
  const digits = normalizePhone(value);
  if (/^923\d{9}$/.test(digits)) return `+92 ${digits.slice(2, 5)} ${digits.slice(5)}`;
  if (/^92[1-9]\d{8,9}$/.test(digits)) {
    const rest = digits.slice(2);
    const code = PK_TWO_DIGIT_AREA.test(rest) ? rest.slice(0, 2) : rest.slice(0, 3);
    return `+92 ${code} ${rest.slice(code.length)}`;
  }
  return typeof value === "string" ? value : "";
}


/** Valid national number (for forms and click-to-call). */
export function isValidPhone(value: unknown): boolean {
  const d = normalizePhone(value);
  return /^923\d{9}$/.test(d) || /^92[1-9]\d{8,9}$/.test(d);
}

/** Mobile number (normalised digits) – used for WhatsApp buttons. */
export const isMobilePhone = (digits: string) => /^923\d{9}$/.test(digits);

export const PHONE_HELP = "Enter a Pakistani phone number, e.g. 0300 1234567 or 021 12345678.";

// ---------------------------------------------------------------- business names
/** Words kept in capitals when business names are title-cased. */
export const UPPERCASE_WORDS = /^(PVT|LTD|SMC|LLP|DHA|PECHS|IT|CNG|LPG|ATM|NADRA|SECP|FBR)$/i;

/** Legal forms offered on the add-business form. */
export const LEGAL_FORMS: { value: string; label: string }[] = [
  { value: "Sole Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership (AOP)" },
  { value: "SMC-Pvt", label: "Single Member Company (SMC-Private) Limited" },
  { value: "Pvt Ltd", label: "Private Limited Company" },
  { value: "Public Ltd", label: "Public Limited Company" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "Branch", label: "Branch / Liaison Office" },
  { value: "NGO", label: "NGO / Trust / Society" },
];

// ---------------------------------------------------------------- content helpers (admin page generators)
export const COUNTRY_FACTS: string[] = [
  "Pakistan is one of the world's most populous countries, with a large and young consumer market",
  "Karachi is Pakistan's largest city and financial centre",
  "Textiles are Pakistan's largest export industry",
  "Pakistan has one of the world's largest communities of freelancers",
  "Businesses register for tax with the Federal Board of Revenue (FBR)",
  "Companies in Pakistan are incorporated with the SECP",
  "Lahore is a major hub for trade, education and culture",
  "Islamabad and Rawalpindi together form a growing business region"
];

/** Facts per province / region, keyed by its name. */
export const REGION_FACTS: Record<string, string[]> = {
  'Punjab': [
    "Punjab is Pakistan's most populous province",
    "Lahore, the provincial capital, is Pakistan's second-largest city",
    "Punjab is the country's agricultural heartland and grows most of its wheat",
    "Faisalabad is a major centre of the textile industry",
    "Sialkot is known worldwide for sports goods and surgical instruments"
  ],
  'Sindh': [
    "Karachi is Pakistan's largest city and main commercial hub",
    "The Port of Karachi is the country's busiest seaport",
    "The Indus River flows through Sindh to the Arabian Sea",
    "Hyderabad is Sindh's second-largest city",
    "Mohenjo-daro, a UNESCO World Heritage Site, is in Sindh"
  ],
  'Khyber Pakhtunkhwa': [
    "Peshawar is one of the oldest cities in South Asia",
    "The province is known for mountain valleys such as Swat",
    "Abbottabad and Mansehra are gateways to the northern areas",
    "The Khyber Pass links Pakistan with Afghanistan",
    "Peshawar's Qissa Khwani Bazaar is a historic trading centre"
  ],
  'Balochistan': [
    "Balochistan is Pakistan's largest province by area",
    "Gwadar is a deep-sea port on the Arabian Sea coast",
    "Quetta is the provincial capital",
    "The province is rich in minerals and natural gas",
    "Balochistan has a long coastline along the Arabian Sea"
  ],
  'Islamabad Capital Territory': [
    "Islamabad is Pakistan's planned capital city",
    "The city is laid out in sectors such as F-7 and G-9",
    "The Faisal Mosque is one of the largest mosques in the world",
    "The Margalla Hills National Park borders the city",
    "Blue Area is the city's main business district"
  ],
  'Gilgit-Baltistan': [
    "Gilgit-Baltistan is home to K2, the world's second-highest mountain",
    "The Karakoram Highway runs through the region",
    "Hunza and Skardu are popular tourist destinations",
    "Gilgit is the regional capital",
    "Tourism and hospitality are key local industries"
  ],
  'Azad Jammu and Kashmir': [
    "Muzaffarabad is the capital of Azad Jammu and Kashmir",
    "Mirpur has a large overseas community, mainly in the United Kingdom",
    "The Neelum Valley is a well-known tourist destination",
    "The Jhelum and Neelum rivers flow through the region",
    "Hydropower is an important local industry"
  ]
};

/** Example FAQ text in the admin FAQ editor. */
export const SAMPLE_FAQ = `1. How do I register a company in Pakistan?
Companies are registered online with the Securities and Exchange Commission of Pakistan (SECP). A private limited company can be registered by one or more people.

2. Do I need an NTN for my business?
Yes. Businesses and individuals earning taxable income register with the Federal Board of Revenue (FBR) to get a National Tax Number (NTN).

3. How long does SECP company registration take?
Online registration is usually completed within a few working days once the name is approved and documents are submitted.

4. Which documents are usually needed?
Copies of the CNICs of directors and shareholders, the proposed company name, the registered office address and the company's memorandum and articles of association.`;
