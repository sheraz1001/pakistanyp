/**
 * Saudi Life sections (shared by the pages, the server sitemap and the navigation).
 * English pages live at "/<path>", Arabic at "/ar/<path>" (the site's language convention).
 */
import { bi, type Bi } from "./lib";
import { CALCULATORS } from "./calculators";

export interface Section {
  id: string;
  path: string;
  title: Bi;
  tagline: Bi;
  intro: Bi;
  icon: string;               // lucide icon name
  calculators?: string[];     // calculator section ids shown here
  tools?: { href: string; title: Bi; desc: Bi }[];
  directory?: { slug: string; title: Bi }[];   // related business categories
  guides?: string;            // guide collection id
}

export const HUB_PATH = "/saudi-life";

export const SECTIONS: Section[] = [
  { id: "business-directory", path: "/categories", icon: "Building2",
    title: bi("Business Directory", "دليل الشركات"), tagline: bi("Find companies and services in every region, city and district.", "ابحث عن الشركات والخدمات في كل منطقة ومدينة وحي."),
    intro: bi("", "") },
  { id: "calculators", path: "/calculators", icon: "Calculator",
    title: bi("Calculators", "الحاسبات"), tagline: bi("Salary, end of service, GOSI, bills, cars, education and family budgets.", "الرواتب ونهاية الخدمة والتأمينات والفواتير والسيارات والتعليم وميزانية الأسرة."),
    intro: bi("Free calculators for everyday decisions in Saudi Arabia. Official rates come from the government bodies that publish them, each with its source and the date we last checked it; market prices are always yours to edit.",
      "حاسبات مجانية لقرارات الحياة اليومية في السعودية. تأتي النسب الرسمية من الجهات الحكومية التي تنشرها، مع مصدر كل منها وتاريخ آخر مراجعة، وتبقى أسعار السوق قابلة للتعديل دائمًا.") },
  { id: "education", path: "/education", icon: "GraduationCap",
    title: bi("Education & Schools", "التعليم والمدارس"), tagline: bi("School age, GPA, weighted admission percentage and education budgets.", "عمر القبول والمعدل والنسبة الموزونة وميزانية التعليم."),
    intro: bi("Tools for parents and students: check Grade 1 admission age, work out your GPA or university weighted percentage, and plan school and university costs. School listings are in the business directory.",
      "أدوات لأولياء الأمور والطلاب: تحقق من عمر القبول في الصف الأول، واحسب معدلك أو نسبتك الموزونة، وخطط لتكاليف المدرسة والجامعة. وتجد المدارس في دليل الشركات."),
    calculators: ["education"], directory: [{ slug: "schools", title: bi("Schools", "المدارس") }, { slug: "education-training", title: bi("Education & training", "التعليم والتدريب") }] },
  { id: "expat-guide", path: "/expat-guide", icon: "Globe2", guides: "expat",
    title: bi("Expatriate Guide", "دليل المقيمين"), tagline: bi("Iqama, family residency, exit/re-entry, work, banking, healthcare and more.", "الإقامة وإقامة الأسرة والخروج والعودة والعمل والبنوك والرعاية الصحية وغيرها."),
    intro: bi("Plain-language guides to the main procedures for residents and their families, with links to the official platforms where each is completed. SaudiYP is not a government service.",
      "أدلة مبسطة لأهم الإجراءات للمقيمين وأسرهم، مع روابط المنصات الرسمية التي تُنجز فيها. وSaudiYP ليس جهة حكومية."),
    directory: [{ slug: "business-setup-pro-services", title: bi("Business setup & PRO services", "تأسيس الأعمال وخدمات التعقيب") }] },
  { id: "cars-driving", path: "/cars-driving", icon: "Car",
    title: bi("Cars & Driving", "السيارات والقيادة"), tagline: bi("Fuel, finance, government fees, EV charging and running costs.", "الوقود والتمويل والرسوم الحكومية وشحن السيارات الكهربائية وتكاليف التشغيل."),
    intro: bi("Know what a car really costs in Saudi Arabia: fuel at Aramco prices, istimara, Fahas and licence fees, finance installments and the full cost of ownership.",
      "اعرف تكلفة السيارة الحقيقية في السعودية: الوقود بأسعار أرامكو، ورسوم الاستمارة والفحص الدوري والرخصة، وأقساط التمويل، والتكلفة الكاملة للامتلاك."),
    calculators: ["cars"], directory: [{ slug: "automotive", title: bi("Automotive services", "خدمات السيارات") }, { slug: "tyres-batteries", title: bi("Tyres & batteries", "الإطارات والبطاريات") }] },
  { id: "home-utilities", path: "/home-utilities", icon: "Home",
    title: bi("Home & Utilities", "المنزل والخدمات"), tagline: bi("Electricity and water bills, AC running costs, solar and the household budget.", "فواتير الكهرباء والمياه وتكلفة المكيفات والطاقة الشمسية وميزانية المنزل."),
    intro: bi("Electricity and water calculators use the official Saudi Energy and National Water Company tariffs, including the new tariffs that apply from 1 January 2027.",
      "تعتمد حاسبات الكهرباء والمياه على التعرفة الرسمية للشركة السعودية للطاقة وشركة المياه الوطنية، بما في ذلك التعرفة الجديدة اعتبارًا من ١ يناير ٢٠٢٧."),
    calculators: ["home"], directory: [{ slug: "home-services-maintenance", title: bi("Home services & maintenance", "الخدمات المنزلية والصيانة") }] },
  { id: "family-kids", path: "/family-kids", icon: "Users",
    title: bi("Family & Kids", "العائلة والأطفال"), tagline: bi("Family budgets, savings and activities for children.", "ميزانية الأسرة والادخار وأنشطة الأطفال."),
    intro: bi("Plan the family budget and savings. Family places and activities are listed in the business directory; event listings will only appear here when they come from verified sources.",
      "خطط لميزانية الأسرة ومدخراتها. وتجد أماكن العائلة والأنشطة في دليل الشركات، ولن تُعرض الفعاليات هنا إلا من مصادر موثقة."),
    calculators: ["family"], directory: [{ slug: "entertainment-attractions", title: bi("Entertainment & attractions", "الترفيه والمعالم") }, { slug: "sports-leisure-pets", title: bi("Sports & leisure", "الرياضة والترفيه") }] },
  { id: "travel-tourism", path: "/travel-tourism", icon: "Plane",
    title: bi("Travel & Tourism", "السفر والسياحة"), tagline: bi("Road-trip costs, hotels, tour operators and holidays.", "تكاليف الرحلات البرية والفنادق ومنظمو الرحلات والإجازات."),
    intro: bi("Plan trips around the Kingdom: estimate road-trip fuel, check public holidays and find hotels and tour operators in the directory.",
      "خطط لرحلاتك داخل المملكة: قدّر وقود الرحلات البرية، واطلع على الإجازات الرسمية، وابحث عن الفنادق ومنظمي الرحلات في الدليل."),
    tools: [{ href: "/calculators/trip-fuel-cost", title: bi("Road trip fuel cost", "تكلفة وقود الرحلة"), desc: bi("Fuel and cost per person for intercity trips.", "الوقود والتكلفة للفرد في الرحلات بين المدن.") },
      { href: "/holidays", title: bi("Public holidays", "الإجازات الرسمية"), desc: bi("Eid, Founding Day and National Day dates.", "مواعيد العيدين ويوم التأسيس واليوم الوطني.") }],
    directory: [{ slug: "hotels-furnished-units", title: bi("Hotels & furnished units", "الفنادق والوحدات المفروشة") }, { slug: "tour-operators", title: bi("Tour operators", "منظمو الرحلات") }, { slug: "travel-hajj-tourism", title: bi("Travel, Hajj & tourism", "السفر والحج والسياحة") }] },
  { id: "shopping-prices", path: "/shopping-prices", icon: "ShoppingBag",
    title: bi("Shopping & Prices", "التسوق والأسعار"), tagline: bi("Appliance running costs, budgets and buying guides.", "تكاليف تشغيل الأجهزة والميزانيات وأدلة الشراء."),
    intro: bi("Spend wisely: compare what appliances cost to run and plan your grocery and back-to-school budgets. We do not publish live retail prices unless they come from authorised retailer feeds.",
      "أنفق بحكمة: قارن تكلفة تشغيل الأجهزة وخطط لميزانية البقالة والعودة إلى المدارس. ولا ننشر أسعار تجزئة مباشرة إلا من مصادر معتمدة لدى التجار."),
    tools: [{ href: "/calculators/appliance-cost", title: bi("Appliance running cost", "تكلفة تشغيل الأجهزة"), desc: bi("What any appliance costs per month.", "تكلفة أي جهاز شهريًا.") },
      { href: "/calculators/household-budget", title: bi("Household budget", "ميزانية الأسرة"), desc: bi("Income against spending by category.", "الدخل مقابل الإنفاق حسب البند.") },
      { href: "/calculators/school-budget", title: bi("Back-to-school budget", "ميزانية العودة للمدارس"), desc: bi("Fees, uniforms, books and transport.", "الرسوم والزي والكتب والنقل.") }],
    directory: [{ slug: "supermarkets-groceries", title: bi("Supermarkets & groceries", "السوبرماركت والبقالة") }, { slug: "home-appliances-electronics", title: bi("Home appliances & electronics", "الأجهزة المنزلية والإلكترونيات") }] },
  { id: "holidays", path: "/holidays", icon: "CalendarDays",
    title: bi("Public Holidays & Calendars", "العطلات والتقويم"), tagline: bi("Official holidays, Hijri–Gregorian converter, Ramadan and the school calendar.", "الإجازات الرسمية ومحوّل التاريخ الهجري والميلادي ورمضان والتقويم الدراسي."),
    intro: bi("Saudi public holidays, the Umm al-Qura Hijri calendar and key dates for workers, families and students. Lunar dates are marked as expected until they are officially announced.",
      "الإجازات الرسمية في السعودية وتقويم أم القرى الهجري والمواعيد المهمة للعاملين والأسر والطلاب. وتُعرض التواريخ القمرية كتواريخ متوقعة حتى يُعلن عنها رسميًا."),
    tools: [{ href: "/holidays/hijri-converter", title: bi("Hijri ⇄ Gregorian converter", "محوّل التاريخ الهجري والميلادي"), desc: bi("Umm al-Qura calendar conversion.", "التحويل وفق تقويم أم القرى.") }] },
  { id: "cost-of-living", path: "/cost-of-living", icon: "Wallet",
    title: bi("Cost of Living", "تكلفة المعيشة"), tagline: bi("Family budgets by city, rent affordability and relocation costs.", "ميزانية الأسرة حسب المدينة والقدرة على تحمل الإيجار وتكاليف الانتقال."),
    intro: bi("Build a realistic budget for living in Riyadh, Jeddah, Dammam, Khobar and other cities from your own quotes and bills — we do not publish city averages without verified data.",
      "ابنِ ميزانية واقعية للمعيشة في الرياض وجدة والدمام والخبر وغيرها من المدن من عروض الأسعار وفواتيرك — فلا ننشر متوسطات للمدن دون بيانات موثقة."),
    tools: [{ href: "/cost-of-living/compare", title: bi("Compare two cities", "قارن بين مدينتين"), desc: bi("Side-by-side budgets with your own figures.", "ميزانيتان متجاورتان بأرقامك.") }],
    directory: [{ slug: "real-estate-accommodation", title: bi("Real estate & accommodation", "العقار والسكن") }] },
];

export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

/** Calculators for a section id. "calculators" lists the employment and family ones. */
export function calculatorsFor(sectionId: string) {
  return CALCULATORS.filter((c) => c.section === sectionId || (sectionId === "cost-of-living" && c.section === "cost-of-living"));
}

/** Every public Saudi Life path (English form), for routing checks and the sitemap. */
export function allLifePaths(guideSlugs: string[] = []): string[] {
  return [
    HUB_PATH,
    ...SECTIONS.filter((s) => s.id !== "business-directory").map((s) => s.path),
    ...CALCULATORS.map((c) => `/calculators/${c.slug}`),
    "/holidays/hijri-converter",
    "/cost-of-living/compare",
    ...guideSlugs.map((g) => `/expat-guide/${g}`),
  ];
}
