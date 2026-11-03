/** Education calculators: GPA, grades, university weighted percentage, school age, budgets. */
import { bi, sar, fmt, pct, formatDate } from "../lib";
import { type Calculator, n, s, ruleValue, round2, InputError } from "./types";

const REVIEWED = "2026-11-03";

/** GPA from "grade,credits" lines; grade = letter (A+, A, ...) or a percentage mark. */
export function gpa(lines: string, scale: "5" | "4", table: { letter: string; range: string; gpa4: number; gpa5: number }[]) {
  let points = 0, credits = 0;
  const pointsFor = (g: string) => {
    const row = table.find((r) => r.letter.toUpperCase() === g.toUpperCase());
    if (row) return scale === "5" ? row.gpa5 : row.gpa4;
    const mark = Number(g);
    if (!Number.isFinite(mark) || mark < 0 || mark > 100) return null;
    const byMark = table.find((r) => { const [lo] = r.range.replace("<", "").split("-").map(Number); return r.range.startsWith("<") ? mark < 60 : mark >= lo; });
    return byMark ? (scale === "5" ? byMark.gpa5 : byMark.gpa4) : null;
  };
  const rows = lines.split(/\n|;/).map((l) => l.trim()).filter(Boolean);
  for (const [i, line] of rows.entries()) {
    const [g, c] = line.split(/[,\s]+/);
    const p = pointsFor(g || ""), cr = Number(c);
    if (p === null || !Number.isFinite(cr) || cr <= 0) throw new InputError("courses", bi(`Line ${i + 1}: write a grade (A+, B or a mark) and credit hours, e.g. "A, 3".`, `السطر ${i + 1}: اكتب التقدير (A+ أو B أو الدرجة) والساعات المعتمدة، مثل "A, 3".`));
    points += p * cr; credits += cr;
  }
  if (!credits) throw new InputError("courses", bi("Add at least one course.", "أضف مقررًا واحدًا على الأقل."));
  return { gpa: points / credits, credits, points };
}

export const gpaCalc: Calculator = {
  slug: "gpa",
  section: "education",
  title: bi("GPA Calculator (Saudi Universities, 5 and 4 scales)", "حاسبة المعدل التراكمي (الجامعات السعودية، من ٥ ومن ٤)"),
  short: bi("Semester or cumulative GPA out of 5 or out of 4 from your grades and credit hours.", "المعدل الفصلي أو التراكمي من ٥ أو من ٤ من تقديراتك وساعاتك المعتمدة."),
  metaDescription: bi("Calculate your GPA out of 5 or 4 using the Saudi university grade table (A+ to F) and credit hours, with an option to add your previous cumulative GPA.", "احسب معدلك من ٥ أو من ٤ وفق جدول التقديرات في الجامعات السعودية (A+ إلى F) والساعات المعتمدة، مع إمكانية إضافة معدلك التراكمي السابق."),
  kind: "official",
  ruleIds: ["gpa_scales"],
  inputs: [
    { id: "scale", type: "select", label: bi("Scale", "المقياس"), default: "5", options: [{ value: "5", label: bi("Out of 5", "من ٥") }, { value: "4", label: bi("Out of 4", "من ٤") }] },
    { id: "courses", type: "text", multiline: true, label: bi("Courses: grade, credit hours (one per line)", "المقررات: التقدير، الساعات المعتمدة (مقرر في كل سطر)"), default: "A+, 3\nB+, 4\nA, 3\nC, 2" },
    { id: "prevGpa", type: "number", label: bi("Previous cumulative GPA (optional)", "المعدل التراكمي السابق (اختياري)"), min: 0, max: 5, step: 0.01, default: 0 },
    { id: "prevCredits", type: "number", label: bi("Previous credit hours", "الساعات المعتمدة السابقة"), min: 0, max: 400, step: 1, default: 0 },
  ],
  compute(v, rules) {
    const scale = s(v, "scale") === "4" ? "4" : "5";
    const table = ruleValue(rules, "gpa_scales").table;
    const sem = gpa(s(v, "courses"), scale, table);
    const prevG = n(v, "prevGpa", { min: 0, max: Number(scale) }), prevC = n(v, "prevCredits", { min: 0 });
    const cumulative = prevC > 0 ? (sem.points + prevG * prevC) / (sem.credits + prevC) : sem.gpa;
    return {
      headline: { label: prevC > 0 ? bi("Cumulative GPA", "المعدل التراكمي") : bi("Semester GPA", "المعدل الفصلي"), value: `${fmt(cumulative, 2)} / ${scale}` },
      rows: [
        { label: bi("Semester GPA", "المعدل الفصلي"), value: fmt(sem.gpa, 2) },
        { label: bi("Semester credit hours", "ساعات الفصل"), value: fmt(sem.credits, 0) },
        { label: bi("Cumulative GPA", "المعدل التراكمي"), value: fmt(cumulative, 2), strong: true },
      ],
    };
  },
  content: {
    intro: bi("Saudi universities use a common grade table: A+ (95–100) is 5.00 out of 5 or 4.00 out of 4, A is 4.75 / 3.75, and so on down to F below 60. Some universities, such as KFUPM, use the 4-point scale.", "تعتمد الجامعات السعودية جدول تقديرات موحدًا: A+ (٩٥–١٠٠) يعادل ٥٫٠٠ من ٥ أو ٤٫٠٠ من ٤، وA يعادل ٤٫٧٥ / ٣٫٧٥، وهكذا حتى F لأقل من ٦٠. وتستخدم بعض الجامعات مثل جامعة الملك فهد للبترول والمعادن مقياس ٤."),
    howTo: bi("Write one course per line as grade and credit hours, e.g. \"A+, 3\". You can use a mark out of 100 instead of the letter. Add your previous GPA and hours for the cumulative GPA.", "اكتب كل مقرر في سطر: التقدير ثم الساعات المعتمدة، مثل \"A+, 3\"، ويمكنك كتابة الدرجة من ١٠٠ بدل الحرف. وأضف معدلك السابق وساعاته للحصول على المعدل التراكمي."),
    formula: bi("GPA = Σ(grade points × credit hours) ÷ Σ credit hours.", "المعدل = مجموع (نقاط التقدير × الساعات) ÷ مجموع الساعات."),
    example: bi("A+ (3 h), B+ (4 h), A (3 h), C (2 h) on the 5 scale: (15 + 18 + 14.25 + 6) ÷ 12 = 4.44.", "A+ (٣ ساعات) وB+ (٤ ساعات) وA (٣ ساعات) وC (ساعتان) على مقياس ٥: (١٥ + ١٨ + ١٤٫٢٥ + ٦) ÷ ١٢ = ٤٫٤٤."),
    limitations: bi("Check your university's regulations for repeated courses, pass/fail courses and the exact grade table.", "راجع لوائح جامعتك بشأن المقررات المعادة ومقررات النجاح والرسوب وجدول التقديرات المعتمد."),
  },
  related: ["grade-percentage", "weighted-admission"],
  reviewed: REVIEWED,
};

export const gradePercentage: Calculator = {
  slug: "grade-percentage",
  section: "education",
  title: bi("Grade Percentage Calculator", "حاسبة النسبة المئوية للدرجات"),
  short: bi("Turn a score into a percentage and see the grade it corresponds to.", "حوّل الدرجة إلى نسبة مئوية واعرف التقدير المقابل لها."),
  metaDescription: bi("Convert a test or course score into a percentage and the matching grade on the Saudi university grade table.", "حوّل درجة الاختبار أو المقرر إلى نسبة مئوية والتقدير المقابل في جدول تقديرات الجامعات السعودية."),
  kind: "official",
  ruleIds: ["gpa_scales"],
  inputs: [
    { id: "score", type: "number", label: bi("Your score", "درجتك"), min: 0, step: 0.5, default: 43 },
    { id: "max", type: "number", label: bi("Out of", "من"), min: 1, step: 0.5, default: 50 },
  ],
  compute(v, rules) {
    const score = n(v, "score", { min: 0 }), max = n(v, "max", { min: 0.01 });
    if (score > max) throw new InputError("score", bi("The score is higher than the maximum.", "الدرجة أعلى من الدرجة القصوى."));
    const p = score / max * 100;
    const table = ruleValue(rules, "gpa_scales").table as any[];
    const row = table.find((r) => (r.range.startsWith("<") ? true : p >= Number(r.range.split("-")[0])));
    return {
      headline: { label: bi("Percentage", "النسبة المئوية"), value: pct(p) },
      rows: [
        { label: bi("Grade", "التقدير"), value: row ? `${row.letter} (${row.ar})` : "—", strong: true },
        { label: bi("Points out of 5 / out of 4", "النقاط من ٥ / من ٤"), value: row ? `${fmt(row.gpa5, 2)} / ${fmt(row.gpa4, 2)}` : "—" },
      ],
    };
  },
  content: {
    intro: bi("A quick way to turn any score into a percentage and the university grade it corresponds to.", "طريقة سريعة لتحويل أي درجة إلى نسبة مئوية والتقدير الجامعي المقابل لها."),
    howTo: bi("Enter your score and the maximum score.", "أدخل درجتك والدرجة القصوى."),
    formula: bi("Percentage = score ÷ maximum × 100; the grade comes from the university grade table.", "النسبة = الدرجة ÷ الدرجة القصوى × ١٠٠، والتقدير من جدول تقديرات الجامعات."),
  },
  related: ["gpa", "weighted-admission"],
  reviewed: REVIEWED,
};

export const weightedAdmission: Calculator = {
  slug: "weighted-admission",
  section: "education",
  title: bi("University Weighted Percentage Calculator (Nisba Mowazana)", "حاسبة النسبة الموزونة للقبول الجامعي"),
  short: bi("Your weighted admission percentage from high-school GPA, Qudurat and Tahsili, with university presets.", "نسبتك الموزونة للقبول من معدل الثانوية والقدرات والتحصيلي، مع أوزان جامعات محددة."),
  metaDescription: bi("Calculate your Saudi university weighted percentage from high-school GPA, Qudurat and Tahsili, with published weights for IAU, KSU and KFUPM.", "احسب نسبتك الموزونة للقبول الجامعي من معدل الثانوية والقدرات والتحصيلي، مع الأوزان المنشورة لجامعات الإمام عبدالرحمن والملك سعود والملك فهد."),
  kind: "official",
  ruleIds: ["university_weighted_admission"],
  inputs: [
    { id: "preset", type: "select", label: bi("Weights", "الأوزان"), default: "common", options: [
      { value: "common", label: bi("Common 30 / 30 / 40", "الأوزان الشائعة ٣٠ / ٣٠ / ٤٠") },
      { value: "iau", label: bi("Imam Abdulrahman bin Faisal University (IAU)", "جامعة الإمام عبدالرحمن بن فيصل") },
      { value: "ksu_health", label: bi("King Saud University — health programs", "جامعة الملك سعود — المسارات الصحية") },
      { value: "kfupm", label: bi("KFUPM — regular track", "جامعة الملك فهد للبترول والمعادن — المسار العام") },
      { value: "custom", label: bi("Custom weights", "أوزان مخصصة") }] },
    { id: "hs", type: "number", label: bi("High-school GPA", "معدل الثانوية"), unit: bi("%", "٪"), min: 0, max: 100, step: 0.01, default: 95 },
    { id: "qudurat", type: "number", label: bi("Qudurat (General Aptitude)", "القدرات العامة"), unit: bi("out of 100", "من ١٠٠"), min: 0, max: 100, step: 1, default: 80 },
    { id: "tahsili", type: "number", label: bi("Tahsili (Achievement)", "التحصيلي"), unit: bi("out of 100", "من ١٠٠"), min: 0, max: 100, step: 1, default: 78 },
    { id: "wHs", type: "number", label: bi("Weight: high school", "وزن الثانوية"), unit: bi("%", "٪"), min: 0, max: 100, step: 1, default: 30, showIf: (v) => v.preset === "custom" },
    { id: "wQ", type: "number", label: bi("Weight: Qudurat", "وزن القدرات"), unit: bi("%", "٪"), min: 0, max: 100, step: 1, default: 30, showIf: (v) => v.preset === "custom" },
    { id: "wT", type: "number", label: bi("Weight: Tahsili", "وزن التحصيلي"), unit: bi("%", "٪"), min: 0, max: 100, step: 1, default: 40, showIf: (v) => v.preset === "custom" },
  ],
  compute(v, rules) {
    const r = ruleValue(rules, "university_weighted_admission");
    const presets: Record<string, { high_school: number; qudurat: number; tahsili: number }> = {
      common: r.most_common_weights, iau: r.universities.IAU.all_tracks_calc, ksu_health: r.universities.KSU.health_programs, kfupm: r.universities.KFUPM.regular_track,
    };
    const p = s(v, "preset");
    const w = p === "custom" ? { high_school: n(v, "wHs") / 100, qudurat: n(v, "wQ") / 100, tahsili: n(v, "wT") / 100 } : presets[p] || presets.common;
    const sum = w.high_school + w.qudurat + w.tahsili;
    if (Math.abs(sum - 1) > 0.001) throw new InputError("wT", bi("The three weights must add up to 100%.", "يجب أن يكون مجموع الأوزان الثلاثة ١٠٠٪."));
    const hs = n(v, "hs", { min: 0, max: 100 }), q = n(v, "qudurat", { min: 0, max: 100 }), t = n(v, "tahsili", { min: 0, max: 100 });
    const total = hs * w.high_school + q * w.qudurat + t * w.tahsili;
    return {
      headline: { label: bi("Weighted percentage", "النسبة الموزونة"), value: pct(total) },
      rows: [
        { label: bi("High school", "الثانوية"), value: `${pct(hs)} × ${pct(w.high_school * 100, 0)} = ${fmt(hs * w.high_school)}` },
        { label: bi("Qudurat", "القدرات"), value: `${fmt(q)} × ${pct(w.qudurat * 100, 0)} = ${fmt(q * w.qudurat)}` },
        { label: bi("Tahsili", "التحصيلي"), value: `${fmt(t)} × ${pct(w.tahsili * 100, 0)} = ${fmt(t * w.tahsili)}` },
        { label: bi("Weighted percentage", "النسبة الموزونة"), value: pct(total), strong: true },
      ],
      warnings: [bi("Weights differ by university, program and admission cycle, and some programs add interviews or other tests. Always confirm in the university's admission guide for your year.", "تختلف الأوزان بحسب الجامعة والبرنامج ودورة القبول، وتضيف بعض البرامج مقابلات أو اختبارات أخرى. تأكد دائمًا من دليل القبول للجامعة في سنتك.")],
    };
  },
  content: {
    intro: bi("Saudi universities rank applicants by a weighted percentage that combines the high-school GPA with the Qudurat (General Aptitude Test) and Tahsili (Scholastic Achievement Admission Test) scores from the Education & Training Evaluation Commission (Qiyas).", "ترتب الجامعات السعودية المتقدمين بنسبة موزونة تجمع معدل الثانوية مع درجتي اختبار القدرات العامة والاختبار التحصيلي من هيئة تقويم التعليم والتدريب (قياس)."),
    howTo: bi("Choose a university preset or enter custom weights, then enter your three scores.", "اختر أوزان جامعة محددة أو أدخل أوزانًا مخصصة، ثم أدخل درجاتك الثلاث."),
    formula: bi("Weighted % = high-school % × w₁ + Qudurat × w₂ + Tahsili × w₃ (w₁ + w₂ + w₃ = 100%). The most common split is 30 / 30 / 40.", "النسبة الموزونة = نسبة الثانوية × و₁ + القدرات × و₂ + التحصيلي × و₃ (و₁ + و₂ + و₃ = ١٠٠٪). والتوزيع الأكثر شيوعًا ٣٠ / ٣٠ / ٤٠."),
    example: bi("95% high school, Qudurat 80, Tahsili 78 at 30/30/40: 28.5 + 24 + 31.2 = 83.7%.", "ثانوية ٩٥٪ وقدرات ٨٠ وتحصيلي ٧٨ بأوزان ٣٠/٣٠/٤٠: ٢٨٫٥ + ٢٤ + ٣١٫٢ = ٨٣٫٧٪."),
  },
  related: ["gpa", "grade-percentage", "education-savings"],
  reviewed: REVIEWED,
};

export const schoolAge: Calculator = {
  slug: "school-age",
  section: "education",
  title: bi("School Admission Age Calculator (Grade 1 & Kindergarten)", "حاسبة عمر القبول المدرسي (الصف الأول ورياض الأطفال)"),
  short: bi("Check whether your child can start Grade 1 or kindergarten in a given school year.", "تحقق من إمكانية التحاق طفلك بالصف الأول أو رياض الأطفال في عام دراسي معين."),
  metaDescription: bi("Check Saudi Grade 1 admission age: six years by the first school day, and the 90-day early-entry exception after kindergarten.", "تحقق من عمر القبول في الصف الأول في السعودية: إتمام ست سنوات في أول يوم دراسي، واستثناء ٩٠ يومًا بعد رياض الأطفال، ومستويات الروضة."),
  kind: "official",
  ruleIds: ["school_admission_age", "school_calendar_2026_2027"],
  inputs: [
    { id: "dob", type: "date", label: bi("Child's date of birth", "تاريخ ميلاد الطفل"), default: "2020-06-15" },
    { id: "firstDay", type: "date", label: bi("First day of the school year", "أول يوم في العام الدراسي"), default: "2026-08-23",
      help: bi("2026–2027 started on 23 August 2026 (30 August in Makkah, Madinah, Jeddah and Taif, as reported).", "بدأ العام الدراسي ٢٠٢٦–٢٠٢٧ في ٢٣ أغسطس ٢٠٢٦ (و٣٠ أغسطس في مكة المكرمة والمدينة المنورة وجدة والطائف بحسب ما نُشر).") },
    { id: "kg", type: "toggle", label: bi("Completed a full year of kindergarten", "أتم سنة كاملة في رياض الأطفال"), default: false },
  ],
  compute(v, rules) {
    const r = ruleValue(rules, "school_admission_age");
    const dob = new Date(`${s(v, "dob")}T00:00:00Z`), day = new Date(`${s(v, "firstDay")}T00:00:00Z`);
    if (Number.isNaN(dob.getTime()) || Number.isNaN(day.getTime()) || dob >= day) throw new InputError("dob", bi("Enter a valid birth date before the first school day.", "أدخل تاريخ ميلاد صحيحًا قبل أول يوم دراسي."));
    const sixth = new Date(dob); sixth.setUTCFullYear(dob.getUTCFullYear() + r.grade1_min_age_years);
    const shortBy = Math.ceil((sixth.getTime() - day.getTime()) / 86400000);
    let years = day.getUTCFullYear() - dob.getUTCFullYear(), months = day.getUTCMonth() - dob.getUTCMonth();
    if (day.getUTCDate() < dob.getUTCDate()) months--;
    if (months < 0) { years--; months += 12; }
    const grade1 = shortBy <= 0 ? "yes" : shortBy <= r.early_entry_exception_days && (v.kg === true || v.kg === "true") ? "early" : "no";
    const verdict = { yes: bi("Eligible", "مؤهل"), early: bi("Eligible with early entry", "مؤهل بالقبول المبكر"), no: bi("Not yet eligible", "غير مؤهل بعد") }[grade1];
    return {
      headline: { label: bi("Grade 1 this school year", "الصف الأول هذا العام"), value: verdict },
      rows: [
        { label: bi("Age on the first school day", "العمر في أول يوم دراسي"), value: `${fmt(years, 0)} / ${fmt(months, 0)}`, note: bi("years / months", "سنوات / أشهر") },
        { label: bi("Turns 6 on", "يكمل ٦ سنوات في"), value: formatDate(sixth) },
        { label: bi("Grade 1 eligibility", "أهلية الصف الأول"), value: verdict, strong: true },
      ],
      steps: [
        grade1 === "yes" ? bi("The child completes six years by the first day of the school year.", "يكمل الطفل ست سنوات بحلول أول يوم في العام الدراسي.")
          : grade1 === "early" ? bi(`The child is ${shortBy} days short of six, within the ${r.early_entry_exception_days}-day exception for children who completed kindergarten.`, `ينقص عمر الطفل ${shortBy} يومًا عن ست سنوات، وهو ضمن استثناء ${r.early_entry_exception_days} يومًا لمن أتم رياض الأطفال.`)
          : bi(`The child is ${shortBy} days short of six on the first school day.`, `ينقص عمر الطفل ${shortBy} يومًا عن ست سنوات في أول يوم دراسي.`),
      ],
      warnings: [bi("Admission is decided through the Noor system by the Ministry of Education; rules can change each year.", "يتم القبول عبر نظام نور التابع لوزارة التعليم، وقد تتغير الضوابط كل عام.")],
    };
  },
  content: {
    intro: bi("To start Grade 1 in Saudi Arabia, a child must have completed six years on the first day of the school year. Children up to 90 days younger may be accepted if they completed a full year of kindergarten, as announced by the Ministry of Education.", "لالتحاق الطفل بالصف الأول في السعودية يجب أن يكمل ست سنوات في أول يوم من العام الدراسي، ويجوز قبول الأصغر بما لا يزيد على ٩٠ يومًا إذا أتم سنة كاملة في رياض الأطفال وفق ما أعلنته وزارة التعليم."),
    howTo: bi("Enter the child's date of birth and the first day of the school year you are planning for.", "أدخل تاريخ ميلاد الطفل وأول يوم في العام الدراسي الذي تخطط له."),
    formula: bi("Eligible if the sixth birthday is on or before the first school day; early entry if no more than 90 days later and kindergarten was completed.", "مؤهل إذا كان عيد الميلاد السادس في أول يوم دراسي أو قبله، وقبول مبكر إذا تأخر بما لا يزيد على ٩٠ يومًا مع إتمام رياض الأطفال."),
  },
  related: ["school-budget", "education-savings"],
  reviewed: REVIEWED,
};
export const schoolBudget: Calculator = {
  slug: "school-budget",
  section: "education",
  title: bi("School Education Budget Calculator", "حاسبة ميزانية التعليم المدرسي"),
  short: bi("Total yearly school costs per child and for the family: tuition, transport, uniforms, books and activities.", "إجمالي تكاليف المدرسة السنوية لكل طفل وللأسرة: الرسوم والنقل والزي والكتب والأنشطة."),
  metaDescription: bi("Plan your family's school costs in Saudi Arabia: tuition, transport, uniforms, books and activities per child, per year and per month, with sibling discounts.", "خطط لتكاليف المدرسة لأسرتك في السعودية: الرسوم والنقل والزي والكتب والأنشطة لكل طفل، سنويًا وشهريًا، مع خصم الإخوة."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "children", type: "number", label: bi("Number of children", "عدد الأطفال"), min: 1, max: 12, step: 1, default: 2 },
    { id: "tuition", type: "number", label: bi("Tuition per child per year (school's fee list)", "الرسوم الدراسية لكل طفل سنويًا (من قائمة رسوم المدرسة)"), unit: bi("SAR", "ر.س"), min: 0, step: 500, default: 0 },
    { id: "transport", type: "number", label: bi("Transport per child per year", "النقل لكل طفل سنويًا"), unit: bi("SAR", "ر.س"), min: 0, step: 100, default: 0 },
    { id: "uniform", type: "number", label: bi("Uniforms and supplies per child", "الزي والأدوات لكل طفل"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 0 },
    { id: "books", type: "number", label: bi("Books per child", "الكتب لكل طفل"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 0 },
    { id: "activities", type: "number", label: bi("Activities and trips per child", "الأنشطة والرحلات لكل طفل"), unit: bi("SAR", "ر.س"), min: 0, step: 50, default: 0 },
    { id: "discount", type: "number", label: bi("Sibling discount on tuition (2nd child onward)", "خصم الإخوة على الرسوم (من الطفل الثاني)"), unit: bi("%", "٪"), min: 0, max: 100, step: 1, default: 0 },
    { id: "vat", type: "number", label: bi("VAT charged on fees, if any", "ضريبة القيمة المضافة على الرسوم إن وُجدت"), unit: bi("%", "٪"), min: 0, max: 15, step: 15, default: 0,
      help: bi("Check your school's invoice: VAT treatment of school fees depends on the student's nationality and the school.", "راجع فاتورة المدرسة: تعتمد معاملة الرسوم الدراسية لضريبة القيمة المضافة على جنسية الطالب والمدرسة.") },
  ],
  compute(v) {
    const kids = n(v, "children", { min: 1 }), tuition = n(v, "tuition", { min: 0 }), disc = n(v, "discount", { min: 0, max: 100 }) / 100, vat = n(v, "vat", { min: 0, max: 15 }) / 100;
    const tuitionTotal = tuition + tuition * (1 - disc) * (kids - 1);
    const perChildOther = n(v, "transport", { min: 0 }) + n(v, "uniform", { min: 0 }) + n(v, "books", { min: 0 }) + n(v, "activities", { min: 0 });
    const total = tuitionTotal * (1 + vat) + perChildOther * kids;
    return {
      headline: { label: bi("Family education cost per year", "تكلفة التعليم للأسرة سنويًا"), value: sar(total, 0) },
      rows: [
        { label: bi("Tuition (after sibling discount and VAT)", "الرسوم (بعد خصم الإخوة والضريبة)"), value: sar(tuitionTotal * (1 + vat), 0) },
        { label: bi("Transport, uniforms, books, activities", "النقل والزي والكتب والأنشطة"), value: sar(perChildOther * kids, 0) },
        { label: bi("Per month (12 months)", "شهريًا (١٢ شهرًا)"), value: sar(total / 12, 0), strong: true },
        { label: bi("Per child on average", "متوسط الطفل الواحد"), value: sar(total / kids, 0) },
      ],
    };
  },
  content: {
    intro: bi("Use your school's published fee list to see the full yearly cost of schooling for all your children. SaudiYP does not show estimated school fees: every family's figures come from their own school.", "استخدم قائمة الرسوم المنشورة لمدرستك لمعرفة التكلفة السنوية الكاملة لتعليم أطفالك. ولا يعرض SaudiYP رسومًا دراسية تقديرية؛ فأرقام كل أسرة من مدرستها."),
    howTo: bi("Enter the costs per child from the school's fee list and invoices, the number of children and any sibling discount.", "أدخل التكاليف لكل طفل من قائمة رسوم المدرسة وفواتيرها، وعدد الأطفال وخصم الإخوة إن وجد."),
    formula: bi("Tuition = first child + other children × (1 − discount), plus VAT if charged; other costs × children.", "الرسوم = الطفل الأول + بقية الأطفال × (١ − الخصم) مع الضريبة إن طُبقت، والتكاليف الأخرى × عدد الأطفال."),
  },
  related: ["school-age", "education-savings", "household-budget"],
  reviewed: REVIEWED,
};

export const educationSavings: Calculator = {
  slug: "education-savings",
  section: "education",
  title: bi("Education Savings Goal Calculator", "حاسبة هدف الادخار للتعليم"),
  short: bi("How much to save each month to reach a university or school fund by a target date.", "كم تحتاج إلى ادخاره شهريًا لتكوين مبلغ للجامعة أو المدرسة بحلول موعد محدد."),
  metaDescription: bi("Find the monthly saving needed to reach an education fund goal, with an optional expected return and the money you already have saved.", "اعرف مبلغ الادخار الشهري اللازم للوصول إلى هدف صندوق التعليم، مع عائد متوقع اختياري والمبلغ المدخر حاليًا."),
  kind: "estimate",
  ruleIds: [],
  inputs: [
    { id: "goal", type: "number", label: bi("Amount needed", "المبلغ المطلوب"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 120000 },
    { id: "saved", type: "number", label: bi("Already saved", "المدخر حاليًا"), unit: bi("SAR", "ر.س"), min: 0, step: 1000, default: 10000 },
    { id: "years", type: "number", label: bi("Years until needed", "السنوات المتبقية"), min: 0.5, max: 30, step: 0.5, default: 10 },
    { id: "ret", type: "number", label: bi("Expected yearly return (assumption)", "العائد السنوي المتوقع (افتراض)"), unit: bi("%", "٪"), min: 0, max: 20, step: 0.25, default: 0 },
  ],
  compute(v) {
    const goal = n(v, "goal", { min: 0 }), saved = n(v, "saved", { min: 0 }), months = Math.round(n(v, "years", { min: 0.1 }) * 12), r = n(v, "ret", { min: 0 }) / 100 / 12;
    const fvSaved = saved * Math.pow(1 + r, months);
    const need = Math.max(0, goal - fvSaved);
    const monthly = r === 0 ? need / months : need * r / (Math.pow(1 + r, months) - 1);
    return {
      headline: { label: bi("Save each month", "ادّخر شهريًا"), value: sar(monthly) },
      rows: [
        { label: bi("Current savings grow to", "ينمو المدخر الحالي إلى"), value: sar(fvSaved, 0) },
        { label: bi("Still needed", "المتبقي المطلوب"), value: sar(need, 0) },
        { label: bi("Total you will put in", "إجمالي ما ستدّخره"), value: sar(monthly * months, 0) },
      ],
    };
  },
  content: {
    intro: bi("Plan ahead for university or private school costs with a simple monthly saving target.", "خطط مبكرًا لتكاليف الجامعة أو المدرسة الخاصة بهدف ادخار شهري بسيط."),
    howTo: bi("Enter the amount you need, what you have, the time left and, if you invest, an expected return.", "أدخل المبلغ المطلوب وما لديك والمدة المتبقية، وإن كنت تستثمر فأدخل العائد المتوقع."),
    formula: bi("Monthly saving = (goal − savings × (1 + r)ⁿ) × r ÷ ((1 + r)ⁿ − 1), r = monthly return, n = months; with no return, the remaining amount ÷ months.", "الادخار الشهري = (الهدف − المدخر × (١ + ع)^ن) × ع ÷ ((١ + ع)^ن − ١)، حيث ع العائد الشهري ون عدد الأشهر؛ وبدون عائد: المتبقي ÷ عدد الأشهر."),
    limitations: bi("Returns are not guaranteed; the default of 0% assumes plain saving.", "العوائد غير مضمونة، والقيمة الافتراضية ٠٪ تفترض ادخارًا بسيطًا."),
  },
  related: ["school-budget", "savings-goal"],
  reviewed: REVIEWED,
};

export const EDUCATION = [gpaCalc, gradePercentage, weightedAdmission, schoolAge, schoolBudget, educationSavings];
export { round2 };
