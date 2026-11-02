/**
 * Country-specific code for this site (India). Each country pack supplies its own copy of this file;
 * everything else in the codebase is shared.
 */

// ---------------------------------------------------------------- phone numbers
// Indian numbers: 10-digit mobiles starting 6-9 (optional trunk 0), landlines 0 + STD code
// + number (10 digits after the 0), toll-free 1800 XXX XXXX.
export function normalizePhone(value: unknown): string {
  if (typeof value !== "string") return "";
  // Do not merge extensions or multiple phone numbers into a fictional number.
  const first = value.split(/[,;/]|\s+(?:or|ext\.?|x)\s*/i)[0].trim();
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^0?[6-9]\d{9}$/.test(digits)) return `91${digits.slice(-10)}`;
  if (/^0[1-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`;
  return digits;
}

export function formatPhone(value: unknown): string {
  const digits = normalizePhone(value);
  if (/^91[6-9]\d{9}$/.test(digits)) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  if (/^91[1-5]\d{9}$/.test(digits)) {
    const rest = digits.slice(2);
    // Metro STD codes are 2 digits (11 Delhi, 20 Pune, 22 Mumbai, 33 Kolkata, 40 Hyderabad, 44 Chennai, 79 Ahmedabad, 80 Bengaluru)
    const code = /^(11|20|22|33|40|44|79|80)/.test(rest) ? rest.slice(0, 2) : rest.slice(0, 3);
    return `+91 ${code} ${rest.slice(code.length)}`;
  }
  if (/^1800\d{6,7}$/.test(digits)) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return typeof value === "string" ? value : "";
}

/** Valid national number (for forms and click-to-call). */
export function isValidPhone(value: unknown): boolean {
  const d = normalizePhone(value);
  return /^91[1-9]\d{9}$/.test(d) || /^1800\d{6,7}$/.test(d);
}

/** Mobile number (normalised digits) – used for WhatsApp buttons. */
export const isMobilePhone = (digits: string) => /^91[6-9]\d{9}$/.test(digits);

export const PHONE_HELP = "Enter an Indian phone number, e.g. 98765 43210 or 022 12345678.";

// ---------------------------------------------------------------- business names
/** Words kept in capitals when business names are title-cased. */
export const UPPERCASE_WORDS = /^(PVT|LTD|LLP|OPC|IT|CA|GST|CNG|LPG|ATM|MG|NH|HSR|BTM|JP|DLF|HDFC|ICICI|SBI)$/i;

/** Legal forms offered on the add-business form. */
export const LEGAL_FORMS: { value: string; label: string }[] = [
  { value: "Proprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership Firm" },
  { value: "LLP", label: "Limited Liability Partnership (LLP)" },
  { value: "OPC", label: "One Person Company (OPC)" },
  { value: "Pvt Ltd", label: "Private Limited Company" },
  { value: "Public Ltd", label: "Public Limited Company" },
  { value: "HUF", label: "Hindu Undivided Family (HUF)" },
  { value: "Branch", label: "Branch / Liaison Office" },
  { value: "NGO", label: "Trust / Society / Section 8 Company" },
];

// ---------------------------------------------------------------- content helpers (admin page generators)
export const COUNTRY_FACTS: string[] = [
  "India is the world's most populous country",
  "India is one of the fastest-growing large economies",
  "Mumbai is India's financial capital",
  "Bengaluru is known as India's technology hub",
  "Businesses register for GST under the Goods and Services Tax regime",
  "Companies and LLPs are incorporated with the Ministry of Corporate Affairs (MCA)",
  "Small businesses can register as MSMEs through Udyam",
  "India has one of the world's largest start-up ecosystems"
];

/** Facts per state / union territory, keyed by its name. */
export const REGION_FACTS: Record<string, string[]> = {
  'Maharashtra': [
    "Mumbai, the state capital, is India's financial centre",
    "Pune is a major hub for education, IT and automobiles",
    "Maharashtra contributes the largest share of India's GDP",
    "Nagpur is known as the geographic centre of India",
    "The state is home to Bollywood, the Hindi film industry"
  ],
  'Karnataka': [
    "Bengaluru is India's technology and start-up capital",
    "Mysuru is known for its palace and silk",
    "Mangaluru is an important port on the west coast",
    "Karnataka is a leading producer of coffee",
    "Hubballi-Dharwad is a major commercial centre in the north of the state"
  ],
  'Tamil Nadu': [
    "Chennai is a major centre for automobiles and IT",
    "Coimbatore is known for textiles and engineering",
    "Tamil Nadu is one of India's most industrialised states",
    "Madurai is one of the oldest continuously inhabited cities in India",
    "Tiruppur is a leading exporter of knitwear"
  ],
  'Delhi': [
    "New Delhi is the capital of India",
    "Connaught Place is one of the city's main business districts",
    "Delhi is the centre of the National Capital Region",
    "Chandni Chowk is one of India's oldest and busiest markets",
    "Many company headquarters and government offices are in Delhi"
  ],
  'Gujarat': [
    "Ahmedabad is Gujarat's largest city and a textile centre",
    "Surat is the world's leading diamond-cutting centre",
    "Gujarat has India's longest coastline",
    "GIFT City in Gandhinagar is India's international financial services centre",
    "Vadodara and Rajkot are major industrial cities"
  ]
};

/** Example FAQ text in the admin FAQ editor. */
export const SAMPLE_FAQ = `1. How do I register a company in India?
Companies and LLPs are registered online with the Ministry of Corporate Affairs (MCA) using the SPICe+ form.

2. Do I need GST registration?
Businesses whose turnover is above the GST threshold, and businesses that sell between states or online, must register for GST.

3. What is Udyam registration?
Udyam is the free online registration for micro, small and medium enterprises (MSMEs). It gives access to government schemes and priority lending.

4. Which documents are usually needed?
PAN and Aadhaar of the owners or directors, proof of the business address, and the constitution documents of the business.`;
