// Industries and ready-made solutions — from "O2One Consultants - Website" (final copy).

export const industries = [
  {
    name: 'Trading & Distribution',
    short: 'wholesale, import/export, logistics',
    text: 'General trading, wholesale, import & export, industrial supplies, food distribution and logistics.',
    solutions: ['Fleet Management', 'Labour Outsourcing Management'],
  },
  {
    name: 'Professional Services',
    short: 'consulting, IT, finance, HR',
    text: 'Consulting, IT, finance, HR, engineering, marketing and business support.',
    solutions: ['Visa Management', 'Labour Outsourcing Management'],
  },
  {
    name: 'Manufacturing',
    short: 'food, steel, plastics, machinery',
    text: 'Food, steel, plastics, chemicals, machinery, electronics and packaging.',
    solutions: ['Fleet Management'],
  },
  {
    name: 'Retail & E-commerce',
    short: 'supermarkets, fashion, online',
    text: 'Supermarkets, fashion, electronics, lifestyle, automotive and online retail.',
    solutions: ['Optical Store Management', 'Salon & Spa Management'],
  },
  {
    name: 'Real Estate & Construction',
    short: 'development, leasing, FM',
    text: 'Property development, brokerage, leasing, facilities management and construction.',
    solutions: ['Property Management', 'Labour Outsourcing Management'],
  },
  {
    name: 'Automotive',
    short: 'dealerships, parts, workshops',
    text: 'Dealerships, spare parts, manufacturing, workshops, rentals and fleet management.',
    solutions: ['Car Wash Management', 'Fleet Management'],
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
