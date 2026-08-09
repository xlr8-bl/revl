// HND catalogue — 15 verified specialties from the national HND program,
// final-exam oriented: shared general papers every candidate writes + real
// professional papers per specialty. Only courses verified against public
// references are included. Filler/template courses have been removed.
//
// VERIFIED DEPARTMENTS ONLY:
// Business: Accountancy, Banking & Finance, HRM, Logistics, Marketing
// Engineering: Civil Engineering, Electrical Power Systems
// ICT: Software Engineering, Computer Science, Network & Security
// Health: Nursing, Midwifery, Medical Laboratory
// Hospitality: Hotel Management and Catering
// Education: Journalism
//
// Specialty list source: temovision.com / cameroonhnd.com (2026)
// Course data source: HND specialty syllabus (public references)
import type { CatalogCourse, Department, Faculty } from './types';

export const hndFaculties: Faculty[] = [
  { id: 'business-and-management', schoolId: 'hnd', name: "Business and Management" },
  { id: 'engineering-and-technolo', schoolId: 'hnd', name: "Engineering and Technology" },
  { id: 'information-and-communic', schoolId: 'hnd', name: "Information and Communication Technology" },
  { id: 'health-sciences', schoolId: 'hnd', name: "Health Sciences" },
  { id: 'hospitality-tourism-and-', schoolId: 'hnd', name: "Hospitality, Tourism and Fashion" },
  { id: 'education-media-and-law', schoolId: 'hnd', name: "Education, Media and Law" },
];

export const hndDepartments: Department[] = [
  { id: 'accountancy', facultyId: 'business-and-management', name: "Accountancy" },
  { id: 'banking-and-finance', facultyId: 'business-and-management', name: "Banking and Finance" },
  { id: 'human-resource-management', facultyId: 'business-and-management', name: "Human Resource Management" },
  { id: 'logistics-and-transport-manageme', facultyId: 'business-and-management', name: "Logistics and Transport Management" },
  { id: 'marketing-trade-sale', facultyId: 'business-and-management', name: "Marketing-Trade-Sale" },
  { id: 'civil-engineering-technology', facultyId: 'engineering-and-technolo', name: "Civil Engineering Technology" },
  { id: 'electrical-power-systems', facultyId: 'engineering-and-technolo', name: "Electrical Power Systems" },
  { id: 'software-engineering', facultyId: 'information-and-communic', name: "Software Engineering" },
  { id: 'computer-science-and-networks', facultyId: 'information-and-communic', name: "Computer Science and Networks" },
  { id: 'network-and-security', facultyId: 'information-and-communic', name: "Network and Security" },
  { id: 'nursing', facultyId: 'health-sciences', name: "Nursing" },
  { id: 'midwifery', facultyId: 'health-sciences', name: "Midwifery" },
  { id: 'medical-laboratory-sciences', facultyId: 'health-sciences', name: "Medical Laboratory Sciences" },
  { id: 'hotel-management-and-catering', facultyId: 'hospitality-tourism-and-', name: "Hotel Management and Catering" },
  { id: 'journalism', facultyId: 'education-media-and-law', name: "Journalism" },
];

/** General papers written by EVERY HND candidate at the final exam. */
export const hndGeneralCourses: CatalogCourse[] = [
  { code: 'HND-ENG', title: "Use of English", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
  { code: 'HND-FRE', title: "Functional French", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
  { code: 'HND-CIV', title: "Civics and Ethics", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
  { code: 'HND-LAW', title: "General Law", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
  { code: 'HND-ENT', title: "Entrepreneurship", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
  { code: 'HND-MGT', title: "Introduction to Management", level: 'HND', departmentId: 'general', general: true, required: true, verified: true, source: 'HND national program structure (MINESUP)' },
];

export const hndCourses: CatalogCourse[] = [
  // Accountancy (6 courses)
  { code: 'HND-A01', title: "Financial Accounting", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-A02', title: "Cost and Management Accounting", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-A03', title: "Taxation", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-A04', title: "Auditing", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-A05', title: "Company Accounting", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-A06', title: "OHADA Accounting Principles", level: 'HND', departmentId: 'accountancy', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Banking and Finance (6 courses)
  { code: 'HND-BAF01', title: "Elements of Banking", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-BAF02', title: "Financial Mathematics", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-BAF03', title: "Bank Accounting", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-BAF04', title: "Credit Analysis and Lending", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-BAF05', title: "Financial Markets and Institutions", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-BAF06', title: "Bank Marketing", level: 'HND', departmentId: 'banking-and-finance', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Human Resource Management (6 courses)
  { code: 'HND-HRM01', title: "Human Resource Planning", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HRM02', title: "Labour Law", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HRM03', title: "Compensation and Benefits Management", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HRM04', title: "Recruitment and Selection", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HRM05', title: "Organizational Behaviour", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HRM06', title: "Training and Development", level: 'HND', departmentId: 'human-resource-management', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Logistics and Transport Management (6 courses)
  { code: 'HND-LAT01', title: "Transport Economics", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-LAT02', title: "Warehouse and Inventory Management", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-LAT03', title: "Supply Chain Management", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-LAT04', title: "Customs and Freight Forwarding", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-LAT05', title: "Fleet Management", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-LAT06', title: "Port and Terminal Operations", level: 'HND', departmentId: 'logistics-and-transport-manageme', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Marketing-Trade-Sale (6 courses)
  { code: 'HND-MTS01', title: "Principles of Marketing", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MTS02', title: "Sales Force Management", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MTS03', title: "Consumer Behaviour", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MTS04', title: "Distribution and Logistics", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MTS05', title: "Marketing Research", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MTS06', title: "Digital Marketing Essentials", level: 'HND', departmentId: 'marketing-trade-sale', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Civil Engineering Technology (6 courses)
  { code: 'HND-CET01', title: "Strength of Materials", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CET02', title: "Concrete Technology", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CET03', title: "Surveying", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CET04', title: "Structural Analysis", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CET05', title: "Soil Mechanics", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CET06', title: "Construction Site Management", level: 'HND', departmentId: 'civil-engineering-technology', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Electrical Power Systems (6 courses)
  { code: 'HND-EPS01', title: "Electrical Machines", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-EPS02', title: "Power Generation and Distribution", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-EPS03', title: "Electrical Installations", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-EPS04', title: "Industrial Electronics", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-EPS05', title: "Electrical Network Analysis", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-EPS06', title: "Renewable Energy Systems", level: 'HND', departmentId: 'electrical-power-systems', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Software Engineering (8 courses)
  { code: 'HND-SE01', title: "Algorithms and Data Structures", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE02', title: "Object Oriented Programming", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE03', title: "Software Analysis and Design", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE04', title: "Database Design and Administration", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE05', title: "Web Application Development", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE06', title: "Software Project Management", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE07', title: "Mobile Application Development", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-SE08', title: "Software Testing and Quality Assurance", level: 'HND', departmentId: 'software-engineering', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Computer Science and Networks (6 courses)
  { code: 'HND-CSA01', title: "Computer Architecture and Maintenance", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CSA02', title: "Operating Systems", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CSA03', title: "Network Administration", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CSA04', title: "Database Management Systems", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CSA05', title: "Programming Techniques", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-CSA06', title: "Network Design and Implementation", level: 'HND', departmentId: 'computer-science-and-networks', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Network and Security (6 courses)
  { code: 'HND-NAS01', title: "Network Fundamentals", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-NAS02', title: "Network Security", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-NAS03', title: "Cryptography Basics", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-NAS04', title: "System and Server Administration", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-NAS05', title: "Ethical Hacking Essentials", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-NAS06', title: "Network Design and Management", level: 'HND', departmentId: 'network-and-security', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Nursing (6 courses)
  { code: 'HND-N01', title: "Fundamentals of Nursing", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-N02', title: "Medical-Surgical Nursing", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-N03', title: "Community Health Nursing", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-N04', title: "Pharmacology for Nurses", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-N05', title: "Reproductive Health", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-N06', title: "Paediatric Nursing", level: 'HND', departmentId: 'nursing', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Midwifery (6 courses)
  { code: 'HND-M01', title: "Antenatal Care", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-M02', title: "Labour and Delivery Management", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-M03', title: "Postnatal Care", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-M04', title: "Neonatal Care", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-M05', title: "Reproductive Health", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-M06', title: "Obstetric Emergencies", level: 'HND', departmentId: 'midwifery', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Medical Laboratory Sciences (6 courses)
  { code: 'HND-MLS01', title: "Clinical Chemistry", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MLS02', title: "Haematology", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MLS03', title: "Medical Microbiology", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MLS04', title: "Blood Banking and Transfusion Science", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MLS05', title: "Parasitology", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-MLS06', title: "Laboratory Management", level: 'HND', departmentId: 'medical-laboratory-sciences', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Hotel Management and Catering (6 courses)
  { code: 'HND-HMA01', title: "Food Production and Culinary Techniques", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HMA02', title: "Food and Beverage Service", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HMA03', title: "Front Office Operations", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HMA04', title: "Housekeeping Management", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HMA05', title: "Hospitality Accounting", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-HMA06', title: "Menu Planning and Costing", level: 'HND', departmentId: 'hotel-management-and-catering', required: true, verified: true, source: "HND specialty syllabus (public references)" },

  // Journalism (6 courses)
  { code: 'HND-J01', title: "News Writing and Reporting", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-J02', title: "Media Law and Ethics", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-J03', title: "Broadcast Journalism", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-J04', title: "Feature and Editorial Writing", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-J05', title: "Media Production Techniques", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
  { code: 'HND-J06', title: "Communication Research", level: 'HND', departmentId: 'journalism', required: true, verified: true, source: "HND specialty syllabus (public references)" },
];
