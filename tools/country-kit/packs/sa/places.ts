/**
 * Saudi Arabia: regions, cities and towns (governorate seats plus other significant towns),
 * and districts (localities) of the main cities.
 *
 * Stored in the provinces table and the localities table.
 * Districts inside a city are stored as "<District>, <City>" (e.g. "Al Olaya, Riyadh")
 * so they read unambiguously in region lists; cities are flagged is_main_area.
 * There is deliberately no governorate level: a region holds its cities directly.
 *
 * nameAr holds the Arabic name. It is left out where the Arabic spelling is uncertain.
 * Region slugs/codes/names and the original city names are kept exactly as in the live data.
 */
import type { Region } from "../country";

type City = { name: string; nameAr?: string; localities?: string[] };
type RegionDef = { slug: string; code: string; name: string; nameAr: string; capital?: boolean; territory?: boolean; cities: City[] };

const REGION_DEFS: RegionDef[] = [
  { slug: "riyadh", code: "SA-01", name: "Riyadh", nameAr: "الرياض", capital: true, cities: [
    { name: "Riyadh", nameAr: "الرياض", localities: [
      "Al Olaya", "Al Sulaimaniyah", "Al Malqa", "Al Sahafa", "Al Yasmin", "Al Narjis", "Al Nakheel", "Al Muruj", "Al Wurud", "Al Rawdah",
      "Al Malaz", "Al Murabba", "Al Batha", "Al Dirah", "Al Naseem", "Al Rabwah", "Al Rayyan", "Al Shifa", "Al Suwaidi", "Al Aziziyah",
      "Al Hamra", "Al Qadisiyah", "Al Nahdah", "Al Khaleej", "Al Munsiyah", "Ishbiliyah", "Al Yarmouk", "Granada", "Qurtubah", "Al Maather",
      "Al Mursalat", "Al Wadi", "Al Nuzha", "Al Taawun", "Al Masif", "Al Izdihar", "Al Falah", "Al Andalus", "Al Rimal", "Al Hazm",
      "Dhahrat Laban", "Al Uraija", "Al Badiah", "Al Shumaisi", "Al Faisaliyah", "Al Wizarat", "Al Futah", "Al Mansourah", "Al Dar Al Baida", "Al Aqiq",
      "Hittin", "Al Qirawan", "Al Arid", "Al Ghadir", "King Fahd", "Al Mughrizat", "Al Nafal", "Al Mohammadiyah", "Al Raed", "Umm Al Hamam",
      "Al Khuzama", "Diplomatic Quarter", "Al Rahmaniyah", "Al Nada", "Al Rabie", "Al Amal", "Al Jaradiyah", "Manfuhah", "Al Sulay", "Al Marwah",
      "Al Rawabi", "Al Jazirah", "Al Fayha", "Al Salam", "Al Quds", "Laban", "Tuwaiq", "Namar", "Badr", "Al Janadriyah",
      "Al Zahra", "Irqah", "Shubra", "Al Marqab", "Al Oud", "Okaz", "Al Yamamah", "Al Manar", "Al Shuhada", "Al Nadhim",
      "King Abdullah Financial District", "Ghubairah", "Al Washam", "Umm Salim", "Utayqah", "Al Mahdiyah", "Al Khalidiyah", "Al Dubiyah", "Al Saadah", "Al Bayan",
      "Al Farouq", "Al Sinaiyah", "Al Hair", "Al Wahah", "Al Iskan", "Al Muaizilah", "Taibah", "Al Masani", "Uhud",
    ] },
    { name: "Al Kharj", nameAr: "الخرج", localities: ["Al Saih", "Al Yamamah", "Al Khuzama", "Al Rawdah", "Al Faisaliyah", "Al Aziziyah", "Al Andalus"] },
    { name: "Diriyah", nameAr: "الدرعية", localities: ["Al Turaif", "Al Bujairi", "Al Ammariyah", "Al Uyaynah", "Al Jubailah"] },
    { name: "Al Majmaah", nameAr: "المجمعة" }, { name: "Dawadmi", nameAr: "الدوادمي" },
    { name: "Al Quwayiyah", nameAr: "القويعية" }, { name: "Wadi Al Dawasir", nameAr: "وادي الدواسر" }, { name: "Al Aflaj", nameAr: "الأفلاج" },
    { name: "Al Zulfi", nameAr: "الزلفي" }, { name: "Shaqra", nameAr: "شقراء" }, { name: "Hotat Bani Tamim", nameAr: "حوطة بني تميم" },
    { name: "Afif", nameAr: "عفيف" }, { name: "Al Sulayyil", nameAr: "السليل" }, { name: "Durma", nameAr: "ضرما" },
    { name: "Al Muzahmiyah", nameAr: "المزاحمية" }, { name: "Rumah", nameAr: "رماح" }, { name: "Thadiq", nameAr: "ثادق" },
    { name: "Huraymila", nameAr: "حريملاء" }, { name: "Al Hariq", nameAr: "الحريق" }, { name: "Al Ghat", nameAr: "الغاط" },
    { name: "Marat", nameAr: "مرات" }, { name: "Al Dilam", nameAr: "الدلم" }, { name: "Al Rayn", nameAr: "الرين" },
  ] },
  { slug: "makkah", code: "SA-02", name: "Makkah", nameAr: "مكة المكرمة", cities: [
    { name: "Jeddah", nameAr: "جدة", localities: [
      "Al Hamra", "Al Rawdah", "Al Andalus", "Al Shati", "Al Zahra", "Al Salamah", "Al Naeem", "Al Nahdah", "Al Khalidiyah", "Al Faisaliyah",
      "Al Rehab", "Al Aziziyah", "Al Safa", "Al Marwah", "Al Samer", "Al Naseem", "Al Rabwah", "Al Baghdadiyah", "Al Balad", "Al Sharafiyah",
      "Al Ruwais", "Al Hindawiyah", "Al Kandarah", "Al Sulaimaniyah", "Al Bawadi", "Al Mohammadiyah", "Obhur", "North Obhur", "South Obhur", "Al Murjan",
      "Al Basateen", "Abruq Al Rughamah", "Al Rughamah", "Al Rayyan", "Al Muntazahat", "Al Waziriyah", "Al Jamiah", "Al Thaghr", "Al Mahjar", "Al Quraiyat",
      "Al Sabil", "Al Nuzlah", "Bani Malik", "Al Mushrifah", "Al Ajwad", "Al Fayha", "Al Manar", "Al Nuzha", "Al Hamdaniyah", "Al Sawari",
      "Al Falah", "Al Wurud", "Al Harazat", "Al Khumrah", "Al Rawabi", "Prince Fawaz", "Madain Al Fahd", "Ghulail", "Al Quwaizah", "Petromin",
      "Al Thaalibah", "Al Jawharah", "Al Zumurrud", "Al Yaqut", "Al Lulu", "Al Mulaysa", "Corniche",
    ] },
    { name: "Makkah", nameAr: "مكة المكرمة", localities: [
      "Al Aziziyah", "Al Awali", "Al Shawqiyah", "Al Naseem", "Al Zahir", "Al Shubaikah", "Ajyad", "Al Misfalah", "Jarwal", "Al Utaibiyah",
      "Al Rusaifah", "Al Kaakiyah", "Al Sharaye", "Al Adl", "Al Zaidi", "Kudai", "Batha Quraish", "Al Taneem", "Al Hajun", "Al Mansour",
      "Al Nuzha", "Al Rawdah", "Al Khalidiyah", "Al Tandabawi", "Al Hindawiyah", "Mina", "Muzdalifah", "Arafat", "Al Nawariyah", "Al Maabdah",
      "Al Ghazzah", "Al Umrah", "Al Iskan", "Al Jamiah",
    ] },
    { name: "Taif", nameAr: "الطائف", localities: [
      "Shubra", "Al Hawiyah", "Al Hada", "Al Shafa", "Al Faisaliyah", "Al Aziziyah", "Al Qamariyah", "Al Khalidiyah", "Al Nuzha", "Al Wisam",
      "Qurwa", "Shihar", "Al Shuhada", "Al Salamah", "Al Rudaf", "Al Mathnah", "Al Sharqiyah", "Al Naseem", "Jabrah",
    ] },
    { name: "Rabigh", nameAr: "رابغ" }, { name: "King Abdullah Economic City", nameAr: "مدينة الملك عبدالله الاقتصادية" },
    { name: "Al Qunfudhah", nameAr: "القنفذة" }, { name: "Al Lith", nameAr: "الليث" }, { name: "Al Jumum", nameAr: "الجموم" },
    { name: "Khulais", nameAr: "خليص" }, { name: "Al Kamil", nameAr: "الكامل" }, { name: "Turabah", nameAr: "تربة" },
    { name: "Al Khurmah", nameAr: "الخرمة" }, { name: "Ranyah", nameAr: "رنية" }, { name: "Al Muwayh", nameAr: "المويه" },
    { name: "Adham", nameAr: "أضم" }, { name: "Al Ardiyat", nameAr: "العرضيات" }, { name: "Maysan", nameAr: "ميسان" },
    { name: "Bahrah", nameAr: "بحرة" }, { name: "Thuwal", nameAr: "ثول" }, { name: "Al Sail Al Kabir", nameAr: "السيل الكبير" },
    { name: "Dhahban", nameAr: "ذهبان" },
  ] },
  { slug: "madinah", code: "SA-03", name: "Madinah", nameAr: "المدينة المنورة", cities: [
    { name: "Madinah", nameAr: "المدينة المنورة", localities: [
      "Quba", "Al Awali", "Al Aqiq", "Al Uyun", "Al Khalidiyah", "Al Markaziyah", "Al Haram", "Al Iskan", "Sultanah", "Al Anbariyah",
      "Al Aziziyah", "Al Rawabi", "Al Ranuna", "Al Jumuah", "Al Qiblatain", "Al Aqoul", "Shuran", "Sayed Al Shuhada", "Al Mughaisilah", "Al Jurf",
      "Abyar Ali", "Al Qurban", "Al Masani", "Al Manakhah", "King Fahd",
    ] },
    { name: "Yanbu", nameAr: "ينبع", localities: [
      "Yanbu Industrial City", "Yanbu Al Balad", "Al Suwaiq", "Al Sumairi", "Al Jabriyah", "Al Sharm", "Al Faisaliyah", "Al Aziziyah", "Al Khalidiyah", "Al Nahdah",
      "Al Rabwah", "Al Yarmouk", "Radwa", "Al Nakheel", "Al Dana",
    ] },
    { name: "Al Ula", nameAr: "العلا" },
    { name: "Badr", nameAr: "بدر" }, { name: "Khaybar", nameAr: "خيبر" }, { name: "Mahd Al Dhahab", nameAr: "مهد الذهب" },
    { name: "Al Hanakiyah", nameAr: "الحناكية" }, { name: "Al Ais", nameAr: "العيص" }, { name: "Wadi Al Fara", nameAr: "وادي الفرع" },
    { name: "Yanbu Al Nakhal", nameAr: "ينبع النخل" },
  ] },
  { slug: "eastern-province", code: "SA-04", name: "Eastern Province", nameAr: "المنطقة الشرقية", cities: [
    { name: "Dammam", nameAr: "الدمام", localities: [
      "Al Faisaliyah", "Al Shati", "Al Mazruiyah", "Al Adamah", "Al Badiyah", "Al Jalawiyah", "Al Nakheel", "Al Hamra", "Al Muraikabat", "Al Qadisiyah",
      "Al Anoud", "Al Itisalat", "Al Noor", "Al Nada", "Al Fursan", "Al Aziziyah", "Al Danah", "Al Badi", "Al Rayyan", "Al Muhammadiyah",
      "Al Rawdah", "Al Manar", "Al Iskan", "Al Khaleej", "Al Mubarakiyah", "Ibn Khaldun", "Al Tubaishi", "Al Khalidiyah", "Al Shulah", "Al Amanah",
      "Al Dawasir", "Al Zuhur", "Granada", "Al Jawharah", "Al Naseem", "Al Wahah", "Uhud", "Badr", "Taibah", "Al Nahdah",
      "Al Salam", "King Fahd Suburb", "Al Nuzha", "Al Qazzaz", "Al Firdous",
    ] },
    { name: "Khobar", nameAr: "الخبر", localities: [
      "Al Olaya", "Al Thuqbah", "Al Rakah", "Al Aqrabiyah", "North Khobar", "South Khobar", "Al Yarmouk", "Corniche", "Al Bandariyah", "Al Hamra",
      "Al Jisr", "Al Rawabi", "Al Khuzama", "Al Andalus", "Al Aziziyah", "Al Safa", "Al Hada", "Madinat Al Ummal", "Ishbiliyah", "Al Qusur",
      "Al Amwaj",
    ] },
    { name: "Dhahran", nameAr: "الظهران", localities: [
      "North Doha", "South Doha", "North Danah", "South Danah", "Al Qusur", "Al Jamiah", "West Dhahran", "Al Hizam Al Dhahabi", "Al Hizam Al Akhdar", "Aramco Camp",
      "KFUPM", "King Abdulaziz Air Base", "Dhahran Hills", "Al Iskan",
    ] },
    { name: "Jubail", nameAr: "الجبيل", localities: [
      "Jubail Industrial City", "Jubail Al Balad", "Al Fanateer", "Al Deffi", "Al Huwailat", "Al Andalus", "Jalmudah", "Al Khalidiyah", "Al Aziziyah", "Al Danah",
      "Al Fayha", "Al Nakheel", "Al Firdous", "Al Taawun", "Ras Al Khair", "Al Hamra", "Al Rawdah", "Al Khaleej",
    ] },
    { name: "Al Ahsa", nameAr: "الأحساء", localities: [
      "Al Hofuf", "Al Mubarraz", "Al Uyun", "Al Omran", "Al Jafr", "Al Qarah", "Al Taraf", "Al Battaliyah", "Al Jishah", "Al Mutairfi",
      "Al Hulaylah", "Al Munaizlah", "Al Kilabiyah", "Al Mansourah", "Al Tuwaithir", "Al Fudhool", "Al Kut", "Al Rifaa", "Al Naathel", "Al Salhiyah",
      "Mahasin", "Al Khalidiyah", "Al Muzrooa", "Al Yarmouk",
    ] },
    { name: "Qatif", nameAr: "القطيف", localities: [
      "Al Awamiyah", "Al Jish", "Umm Al Hamam", "Al Qudaih", "Al Tubi", "Al Jarudiyah", "Al Khuwaildiyah", "Anak", "Al Qalaa", "Al Shuwaikah",
      "Al Bahari", "Darin", "Al Rabiyah",
    ] },
    { name: "Hafar Al Batin", nameAr: "حفر الباطن", localities: ["Al Faisaliyah", "Al Khalidiyah", "Al Aziziyah", "Al Rabwah", "Al Batin"] },
    { name: "Ras Tanura", nameAr: "رأس تنورة" }, { name: "Al Khafji", nameAr: "الخفجي" }, { name: "Abqaiq", nameAr: "بقيق" },
    { name: "Al Nairyah", nameAr: "النعيرية" }, { name: "Qaryat Al Ulya", nameAr: "قرية العليا" }, { name: "Safwa", nameAr: "صفوى" },
    { name: "Saihat", nameAr: "سيهات" }, { name: "Tarout", nameAr: "تاروت" }, { name: "Al Qaisumah", nameAr: "القيصومة" },
    { name: "Salwa", nameAr: "سلوى" }, { name: "King Khalid Military City", nameAr: "مدينة الملك خالد العسكرية" },
  ] },
  { slug: "asir", code: "SA-14", name: "Asir", nameAr: "عسير", cities: [
    { name: "Abha", nameAr: "أبها", localities: [
      "Al Manhal", "Al Muftaha", "Al Khalidiyah", "Al Mansak", "Al Mahalah", "Al Wardatain", "Al Sadd", "Al Dabab", "Al Aziziyah", "Shamasan",
      "Al Nasb", "Al Rabwah", "Al Moudhaf", "Al Andalus", "Al Soudah", "Al Numais", "Al Qabil",
    ] },
    { name: "Khamis Mushait", nameAr: "خميس مشيط", localities: [
      "Umm Sarar", "Al Rasras", "Al Nahdah", "Al Khalidiyah", "Al Aziziyah", "Al Rawdah", "Al Andalus", "Al Iskan", "Al Qadisiyah", "Al Yarmouk",
      "Al Rabwah", "Al Shifa", "Al Nuzha", "Al Mousa", "King Faisal Military City", "Tandaha",
    ] },
    { name: "Bisha", nameAr: "بيشة" }, { name: "Al Namas", nameAr: "النماص" }, { name: "Muhayil", nameAr: "محايل" },
    { name: "Sarat Abidah", nameAr: "سراة عبيدة" }, { name: "Rijal Almaa", nameAr: "رجال ألمع" }, { name: "Ahad Rafidah", nameAr: "أحد رفيدة" },
    { name: "Dhahran Al Janub", nameAr: "ظهران الجنوب" }, { name: "Bariq", nameAr: "بارق" }, { name: "Tathlith", nameAr: "تثليث" },
    { name: "Al Majardah", nameAr: "المجاردة" }, { name: "Balqarn", nameAr: "بلقرن" }, { name: "Tanomah", nameAr: "تنومة" },
    { name: "Al Birk", nameAr: "البرك" }, { name: "Al Harajah", nameAr: "الحرجة" }, { name: "Al Amwah", nameAr: "الأمواه" },
    { name: "Tareeb", nameAr: "طريب" },
  ] },
  { slug: "tabuk", code: "SA-07", name: "Tabuk", nameAr: "تبوك", cities: [
    { name: "Tabuk", nameAr: "تبوك", localities: [
      "Al Muruj", "Al Rawdah", "Al Sulaimaniyah", "Al Faisaliyah", "Al Aziziyah", "Al Wurud", "Al Masif", "Al Mahrajan", "Al Qadisiyah", "Al Akhdar",
      "Al Rayyan", "Al Safa", "Al Nahdah", "Al Rabie", "Al Khalidiyah", "Al Salihiyah", "Al Rabwah", "Al Naseem", "King Fahd", "Al Basateen",
    ] },
    { name: "NEOM", nameAr: "نيوم" },
    { name: "Umluj", nameAr: "أملج" }, { name: "Al Wajh", nameAr: "الوجه" }, { name: "Duba", nameAr: "ضباء" },
    { name: "Tayma", nameAr: "تيماء" }, { name: "Haql", nameAr: "حقل" }, { name: "Al Bad", nameAr: "البدع" },
  ] },
  { slug: "qassim", code: "SA-05", name: "Qassim", nameAr: "القصيم", cities: [
    { name: "Buraidah", nameAr: "بريدة", localities: [
      "Al Iskan", "Al Rayyan", "Al Safra", "Al Nahdah", "Al Khalidiyah", "Al Fayziyah", "Al Rabwah", "Al Muntazah", "Al Khabib", "Al Akhdar",
      "Al Rawdah", "Al Naseem", "Al Jamiah", "Al Basateen", "Al Hilal", "Al Wasitah", "Al Shiqah",
    ] },
    { name: "Unaizah", nameAr: "عنيزة" },
    { name: "Al Rass", nameAr: "الرس" }, { name: "Al Mithnab", nameAr: "المذنب" }, { name: "Al Bukayriyah", nameAr: "البكيرية" },
    { name: "Al Badaya", nameAr: "البدائع" }, { name: "Riyadh Al Khabra", nameAr: "رياض الخبراء" }, { name: "Uyun Al Jiwa", nameAr: "عيون الجواء" },
    { name: "Al Asyah", nameAr: "الأسياح" }, { name: "Al Nabhaniyah", nameAr: "النبهانية" }, { name: "Al Shimasiyah", nameAr: "الشماسية" },
    { name: "Uqlat Al Suqur", nameAr: "عقلة الصقور" }, { name: "Dariyah", nameAr: "ضرية" },
  ] },
  { slug: "hail", code: "SA-06", name: "Hail", nameAr: "حائل", cities: [
    { name: "Hail", nameAr: "حائل", localities: [
      "Al Nuqrah", "Al Aziziyah", "Al Khuzama", "Al Samra", "Al Wadi", "Al Muntazah", "Al Barahah", "Lubdah", "Al Wusaita", "Al Naseem",
      "Al Masif", "Al Mahattah", "Al Zibarah", "Al Rawdah", "Al Iskan", "Al Khamashiyah", "Al Matar", "Mughaidah",
    ] },
    { name: "Baqaa", nameAr: "بقعاء" }, { name: "Al Ghazalah", nameAr: "الغزالة" }, { name: "Al Shinan", nameAr: "الشنان" },
    { name: "Al Hait", nameAr: "الحائط" }, { name: "Al Sulaimi", nameAr: "السليمي" }, { name: "Mawqaq", nameAr: "موقق" },
    { name: "Samira", nameAr: "سميراء" }, { name: "Al Shamli", nameAr: "الشملي" }, { name: "Jubbah", nameAr: "جبة" },
  ] },
  { slug: "northern-borders", code: "SA-08", name: "Northern Borders", nameAr: "الحدود الشمالية", cities: [
    { name: "Arar", nameAr: "عرعر" },
    { name: "Rafha", nameAr: "رفحاء" }, { name: "Turaif", nameAr: "طريف" }, { name: "Al Uwayqilah", nameAr: "العويقيلة" },
  ] },
  { slug: "jazan", code: "SA-09", name: "Jazan", nameAr: "جازان", cities: [
    { name: "Jazan", nameAr: "جازان", localities: [
      "Al Rawdah", "Al Safa", "Al Shati", "Al Suwais", "Al Shamiyah", "Al Mutlaq", "Al Jabal", "Al Matar", "Corniche", "Al Rabwah",
      "Al Naseem", "Al Khalidiyah", "Al Aziziyah", "Al Faisaliyah", "Al Sahil", "Al Ruwais",
    ] },
    { name: "Sabya", nameAr: "صبيا" }, { name: "Abu Arish", nameAr: "أبو عريش" }, { name: "Samtah", nameAr: "صامطة" },
    { name: "Al Darb", nameAr: "الدرب" }, { name: "Baish", nameAr: "بيش" }, { name: "Ahad Al Masarihah", nameAr: "أحد المسارحة" },
    { name: "Farasan", nameAr: "فرسان" }, { name: "Al Aridah", nameAr: "العارضة" }, { name: "Al Dayer", nameAr: "الداير" },
    { name: "Al Tuwal", nameAr: "الطوال" }, { name: "Damad", nameAr: "ضمد" }, { name: "Al Harth", nameAr: "الحرث" },
    { name: "Fifa", nameAr: "فيفاء" }, { name: "Al Edabi", nameAr: "العيدابي" }, { name: "Al Raith", nameAr: "الريث" },
    { name: "Haroob", nameAr: "هروب" }, { name: "Al Shuqaiq", nameAr: "الشقيق" },
  ] },
  { slug: "najran", code: "SA-10", name: "Najran", nameAr: "نجران", cities: [
    { name: "Najran", nameAr: "نجران", localities: [
      "Al Fahd", "Al Faisaliyah", "Al Khalidiyah", "Al Aziziyah", "Al Ukhdood", "Al Jurbah", "Abu Al Saud", "Rajla", "Al Shurfah", "Dahdah",
      "Al Hadn", "Al Qabil", "Al Mikhlaf", "Al Nahdah", "Al Mundafa", "Al Ghuwaylah", "Al Aan",
    ] },
    { name: "Sharurah", nameAr: "شرورة" }, { name: "Habuna", nameAr: "حبونا" }, { name: "Badr Al Janoub", nameAr: "بدر الجنوب" },
    { name: "Yadamah", nameAr: "يدمة" }, { name: "Thar", nameAr: "ثار" }, { name: "Khubash", nameAr: "خباش" },
    { name: "Al Kharkhir", nameAr: "الخرخير" },
  ] },
  { slug: "al-bahah", code: "SA-11", name: "Al Bahah", nameAr: "الباحة", cities: [
    { name: "Al Bahah", nameAr: "الباحة" },
    { name: "Baljurashi", nameAr: "بلجرشي" }, { name: "Al Mandaq", nameAr: "المندق" }, { name: "Al Mikhwah", nameAr: "المخواة" },
    { name: "Al Aqiq", nameAr: "العقيق" }, { name: "Qilwah", nameAr: "قلوة" }, { name: "Al Qura", nameAr: "القرى" },
    { name: "Bani Hassan", nameAr: "بني حسن" }, { name: "Ghamid Al Zinad", nameAr: "غامد الزناد" }, { name: "Al Hajrah", nameAr: "الحجرة" },
  ] },
  { slug: "al-jawf", code: "SA-12", name: "Al Jawf", nameAr: "الجوف", cities: [
    { name: "Sakaka", nameAr: "سكاكا" },
    { name: "Dumat Al Jandal", nameAr: "دومة الجندل" }, { name: "Al Qurayyat", nameAr: "القريات" }, { name: "Tabarjal", nameAr: "طبرجل" },
    { name: "Al Hadithah", nameAr: "الحديثة" },
  ] },
];

/** Regions for the country config: cities first (main areas), then "<District>, <City>" entries. */
export const REGIONS: Region[] = REGION_DEFS.map((s) => ({
  slug: s.slug,
  code: s.code,
  name: s.name,
  nameAr: s.nameAr,
  capital: s.capital,
  cities: [
    ...s.cities.map((c) => ({ name: c.name, nameAr: c.nameAr || "" })),
    ...s.cities.flatMap((c) => (c.localities || []).map((l) => ({ name: `${l}, ${c.name}`, nameAr: "", locality: true }))),
  ],
}));

export const TERRITORIES = new Set(REGION_DEFS.filter((s) => s.territory).map((s) => s.slug));
