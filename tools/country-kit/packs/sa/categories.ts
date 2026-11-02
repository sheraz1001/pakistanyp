/**
 * SaudiYP category tree for the Saudi Arabia business directory:
 * sector > group > category (3 levels).
 * Format: one sector per block; "# Sector" lines followed by "## Group: item; item; item" lines.
 * Parsed by parseCategoryTree() into rows with slug, level and parent.
 */
export const CATEGORY_TREE = `
# Business Setup & PRO Services
## Company Formation: Commercial Registration (CR) Services; Company Formation Consultants; Foreign Investment Licensing (MISA); Branch Office Setup; Regional Headquarters Setup; Special Economic Zone Company Setup; Sole Establishment Registration; Chamber of Commerce Registration; Trademark Registration
## PRO & Government Liaison: PRO Services; Government Relations Agents (Muaqqib); Balady Municipal Permits; Civil Defence Permits; Shop Licence Services; Signboard Permits; Document Clearing Agents; Ministry Liaison Services
## Labour & Residency Services: Qiwa Services; GOSI Registration Services; Muqeem Services; Iqama Renewal Services; Work Visa Processing; Exit & Re-Entry Visa Services; Sponsorship Transfer (Naql Kafala); Final Exit Processing; Family Visit Visa Services
## Saudization & HR: Saudization (Nitaqat) Consultants; HR Consultants; Payroll Services; Manpower Supply Companies; Recruitment Agencies; Executive Search Firms; Labour Law Consultants; Employee Outsourcing
## Business Consulting: Management Consultants; Business Plan Writers; Feasibility Study Consultants; Strategy Consultants; ISO Certification Consultants; Quality & Compliance Consultants; Franchise Consultants; Market Research Firms
## Office Space & Business Centres: Business Centres; Coworking Spaces; Virtual Offices; Serviced Offices; Meeting Room Rental; Executive Suites; Commercial Address Services; Office Fit-out Packages
## Translation & Attestation: Certified Translation Offices; Legal Translation; Document Attestation Services; Embassy Attestation; Foreign Affairs Attestation; Degree Attestation & Equivalency; Arabic-English Interpreters; Medical Report Translation

# Finance, Tax & Legal
## Banks & Exchange: Banks; Islamic Banks; Bank ATMs; Money Exchange Centres; Remittance Centres; Money Transfer Offices; Foreign Currency Exchange; Gold Bullion Dealers
## Financing & Loans: Personal Finance; Car Finance; Home Finance (Mortgage); SME Financing; Islamic Financing (Murabaha); Leasing Companies; Microfinance; Buy Now Pay Later Providers
## Insurance: Insurance Companies; Car Insurance; Medical Insurance; Travel Insurance; Home Insurance; Marine & Cargo Insurance; Takaful Insurance; Insurance Brokers
## Investments: Investment Companies; Stock Brokers; Asset Management Firms; Real Estate Funds (REITs); Venture Capital Firms; Financial Advisors; Wealth Management; Crowdfunding Platforms
## Zakat, Tax & VAT: VAT Consultants (ZATCA); Zakat Consultants; Tax Consultants; VAT Registration Services; E-Invoicing (Fatoora) Solutions; Zakat & Tax Return Filing; Withholding Tax Advisors; Transfer Pricing Consultants
## Accounting & Audit: Chartered Accountants; Audit Firms; Bookkeeping Services; Accounting Firms; Financial Statement Preparation; Internal Audit Services; CFO Services; Accounting Software Providers
## Lawyers & Law Firms: Law Firms; Lawyers; Corporate Lawyers; Labour Lawyers; Family & Personal Status Lawyers; Criminal Lawyers; Real Estate Lawyers; Commercial Dispute Lawyers; Inheritance Lawyers
## Legal Services: Notaries Public; Legal Consultants; Contract Drafting; Power of Attorney Services; Debt Collection Agencies; Legal Document Services; Mediation & Reconciliation; Licensed Arbitrators

# Real Estate & Accommodation
## Brokers & Agents: Real Estate Brokers; Real Estate Offices (Aqar); Commercial Real Estate Brokers; Land Brokers; Real Estate Marketing Companies; Property Valuers (Taqeem); Real Estate Consultants; Real Estate Auctions
## Property Management: Property Management Companies; Building Management; Facility Management Companies; Owners Association Management; Rent Collection Services; Tenant Screening; Ejar Contract Services; Building Maintenance Contracts
## Residential Rentals: Apartments for Rent; Villas for Rent; Floors for Rent; Rooms for Rent; Bachelor Accommodation; Family Apartments; Duplex Villas; Staff Housing
## Compounds & Furnished Apartments: Residential Compounds; Western Compounds; Furnished Apartments; Serviced Apartments; Monthly Furnished Rentals; Furnished Villas; Gated Villa Communities; Short-Term Rentals
## Commercial Property: Offices for Rent; Showrooms for Rent; Shops for Rent; Warehouses for Rent; Commercial Land; Industrial Land; Retail Space in Malls; Workshops for Rent
## Property Sales & Development: Real Estate Developers; Villas for Sale; Apartments for Sale; Residential Land for Sale; Farms for Sale; Housing Projects; Townhouses; Real Estate Investment Advisors
## Rest Houses & Chalets: Istirahas (Rest Houses); Chalets; Farm Stays; Private Pools for Rent; Event Istirahas; Beach Chalets; Mountain Chalets; Istirahas for Sale

# Construction & Contracting
## Contracting Companies: General Contractors; Building Contractors; Villa Construction Contractors; Infrastructure Contractors; Road Contractors; Civil Works Contractors; Turnkey Contractors; Steel Structure Contractors
## MEP & HVAC Contractors: MEP Contractors; HVAC Contractors; Central AC Installation; Ducting Contractors; Chiller Maintenance; Electrical Contractors; Plumbing Contractors; Fire Fighting Contractors; Fire Alarm Systems
## Engineering Offices: Engineering Consultants; Architects; Structural Engineers; Interior Architects; Surveying Offices; Soil Testing Labs; Building Permit Drawings; Project Management Consultants; Quantity Surveyors
## Specialised Works: Waterproofing Contractors; Thermal Insulation; Roof Insulation; Epoxy Flooring; Swimming Pool Contractors; Landscaping Contractors; Asphalt & Paving; Precast Concrete Works
## Building Materials: Cement Suppliers; Steel & Rebar Suppliers; Ready-Mix Concrete; Blocks & Bricks; Sand & Aggregates; Hardware Stores; Plumbing Materials; Electrical Materials
## Finishing Materials: Marble & Granite; Ceramic & Porcelain Tiles; Sanitary Ware; Kitchen Showrooms; Doors & Windows; Aluminium & Glass Works; uPVC Windows; Gypsum Board Suppliers
## Interior Design & Decor: Interior Designers; Gypsum & Decor Works; Curtains & Blinds; Majlis Design & Upholstery; Carpets & Rugs; Wooden Flooring; Wall Cladding; Lighting Shops; Furniture Showrooms
## Metal & Steel Works: Blacksmith Workshops (Haddad); Steel Doors & Gates; Shades & Tents (Mazallat); Car Parking Shades; Steel Fabrication; Stainless Steel Works; Fences & Barriers; Cladding & Facades
## Equipment Rental: Heavy Equipment Rental; Crane Rental; Excavator Rental; Forklift Rental; Generator Rental; Water Tanker Rental; Mobile Toilet Rental; Construction Tools Rental; Scaffolding Rental

# Home Services & Maintenance
## AC Maintenance: AC Repair; Split AC Installation; Window AC Repair; AC Cleaning & Servicing; AC Gas Refilling; AC Duct Cleaning; Used AC Buy & Sell; AC Spare Parts; Central AC Maintenance
## Home Maintenance: Electricians; Plumbers; Carpenters; Painters; Handyman Services; Satellite Dish Installation; Locksmiths; Gypsum Repair
## Appliance Repair: Washing Machine Repair; Refrigerator Repair; Oven & Cooker Repair; Water Heater Repair; Dishwasher Repair; Water Cooler Repair; TV Repair; Freezer Repair
## Cleaning Services: Home Cleaning; Deep Cleaning; Villa Cleaning; Office Cleaning; Sofa & Carpet Cleaning; Facade & Glass Cleaning; Kitchen Exhaust Cleaning; Post-Construction Cleaning; Cleaning Workers by the Hour
## Water Tanks & Sewage: Water Tank Cleaning; Water Tank Insulation; Fiberglass Water Tanks; Water Pumps; Sewage Tanker Services; Drain Cleaning; Septic Tank Cleaning; Water Leak Detection; Sweet Water Delivery (Wayet)
## Pest Control: Pest Control Companies; Termite Control; Cockroach Control; Bed Bug Treatment; Rodent Control; Mosquito Fogging; Snake & Scorpion Control; Bird Control; Disinfection & Sterilisation Services
## Domestic Labour Offices: Domestic Labour Recruitment Offices; Musaned Recruitment Services; Housemaids; Hourly Maids; Private Drivers; Home Nurses; Babysitters & Nannies; Domestic Cooks; Labour Rental Companies
## Moving & Storage: Furniture Movers; House Shifting; Furniture Packing; Furniture Dismantling & Installation; Storage Units; Office Relocation; International Movers; Pickup Truck Hire (Dyna)
## Security & Smart Home: CCTV Installation; Security Guards Companies; Intercom Systems; Smart Home Automation; Alarm Systems; Access Control Systems; Safes & Lockers; Electric Gate Motors
## Laundry: Laundry Services; Dry Cleaning; Steam Ironing; Carpet Washing; Curtain Cleaning; Laundry Pickup & Delivery; Shoe Cleaning; Self-Service Laundromats

# Automotive
## Car Dealers & Showrooms: New Car Showrooms; Used Car Dealers; Car Exhibitions (Maared); Car Auctions; Luxury Car Dealers; Car Importers; Car Export Services; Classic Cars
## Car Rental & Leasing: Car Rental; Monthly Car Rental; Car Leasing; Luxury Car Rental; Car Rental with Driver; Bus Rental; Pickup & Van Rental; Lease to Own Cars
## Service & Repair: Car Service Centres; Car Workshops; Oil Change Centres; Engine Repair; Transmission Repair; Car Electricians; Car AC Repair; Brake Service; Hybrid & EV Repair
## Body & Paint: Car Body Shops; Car Painting; Dent Repair (Samkara); Car Glass Replacement; Bumper Repair; Insurance Claim Repairs; Car Upholstery; Headlight Restoration
## Tyres & Batteries: Tyre Shops; Tyre Repair (Banshar); Wheel Alignment & Balancing; Rims & Alloy Wheels; Car Battery Shops; Battery Delivery Service; Nitrogen Tyre Filling; Mobile Tyre Service
## Auto Parts: Auto Parts Shops; Used Spare Parts (Tashleeh); Genuine Spare Parts; Engine Oil Dealers; Car Accessories; Car Audio & Multimedia; Truck Spare Parts; Heavy Equipment Spare Parts
## Car Care & Customisation: Car Wash; Mobile Car Wash; Car Detailing; Window Tinting; Paint Protection Film (PPF); Ceramic Coating; Car Wrapping; Off-Road Accessories
## Roadside & Inspection: Tow Trucks (Satha); Roadside Assistance; Periodic Vehicle Inspection (Fahas); Pre-Purchase Car Inspection; Driving Schools; Number Plate Services; Vehicle Registration Services; Car Key Programming
## Motorcycles & Heavy Vehicles: Motorcycle Dealers; Motorcycle Repair; Truck Dealers; Truck Repair Workshops; Bus Dealers; Trailer Manufacturers; Forklift Dealers; Delivery Bikes

# Travel, Hajj & Tourism
## Hajj & Umrah: Hajj Operators; Umrah Companies; Umrah Packages; Domestic Hajj Packages; Umrah Transport Services; Ziyarat Tours; Ihram & Hajj Supplies; Pilgrim Guides (Mutawwif)
## Travel Agencies: Travel Agents; Air Ticketing; Holiday Packages; Visa Services; Corporate Travel; Honeymoon Packages; Cruise Bookings; Student Travel
## Hotels & Furnished Units: Hotels; Luxury Hotels; Budget Hotels; Furnished Units (Shuqaq Mafrusha); Hotel Apartments; Resorts; Highway Hotels & Motels; Hotels near Haram; Desert Resorts
## Tour Operators: Tourism Companies; Heritage Tours; Desert Safari Tours; Diving & Snorkelling Tours; Mountain Tours; City Tours; Archaeological Site Tours; Tour Guides; Island & Boat Trips; Stargazing Tours; Hot Air Balloon Rides; Red Sea Coast Tours
## Transport & Taxis: Taxi Services; Airport Transfers; Intercity Buses; Chauffeur Services; Limousine Services; Staff Transport Services; School Transport; Coaster & Minibus Hire
## Airlines & Airports: Airline Offices; Airport Services; Meet & Assist Services; Private Jet Charter; Excess Baggage Services; Airport Parking; Air Cargo Agents; Airport Lounges

# Food & Dining
## Saudi & Gulf Cuisine: Saudi Restaurants; Kabsa Restaurants; Mandi Restaurants; Mathbi & Madfoon Restaurants; Haneeth Restaurants; Jareesh & Qursan; Saleeg Restaurants; Hejazi Restaurants; Najdi Restaurants; Yemeni Restaurants; Foul & Tamees Shops; Mutabbaq Shops
## Grills & Shawarma: Shawarma Shops; Grill Restaurants (Mashawi); Broasted Chicken; Charcoal Chicken; Kebab Restaurants; Turkish Grills; Lebanese Restaurants; Steak Houses
## International Cuisine: Indian Restaurants; Pakistani Restaurants; Filipino Restaurants; Egyptian Restaurants; Syrian Restaurants; Turkish Restaurants; Chinese Restaurants; Italian Restaurants; Japanese & Sushi; Korean Restaurants; Thai Restaurants; Mexican Restaurants; Indonesian Restaurants; Ethiopian Restaurants
## Fast Food & Casual: Burger Restaurants; Pizza Restaurants; Fried Chicken; Sandwich Shops; Fast Food Restaurants; Food Trucks; Breakfast Restaurants; Family Restaurants
## Seafood & Fish: Seafood Restaurants; Fish Markets; Fried Fish Shops; Sayadieh Restaurants; Shrimp Restaurants; Fresh Fish Shops; Fish Grilling Shops
## Cafes & Coffee: Specialty Coffee Shops; Cafes; Saudi Coffee (Qahwa) Houses; Drive-Thru Coffee; Karak Tea Shops; Juice Shops; Shisha Cafes; Dessert Cafes
## Bakeries & Sweets: Bakeries; Tannour Bread Bakeries; Samoli & Bread Shops; Arabic Sweets (Halawiyat); Kunafa Shops; Cake Shops; Pastry Shops; Luqaimat Shops
## Catering & Home Food: Food Catering; Home Cooks (Productive Families); Meal Subscriptions; Diet Meal Plans; Cloud Kitchens; Staff Meal Catering; Iftar Catering; Sacrifice Meat Cooking

# Grocery, Dates & Coffee
## Supermarkets & Groceries: Hypermarkets; Supermarkets; Grocery Stores (Baqala); Convenience Stores; Wholesale Food Stores; Online Grocery Delivery; Organic Food Stores; Asian Grocery Stores
## Dates & Date Shops: Date Shops; Date Wholesalers; Ajwa Dates; Sukkari Dates; Khalas Dates; Date Gift Boxes; Stuffed Dates; Date Paste & Products; Date Markets
## Arabic Coffee & Roasteries: Coffee Roasteries; Arabic Coffee Beans; Cardamom & Saffron Coffee Blends; Coffee Equipment Shops; Dallah & Coffee Pots; Specialty Coffee Beans; Coffee Wholesalers; Coffee Cups (Finjan) Shops
## Meat & Poultry: Butcher Shops; Fresh Chicken Shops; Sheep Meat (Naeemi & Najdi); Camel Meat Shops; Frozen Meat Suppliers; Slaughterhouses; Udhiyah & Aqiqah Services; Meat Cutting Services
## Fruits, Vegetables & Spices: Fruit & Vegetable Shops; Central Vegetable Markets; Spice Shops (Attarah); Nuts & Roasted Seeds (Mohamas); Honey Shops; Herbal Shops; Rice Wholesalers; Olive Oil Shops
## Dairy & Drinking Water: Dairy Products; Camel Milk; Laban & Yogurt Suppliers; Drinking Water Delivery; Water Gallon Refilling; Ice Factories; Cheese Shops; Fresh Juice Suppliers
## Household Supplies: Household Items Stores; Cleaning Supplies; Kitchenware Shops; Plastic & Disposables; Gas Cylinder Delivery; Charcoal & Firewood; Discount Stores (2 Riyal Shops); Gift Shops

# Fashion, Perfume & Jewellery
## Abaya & Women's Wear: Abaya Shops; Abaya Tailors; Hijab & Niqab Shops; Jalabiya Shops; Women's Clothing; Evening & Soiree Dresses; Modest Fashion Boutiques; Lingerie Shops
## Thobe & Men's Wear: Thobe Tailors; Ready-Made Thobes; Shemagh & Ghutra Shops; Bisht Shops; Men's Clothing; Sirwal & Undershirts; Agal & Taqiyah Shops; School Uniforms
## Tailoring & Fabrics: Ladies Tailors; Men's Tailors; Fabric Shops; Thobe Fabric Shops; Embroidery Services; Alteration Shops; Uniform Manufacturers; Curtain Fabric Shops
## Oud & Perfumes: Perfume Shops; Oud Shops; Bakhoor Shops; Oud Oil (Dehn Al Oud); Arabic Perfume Makers; Musk & Attar Shops; Incense Burners (Mabkhara); Perfume Wholesalers
## Gold & Jewellery: Gold Souqs; Jewellers; Gold Buyers; Diamond Jewellers; Silver Shops; Jewellery Repair; Gold Engraving; Watch Shops; Prayer Beads (Misbaha) Shops
## Shoes & Accessories: Shoe Shops; Arabic Sandals (Zabbab); Bags & Handbags; Sunglasses Shops; Kids Clothing; Sportswear Shops; Shoe Repair; Leather Goods

# Weddings & Events
## Wedding Halls & Venues: Wedding Halls (Qasr Afrah); Wedding Palaces; Hotel Ballrooms; Women's Wedding Halls; Outdoor Event Venues; Banquet Halls; Conference Venues; Engagement (Malka) Venues
## Event Catering & Hospitality: Wedding Catering; Buffet Catering; Arabic Coffee Servers (Qahwaji); Live Cooking Stations; Dessert Tables; Hospitality Staff (Ladies & Gents); Whole Lamb (Hashi) Catering; Chocolate & Sweets Trays
## Decor & Setup: Wedding Decorators; Kosha Designers; Flower Shops; Event Lighting; Event Tents Rental; Event Furniture Rental; Balloon Decoration; Fireworks Displays
## Bridal & Beauty: Bridal Makeup Artists; Henna Artists; Bridal Salons; Bridal Dress Rental; Wedding Dress Designers; Bisht Rental for Grooms; Bridal Hair Stylists; Bridal Packages
## Photography & Media: Wedding Photographers (Female); Event Photographers; Videographers; Drone Photography; Photo Studios; Photo Printing & Albums; Live Streaming; Photo Booths
## Traditional Arts & Entertainment: Folk Bands (Ardah); Zaffa Bands; DJs; Singers & Performers; Kids Entertainers; Shilat Performers; Magicians; Poets for Occasions
## Event Management: Event Planners; Event Management Companies; Wedding Planners; Exhibition Organisers; Conference Organisers; Corporate Events; Festival & Season Events; Invitation Cards & Printing
## Event Supplies & Staffing: Event Staffing; Ushers & Hostesses; Booth & Stand Builders; Audio Visual Rental; LED Screen Rental; Ticketing Services; Crowd Management; Event Security

# Health & Medical
## Hospitals: Private Hospitals; Government Hospitals; Specialist Hospitals; Maternity Hospitals; Children's Hospitals; Eye Hospitals; Psychiatric Hospitals; Oncology Centres
## Polyclinics & Medical Centres: Polyclinics; Medical Complexes (Mujamma Tibbi); Primary Healthcare Centres; Urgent Care Centres; Day Surgery Centres; Dialysis Centres; IVF & Fertility Centres; Telemedicine Services
## Doctors & Specialists: General Practitioners; Internal Medicine; Cardiologists; Endocrinologists; Gastroenterologists; Neurologists; Pulmonologists; Nephrologists; Urologists; Orthopaedic Surgeons; General Surgeons; ENT Specialists; Ophthalmologists; Paediatricians; Obstetricians & Gynaecologists; Psychiatrists; Psychologists; Oncologists; Rheumatologists; Plastic Surgeons; Bariatric Surgeons; Nutritionists & Dietitians; Vascular Surgeons; Neurosurgeons
## Dental: Dental Clinics; Orthodontists; Dental Implants; Cosmetic Dentistry; Paediatric Dentists; Root Canal Treatment; Teeth Whitening; Dental Labs
## Dermatology & Cosmetic: Dermatology Clinics; Laser Hair Removal; Botox & Fillers; Skin Care Clinics; Hair Transplant Centres; Cosmetic Surgery Centres; Body Contouring; Acne & Scar Treatment
## Labs & Radiology: Medical Laboratories; Home Lab Tests; Radiology Centres; MRI Centres; CT Scan Centres; Ultrasound Centres; Medical Check-Up Packages; Pre-Employment Medicals; Premarital Screening
## Pharmacies & Medical Supplies: Pharmacies; 24-Hour Pharmacies; Medical Equipment Suppliers; Surgical Supplies; Mobility Aids & Wheelchairs; Hearing Aid Centres; Diabetic Supplies; Medical Uniforms
## Optical: Optical Shops; Eyeglasses; Contact Lenses; Eye Testing; Optical Labs; LASIK Centres; Kids Eyewear
## Therapy & Home Care: Physiotherapy Centres; Home Healthcare; Hijama (Cupping) Centres; Herbal Medicine (Tibb Nabawi); Speech Therapy; Occupational Therapy; Autism Centres; Chiropractors

# Beauty & Wellness
## Women's Salons: Ladies Salons; Hair Salons for Women; Makeup Artists; Nail Salons; Eyelash Extensions; Eyebrow Threading; Moroccan Bath for Women; Home Salon Services
## Men's Barbershops & Grooming: Barbershops; Men's Grooming Lounges; Beard Grooming; Men's Moroccan Bath; Men's Spa; Kids Haircuts; Home Barber Services
## Spa & Massage: Spas; Massage Centres; Turkish Bath; Hotel Spas; Sauna & Steam; Foot Reflexology; Women's Spa
## Gyms & Fitness: Men's Gyms; Women's Gyms; Fitness Centres; CrossFit Boxes; Personal Trainers; Yoga Studios; Pilates Studios; Boxing & MMA Gyms
## Cosmetics & Personal Care: Cosmetic Shops; Skincare Products; Hair Care Products; Natural & Organic Cosmetics; Henna Shops; Beauty Supplies Wholesale; Salon Equipment; Korean Skincare Shops

# Education & Training
## Schools: International Schools; Private Schools; Public Schools; British Curriculum Schools; American Curriculum Schools; IB Schools; Indian Curriculum Schools; Pakistani Curriculum Schools; Filipino Schools; Girls Schools; Boys Schools; Special Needs Schools
## Kindergartens & Nurseries: Kindergartens; Nurseries & Day Care; Montessori Schools; Early Learning Centres; Kids Activity Centres; Hourly Childcare
## Universities & Colleges: Universities; Private Universities; Colleges; Medical Colleges; Engineering Colleges; Business Schools; Technical Colleges; Health Sciences Colleges
## Quran & Islamic Studies: Quran Memorisation Centres (Tahfeez); Women's Quran Centres; Online Quran Teachers; Tajweed Courses; Islamic Studies Institutes; Arabic for Non-Native Speakers; Quran Teachers at Home; Kids Quran Circles (Halaqat)
## Professional Training: Training Institutes; Corporate Training; Leadership Training; Project Management Training; HSE Safety Training; Accounting Certification Courses; HR Training; Soft Skills Training
## English & Language Centres: English Centres; IELTS Preparation; TOEFL Preparation; Spoken English Courses; Business English Courses; French Language Courses; Chinese Language Courses; Korean Language Courses
## Tutoring & Test Prep: Private Tutors; Home Tutors; Maths Tutors; Physics & Chemistry Tutors; Qudurat & Tahsili Preparation; SAT Preparation; STEP Test Preparation; Online Tutoring
## Technical & Vocational: Technical Training Centres; Computer Courses; Programming Courses; Graphic Design Courses; Digital Marketing Courses; Women's Driving Courses; Cooking Courses; Beauty & Makeup Courses

# IT & Digital
## Software Development: Software Companies; Mobile App Developers; Web Developers; ERP Solutions; CRM Solutions; Custom Software; Point of Sale (POS) Systems; HR & Payroll Software
## Cybersecurity & Infrastructure: Cybersecurity Companies; Penetration Testing; Network Installation; Data Centres; Cloud Services; Structured Cabling; IT Support & AMC; Server & Storage Solutions
## E-commerce: E-commerce Development; Online Store Setup; Marketplace Seller Services; Payment Gateway Integration; Fulfilment Centres; Product Photography; Dropshipping Services; Maroof & Online Store Registration
## Fintech & Digital Payments: Fintech Companies; Digital Wallets; Payment Solutions; POS Terminal Providers; Open Banking Solutions; Blockchain Solutions; Regtech Solutions; Payroll Cards
## Digital Marketing & Media: Digital Marketing Agencies; Social Media Marketing; SEO Services; Influencer Marketing Agencies; Content Creation; Video Production; Advertising Agencies; Public Relations Agencies
## Design & Printing: Graphic Designers; Branding Agencies; Printing Press; Digital Printing; Signboards & Signage; Large Format Printing; Corporate Gifts; Packaging Design

# Electronics & Telecom
## Mobile Phones: Mobile Phone Shops; Used Mobile Phones; Mobile Accessories; Mobile Repair; Screen Replacement; Mobile Wholesale; SIM Cards & Recharge; Tablet & iPad Repair
## Computers & Laptops: Computer Shops; Laptop Repair; Gaming PCs; Printers & Ink; Computer Accessories; Used Computers; Data Recovery; Printer Repair
## Home Appliances & Electronics: Electronics Stores; Home Appliances Shops; Air Conditioner Shops; Kitchen Appliances; TV & Home Theatre; Cameras & Photography Equipment; Water Filters; Used Furniture & Appliances (Haraj)
## Telecom & Internet: Internet Service Providers; Fibre Optic Installation; Telecom Dealers; Satellite Internet; Mobile Network Stores; Business Telephony (PBX); Two-Way Radios; Mobile Signal Boosters
## Office Equipment: Office Equipment Suppliers; Photocopier Sales & Rental; Office Stationery; Cash Counting Machines; Barcode & Label Printers; Time Attendance Systems; Paper Shredders; School Supplies

# Logistics & Freight
## Freight & Shipping: Freight Forwarders; Sea Freight; Air Freight; GCC Land Freight; Shipping Agents; Container Services; Project Cargo; Car Shipping
## Customs Clearance: Customs Brokers; Customs Clearance Agents; Import Licensing; SABER Product Certification; SFDA Registration Services; Port Services; Bonded Warehouses; Conformity Certificates
## Courier & Delivery: Courier Companies; Same-Day Delivery; Last-Mile Delivery; Document Delivery; International Courier; Cash on Delivery Services; Parcel Lockers; Delivery Drivers Supply
## Warehousing: Warehousing Companies; Cold Storage; Third-Party Logistics (3PL); Warehouse Racking; Inventory Management; Dry Storage; Temperature-Controlled Transport; Hazardous Goods Storage
## Trucking & Transport: Trucking Companies; Heavy Transport; Refrigerated Trucks; Flatbed Trailers; Fuel Transport; Car Carriers; Low-Bed Trailers; Truck Rental
## Packaging: Packaging Companies; Carton Box Suppliers; Plastic Packaging; Pallet Suppliers; Shrink Wrap & Stretch Film; Food Packaging; Industrial Packaging; Paper Bags

# Industry & Manufacturing
## Factories & Manufacturing: Factories; Food Factories; Furniture Factories; Paper Products Factories; Cosmetics Manufacturers; Pharmaceutical Manufacturers; Detergent Factories; Garment Factories
## Oil, Gas & Petrochemical Services: Oilfield Services; Petrochemical Services; Drilling Services; Pipeline Contractors; Inspection & NDT Services; Industrial Maintenance; Plant Shutdown Services; Corrosion Protection
## Steel & Metals: Steel Factories; Steel Structures Manufacturers; Aluminium Extrusion; Scrap Metal Dealers; Metal Fabrication Workshops; Sheet Metal Works; Galvanising; CNC Machining
## Plastics & Chemicals: Plastic Manufacturers; Plastic Raw Materials; Chemical Suppliers; Industrial Chemicals; Fibreglass Products; Paint Manufacturers; Rubber Products; Recycling Companies
## Industrial Supplies & Equipment: Industrial Equipment Suppliers; Safety Equipment (PPE); Valves & Pipes; Pumps & Compressors; Bearings & Power Transmission; Welding Supplies; Hydraulics & Pneumatics; Industrial Tools
## Building Products Manufacturing: Cement Factories; Block Factories; Precast Factories; Marble Factories; Glass Factories; Insulation Panel Manufacturers; Pipe Manufacturers; Cable Manufacturers
## Wholesale & Trading: Trading Companies; Import & Export Companies; General Trading; Wholesale Markets; Distributors; Commercial Agents; Electrical Wholesalers; Food Importers
## Environmental & Waste: Waste Management; Industrial Waste Disposal; Water Treatment Plants; Environmental Consultants; Sewage Treatment; Used Oil Recycling; Air Quality Testing; Medical Waste Disposal

# Agriculture, Livestock & Farms
## Camel & Livestock Markets: Camel Markets; Livestock Markets; Sheep & Goat Traders; Camel Traders; Cattle Traders; Animal Feed Stores; Livestock Transport; Hay & Fodder Suppliers
## Camels, Horses & Falcons: Camel Farms; Camel Breeders; Camel Racing; Horse Stables; Arabian Horse Breeders; Equestrian Supplies; Falcon Shops; Falconry Supplies
## Farms & Agriculture: Farms; Date Palm Farms; Greenhouses; Vegetable Farms; Organic Farms; Hydroponic Farms; Farm Management; Agricultural Consultants
## Agricultural Supplies: Seeds & Fertilisers; Irrigation Systems; Drip Irrigation; Agricultural Equipment; Tractors; Pesticides; Palm Tree Services; Well Drilling
## Poultry & Fisheries: Poultry Farms; Egg Suppliers; Fish Farms; Shrimp Farms; Hatcheries; Poultry Equipment; Beekeeping & Apiaries; Pigeon Breeders
## Nurseries & Gardens: Plant Nurseries; Garden Centres; Artificial Grass; Garden Maintenance; Tree Trimming; Palm Trees for Sale; Pots & Planters; Indoor Plants
## Veterinary: Veterinary Clinics; Veterinary Pharmacies; Camel Veterinary Clinics; Equine Veterinary; Livestock Vaccination; Mobile Vet Services; Veterinary Labs

# Religious & Charity
## Mosques & Islamic Centres: Mosques; Jami Mosques; Islamic Centres; Dawah Centres; Expat Guidance Centres (Jaliyat); Mosque Maintenance; Mosque Furnishing & Carpets; Women's Prayer Halls
## Charities & Non-Profits: Charities; Charitable Associations; Orphan Care; Food Banks; Zakat & Sadaqah Collection; Waqf (Endowment) Management; Volunteer Organisations; Clothing Donation
## Islamic Services: Ruqyah Shariah Centres; Marriage Officiants (Mazoon); Islamic Bookstores; Quran Printing & Distribution; Islamic Gifts; Funeral Services (Tajheez); Cemeteries; Fatwa & Islamic Guidance
## Community & Social Services: Family Counselling Centres; Marriage Counselling; Social Development Centres; Women's Associations; Youth Centres; Expat Community Associations; Elderly Care Centres; Rehabilitation Associations

# Government & Public Services
## Service Offices (Maktab Khidmat): Government Service Offices (Maktab Khidmat); Absher Services Offices; Typing & E-Services Offices; Online Application Services; Photocopy & Printing Shops; Passport Photo Studios; Traffic Violation Services; Visa Application Typing
## Ministries & Agencies: Government Ministries; Municipalities (Amanah); Sub-Municipalities (Baladiyah); Passports Department (Jawazat); Civil Affairs Offices; Traffic Department (Muroor); Labour Offices; Chambers of Commerce; Social Insurance Offices
## Courts & Justice: General Courts; Labour Courts; Commercial Courts; Personal Status Courts; Notary Offices (Kitabat Adl); Enforcement Courts; Administrative Courts (Board of Grievances); Public Prosecution Offices
## Security & Emergency: Police Stations; Civil Defence Centres; Red Crescent Stations; Fire Stations; Highway Security Centres; Security Patrols; Emergency Numbers & Hotlines; Lost & Found Offices
## Public Utilities: Electricity Company Offices; Water Company Offices; Sewage Services Offices; Gas Distribution Offices; Post Offices; National Address Services; Public Libraries; Public Transport Offices
## Embassies & Consulates: Embassies; Consulates; Visa Centres; Diplomatic Quarter Offices; International Organisations; Honorary Consulates; Embassy Labour Attaches

# Sports, Leisure & Pets
## Sports Clubs & Academies: Sports Clubs; Football Academies; Swimming Academies; Tennis Academies; Martial Arts Academies; Padel Courts; Football Pitch Rental; Women's Sports Academies; Golf Courses
## Desert & Outdoor: Desert Camping; Camping Equipment Rental; Desert Camps (Mukhayyam); Dune Bashing; ATV & Quad Bike Rental; Sandboarding; Hiking Groups; Camping Gear Shops
## Horse Riding & Equestrian: Horse Riding Schools; Equestrian Clubs; Horse Riding for Kids; Pony Rides; Endurance Riding Clubs; Horse Riding for Women
## Water Sports & Marine: Diving Centres; Boat Rental; Yacht Charter; Jet Ski Rental; Fishing Trips; Kayaking; Marinas; Boat Repair
## Entertainment & Attractions: Cinemas; Theme Parks; Water Parks; Family Entertainment Centres; Kids Play Areas; Gaming Centres; Escape Rooms; Bowling Centres; Karting Tracks; Trampoline Parks; Museums; Art Galleries; Zoos
## Pets: Pet Shops; Pet Clinics; Pet Grooming; Pet Boarding; Pet Food; Cat Shops; Bird Shops; Aquarium Shops; Dog Training
## Hobbies & Sports Shops: Sports Shops; Bicycle Shops; Fishing Equipment Shops; Toy Shops; Bookshops; Musical Instruments; Art Supplies; Hobby Shops
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
export function parseCategoryTree(tree = CATEGORY_TREE): CategoryRow[] {
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

