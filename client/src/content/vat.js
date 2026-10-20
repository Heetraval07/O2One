// UAE VAT & E-invoicing page — final copy from "O2One – UAE VAT & E-invoicing Page Copy" (8 Oct 2026). Word for word.
// Re-check all dates and penalties against the Ministry of Finance / FTA before launch.

export const vatMeta = {
  title: 'UAE E-invoicing & VAT in Odoo | O2One',
  description:
    'Get your Odoo ready for UAE e-invoicing. VAT, Corporate Tax and ASP connection, set up by Odoo experts in Dubai. Book a free readiness check.',
};

export const vatHero = {
  label: 'UAE VAT & e-invoicing in Odoo',
  title: 'Get your Odoo ready for UAE e-invoicing.',
  body: 'From 2027, business invoices must go through an approved provider. We set up your Odoo to do it, without changing how your team works.',
  // Phones show the first sentence only (mobile wireframe)
  bodyShort: 'From 2027, business invoices must go through an approved provider.',
  button: 'Book a free readiness check',
  link: 'Check your readiness',
  stats: [
    { value: '10+', label: 'years in Odoo' },
    { value: '5+', label: 'certified experts' },
    { value: 'Dubai', label: 'and Mumbai' },
  ],
  invoice: {
    number: 'INV/2027/00184',
    status: 'Accepted',
    customer: 'Sample Trading LLC',
    trn: '100 XXX XXX XXX 003',
    subtotal: 'AED 48,000.00',
    vat: 'AED 2,400.00',
    total: 'AED 50,400.00',
    tracker: [
      { title: 'Created', sub: 'in Odoo' },
      { title: 'Sent', sub: 'to ASP' },
      { title: 'Delivered', sub: 'to customer' },
      { title: 'Reported', sub: 'to FTA' },
    ],
  },
};

export const vatChanges = {
  label: 'What changes',
  title: 'Invoices go through a provider, not email.',
  body: "A PDF on its own won't count. Your Odoo sends invoice data to an Accredited Service Provider (ASP), which delivers it and reports it.",
  flow: [
    { n: '01', title: 'Your Odoo', text: 'Creates the invoice' },
    { n: '02', title: 'Your ASP', text: 'Checks and sends it' },
    { n: '03', title: 'Their ASP', text: 'Receives it' },
    { n: '04', title: 'Your customer', text: 'Books it' },
  ],
  note: 'A copy goes to the Federal Tax Authority at the same time.',
};

export const vatDeadlines = {
  label: 'Deadlines',
  title: 'Find your date.',
  body: 'It depends on your revenue. Appoint an ASP first, then go live.',
  rows: [
    { who: 'Revenue AED 50M+', headline: 'Jan 2027', appoint: '30 Oct 2026', live: '1 Jan 2027', highlight: true },
    { who: 'Everyone else', headline: 'Jul 2027', appoint: '31 Mar 2027', live: '1 Jul 2027' },
    { who: 'Selling to government', headline: 'Oct 2027', appoint: null, live: '1 Oct 2027' },
  ],
  tags: ['Not VAT-registered? Still applies', 'Free zone? Not automatically exempt', 'B2C only? Out of scope for now'],
  smallPrint:
    'Penalties: AED 5,000 a month without an ASP. AED 100 per invoice not sent, capped at AED 5,000 a month.',
};

export const vatCheck = {
  label: 'Self-check',
  title: 'How ready are you?',
  body: "Tick what's true today. Every unticked box is a gap we'll close.",
  // These exact strings are sent with the booking and checked by the API. Don't reword without updating the server.
  items: [
    'Every customer and supplier has a correct TRN',
    'Tax codes match your VAT return',
    'Credit notes are made in Odoo, not by hand',
    'You know your deadline',
    "You've chosen an ASP",
  ],
  // Shorter labels shown on phones, same order as `items`. Display only.
  itemsShort: ['Correct TRNs', 'Tax codes match', 'Credit notes in Odoo', 'Know your deadline', 'Chosen an ASP'],
  button: 'Close the gaps',
};

export const vatWhatWeDo = {
  label: 'What we do',
  title: 'Clean tax setup, then e-invoicing.',
  body: 'All in the Odoo you already use.',
  cards: [
    { label: 'VAT', title: 'Right from the first invoice', text: '5% tax codes, TRNs, returns that reconcile.' },
    { label: 'Corporate Tax', title: 'Ready for year end', text: '9% CT accounts, free zone transactions tracked.' },
    { label: 'E-invoicing', title: 'Connected to your ASP', text: 'Required format, sent automatically, status in Odoo.', dark: true },
  ],
  steps: [
    { n: '01', title: 'Check', text: 'Find the gaps.' },
    { n: '02', title: 'Clean up', text: 'Fix tax codes and data.' },
    { n: '03', title: 'Connect', text: 'Link to your ASP and test.' },
    { n: '04', title: 'Go live', text: 'Train your team, then support.' },
  ],
};

export const vatHonesty = {
  title: "We're not an ASP.",
  body: 'Only accredited providers can send e-invoices in the UAE. We make your Odoo produce the right data and connect it to the provider you choose.',
  bodyShort: 'We connect your Odoo to the provider you choose.',
};

export const vatFaq = {
  label: 'Questions',
  title: 'Short answers.',
  items: [
    { q: 'Do I need a new ERP?', a: "Usually not. We'll tell you if you do." },
    { q: 'Community or Enterprise?', a: 'Both can work. The connection is built differently.' },
    { q: 'How long does it take?', a: 'A few weeks if your data is clean. Longer if not.' },
    { q: 'Which ASP should I pick?', a: "We'll compare options with you. The choice is yours." },
  ],
};

export const vatCta = {
  label: 'Free readiness check',
  title: 'Two hours. One conversation. On us.',
  tags: ['Your deadline', 'Your gaps', 'An honest plan'],
  button: 'Book a free readiness check',
};
