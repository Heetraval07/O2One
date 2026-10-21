// Industries and ready-made solutions — from "O2One Consultants - Website" (final copy).

export const industries = [
  {
    name: 'Trading & Distribution',
    short: 'wholesale, import/export, logistics',
    text: 'General trading & re-export, wholesale, import & export, industrial supplies, FMCG & food distribution and logistics.',
    challenges: ['Stock levels you can’t trust', 'Margins lost to hidden landed costs', 'Receivables that slip through the cracks'],
    solutions: ['Container & Shipment Tracking', 'Van Sales', 'Fleet Management', 'Landed Cost Management', 'Batch & Expiry Tracking'],
  },
  {
    name: 'Professional Services',
    short: 'consulting, IT, finance, HR',
    text: 'Consulting, IT services, accounting, HR, recruitment and manpower agencies.',
    challenges: ['Billable hours that never get invoiced', 'Projects running over budget, unnoticed', 'Staff visas and contracts tracked on spreadsheets'],
    solutions: ['Labour Outsourcing', 'Visa Management', 'Timesheets & Billing', 'Project Profitability', 'Recruitment'],
  },
  {
    name: 'Manufacturing',
    short: 'food, steel, plastics, machinery',
    text: 'Food processing, steel & metals, plastics, machinery and made-to-order production.',
    challenges: ['Production plans that don’t match stock', 'No clear cost per unit', 'Quality issues found too late'],
    solutions: ['Bill of Materials & Costing', 'Production Planning', 'Quality Control', 'Maintenance Management', 'Batch & Expiry Tracking'],
  },
  {
    name: 'Retail & E-commerce',
    short: 'supermarkets, fashion, online',
    text: 'Supermarkets, fashion, specialty stores, multi-branch retail and online stores.',
    challenges: ['Stores and online selling from different stock', 'Slow checkouts at peak hours', 'Little insight into what actually sells'],
    solutions: ['Point of Sale', 'eCommerce', 'Loyalty & Gift Cards', 'Optical Store', 'Salon & Spa', 'Gym'],
  },
  {
    name: 'Real Estate & Construction',
    short: 'development, leasing, FM',
    text: 'Developers, contractors, leasing companies and facility management.',
    challenges: ['Rent and service charges chased by hand', 'Project costs scattered across sites', 'Maintenance requests lost in WhatsApp'],
    solutions: ['Property Management', 'Lease & Rent Collection', 'Project Costing', 'Subcontractor Management', 'Facility Maintenance'],
  },
  {
    name: 'Automotive',
    short: 'dealerships, parts, workshops',
    text: 'Dealerships, spare parts, service workshops and car wash.',
    challenges: ['Job cards still on paper', 'Parts stock that doesn’t match the system', 'No service history per vehicle'],
    solutions: ['Workshop & Repairs', 'Spare Parts Inventory', 'Vehicle Sales', 'Car Wash', 'Fleet Management'],
  },
  {
    name: 'Healthcare & Pharmaceuticals',
    short: 'providers, equipment, distribution',
    text: 'Healthcare providers, medical equipment, pharmaceuticals and healthcare distribution.',
    solutions: ['Optical Store Management'],
  },
  {
    name: 'Energy & Utilities',
    short: 'oil & gas, solar, water',
    text: 'Oil and gas, renewable energy, solar, power equipment and water management.',
    solutions: ['Fleet Management', 'Labour Outsourcing Management'],
  },
  {
    name: 'Hospitality & Tourism',
    short: 'hotels, restaurants, travel',
    text: 'Hotels, restaurants, catering, travel, tourism and holiday home operators.',
    solutions: ['Hotel Management', 'Restaurant Management', 'Tours and Travel Management'],
  },
  {
    name: 'Agriculture & Food Production',
    short: 'farming, processing, feed',
    text: 'Agriculture, food processing, farming technology, animal feed and agribusiness.',
    solutions: ['Fleet Management'],
  },
  {
    name: 'Education & Training',
    short: 'schools, institutes, e-learning',
    text: 'Schools, training institutes, vocational education and e-learning.',
    solutions: ['Education Management', 'Gym Management'],
  },
  {
    name: 'Financial Services',
    short: 'accounting, insurance, fintech',
    text: 'Accounting, insurance, fintech, payment solutions and financial advisory.',
    solutions: [],
  },
];

export const solutions = [
  'Property Management',
  'Tours and Travel Management',
  'Gym Management',
  'Education Management',
  'Hotel Management',
  'Labour Outsourcing Management',
  'Car Wash Management',
  'Visa Management',
  'Fleet Management',
  'Salon & Spa Management',
  'Optical Store Management',
  'Restaurant Management',
];

/** Short chip label: "Fleet Management" -> "Fleet" */
export const solutionShort = (s) => s.replace(/ Management$/, '').replace('Tours and Travel', 'Tours & Travel');

export const industryNames = industries.map((i) => i.name);

/** Card illustrations for the industries shown on the Industries page, in /public/industries. */
export const industryImages = {
  'Trading & Distribution': '/industries/trading-distribution.svg',
  'Professional Services': '/industries/professional-services.svg',
  Manufacturing: '/industries/manufacturing.svg',
  'Retail & E-commerce': '/industries/retail-ecommerce.svg',
  'Real Estate & Construction': '/industries/real-estate-construction.svg',
  Automotive: '/industries/automotive.svg',
};
