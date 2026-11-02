/**
 * IndiaYP category tree for the India business directory:
 * sector > group > category (3 levels).
 * Format: one sector per block; "# Sector" lines followed by "## Group: item; item; item" lines.
 * Parsed by parseCategoryTree() into rows with slug, level and parent.
 * Every sector, group and item of the earlier India tree is kept (same names, same order) so live slugs are unchanged.
 */
export const CATEGORY_TREE = `
# Financial, Tax & Legal Services
## Chartered Accountants & Tax: Chartered Accountants (CA); GST Registration & Filing; Income Tax Return Filing; TDS Consultants; Company Secretaries (CS); Cost Accountants; Bookkeeping & Accounting Services; Payroll Services; Audit Firms; Tax Consultants; GST Consultants; Virtual CFO Services; NRI Tax Consultants
## Banks & Financial Institutions: Public Sector Banks; Private Sector Banks; Co-operative Banks; Small Finance Banks; NBFCs; Microfinance Institutions; ATMs; Foreign Exchange Dealers; Regional Rural Banks; Payments Banks; Money Transfer Services; Co-operative Credit Societies
## Loans: Home Loans; Personal Loans; Business Loans; Car Loans; Gold Loans; Education Loans; Loan Against Property; Loan Agents (DSA); Two-Wheeler Loans; Mudra Loans; Working Capital Loans; Credit Card Agents
## Insurance: Life Insurance Agents; Health Insurance; Motor Insurance; General Insurance; Insurance Brokers; Crop Insurance; Term Insurance Advisors; Travel Insurance; Fire & Property Insurance
## Investments: Mutual Fund Distributors; Stock Brokers; Financial Planners; Portfolio Management Services; Wealth Management; Post Office Savings Agents; Commodity Brokers; SEBI Registered Investment Advisers; Chit Funds
## Legal Services: Advocates & Lawyers; Property Lawyers; Divorce & Family Lawyers; Criminal Lawyers; Corporate Lawyers; Notary Public; Legal Document Writers; Trademark & Patent Attorneys; Consumer Court Lawyers; Stamp Vendors
## Specialist Lawyers: Civil Lawyers; Labour Lawyers; Tax Lawyers; Cheque Bounce Lawyers; Immigration Lawyers
## Business Registration: Company Registration; LLP Registration; Udyam (MSME) Registration; Trademark Registration; FSSAI Licence Consultants; Import Export Code (IEC) Consultants; ISO Certification Consultants; One Person Company (OPC) Registration; Startup India Registration
## Licences & Compliance: Shop & Establishment Licence; Trade Licence Consultants; Drug Licence Consultants; NGO & Trust Registration; ROC Compliance Services
## Property Documentation: Property Registration Services; Sale Deed & Agreement Drafting; Rent Agreement Services; Land Record & Mutation Services; Will Drafting & Registration; Succession & Legal Heir Certificates
## Recovery & Insolvency: Debt Recovery Agencies; Loan Settlement Consultants; Insolvency Professionals

# Healthcare & Medical
## Hospitals: Multi-Speciality Hospitals; Government Hospitals; Nursing Homes; Children's Hospitals; Eye Hospitals; Maternity Hospitals; Cancer Hospitals; Cardiac Hospitals; Orthopaedic Hospitals; Kidney & Dialysis Centres; ESI Hospitals; Primary Health Centres (PHC); Charitable Hospitals
## Doctors & Clinics: General Physicians; Paediatricians; Gynaecologists; Orthopaedic Doctors; Cardiologists; Dermatologists; ENT Specialists; Neurologists; Psychiatrists; Diabetologists; Urologists; Physiotherapists; Ophthalmologists
## Super Specialists: Gastroenterologists; Pulmonologists; Nephrologists; Oncologists; General Surgeons; Plastic & Cosmetic Surgeons; Infertility Specialists; Sexologists; Piles & Fistula Clinics; Speech Therapists
## Dental Care: Dentists; Orthodontists; Dental Implant Clinics; Root Canal Specialists; Paediatric Dentists; Cosmetic Dentists; Braces & Aligners
## Diagnostics: Pathology Labs; Diagnostic Centres; MRI & CT Scan Centres; X-Ray Centres; Blood Banks; Health Check-up Packages; Ultrasound & Sonography Centres; ECG & Echo Centres; Home Sample Collection
## AYUSH & Traditional Medicine: Ayurvedic Doctors; Ayurvedic Hospitals; Homeopathy Clinics; Unani Clinics; Siddha Clinics; Naturopathy Centres; Panchakarma Centres; Kerala Ayurveda Treatment; Nadi Vaidyas; Yoga Therapy Centres; Acupuncture Clinics; Cupping (Hijama) Therapy
## Pharmacies & Medical Supplies: Chemists & Pharmacies; Jan Aushadhi Kendras; Surgical Equipment Dealers; Medical Equipment on Rent; Ayurvedic Medicine Stores; 24 Hour Chemists; Homeopathic Medicine Stores; Pharma Distributors
## Medical Equipment & Aids: Medical Equipment Dealers; Wheelchair Dealers; Oxygen Cylinder Suppliers; Oxygen Concentrators on Rent; Hearing Aid Centres
## Care Services: Home Nursing Services; Elder Care; Ambulance Services; Rehabilitation Centres; De-addiction Centres; IVF Centres; Doctor on Call; Physiotherapy at Home; Dialysis Centres; Palliative Care; Patient Attendants
## Mental Health & Counselling: Psychologists; Counsellors; Marriage Counsellors; Child Psychologists; Addiction Counsellors
## Mother & Child Care: Lactation Consultants; Antenatal Classes; Child Development Centres; Autism & ADHD Therapy Centres; Vaccination Centres
## Specialty & Cosmetic Clinics: Skin & Laser Clinics; Hair Fall Clinics; Cosmetic Surgery Clinics; Bariatric & Weight Loss Surgery; LASIK Eye Surgery; Varicose Vein Clinics

# Education & Coaching
## Schools: CBSE Schools; ICSE Schools; State Board Schools; International Schools (IB/IGCSE); Play Schools & Pre-schools; Boarding Schools; Kendriya Vidyalayas; Montessori Schools; Day Care Centres & Creches; Government Schools; Navodaya Vidyalayas; Sainik Schools; Special Schools; Madrasas; Gurukuls; Open Schooling (NIOS) Centres
## Coaching Classes: IIT-JEE Coaching; NEET Coaching; UPSC & IAS Coaching; SSC & Banking Exam Coaching; CA & CS Coaching; CAT & MBA Entrance Coaching; GATE Coaching; State PSC Coaching; Defence Exam Coaching; CLAT & Law Entrance Coaching; CUET Coaching; NEET PG Coaching; Foundation Coaching (Class 6-10)
## Government Job Coaching: Bank PO & Clerk Coaching; Railway Exam Coaching; Police Recruitment Coaching; Teaching Exam Coaching (CTET/TET); Judiciary Exam Coaching; NDA Coaching
## Tuition & Skills: Home Tutors; Tuition Classes; Spoken English Classes; Computer Training Institutes; Foreign Language Classes; Abacus & Vedic Maths; Handwriting Classes; Maths Tuition; Online Tuition; Personality Development Classes; Coding Classes for Kids; Robotics Classes
## Higher Education: Engineering Colleges; Medical Colleges; MBA Colleges; Arts & Science Colleges; Law Colleges; Polytechnic Colleges; Universities; Distance Education Centres; Pharmacy Colleges; Nursing Colleges; B.Ed Colleges; Hotel Management Colleges; Junior Colleges (11th-12th)
## Vocational & Hobby: ITI Institutes; Music Classes; Dance Classes; Drawing & Painting Classes; Yoga Teacher Training; Fashion Design Institutes; Driving Schools; Bharatanatyam Classes
## Professional Courses: Beautician Courses; Air Hostess & Aviation Training; Animation & VFX Institutes; Mobile Repairing Courses; Digital Marketing Courses; Photography Courses; Tailoring & Embroidery Classes; Mehendi Classes; Cooking Classes
## Study Abroad: Overseas Education Consultants; IELTS & TOEFL Coaching; Visa Consultants for Students; PTE Coaching; GRE & GMAT Coaching; MBBS Abroad Consultants
## Education Services: Career Counsellors; Admission Consultants; School Uniform Suppliers; School Book Sellers; School Van & Bus Services; Exam Form Filling Centres
## Libraries & Study Spaces: Self-Study Libraries; Reading Rooms; Student Hostels

# Real Estate & Construction
## Property: Real Estate Agents & Brokers; Builders & Developers; PG & Hostels; Co-living Spaces; Commercial Property Dealers; Property Valuers; Plot & Land Dealers; Property Management Services; NRI Property Services
## Rentals & PG: Boys PG; Girls PG; Working Women Hostels; Flats for Rent; Houses for Rent; Shops for Rent; Office Space for Rent; Godowns for Rent
## Construction: Civil Contractors; Architects; Structural Engineers; Interior Designers; Modular Kitchen Dealers; Waterproofing Contractors; Vastu Consultants; False Ceiling Contractors
## Specialist Contractors: Turnkey Construction Contractors; Labour Contractors; Renovation Contractors; Demolition Contractors; Borewell Drilling
## Surveys & Approvals: Building Plan Approval Consultants; Land Surveyors; Soil Testing Labs; Structural Audit Services; Completion & Occupancy Certificate Consultants
## Building Materials: Cement Dealers; TMT Steel Bar Dealers; Tiles & Marble Dealers; Sanitaryware Dealers; Paint Dealers; Plywood & Laminates; Hardware Stores; Bricks & Sand Suppliers; Granite Dealers; Kota Stone Dealers; AAC Blocks Dealers; Ready Mix Concrete; Timber Merchants; Roofing Sheet Dealers; Construction Chemicals
## Fittings & Fixtures: Electrical Goods Dealers; Pipes & Fittings; Glass & Aluminium Works; Grills & Fabrication; Doors & Windows; Solar Panel Dealers; uPVC Windows; Aluminium Sliding Windows; Wooden Doors; Rolling Shutters; Bathroom Fittings; Lights & Fans Dealers; Wires & Cables Dealers; Switches & Switchgear; Lifts & Elevators
## Interior Work: Wardrobe Makers; Wallpaper Dealers; Wooden Flooring; Vinyl Flooring; POP Contractors; Curtains & Blinds; Glass Partition Contractors; Office Interior Designers
## Construction Equipment: Excavator & Backhoe Hire; Crane Services; Scaffolding on Rent; Shuttering Material Suppliers; Construction Equipment Dealers

# Home Services & Repairs
## Repairs: Electricians; Plumbers; Carpenters; AC Repair & Service; Refrigerator Repair; Washing Machine Repair; RO Water Purifier Service; Inverter & Battery Dealers; Geyser Repair; Mobile Phone Repair; Laptop & Computer Repair; TV Repair; Locksmiths & Key Makers; Furniture Repair & Polish; Shoe Repair (Mochi)
## Appliance Repair: Microwave Repair; Kitchen Chimney Service; Gas Stove Repair; Air Cooler Repair; Water Cooler Repair; Printer Repair; Sewing Machine Repair
## Mobile & Electronics Repair: Mobile Screen Replacement; Mobile Battery Replacement; Mobile Water Damage Repair; Mobile Software & Unlocking; Tablet Repair; Speaker & Home Theatre Repair; Data Recovery Services
## Cleaning & Maintenance: Pest Control; Home Deep Cleaning; Sofa & Carpet Cleaning; Water Tank Cleaning; Housekeeping Services; Laundry & Dry Cleaners; Office Cleaning; Septic Tank Cleaning; Drainage & Sewer Cleaning
## Pest Management: Termite Control; Mosquito Control; Disinfection & Sanitisation; Cockroach Control; Snake Catchers
## Relocation: Packers & Movers; Car Transport Services; Bike Transport Services; Storage & Warehousing; Local House Shifting; Office Relocation; International Relocation; Mini Truck for Shifting; Pet Relocation
## Domestic Help: Maid Services; Cooks & Chefs; Babysitters & Nannies; Security Guards; Drivers on Hire; Full-Time Maids; Part-Time Maids; Japa Maids (Newborn Care); Watchmen; Domestic Help Agencies
## Home Improvement: Painters; Modular Furniture; CCTV Installation; Home Automation; Water Proofing; Gardeners & Landscaping; Wall Texture Painting; Wood Polishing; Mosquito Nets & Window Screens; Invisible Grills; Balcony Safety Nets; Water Softeners; Rainwater Harvesting
## Installation Services: AC Installation; TV Wall Mounting; Geyser Installation; Water Purifier Installation
## Home Security & Safety: Burglar Alarms; Video Door Phones; Smart Door Locks; Fire Alarm Systems; Fire Extinguisher Refilling

# Food, Restaurants & Catering
## Restaurants: North Indian Restaurants; South Indian Restaurants; Pure Vegetarian Restaurants; Biryani Restaurants; Chinese & Indo-Chinese; Multi-Cuisine Restaurants; Fine Dining; Dhabas; Fast Food; Cafes; Bakeries & Cake Shops; Family Restaurants; Thali Restaurants; Seafood Restaurants; Mughlai Restaurants; Kebab & Tandoori Restaurants; Jain Food Restaurants; Pizza Outlets; Burger Joints
## Regional Cuisine: Gujarati Restaurants; Rajasthani Restaurants; Punjabi Restaurants; Bengali Restaurants; Hyderabadi Restaurants; Chettinad Restaurants; Kerala Restaurants; Udupi Restaurants; Maharashtrian Restaurants; Awadhi (Lucknowi) Restaurants
## Street Food & Quick Bites: Tea Stalls (Chai); Momos Stalls; Pav Bhaji & Vada Pav; Dosa & Idli Centres; Paratha Centres; Samosa & Kachori Shops; Kathi Rolls; Pani Puri Stalls; Lassi Shops; Food Courts
## Sweets & Snacks: Sweet Shops (Mithai); Namkeen & Farsan Shops; Dairy & Milk Booths; Ice Cream Parlours; Juice Centres; Chaat Corners; Halwai Shops; Bengali Sweet Shops; Kulfi & Falooda Shops; Chikki & Gajak Shops; Dry Fruit Shops; Pickle & Papad Shops; Paan Shops; Sugarcane Juice Stalls
## Catering & Tiffin: Caterers; Wedding Caterers; Tiffin Services; Corporate Catering; Cloud Kitchens; Home Bakers; Veg Caterers; Non-Veg Caterers; Jain Caterers
## Mess & Meal Services: Mess Services; Dabbawalas; Home Cooked Food Delivery; Industrial Canteen Contractors
## Food Business: Food Wholesalers; Spice Merchants; Rice & Grain Traders; Edible Oil Dealers; Dry Fruit Wholesalers; Tea & Coffee Suppliers; Flour Mills (Atta Chakki); Pulses & Dal Wholesalers; Sugar & Jaggery Traders; Ghee Suppliers; Packaged Drinking Water Suppliers; Hotel & Restaurant Suppliers; Commercial Kitchen Equipment
## Bars, Beverages & Liquor: Wine & Liquor Shops; Beer Shops; Soft Drink Distributors; Tender Coconut Vendors; Lounges & Bars; Pubs & Microbreweries

# Weddings & Events
## Wedding Services: Wedding Planners; Banquet Halls; Marriage Gardens & Lawns; Wedding Photographers; Mehendi Artists; Bridal Makeup Artists; Wedding Decorators; Wedding Card Printers; Matrimonial Bureaus; Mandap Decorators; Kalyana Mandapams; Destination Wedding Planners; Flower Decorators
## Wedding Processions & Music: Dhol Players; Ghodi & Baggi on Hire; Wedding Car Rentals; Fireworks & Aatishbazi; Wedding Choreographers
## Wedding Photography & Video: Pre-Wedding Shoots; Wedding Videographers; Drone Videography; Wedding Albums & Photo Books
## Event Services: Event Management Companies; Tent House; DJ & Sound Systems; Light Decorators; Event Caterers; Band & Baaja; Party Halls; Anchors & Emcees; Birthday Party Organisers; Balloon Decorators; Corporate Event Planners; Live Bands; Orchestra Groups; Kids Party Entertainers
## Party & Event Rentals: Stage & Truss Rental; LED Screen Rental; Furniture & Crockery on Rent; Photo Booth Rental
## Religious & Rituals: Pandits & Priests; Puja Samagri Stores; Astrologers; Vastu & Numerology; Temples; Gurudwaras; Mosques; Churches; Griha Pravesh Puja; Satyanarayan Puja; Havan & Yagya Services; Kirtan & Bhajan Mandalis; Qazi Services
## Astrology & Occult: Kundli Matching; Vedic Astrologers; Nadi Astrology; Palmists; Tarot Card Readers; Numerologists; Gemstone Sellers; Rudraksha Sellers; Feng Shui Consultants
## Wedding Shopping: Bridal Wear; Sherwani Shops; Wedding Jewellery; Wedding Gifts & Return Gifts; Lehenga Stores; Wedding Saree Shops; Safa & Turban Shops; Bridal Footwear; Bangles & Chooda; Bridal Wear on Rent

# Shopping & Retail
## Daily Needs: Kirana & General Stores; Supermarkets; Fruits & Vegetable Vendors; Departmental Stores; Organic Food Stores; Meat & Fish Shops; Provision Stores; Ration Shops (Fair Price Shops); Chicken Shops; Mutton Shops; Fish Markets; Egg Shops
## Fashion & Textiles: Saree Shops; Ethnic Wear; Readymade Garments; Tailors; Boutiques; Footwear Shops; Fabric & Textile Shops; Kids Wear; Men's Wear; Women's Wear; Innerwear & Lingerie
## Jewellery & Accessories: Jewellers; Gold & Silver Dealers; Imitation Jewellery; Watch Shops; Opticians; Diamond Jewellers; Silver Jewellery Shops; Kundan & Polki Jewellers; Goldsmiths (Sunar); Gold Buyers; Handbags & Purses; Sunglasses Shops
## Electronics & Appliances: Mobile Phone Shops; Electronics Showrooms; Home Appliance Dealers; Computer & Laptop Dealers; Camera Shops; Mobile Accessories; Second-Hand Mobile Shops; Television Dealers; AC Dealers; Water Purifier Dealers; Kitchen Appliances
## Home & Lifestyle: Furniture Shops; Home Furnishing; Kitchenware & Utensils; Gift Shops; Stationery Shops; Book Stores; Toy Shops; Sports Goods Shops
## Decor & Housewares: Mattress Stores; Lighting Shops; Crockery Shops; Plastic Goods Stores; Home Decor Stores; Steel Almirah Dealers
## Craft & Speciality Stores: Handicraft Stores; Khadi & Handloom Stores; Perfume & Attar Shops; Musical Instrument Shops; Luggage & Bags
## Gifts & Flowers: Florists; Bouquet & Flower Delivery; Gift Hampers; Personalised Gifts; Rakhi Shops; Firecracker Shops
## Markets & Malls: Shopping Malls; Wholesale Markets; Factory Outlets; Weekly Markets (Haat)

# Automobile
## Vehicle Dealers: Car Dealers; Two-Wheeler Dealers; Electric Vehicle Dealers; Used Car Dealers; Commercial Vehicle Dealers; Tractor Dealers; E-Rickshaw Dealers; Luxury Car Dealers; Used Two-Wheeler Dealers; Electric Scooter Dealers; Auto Rickshaw Dealers
## Service & Repair: Car Service Centres; Two-Wheeler Service Centres; Car Wash & Detailing; Tyre Shops & Wheel Alignment; Car Accessories; Denting & Painting; Battery Dealers; Car Mechanics; Two-Wheeler Mechanics; Puncture Repair Shops; Car AC Repair; Car Electricians; Car Glass Replacement; Ceramic Coating & PPF; Car Seat Covers; Truck Repair Workshops; Car Towing Services; Roadside Assistance
## CNG & EV Services: EV Repair Centres; CNG Kit Fitting; LPG Kit Fitting
## Auto Parts & Accessories: Car Spare Parts Dealers; Bike Spare Parts Dealers; Truck Spare Parts; Used Auto Parts; Engine Oil & Lubricant Dealers; Auto Electrical Parts; Helmet Shops; Bike Accessories
## Transport Services: Taxi & Cab Services; Car Rentals; Self-Drive Car Rentals; Bus Operators; Truck & Tempo Services; Auto Rickshaw Stands; Outstation Cabs; Airport Taxi Services; Tempo Traveller on Rent; Mini Bus on Rent; Luxury Car Rentals; Bike & Scooter Rentals; Bike Taxi Services
## Documentation: RTO Agents; Driving Licence Consultants; Vehicle Insurance Agents; PUC Centres; Fastag Dealers; RC Transfer Services; Vehicle NOC Services; High Security Number Plates (HSRP); Vehicle Fitness Certificate Centres; Traffic Challan Consultants

# Travel & Hospitality
## Stay: Hotels; Budget Hotels; Resorts; Homestays; Dharamshalas; Guest Houses; Service Apartments; Luxury Hotels; Boutique Hotels; Heritage Hotels & Havelis; Lodges; Backpacker Hostels; Farm Stays; Houseboats; Camping & Glamping Sites; Beach Resorts
## Travel Services: Travel Agents; Tour Operators; Pilgrimage Tour Operators; Air Ticketing Agents; Railway Ticket Booking Agents; Passport Agents; Visa Consultants; Bus Ticket Booking Agents; Hotel Booking Agents; Tourist Guides; Corporate Travel Management
## Tours & Holidays: Holiday Packages; Honeymoon Packages; Domestic Tour Packages; International Tour Packages; Group Tour Operators; Adventure Tour Operators; Trekking Organisers; Wildlife Safari Bookings; School & College Tours
## Pilgrim Tours: Char Dham Yatra Packages; Amarnath Yatra Packages; Vaishno Devi Yatra Packages; Kailash Mansarovar Yatra; Jyotirlinga Tours; Tirupati Darshan Packages; Kashi & Gaya Tours; Sabarimala Yatra; Hajj & Umrah Tour Operators; Buddhist Circuit Tours; Jain Teerth Yatra; Sikh Pilgrimage Tours; Kumbh Mela Camps
## Immigration & Overseas Jobs: Immigration Consultants; Work Visa Consultants; PR Visa Consultants; Overseas Job Placement Agencies; Emigration Clearance Agents; Document Attestation & Apostille; Police Clearance Certificate Services
## Logistics: Courier Services; Transporters; Freight Forwarders; Cargo Agents; Customs House Agents (CHA)

# Beauty, Wellness & Fitness
## Beauty: Beauty Parlours; Unisex Salons; Men's Salons; Spas; Bridal Makeup Studios; Nail Art Studios; Tattoo Studios; Piercing Studios
## Hair Care: Barber Shops; Hair Stylists; Hair Spa; Hair Straightening & Keratin; Hair Wigs & Patches
## Salon Services: Threading & Waxing; Facial & Clean-up; Manicure & Pedicure; Eyelash Extensions; Microblading & Permanent Makeup; Party Makeup Artists; Saree Draping Artists; Salon at Home
## Beauty Products & Supplies: Cosmetics Shops; Beauty Product Wholesalers; Salon Equipment Dealers; Herbal Products Stores
## Fitness: Gyms; Yoga Classes; Zumba & Aerobics; Martial Arts Classes; Swimming Pools; Sports Academies; Cricket Academies; Personal Trainers; Ladies Gyms; Functional Training Studios; Pilates Studios; Dance Fitness Studios; Kalaripayattu Training; Akhadas & Wrestling (Kushti); Fitness Equipment Dealers
## Wellness: Dieticians & Nutritionists; Ayurvedic Spa & Massage; Hair Transplant Clinics; Slimming Centres; Meditation Centres; Body Massage Centres; Foot Reflexology; Reiki Healers; Pranic Healing; Life Coaches; Wellness Retreats

# IT, Digital & Telecom
## IT Services: Software Companies; Website Designers; Mobile App Developers; IT Consultants; Cyber Security Firms; Cloud Service Providers; Data Entry Services; Custom Software Development; E-commerce Website Development; Web Hosting Providers; IT Support & AMC; AI & Machine Learning Companies; UI/UX Designers; BPO & Call Centres
## Business Software: ERP Software; CRM Software; Billing & GST Software; POS Software; School Management Software
## Computer Hardware: Computer Hardware Suppliers; Networking Equipment Dealers; Laptop on Rent; Cartridge Refilling; Biometric Attendance Machines; POS & Billing Machines
## Digital Marketing: Digital Marketing Agencies; SEO Services; Social Media Marketing; Graphic Designers; Video Production Houses; PPC Advertising; Content Writers; Influencer Marketing; Bulk SMS Services; Online Reputation Management; Branding Agencies; Logo Designers; E-commerce Listing Services
## Telecom & Internet: Broadband Providers; Mobile Network Stores; DTH Service Providers; Internet Cafes & Cyber Cafes; Leased Line Providers; WiFi Installation; SIM Card Dealers; Mobile Recharge Shops; Cable TV Operators; Intercom & EPABX Dealers
## Printing & Media: Printing Presses; Flex & Banner Printing; Advertising Agencies; Newspaper Agencies; Photo Studios; Book Publishers
## Commercial Printing: Offset Printers; Digital Printing; Visiting Card Printing; T-Shirt Printing; Screen Printing; Label & Sticker Printing; Rubber Stamp Makers; Photocopy Shops
## Signage & Outdoor Media: Sign Boards & Name Plates; LED Sign Boards; Hoarding & Outdoor Advertising

# Industrial & Manufacturing
## Manufacturers: Textile Manufacturers; Garment Exporters; Pharmaceutical Manufacturers; Chemical Manufacturers; Plastic Products; Packaging Material; Steel & Metal Fabricators; Food Processing Units; Handicraft Manufacturers; Paper & Board Mills; Rubber Products; PVC Pipe Manufacturers
## Consumer Goods Manufacturing: Furniture Manufacturers; Electronics Manufacturers; Cosmetics Manufacturers; Ayurvedic Product Manufacturers; Agarbatti Manufacturers; Soap & Detergent Manufacturers
## Textile & Leather Clusters: Spinning Mills; Power Loom Units; Handloom Weavers; Hosiery Manufacturers; Knitwear Manufacturers; Dyeing & Printing Units; Cotton Ginning Mills; Carpet & Rug Manufacturers; Leather Goods Manufacturers; Footwear Manufacturers
## Engineering & Metal Works: Castings & Foundries; Forging Units; CNC Machining; Sheet Metal Work; Fastener Manufacturers; Auto Parts Manufacturers; Brassware Manufacturers; Stainless Steel Utensil Manufacturers; Wire & Cable Manufacturers; Powder Coating
## Agro & Food Processing: Rice Mills; Oil Mills; Sugar Mills; Roller Flour Mills; Spice Grinding Units; Cashew Processing Units; Jaggery (Gur) Units; Pickle Manufacturers; Namkeen & Snack Manufacturers
## Industrial Supplies: Machinery Dealers; Industrial Tools; Electrical Motors & Pumps; Generators & DG Sets; Welding Equipment; Safety Equipment; Industrial Chemicals; Bearings Dealers; Valves & Industrial Fittings; Hydraulic & Pneumatic Equipment; Industrial Gas Suppliers; Fire Fighting Equipment; Control Panels
## Plant Machinery & Handling: Air Compressors; Material Handling Equipment; Forklift on Rent; Cranes & Hoists; Weighing Scales; Packaging Machines
## Industrial Services: Contract Manufacturing; Job Work Units; Industrial Automation; Machine Repair & Maintenance; Plant Erection & Commissioning; Testing & Calibration Labs; Pollution Control Consultants; Effluent Treatment Plants; Factory Licence Consultants
## Trade: Importers; Exporters; Wholesalers & Distributors; Commission Agents; Scrap Dealers; Trading Companies; Merchant Exporters; C&F Agents
## Recycling & Scrap: E-waste Recyclers; Plastic Recyclers; Kabadiwala (Raddi Buyers); Metal Scrap Buyers
## Agriculture: Seeds & Fertiliser Dealers; Pesticide Dealers; Agricultural Equipment; Dairy Farms; Poultry Farms; Nurseries & Plant Sellers; Cold Storage; Cattle Feed Suppliers

# Government & Public Services
## Citizen Services: Aadhaar Enrolment Centres; Passport Seva Kendras; Common Service Centres (CSC); PAN Card Centres; Post Offices; Ration Card Offices; E-Mitra & Jan Seva Kendras; Aadhaar Update Centres; Voter ID Centres; Birth & Death Registration; Caste & Income Certificate Services; Domicile Certificate Services; Marriage Registration Offices; Ayushman Card Centres
## Government Offices: Municipal Corporations; Regional Transport Offices (RTO); Tehsil Offices; Police Stations; Electricity Board Offices; Water Supply Offices; Courts; Panchayat Offices; Consumer Forums; Regional Passport Offices
## Revenue & Tax Offices: District Collector Offices; Sub-Registrar Offices; Income Tax Offices; GST Offices
## Labour & Employment Offices: EPFO Offices; ESIC Offices; Employment Exchanges; Labour Offices
## Emergency & Safety: Fire Stations; Traffic Police; Cyber Crime Cells; Disaster Management Offices; Emergency Helplines
## Transport Hubs: Railway Stations; Bus Stands & Depots; Airports; Metro Stations
## Public Utilities: Gas Agencies (LPG); Petrol Pumps; CNG Stations; EV Charging Stations; Public Toilets & Facilities; Water Tanker Services; Electricity Bill Payment Centres; Garbage Collection Services
## Diplomatic Missions: Embassies; Consulates; Visa Application Centres; FRRO Offices

# Business & Professional Services
## Consulting: Management Consultants; HR Consultants; Placement Agencies; Manpower Suppliers; Business Setup Consultants; Franchise Consultants; Startup Consultants; Export Consultants
## Compliance Consulting: Project Report Consultants; Government Subsidy Consultants; Tender & GeM Consultants; PF & ESI Consultants; Labour Law Compliance
## HR & Staffing: Executive Search Firms; Temporary Staffing Agencies; IT Staffing Companies; Corporate Trainers; Training & Development Companies
## Office Services: Co-working Spaces; Virtual Office Providers; Office Furniture; Office Stationery Suppliers; Courier Pickup Points; Translation Services; Meeting Rooms on Rent; Business Centres; Typing & DTP Services; Document Scanning & Digitisation
## Real Estate Services: Facility Management; Security Services; Housekeeping Contractors; Interior Fit-out Contractors; Building Maintenance; Lift AMC Services; Fire Safety Audits; Society Management Services
## Marketing Services: Market Research; Exhibition Stall Designers; Corporate Gifting; Promotional Products; Brand Consultants; BTL Activation Agencies; Leaflet & Pamphlet Distribution; Telemarketing Services; Trade Show Organisers
## Professional Specialists: Private Detectives; Background Verification Agencies; Interpreters; Surveyors & Loss Assessors; Safety Consultants

# Pets & Animals
## Pet Care: Veterinary Doctors; Pet Clinics; Pet Shops; Pet Grooming; Pet Boarding; Dog Trainers; Pet Food Stores; Pet Accessories; Pet Pharmacies; Pet Vaccination; Mobile Pet Grooming; Pet Sitters; Dog Walkers; Dog Breeders; Cat Breeders; Aquarium & Fish Shops; Bird Shops; Pet Cremation
## Livestock: Veterinary Hospitals; Cattle Dealers; Animal Feed Suppliers; Gaushalas; Artificial Insemination Centres
## Animal Welfare: Animal Shelters; Animal Rescue Organisations; Animal Ambulances; Pet Adoption Centres

# Community & Non-Profit
## Organisations: NGOs & Charitable Trusts; Old Age Homes; Orphanages; Community Halls; Clubs & Associations; Libraries; Residents Welfare Associations (RWA); Trade Associations; Youth Clubs; Senior Citizen Clubs; Women Welfare Organisations; Self-Help Groups
## Social Welfare: Shelter Homes; Night Shelters; Disability Support Organisations; Free Food Services (Langar & Annadanam); Blood Donation Camps
## Religious Places: Temples; Gurudwaras; Mosques; Churches; Jain Temples; Buddhist Monasteries; Dargahs; Ashrams; Mathas & Peethams; Synagogues; Fire Temples (Agiaries); Satsang Bhawans; Spiritual Centres
## Funeral & Last Rites: Funeral Services; Cremation Grounds (Shamshan Ghat); Electric Crematoriums; Burial Grounds (Kabristan); Hearse Van Services; Mortuary Freezer Box on Rent; Antim Sanskar Samagri; Asthi Visarjan Services; Shraddh & Pind Daan Services

# Energy & Utilities
## Solar Energy: Solar Panel Installers; Rooftop Solar Systems; Solar EPC Contractors; Solar Inverter Dealers; Solar Battery Dealers; Solar Water Heaters; Solar Water Pumps; Solar Street Lights; Net Metering Consultants; Solar Panel Cleaning
## Power Backup: UPS Dealers; UPS Repair; Inverter Repair; Lithium Battery Dealers; Voltage Stabiliser Dealers; DG Set on Rent; Generator Repair & Service
## Electrical Works: Electrical Contractors; HT & LT Electrical Contractors; Industrial Wiring; Transformer Repair; Earthing & Lightning Protection; New Electricity Connection Consultants
## Water & Sanitation: Water Treatment Plants; Commercial RO Plants; Water Testing Labs; Submersible Pump Dealers; Motor & Pump Repair; Water Tank Dealers; Sewage Treatment Plant Contractors; Swimming Pool Contractors
## Fuel & Gas: Commercial LPG Suppliers; PNG Gas Connections; Diesel Door Delivery; Biogas Plant Installers; Coal & Firewood Depots
## EV & Green Energy: EV Charger Installers; Battery Swapping Stations; Green Building Consultants

# Agriculture & Allied
## Farm Inputs: Hybrid Seed Dealers; Vegetable Seed Dealers; Organic Fertiliser Dealers; Bio-Fertilisers; Vermicompost Suppliers; Krishi Seva Kendras; Drip Irrigation Dealers; Sprinkler Systems; Polyhouse & Greenhouse Builders; Agricultural Soil Testing Centres
## Farm Machinery: Tractor on Rent; Harvester on Rent; Custom Hiring Centres; Tractor Implements; Rotavator Dealers; Power Tiller Dealers; Thresher Dealers; Chaff Cutter Dealers; Sprayer Dealers; Drone Spraying Services
## Mandis & Crop Trade: APMC Mandis; Grain Commission Agents (Arhtiyas); Fruit & Vegetable Mandis; Onion & Potato Traders; Cotton Traders; Agri Exporters; Organic Farm Produce; Farmer Producer Organisations (FPO)
## Dairy: Dairies; Milk Collection Centres; Milk Delivery Services; Bulk Milk Chillers; Dairy Processing Plants; Dairy Equipment Suppliers; Paneer Suppliers; Khoya & Mawa Suppliers
## Livestock & Poultry: Goat Farms; Sheep Farms; Broiler Farms; Layer Farms; Hatcheries; Poultry Feed Dealers; Poultry Equipment; Fish Farms; Fish Seed Suppliers; Prawn Farms; Bee Keeping & Honey Farms
## Horticulture & Plantations: Fruit Orchards; Tea Gardens; Coffee Estates; Spice Plantations; Coconut Traders; Floriculture Farms; Mushroom Farms; Sericulture (Silk Farming)
## Agri Services: Agricultural Consultants; Krishi Vigyan Kendras; Ripening Chambers; Agri Warehouses; Farm Labour Contractors

# Logistics, Cargo & Warehousing
## Road Transport: Full Truck Load (FTL) Services; Part Truck Load (PTL) Services; Goods Transport Agencies; Interstate Transport Services; Container Trucks; Trailer Services; Refrigerated Trucks; Water & Oil Tankers; Mini Truck & Pickup on Rent; Over Dimensional Cargo (ODC) Transport
## Courier & Delivery: International Courier; Same Day Delivery; Parcel Services; E-commerce Logistics; Last Mile Delivery; Hyperlocal Delivery; Bike Delivery Services
## Warehousing & Cold Chain: Warehouses & Godowns; Bonded Warehouses; Cold Chain Logistics; Third Party Logistics (3PL); Fulfilment Centres; Racking & Shelving Systems
## Shipping & Freight: Shipping Agents; Sea Freight; Air Freight; Rail Freight; Container Freight Stations; Inland Container Depots; NVOCC Operators; Export Packing Services
## Packaging & Handling: Corrugated Box Makers; Wooden Box & Crate Makers; Gunny Bag Suppliers; HDPE & PP Bag Manufacturers; Loading & Unloading Labour (Hamals)

# Sports, Leisure & Entertainment
## Sports Academies & Clubs: Football Academies; Badminton Academies; Tennis Academies; Basketball Coaching; Hockey Coaching; Kabaddi Clubs; Shooting Ranges; Skating Classes; Swimming Classes; Horse Riding Clubs; Golf Courses; Boxing Clubs
## Grounds & Venues: Box Cricket; Turf Grounds; Badminton Courts; Pickleball Courts; Indoor Sports Complexes; Sports Ground Booking; Stadiums
## Entertainment: Cinemas & Multiplexes; Theatres & Auditoriums; Gaming Zones; VR Gaming Centres; Bowling Alleys; Snooker & Pool Parlours; Escape Rooms; Trampoline Parks; Go-Karting Tracks; Kids Play Areas
## Parks & Adventure: Amusement Parks; Water Parks; Public Parks & Gardens; Zoos; Botanical Gardens; Picnic Spots; Adventure Parks; Boating; Paragliding; River Rafting; Scuba Diving Centres
## Arts & Culture: Art Galleries; Museums; Cultural Centres; Science Centres; Heritage Walk Organisers; Pottery Studios; Theatre Groups
## Hobby & Sports Shops: Cricket Equipment Shops; Bicycle Shops; Trekking & Camping Gear; Kite Shops; Hobby & Craft Stores; Trophies & Medals

# Fashion, Apparel & Tailoring
## Ethnic & Traditional Wear: Kurta & Kurti Shops; Salwar Suit Shops; Men's Kurta Pyjama; Indo-Western Wear; Dhoti & Lungi Shops; Dupatta & Stole Shops; Shawls & Pashmina; Chikankari Wear; Bandhani & Leheriya; Phulkari Shops; Silk Saree Shops; Banarasi Sarees; Kanjeevaram Sarees; Paithani Sarees; Handloom Sarees
## Tailoring & Alterations: Ladies Tailors; Gents Tailors; Blouse Stitching; Suit & Blazer Tailors; Uniform Tailors; Alteration Services; Embroidery & Zari Work; Fall & Pico Services
## Fabric & Garment Trade: Suiting & Shirting Dealers; Cotton Fabric Wholesalers; Silk Fabric Dealers; Saree Wholesalers; Kurti Wholesalers; Garment Wholesalers; Hosiery Wholesalers; Lace & Trims Suppliers; Buttons & Zippers
## Western & Casual Wear: Jeans Shops; T-Shirt Shops; Formal Wear; Party Wear Gowns; Activewear & Sportswear; Winter Wear; Maternity Wear; Corporate Uniform Suppliers; Second-Hand Clothing
## Footwear & Accessories: Kolhapuri Chappals; Mojari & Juttis; Sports Shoes; Leather Footwear; Shoe Wholesalers; Caps & Hats
## Fashion Services: Fashion Designers; Fashion Stylists; Modelling Agencies; Saree Polishing & Rolling; Ironing (Istri) Services
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
