// Services copy — from "O2One Consultants - Website" (final copy).

export const servicesIntro =
  'We understand business. We understand technology. We make them work together.';

export const services = [
  {
    slug: 'business-consultation',
    number: '01',
    name: 'Business Consultation',
    tagline: 'Know what to fix before you spend on fixing it.',
    panelHeading: 'Know what to fix before you spend on fixing it.',
    description:
      'We study how your business runs, find where time and money are slipping away, and recommend the right systems and changes, with effort and risks clear from the start.',
    items: [
      { name: 'Business Health Checkup', text: 'Where you stand today.' },
      { name: 'As-Is Process Mapping', text: 'How your teams actually work.' },
      { name: 'Solution Blueprint', text: 'The right fit, with gaps, effort, and risks.' },
      { name: 'Change Management', text: 'Getting your people ready.' },
    ],
    showProblems: true,
    faqs: [
      {
        q: 'Do I have to buy Odoo after the consultation?',
        a: "No. If a solution isn't the right fit, we'll tell you. The blueprint is yours to use either way.",
      },
      {
        q: 'Where do we start?',
        a: 'With the free Business Health Checkup: two hours, one conversation, on us.',
      },
    ],
  },
  {
    slug: 'odoo-services',
    number: '02',
    name: 'Odoo Services',
    tagline: 'Official Odoo partner, set up around the way you work.',
    panelHeading: 'One system for sales, stock, accounts and HR, set up properly.',
    description: "Delivered by Odoo-certified experts, so your team gets a system they'll actually use.",
    items: [
      { name: 'Implementation', text: 'Setting up the right Odoo apps for your business.' },
      { name: 'Customization', text: 'Modules and workflows built around your processes.' },
      { name: 'Migration', text: 'Moving your data from Tally, Excel, or your old system.' },
      { name: 'Training', text: 'Hands-on sessions so your team is confident from day one.' },
      { name: 'Hosting', text: 'Secure, reliable hosting for your Odoo system.' },
      { name: 'Support & Maintenance', text: 'Ongoing help after go-live.' },
      {
        name: 'UAE VAT & E-invoicing',
        text: 'VAT, Corporate Tax and e-invoicing set up in the Odoo you already use.',
        to: '/e-invoicing',
      },
    ],
    partnerBadge: true,
    callout: {
      title: 'Moving from Tally or Excel?',
      text: 'We migrate your data from Tally, Excel, or your old system.',
    },
    faqs: [
      {
        q: 'How long does implementation take?',
        a: 'It depends on your business and the state of your data. After the Health Checkup and Solution Blueprint you get a plan with effort and risks laid out up front.',
      },
      {
        q: 'Which Odoo apps do I need?',
        a: 'Only the ones your processes need. We map how your business runs first, then recommend the apps that fit.',
      },
    ],
  },
  {
    slug: 'custom-industry-solutions',
    number: '03',
    name: 'Custom Industry Solutions',
    tagline: "When off-the-shelf doesn't fit, we build.",
    panelHeading: "When off-the-shelf doesn't fit, we build.",
    description:
      'For businesses with unique processes, we design and develop solutions made for your operations.',
    items: [], // filled from industry solutions below
    useSolutions: true,
    faqs: [
      {
        q: "What if my business type isn't listed?",
        a: 'We start from how your business runs, not from a template. Book a checkup and we will tell you honestly what fits.',
      },
    ],
  },
  {
    slug: 'ai-automation',
    number: '04',
    name: 'AI & Automation',
    tagline: 'Practical AI that saves time, cuts cost, and fits into the way you already work.',
    panelHeading: 'Practical AI that saves time and cuts cost.',
    description: 'Start small, prove the value, and expand when it makes sense.',
    items: [
      { name: 'Workflow Automation', text: 'Automate approvals, follow-ups, invoicing, and repetitive tasks.' },
      { name: 'AI-Powered Insights', text: 'Turn your business data into clear reports and predictions.' },
      { name: 'Custom AI Models', text: 'AI trained on your data and built for your specific problem.' },
      { name: 'Intelligent AI Solutions', text: 'Assistants and tools that handle everyday queries and tasks.' },
      { name: 'Seamless AI Integration', text: 'Connect AI to Odoo, your ERP, and the tools you already use.' },
      { name: 'Cost-Effective Automation', text: 'Start small, prove the value, and expand when it makes sense.' },
    ],
    faqs: [
      {
        q: 'Do we need a big AI project to start?',
        a: 'No. Start with one repetitive task, prove the value, and expand when it makes sense.',
      },
    ],
  },
];

export const serviceBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
