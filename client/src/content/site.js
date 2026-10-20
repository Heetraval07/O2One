// Site-wide settings. Contact details come from VITE_* values in the project-root .env,
// so they can be changed without touching code. The fallbacks are placeholders.
const env = import.meta.env;

const whatsappNumber = (env.VITE_WHATSAPP_NUMBER || '971545932700').replace(/\D/g, '');

export const site = {
  name: 'O2One Consultants',
  tagline: 'Business systems that actually work. Official Odoo partner in the UAE.',
  partnerLabel: 'Odoo Registered Partner in UAE',
  email: env.VITE_CONTACT_EMAIL || 'hello@example.com',
  phone: env.VITE_CONTACT_PHONE || '+971 54 593 2700',
  whatsappNumber,
  whatsappUrl: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi O2One, I would like to talk about my business systems.')}`,
  linkedinUrl: env.VITE_LINKEDIN_URL || '',
  offices: [
    { city: 'Dubai', country: 'UAE', address: env.VITE_DUBAI_ADDRESS || 'Meydan Grandstand, 6th floor, Meydan Road, Nad Al Sheba, Dubai, U.A.E.' },
    { city: 'Mumbai', country: 'India', address: env.VITE_MUMBAI_ADDRESS || 'Mumbai, India' },
  ],
};

export const telHref = `tel:${site.phone.replace(/[^\d+]/g, '')}`;

export const CHECKUP_LABEL = 'Book a Free Business Health Checkup';
export const CHECKUP_SHORT = 'Book a free health checkup';
export const CHECKUP_PATH = '/contact';

export const nav = [
  { label: 'Services', to: '/services', mega: 'services' },
  { label: 'Industries', to: '/industries' },
  { label: 'E-Invoicing', to: '/e-invoicing' },
  { label: 'Our approach', to: '/our-approach' },
  { label: 'About', to: '/about' },
  {
    label: 'Resources',
    children: [
      { label: 'Customer stories', to: '/customer-stories' },
      { label: 'Blog', to: '/blog' },
    ],
  },
  { label: 'Contact', to: '/contact' },
];

/** The VAT page top bar. Update after 30 Oct 2026 (see the page copy doc). */
export const vatTopBar = {
  text: 'AED 50M+ revenue? Appoint your e-invoicing provider by 30 October 2026.',
  shortText: 'AED 50M+ revenue? Appoint your provider by 30 October 2026.',
  link: 'See all deadlines',
  // After 30 Oct 2026 change to:
  // text: 'Most UAE businesses must appoint an e-invoicing provider by 31 March 2027.'
  // and set highlightLargeBusiness to false.
  highlightLargeBusiness: true,
};
