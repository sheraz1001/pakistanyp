/**
 * PakistanYP (pakistanyp.com) category tree for Pakistan business directory:
 * sector > group > category (3 levels).
 * Format: one sector per block; "# Sector" lines followed by "## Group: item; item; item" lines.
 * Parsed by parseCategoryTree() into rows with slug, level and parent.
 */
export const PAKISTAN_CATEGORY_TREE = `
# Property & Construction
## Property Dealers & Estate Agents: Property Dealers; Real Estate Agents; Real Estate Consultants; Commercial Property Dealers; Farmhouse Dealers; Property Investment Advisors; Property Portals & Listing Offices; Property Auctioneers
## Housing Societies & Plots: Housing Societies; Gated Communities; Residential Plots; Commercial Plots; Plot Files & Allotment Letters; Overseas Plot Booking; Society Offices; Installment Plots
## Rentals & Accommodation: Houses for Rent; Flats & Apartments for Rent; Portions for Rent; Shops for Rent; Office Space for Rent; Warehouses & Godowns for Rent; Boys Hostels; Girls Hostels; Paying Guest Accommodation
## Builders & Construction Firms: Builders & Developers; Grey Structure Contractors; Turnkey Construction Companies; High-Rise Developers; Shopping Mall Developers; Farmhouse Builders; Construction Companies
## Architects & Engineers: Architects; Structural Engineers; Civil Engineering Consultants; Town Planners; Map & Naqsha Approval Services; Quantity Surveyors; Land Surveyors; Soil Testing Labs
## Contractors & Specialists: Civil Contractors; Labour Contractors (Mistri & Mazdoor); Waterproofing Contractors; Seepage Treatment; False Ceiling Contractors; Roofing & Shed Contractors; Demolition Contractors; Road & Paving Contractors; Boundary Wall Contractors
## Building Materials: Cement Dealers; Steel & Sariya Dealers; Bricks Suppliers (Bhatta); Sand & Bajri Suppliers; Crush & Gravel Suppliers; Ready-Mix Concrete Suppliers; Concrete Blocks & Pavers; Hardware Stores; Pipes & Fittings Dealers
## Finishing Materials: Marble & Granite Dealers; Tiles Dealers; Sanitary Ware Dealers; Bath Fittings Dealers; Paint Dealers; Timber & Lakri Dealers; Plywood & Board Dealers; Glass & Aluminium Works; uPVC Doors & Windows; Steel Gates & Grills
## Interiors & Fit-out: Interior Designers; Kitchen Cabinet Makers; Wardrobe Makers; Wallpaper & Wall Panels; Vinyl & Wooden Flooring; Blinds & Curtains; Gypsum & POP Work; Office Interior Contractors

# Energy & Utilities
## Solar Energy: Solar Panel Installers; Solar Panel Dealers; Solar Inverter Dealers; Net Metering Consultants; Solar Water Heaters; Solar Tube Well Systems; Solar Street Lights; Solar Panel Cleaning Services
## Power Backup: UPS Dealers; UPS Repair; Inverter Dealers; Battery Dealers; Lithium Battery Suppliers; Battery Charging Shops; Stabilizer Dealers
## Generators: Generator Dealers; Generator on Rent; Generator Repair & Maintenance; Diesel Generator Suppliers; Gas Generator Suppliers; Generator Spare Parts
## Fuel Stations & Gas: Petrol Pumps; CNG Stations; LPG Distributors; LPG Cylinder Shops; LPG Cylinder Refilling; Diesel Suppliers; Lubricant & Mobil Oil Dealers; Furnace Oil Suppliers
## Water Supply: Water Tankers; Mineral Water Suppliers; Water Filtration Plants; RO Plant Installers; Water Filter Dealers; Water Coolers & Dispensers; Water Tank Cleaning; Water Testing Labs
## Boring & Pumps: Boring & Tube Well Contractors; Submersible Pump Dealers; Water Motor Dealers; Water Motor Repair; Hand Pumps; Pressure Pumps
## Electrical Supplies: Electrical Goods Stores; Cables & Wires Dealers; Switches & Sockets; LED Lights & Fixtures; Transformer Dealers; Energy Audit Consultants; Electrical Contractors (Commercial)

# Education & Training
## Schools: Private Schools; Government Schools; Cambridge (O/A-Level) Schools; Matric Schools; Montessori & Pre-Schools; Playgroups; Boarding Schools; Girls Schools; Special Education Schools; Schools for the Deaf & Blind
## Colleges: FSc Pre-Medical Colleges; FSc Pre-Engineering Colleges; ICS Colleges; ICom Colleges; FA Colleges; A-Level Colleges; Girls Colleges; Government Degree Colleges; Commerce Colleges
## Universities & Higher Education: Public Universities; Private Universities; Medical Colleges (MBBS); Dental Colleges (BDS); Engineering Universities; Business Schools (BBA/MBA); Law Colleges (LLB); Nursing Colleges; Pharmacy Colleges; Distance Learning Universities
## Academies & Tuition: Tuition Academies; Home Tutors; O/A-Level Tuition; Matric & FSc Tuition; Online Tutors; Female Home Tutors; Maths Tuition; Science Tuition
## Entry Test & Competitive Exams: MDCAT Coaching; ECAT Coaching; NTS & GAT Preparation; CSS Coaching; PMS Coaching; ISSB & Armed Forces Preparation; SAT Preparation; Police & FIA Test Preparation; ACCA & CA Coaching
## Quran & Islamic Education: Quran Academies; Online Quran Teachers; Hifz Classes; Tajweed Classes; Nazra Quran Classes; Female Quran Teachers; Arabic Language Classes; Islamic Studies Courses
## IT & Professional Courses: Computer Training Institutes; Freelancing Courses; Web Development Courses; Graphic Design Courses; Digital Marketing Courses; Amazon & E-commerce Courses; Programming Courses; MS Office Courses; Networking & CCNA Courses
## Languages & Test Prep: English Language Centres; Spoken English Classes; IELTS Preparation; PTE Preparation; TOEFL Preparation; German Language Classes; Chinese Language Classes; Korean & Japanese Language Classes; French Language Classes
## Vocational & Skills: Vocational Training Institutes; TEVTA Institutes; Technical Colleges (DAE); Driving Schools; Female Driving Instructors; Beautician Courses; Cooking Classes; Stitching & Sewing Centres; Electrician & Plumbing Courses; Welding Courses

# Health & Medical
## Hospitals: Private Hospitals; Government Hospitals; Teaching Hospitals; Children's Hospitals; Maternity Hospitals; Eye Hospitals; Cardiac Hospitals; Cancer Hospitals; Trust Hospitals; Psychiatric Hospitals
## Clinics & Medical Centres: General Clinics; Medical Centres; 24-Hour Clinics; Family Clinics; Polyclinics; Day Care Surgery Centres; Dialysis Centres; IVF & Fertility Centres; Rehabilitation Centres; Drug Rehab Centres
## Doctors (Medicine): General Physicians; Family Physicians; Medical Specialists; Cardiologists; Pulmonologists (Chest Specialists); Gastroenterologists; Hepatologists (Liver Specialists); Nephrologists (Kidney Specialists); Neurologists; Endocrinologists; Diabetologists; Rheumatologists; Infectious Disease Specialists; Oncologists; Haematologists; Dermatologists; Psychiatrists; Psychologists
## Doctors (Surgery & Speciality): General Surgeons; Orthopaedic Surgeons; Neurosurgeons; Cardiac Surgeons; Urologists; Plastic & Cosmetic Surgeons; Laparoscopic Surgeons; Paediatric Surgeons; Vascular Surgeons; ENT Specialists; Eye Specialists (Ophthalmologists); Gynaecologists & Obstetricians; Paediatricians; Neonatologists; Andrologists & Sexologists; Radiologists; Anaesthetists; Pain Management Specialists; Sports Medicine Doctors; Nutritionists & Dietitians; Speech Therapists
## Dental Care: Dentists; Dental Clinics; Orthodontists (Braces); Dental Implant Specialists; Root Canal Specialists; Paediatric Dentists; Cosmetic Dentistry; Dental Labs
## Labs & Diagnostics: Clinical Laboratories; Diagnostic Centres; Blood Test Collection Centres; Home Sample Collection; Ultrasound Centres; X-Ray Centres; CT Scan Centres; MRI Centres; ECG & Echo Centres; Blood Banks
## Pharmacies & Medical Supplies: Pharmacies & Medical Stores; 24-Hour Pharmacies; Medicine Distributors; Surgical Stores; Medical Equipment Suppliers; Hospital Beds & Wheelchairs on Rent; Oxygen Cylinder Suppliers; Hearing Aid Centres
## Traditional & Alternative Medicine: Hakeem & Tibb Clinics; Dawakhanas; Herbal Medicine Stores; Homeopathic Doctors; Homeopathic Pharmacies; Hijama (Cupping) Therapy; Acupuncture Clinics; Desi Totkay & Herbal Products
## Care & Allied Services: Physiotherapists; Physiotherapy Clinics; Opticians & Eyewear; Contact Lens Centres; Ambulance Services; Nursing Care at Home; Elderly Care at Home; Lady Health Visitors & Midwives; Vaccination Centres; Prosthetics & Orthotics

# Weddings & Events
## Venues: Marquees; Banquet Halls; Wedding Halls; Farmhouses for Events; Lawns for Events; Hotel Ballrooms; Rooftop Event Venues; Community Wedding Halls
## Catering & Food for Events: Wedding Caterers; Deg & Bulk Cooking; Live BBQ Stations; Event Dessert Tables; Chaat & Gol Gappay Stalls for Events; Tea & Coffee Stalls for Events; Crockery & Cutlery on Rent
## Decor & Setup: Wedding Decorators; Mehndi Stage Decorators; Flower Decorators; Floral Shops; Lighting & Fairy Lights; Tent & Shamiana Services; Furniture on Rent for Events; Balloon Decorators; Fireworks & Atishbazi
## Bridal & Beauty: Bridal Makeup Artists; Mehndi Artists; Bridal Salons; Bridal Hairstylists; Nail Artists; Party Makeup Artists; Groom Grooming Services
## Bridal & Groom Wear: Bridal Wear Designers; Bridal Lehenga & Gharara; Bridal Dresses on Rent; Groom Wear; Sherwani Makers; Sherwani on Rent; Waistcoats & Prince Coats; Wedding Kulla & Turbans; Wedding Khussa
## Photography & Media: Wedding Photographers; Wedding Videographers; Drone Photography; Cinematographers; Photo Studios; Photo Albums & Printing; Live Streaming Services; Photo Booths
## Music & Entertainment: Dhol Players; DJs; Sound Systems on Rent; Qawwals; Live Bands & Singers; Magicians & Kids Entertainers; Shehnai & Band Baja
## Wedding Services: Wedding Planners; Event Planners; Event Management Companies; Wedding Cars on Rent; Horse & Buggi for Weddings; Wedding Invitation Cards; Wedding Gifts & Bari Packing; Rishta Services (Matchmakers); Nikah Khawan; Birthday Party Planners; Corporate Event Organisers

# Fashion & Textiles
## Tailoring: Darzi (Tailors); Gents Tailors; Ladies Tailors; Bespoke Suit Tailors; Shalwar Kameez Tailors; Uniform Tailors; Alteration Services; Online Stitching Services
## Boutiques & Designer Wear: Boutiques; Fashion Designers; Designer Wear Stores; Formal Wear; Party Wear; Pret Wear Stores; Abaya & Hijab Stores; Plus Size Clothing
## Unstitched & Fabric: Unstitched Lawn; Unstitched Suits; Winter Collection & Khaddar; Chiffon & Silk Fabrics; Gents Fabric (Wash & Wear); Cotton & Latha Fabric; Cloth Markets; Fabric Wholesalers
## Embroidery & Handwork: Embroidery Services; Computer Embroidery; Hand Embroidery; Adda Work; Block Printing; Phulkari & Sindhi Embroidery; Laces & Trims Shops; Dyeing & Rangai Services
## Ready-to-Wear: Gents Clothing Stores; Ladies Clothing Stores; Kids Clothing Stores; Kurta Shops; Jeans & Casual Wear; Undergarments Stores; Winter Wear & Jackets; Second-Hand Clothes (Landa Bazaar); School Uniform Shops
## Footwear: Shoe Shops; Khussa Shops; Peshawari Chappal; Kolhapuri & Sandals; Ladies Shoes; Kids Shoes; Sports Shoes; Shoe Repair (Mochi)
## Jewellery & Accessories: Jewellers; Goldsmiths (Sunar); Gold Buyers; Silver Jewellery; Diamond Jewellers; Artificial Jewellery; Bangles Shops (Choorian); Watches Shops; Handbags & Purses; Perfumes & Attar Shops
## Laundry & Garment Care: Dry Cleaners; Laundry Services; Dhobi Ghat; Ironing Services; Carpet & Rug Washing; Shoe Laundry

# Food & Dining
## Desi Cuisine: Desi Restaurants; Karahi Restaurants; Biryani Centres; Nihari Restaurants; Haleem Shops; Paye Restaurants; Pulao Centres; Daal Chawal Points; Sajji Restaurants; Tikka & Boti Shops
## BBQ & Grills: BBQ Restaurants; Seekh Kabab Shops; Chapli Kabab Shops; Tandoori Restaurants; Steak Houses; Shawarma Shops; Bun Kabab Stalls
## Fast Food: Fast Food Restaurants; Burger Joints; Pizza Restaurants; Broast & Fried Chicken; Sandwich Shops; Fries & Loaded Fries; Hot Dog Stalls
## International Cuisine: Chinese Restaurants; Thai Restaurants; Italian Restaurants; Continental Restaurants; Turkish Restaurants; Arabic & Mandi Restaurants; Afghan Restaurants; Japanese & Sushi Restaurants; Korean Restaurants; Seafood Restaurants
## Cafes & Casual Dining: Cafes; Coffee Shops; Dhabas; Roadside Hotels; Buffet Restaurants; Hi-Tea Restaurants; Family Restaurants; Food Courts; Rooftop Restaurants; Shisha Cafes
## Bakeries & Sweets: Bakeries; Cake Shops; Custom Cake Makers; Sweet Shops (Mithai); Halwa Puri Shops; Jalebi & Samosa Shops; Ice Cream Parlours; Kulfi Shops; Desserts & Kheer
## Tea, Juice & Snacks: Chai Dhabas; Chai & Paratha Points; Doodh Patti Cafes; Juice Corners; Falooda Shops; Lassi Shops; Sugarcane Juice (Ganne ka Ras); Chaat & Dahi Bhalay; Gol Gappay Stalls; Pakora & Samosa Stalls; Bhutta & Roasted Corn
## Home Food & Catering: Home Chefs; Tiffin Services; Office Lunch Delivery; Food Catering Services; Frozen Food Makers; Diet Meal Delivery; Cloud Kitchens; Tandoor & Roti Shops

# Grocery & Daily Needs
## Shops & Supermarkets: Kiryana Stores; General Stores; Supermarkets; Hypermarkets; Cash & Carry Stores; Utility Stores; Mart & Convenience Stores; Online Grocery Delivery
## Meat & Poultry: Butchers (Qasai); Mutton Shops; Beef Shops; Chicken Shops; Live Poultry Shops; Fish Markets & Fish Shops; Frozen Meat Suppliers; Halal Meat Processors
## Dairy: Milk Shops (Doodh Dukan); Dairy Shops; Yoghurt & Dahi Shops; Desi Ghee Suppliers; Butter & Makhan Suppliers; Milk Delivery Services; Eggs Suppliers
## Fruits & Vegetables: Fruit Shops; Vegetable Shops (Sabzi); Fruit & Vegetable Markets (Sabzi Mandi); Organic Produce; Imported Fruits; Mango Sellers; Dates (Khajoor) Shops
## Dry Fruits, Spices & Staples: Dry Fruit Shops; Spices (Masala) Shops; Pansaar & Herbs Shops; Rice Dealers; Pulses (Daal) Dealers; Sugar & Gur Dealers; Cooking Oil & Ghee Dealers; Honey Sellers; Tea Leaf Dealers
## Flour & Grain: Chakki (Flour Mills); Atta Dealers; Wheat Suppliers; Besan & Maida Suppliers; Grinding Shops (Pisai)
## Household Supplies: Crockery Shops; Plastic Goods Shops; Kitchenware Stores; Cleaning Supplies; Disposable Items Suppliers; Paan & Cigarette Shops; Stationery Shops; Bookshops

# Automotive
## Car Dealers: New Car Showrooms; Used Car Dealers; Imported Car Dealers; Car Brokers; Car Bazaars; Car Leasing & Financing; Car Valuation & Inspection; Car Registration Agents
## Motorcycles & Rickshaws: Motorcycle Dealers; Used Motorcycle Dealers; Electric Bike Dealers; Rickshaw Dealers; Loader Rickshaw Dealers; Motorcycle Mechanics; Motorcycle Spare Parts; Bicycle Shops
## Commercial Vehicles: Truck Dealers; Bus & Coach Dealers; Pickup & Loader Dealers; Truck Body Makers; Trailer Manufacturers; Truck Art & Painting
## Repair & Maintenance: Car Mechanics; Auto Workshops; Denters & Painters; Auto Electricians; AC Repair for Cars; Engine Overhauling; Suspension & Alignment; Radiator Repair; Gear Box Repair; Car Scanning & Diagnostics; Hybrid Car Specialists; CNG Kit Fitting
## Tyres & Batteries: Tyre Shops; Used Tyres; Puncture Repair; Wheel Alignment & Balancing; Rims & Alloy Wheels; Car Battery Dealers
## Parts & Accessories: Auto Parts Shops; Genuine Spare Parts; Used Auto Parts (Kabari); Car Accessories Shops; Seat Covers & Upholstery; Car Audio & Multimedia; Car Tracker Installers; Car Lights & LEDs; Car Mats & Covers
## Care & Customisation: Car Wash; Car Detailing; Ceramic Coating; Paint Protection Film; Car Wrapping; Window Tinting; Car Tuning & Modification; Body Kits
## Driving Services: Drivers on Hire; Vehicle Towing Services; Auto Insurance Agents; Driving Licence Agents; Number Plate Makers; Vehicle Token Tax Agents

# Travel & Transport
## Hajj & Umrah: Hajj Operators; Umrah Operators; Umrah Packages; Ziyarat Tours; Ihram & Hajj Supplies; Hajj Training Centres
## Travel Agencies: Travel Agents; Air Ticketing Agents; Holiday Packages; Honeymoon Packages; Group Tour Organisers; Corporate Travel Management; Cruise Booking Agents
## Visas & Travel Documents: Visa Consultants; Tourist Visa Services; Visit Visa Services; Travel Insurance; Visa Photo Studios; Passport Renewal Agents
## Tourism (Northern Areas & Domestic): Northern Areas Tour Operators; Hunza & Skardu Tours; Swat & Kalam Tours; Murree & Galiyat Tours; Naran & Kaghan Tours; Trekking & Mountaineering Guides; Jeep Safari Operators; Camping Equipment on Rent; Desert Safari (Thar & Cholistan); Tour Guides
## Hotels & Stay: Hotels; Budget Hotels; Luxury Hotels; Guest Houses; Rest Houses; Resorts; Motels; Serviced Apartments; Holiday Homes & Cottages
## Bus & Road Travel: Bus Services; Coach & Luxury Bus Services; Bus Terminals (Adda); Van & Hiace Services; Bus Ticketing Agents; Tourist Coaster on Rent
## Rent-a-Car & Taxi: Rent a Car; Car Rental with Driver; Self-Drive Car Rental; Taxi Services; Airport Pick & Drop; Pick & Drop for Schools; Pick & Drop for Offices; Coaster & Hiace on Rent
## Cargo & Logistics: Courier Services; Cargo Services; International Cargo; Goods Transport Companies; Truck & Mazda Booking; Freight Forwarders; Customs Clearing Agents; Shifting Containers; Warehousing & Storage; Bike Delivery Services

# Overseas & Immigration
## Overseas Employment: Overseas Employment Promoters; Manpower Recruitment Agencies; Gulf Jobs Recruiters; Europe Work Permit Consultants; Trade Testing Centres; Medical Centres for Overseas Jobs (GAMCA); Protector of Emigrants Services; Overseas Job Training Institutes
## Immigration Services: Immigration Consultants; Immigration Lawyers; Permanent Residency Consultants; Spouse & Family Visa Consultants; Investor & Business Visa Consultants; Citizenship by Investment Advisors; Asylum & Appeals Advisors
## Study Abroad: Study Abroad Consultants; UK Education Consultants; Canada Education Consultants; Australia Education Consultants; Europe Education Consultants; China & Turkey Education Consultants; Scholarship Advisors; MBBS Abroad Consultants
## Documents & Attestation: Document Attestation Services; HEC Degree Attestation Agents; IBCC Certificate Equivalence Agents; Foreign Office Attestation Agents; Apostille Services; Embassy Attestation Agents; Police Character Certificate Agents
## Translation & Paperwork: Certified Translators; Legal Translation Services; Sworn Translators; Interpreters; Typing & Composing Centres; Photocopy & Scanning Shops; Passport Photo Services
## Overseas Pakistani Services: Overseas Property Management; Remittance Services; Overseas Pakistani Legal Help; Proxy & Power of Attorney Services; NICOP & POC Agents; Family Care Services for Overseas

# Finance & Legal
## Banks & Financial Institutions: Commercial Banks; Islamic Banks; Microfinance Banks; Development Finance Institutions; ATMs; Bank Branches; Credit Card Services
## Money Services: Mobile Wallet Agents; Money Exchange Companies; Money Transfer Agents; Bill Payment Centres; Gold & Prize Bond Dealers; Savings Centres (National Savings); Cheque & Cash Collection
## Loans & Financing: Home Financing; Car Financing; Personal Loans; Business & SME Loans; Agriculture Loans; Gold Loans; Loan Consultants; Leasing Companies
## Insurance & Takaful: Life Insurance Agents; Takaful Agents; Health Insurance; Motor Insurance; Property & Fire Insurance; General Insurance Companies; Insurance Brokers; Insurance Surveyors
## Investments: Stock Brokers; Mutual Fund Distributors; Financial Advisors; Wealth Management Firms; Gold Investment Dealers; Real Estate Investment Trusts
## Accounting & Tax: Chartered Accountants; Accounting Firms; Bookkeeping Services; Audit Firms; Tax Consultants; Income Tax Return Filing; NTN Registration; Sales Tax Registration (STRN); FBR Tax Consultants; Provincial Sales Tax Consultants; Payroll Services
## Company & Business Registration: SECP Company Registration; Sole Proprietorship Registration; Partnership Firm Registration; Trademark Registration; Copyright & Patent Agents; Chamber of Commerce Membership Agents; Import Export Licence Consultants; ISO Certification Consultants; PSQCA & Halal Certification Consultants
## Lawyers & Legal Services: Lawyers & Advocates; Law Firms; Family Lawyers; Divorce & Khula Lawyers; Criminal Lawyers; Civil Lawyers; Property Lawyers; Corporate Lawyers; Tax Lawyers; Banking Lawyers; Labour Lawyers; Cyber Crime Lawyers; Constitutional Lawyers; Court Marriage Services
## Legal Documentation: Notary Public; Oath Commissioners; Stamp Vendors; Stamp Paper & Deed Writers; Agreement & Affidavit Writers; Property Transfer Agents; Property Valuers; Fard & Land Record Agents; Private Investigators

# Home Services
## Repairs & Maintenance: Plumbers; Electricians; Carpenters; Painters; Welders; Masons (Raj Mistri); Handymen; Locksmiths; Tile Fixers; Glass Repair
## AC & Appliances: AC Installation; AC Repair & Service; AC Gas Refilling; Refrigerator Repair; Washing Machine Repair; Microwave Oven Repair; Geyser Installation & Repair; Water Dispenser Repair; Kitchen Hood & Stove Repair; Sewing Machine Repair
## Cleaning: Home Cleaning Services; Deep Cleaning; Sofa Cleaning; Carpet Cleaning; Office Cleaning; Glass & Facade Cleaning; Sewerage & Gutter Cleaning; Septic Tank Cleaning; Kitchen Exhaust Cleaning
## Pest Control: Pest Control Services; Termite Control (Deemak); Fumigation Services; Mosquito Spray Services; Rodent Control; Bed Bug Treatment
## Moving & Storage: Movers & Packers; House Shifting; Office Shifting; Furniture Assembly; Storage Services; Scrap Buyers (Kabari)
## Domestic Staff: Maid Agencies; Domestic Staff Agencies; Cooks; Drivers (Domestic); Babysitters & Nannies; Patient Attendants; Gardeners (Mali); Chowkidar Services
## Security: Security Guard Companies; Armed Guards; CCTV Camera Installers; Alarm Systems; Access Control & Biometric Systems; Video Door Phones; Fire Extinguisher Suppliers; Fire Safety Consultants; Armoured Vehicle Services
## Home Improvement: Furniture Polish; Upholstery Services; Sofa Makers; Furniture Repair; Curtain Tailors; Mattress Shops; Furniture Shops; Home Decor Shops; Landscaping & Gardening; Artificial Grass Installers; Swimming Pool Construction

# Electronics & Mobile
## Mobile Phones: Mobile Phone Shops; Used Mobile Phones; Mobile Accessories; Mobile Phone Wholesalers; PTA Registration Services; Smart Watches & Wearables; Mobile Covers & Protectors
## Mobile Repair: Mobile Repair Shops; Mobile Screen Replacement; Mobile Software & Unlocking; Mobile Battery Replacement; Tablet Repair; Mobile Repair Training
## Computers & Laptops: Laptop Shops; Used Laptops; Computer Shops; Gaming PCs; Computer Accessories; Laptop Repair; Computer Repair; Data Recovery Services; Printers & Toner Refilling
## Home Appliances: Home Appliances Stores; Refrigerator Dealers; Air Conditioner Dealers; Washing Machine Dealers; Microwave & Ovens; Air Coolers; Fans Dealers; Room Heaters & Gas Heaters; Geyser Dealers; Kitchen Appliances; Appliances on Installment
## TV & Audio: LED TV Dealers; LED & TV Repair; Smart TV & Android Box; Home Theatre & Speakers; Satellite Dish & Receivers; Cable TV Operators; Projectors
## Markets & Gadgets: Electronics Markets; Electronics Wholesalers; Electronic Components Shops; Used Electronics Shops; Cameras & Photography Equipment; Gaming Consoles; Drones
## Internet & Telecom: Internet Service Providers; Fibre Internet Providers; Wireless Internet Providers; Mobile Network Franchises; PTCL & Landline Services; Routers & Networking Equipment; Telecom Tower Contractors

# IT & Digital
## Software Development: Software Houses; Web Developers; Mobile App Developers; Custom Software Development; ERP Software Providers; POS & Billing Software; School Management Software; Hospital Management Software; Game Development Studios; Blockchain Developers; AI & Machine Learning Companies
## Digital Marketing: Digital Marketing Agencies; SEO Services; Social Media Marketing; Google Ads Specialists; Content Writing Services; Influencer Marketing Agencies; Email & SMS Marketing; YouTube Channel Management
## Design & Creative: Graphic Designers; Logo Designers; UI & UX Designers; Video Editors; Animation Studios; 3D Rendering Services; Photographers (Commercial); Voice-Over Artists
## Freelancing & E-commerce: Freelancing Training Centres; Freelancers; E-commerce Store Setup; Amazon Account Management; Dropshipping Services; Online Store Management; Payment Gateway Integration
## BPO & Outsourcing: Call Centres; BPO Companies; Customer Support Outsourcing; Data Entry Services; Virtual Assistants; Medical Billing Companies; Telemarketing Services
## Printing & Branding: Printing Press; Digital Printing; Offset Printing; Panaflex & Signboards; 3D Signs & Neon Signs; Visiting Card Printing; T-Shirt & Mug Printing; Promotional Items; Packaging Printing; Rubber Stamps
## IT Infrastructure: IT Hardware Suppliers; Networking Companies; Server & Data Centre Services; Web Hosting & Domains; Cloud Services; Cyber Security Companies; IT Support & AMC; Coworking Spaces; Software Training & Certification Centres

# Beauty & Wellness
## Salons & Parlours: Beauty Parlours; Ladies Salons; Gents Salons; Barber Shops (Hajjam); Unisex Salons; Kids Salons; Home Beauty Services; Threading & Waxing
## Skin & Hair Clinics: Skin Clinics; Laser Hair Removal; Hair Transplant Clinics; PRP & Hair Loss Treatment; HydraFacial & Facial Clinics; Botox & Fillers; Acne & Scar Treatment; Weight Loss Clinics
## Spa & Massage: Spas; Massage Centres; Steam & Sauna; Ladies Spas; Foot Reflexology; Turkish Hammam
## Fitness: Gyms; Ladies Gyms; Fitness Centres; Personal Trainers; CrossFit Centres; Yoga Classes; Aerobics & Zumba; Pilates Studios; Gym Equipment Dealers; Supplements & Protein Shops
## Cosmetics & Personal Care: Cosmetics Shops; Skincare Products; Herbal Beauty Products; Hair Care Products; Wigs & Hair Extensions; Beauty Wholesalers; Salon Equipment Suppliers
## Wellness: Diet & Nutrition Centres; Mental Health Counsellors; Life Coaches; Meditation Centres; Ladies Fitness & Wellness Centres; Slimming Centres

# Industry & Manufacturing
## Textile Industry: Textile Mills; Spinning Mills; Weaving Mills; Power Looms; Dyeing & Finishing Units; Denim Mills; Towel Manufacturers; Bed Linen Manufacturers; Yarn Dealers; Knitting Units; Hosiery Manufacturers
## Garments & Leather: Garment Manufacturers; Garment Exporters; Uniform Manufacturers; Leather Tanneries; Leather Garment Manufacturers; Leather Goods Manufacturers; Footwear Manufacturers; Gloves Manufacturers
## Export Industries: Surgical Instrument Manufacturers; Sports Goods Manufacturers; Football Manufacturers; Cutlery Manufacturers; Beauty Instruments Manufacturers; Martial Arts & Boxing Gear; Hand-Knotted Carpets; Carpet Manufacturers; Handicrafts Manufacturers; Onyx & Marble Handicrafts
## Food Processing: Rice Mills; Rice Exporters; Sugar Mills; Flour Mills (Industrial); Oil & Ghee Mills; Cotton Ginning Factories; Dal Mills; Spices Processing Units; Pickle & Chutney Manufacturers; Beverage & Juice Manufacturers; Biscuits & Confectionery Manufacturers; Ice Factories
## Chemicals & Plastics: Plastic Manufacturers; Plastic Moulding; Packaging Manufacturers; Corrugated Carton Manufacturers; Chemical Manufacturers; Paint Manufacturers; Pharmaceutical Manufacturers; Soap & Detergent Manufacturers; Glass Manufacturers; Rubber Products Manufacturers
## Metal & Engineering: Steel Re-Rolling Mills; Steel Fabricators; Foundries; Machinery Manufacturers; Agricultural Machinery Manufacturers; Industrial Machinery Dealers; CNC & Machining Workshops; Lathe Workshops; Electric Fan Manufacturers; Auto Parts Manufacturers; Wire & Cable Manufacturers
## Wood, Paper & Other: Furniture Manufacturers; Chiniot Furniture Makers; Wooden Doors Manufacturers; Paper Mills; Printing & Stationery Manufacturers; Brick Kilns; Cement Factories; Marble Factories; Ceramic & Pottery Units; Industrial Estates

# Agriculture & Livestock
## Seeds & Crop Inputs: Seed Dealers; Vegetable Seeds; Hybrid Seeds; Fertiliser Dealers; Pesticide Dealers; Organic Fertilisers; Agro Chemicals; Soil & Water Testing for Farms
## Farm Machinery: Tractor Dealers; Used Tractors; Tractor Repair Workshops; Tractor Spare Parts; Thresher & Harvester Dealers; Farm Implements; Tube Well Engines; Drip & Sprinkler Irrigation; Agricultural Drones
## Livestock & Dairy Farming: Cattle Farms; Dairy Farms; Goat & Sheep Farms; Bull Fattening Farms; Animal Feed (Wanda) Dealers; Silage Suppliers; Livestock Breeders; Qurbani Animal Sellers
## Poultry & Fisheries: Poultry Farms; Desi Murgi Farms; Hatcheries; Poultry Feed Dealers; Poultry Equipment Suppliers; Fish Farms; Fish Seed Hatcheries; Bee Farms & Honey Producers
## Veterinary: Veterinarians; Veterinary Clinics; Veterinary Medicine Stores; Artificial Insemination Services; Livestock Vaccination
## Markets & Mandis: Cattle Markets (Mandi); Grain Markets (Ghalla Mandi); Fruit Mandi; Cotton Markets; Agricultural Produce Traders; Cold Storage Facilities; Grain Godowns
## Horticulture & Land: Plant Nurseries; Fruit Plant Nurseries; Orchards; Kitchen Gardening Supplies; Agricultural Land Dealers; Agricultural Consultants; Tunnel Farming; Greenhouse Builders

# Wholesale & Trade
## Wholesale Hubs: Wholesale Markets; Wholesale Bazaars; Wholesale Cloth Dealers; Wholesale Grocery Dealers; Wholesale Cosmetics Dealers; Wholesale Toys Dealers; Wholesale Crockery Dealers; Wholesale Stationery Dealers
## Import & Export: Importers; Exporters; Import Export Consultants; Trading Companies; Indenting Agents; Buying Houses; China Import Agents; Afghan Transit Trade Agents
## Distribution: Distributors; FMCG Distributors; Pharmaceutical Distributors; Beverage Distributors; Cigarette Distributors; Electronics Distributors; Sole Agents
## Commission & Brokerage: Commission Agents (Arhti); Grain Arhtis; Fruit & Vegetable Arhtis; Cotton Brokers; Livestock Brokers; Auction Houses
## Industrial Supplies: Industrial Suppliers; Bearings Dealers; Hydraulic & Pneumatic Suppliers; Valves & Fittings; Industrial Chemicals Suppliers; Safety Equipment Suppliers; Welding Equipment Suppliers; Tools & Hardware Wholesalers; Lubricants Wholesalers
## Packaging & Raw Materials: Packaging Suppliers; Plastic Bags Suppliers; Shopping Bags; Polythene Suppliers; Carton & Box Suppliers; Labels & Stickers; Plastic Granules Dealers; Scrap Metal Dealers; Waste Paper Dealers; Raw Material Suppliers

# Religious & Community
## Mosques & Islamic Centres: Mosques (Masjid); Jamia Masjid; Imambargahs; Eidgahs; Islamic Centres; Shrines & Darbars; Khanqahs
## Madrassas & Seminaries: Madrassas; Girls Madrassas; Dar-ul-Uloom; Hifz Madrassas; Dars-e-Nizami Institutes
## Other Faiths: Churches; Gurdwaras; Hindu Temples (Mandir); Christian Community Centres; Ahl-e-Kitab Welfare Societies
## Religious Services: Islamic Bookshops; Islamic Scholars & Mufti Services; Istikhara Services; Quran Khwani Services; Islamic Calligraphy; Tasbeeh & Prayer Mats; Religious Gift Shops
## Welfare & Charity: NGOs; Welfare Trusts; Charitable Foundations; Zakat & Sadqa Organisations; Free Dastarkhwan; Free Dispensaries; Langar Services; Disability Support Organisations; Women Welfare Organisations
## Shelters & Care Homes: Orphanages; Old Age Homes; Women Shelters (Dar-ul-Aman); Child Protection Centres; Street Children Shelters; Special Needs Centres
## Community Services: Blood Donation Societies; Funeral Services; Ghusl & Kafan Services; Graveyards; Dead Body Transport; Community Halls; Social Clubs; Trade Unions & Associations; Biradari & Community Associations

# Government & Public Services
## Identity & Documents: NADRA Registration Centres; Passport Offices; Union Council Offices; Birth & Death Certificates; Nikah Registration (Marriage Certificate); Domicile Offices; E-Sahulat Centres; Arms Licence Offices
## Law & Order: Police Stations; Traffic Police Offices; Police Khidmat Markaz; Women Police Stations; FIA Offices; Anti-Corruption Offices; Cyber Crime Wing; Jails & Prisons
## Courts: High Courts; District Courts; Civil Courts; Family Courts; Banking Courts; Consumer Courts; Anti-Terrorism Courts; Arbitration Centres
## Revenue & Taxation: Excise & Taxation Offices; Vehicle Registration Offices; FBR Regional Tax Offices; Land Record Centres (Patwar Khana); Revenue Offices (Tehsil); Customs Offices
## Utilities: Electricity Distribution Companies; Electricity Complaint Centres; Gas Companies; Gas Complaint Centres; Water & Sanitation Agencies; Sewerage Complaint Offices; Telecom Customer Centres
## Public Services: Post Offices; Municipal Corporations; Town & Tehsil Municipal Offices; Development Authorities; District Commissioner Offices; Labour Department Offices; Social Security Offices; EOBI Offices; Public Libraries; Government Offices
## Emergency Services: Rescue 1122; Fire Brigade; Edhi & Ambulance Centres; Civil Defence Offices; Disaster Management Offices; Emergency Helplines; Motorway Police
## Diplomatic Missions: Embassies; Consulates; High Commissions; Visa Application Centres; Honorary Consuls; International Organisations Offices

# Pets, Sports & Leisure
## Pets: Pet Shops; Pet Clinics; Pet Food Suppliers; Pet Grooming; Pet Boarding; Dog Trainers; Bird Shops; Aquarium & Fish Shops; Cat Breeders; Pigeon Fanciers (Kabootar); Pet Accessories
## Sports Clubs & Academies: Sports Clubs; Cricket Academies; Football Academies; Hockey Clubs; Squash Courts & Academies; Tennis Clubs; Badminton Courts; Martial Arts Academies; Boxing Clubs; Swimming Pools; Swimming Classes; Horse Riding Clubs; Golf Clubs; Shooting Clubs
## Sports Shops & Grounds: Sports Goods Shops; Cricket Bat Makers; Bicycle & Cycling Gear; Fishing & Hunting Shops; Indoor Cricket Arenas; Futsal Grounds; Padel Courts; Sports Ground Booking; Stadiums
## Entertainment: Cinemas; Theatres; Arts Councils; Bowling Alleys; Snooker Clubs; Gaming Zones; VR Gaming Centres; PlayStation Cafes; Escape Rooms; Karaoke Lounges
## Parks & Outdoor: Public Parks; Amusement Parks; Water Parks; Family Fun Lands; Zoos & Safari Parks; Picnic Spots; Lakes & Boating; Adventure Parks; Paragliding & Adventure Sports
## Hobbies & Culture: Art Galleries; Museums; Music Instrument Shops; Music Academies; Dance Academies; Art & Painting Classes; Calligraphy Classes; Kite Shops; Toy Shops; Hobby Shops; Book Clubs & Literary Societies
`;

export interface CategoryRow {
  name: string;
  slug: string;
  level: 1 | 2 | 3;
  parentSlug: string | null;
  sortOrder: number;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[()&'.,/]+/g, " ").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");

/** Parse the tree into rows with globally unique slugs. */
export function parseCategoryTree(tree = PAKISTAN_CATEGORY_TREE): CategoryRow[] {
  const rows: CategoryRow[] = [];
  const used = new Set<string>();
  const unique = (base: string, parent?: string) => {
    let s = base;
    if (used.has(s) && parent) s = `${base}-${parent}`;
    let i = 2;
    while (used.has(s)) s = `${base}-${i++}`;
    used.add(s);
    return s;
  };
  let l1: string | null = null;
  let i1 = 0;
  for (const raw of tree.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("# ")) {
      const name = line.slice(2).trim();
      l1 = unique(slugify(name));
      rows.push({ name, slug: l1, level: 1, parentSlug: null, sortOrder: i1++ });
    } else if (line.startsWith("## ") && l1) {
      const [groupName, items = ""] = line.slice(3).split(/:(.*)/s);
      const g = groupName.trim();
      const l2 = unique(slugify(g), l1);
      rows.push({ name: g, slug: l2, level: 2, parentSlug: l1, sortOrder: rows.length });
      items.split(";").map((x) => x.trim()).filter(Boolean).forEach((name, j) => {
        rows.push({ name, slug: unique(slugify(name), l2), level: 3, parentSlug: l2, sortOrder: j });
      });
    }
  }
  return rows;
}
