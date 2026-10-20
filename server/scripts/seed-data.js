// Starter content for the blog and customer stories.
//
// Blog posts are written from O2One's own website copy and can be published after review.
// Customer stories are SAMPLES (is_sample = 1, shown with a "Sample" badge): replace them with
// real, client-approved stories and numbers before launch, then delete the samples.

export const categories = [
  { slug: 'odoo', name: 'Odoo', sort_order: 1 },
  { slug: 'ai-automation', name: 'AI & Automation', sort_order: 2 },
  { slug: 'business', name: 'Business', sort_order: 3 },
  { slug: 'uae-tax', name: 'UAE VAT & e-invoicing', sort_order: 4 },
];

export const stories = [
  {
    slug: 'trading-company-moved-off-tally',
    title: 'Trading company moved off Tally in 10 weeks',
    client_name: 'Sample trading company',
    industry: 'Trading & Distribution',
    country: 'UAE',
    service_slug: 'odoo-services',
    apps: 'Sales, Inventory, Purchase, Accounting',
    summary: 'Stock in Excel, invoices in Tally, orders on WhatsApp. Now one Odoo system the whole team uses.',
    challenge:
      'Orders came in on WhatsApp, stock lived in Excel and invoices were raised in Tally. Nobody had the same numbers, and month-end took a week of reconciling.',
    approach: ['Business Health Checkup', 'As-Is Process Mapping', 'Implementation', 'Training & UAT', 'Hypercare'],
    results: [
      { value: '10 weeks', label: 'from checkup to go-live' },
      { value: '1', label: 'system instead of three' },
      { value: '[x]', label: 'hours saved each month' },
    ],
    is_featured: 1,
  },
  {
    slug: 'retail-chain-one-view-of-stock',
    title: 'A retail chain got one view of stock across its stores',
    client_name: 'Sample retail chain',
    industry: 'Retail & E-commerce',
    country: 'UAE',
    service_slug: 'odoo-services',
    apps: 'Point of Sale, Inventory, Accounting',
    summary: 'Each store kept its own records. Head office now sees stock and sales for every branch in one place.',
    challenge:
      'Each branch ran its own till and spreadsheet. Transfers between stores were tracked by phone, and head office only saw sales a week late.',
    approach: ['Business Health Checkup', 'Solution Blueprint', 'Implementation', 'Go-Live'],
    results: [
      { value: '[x]', label: 'branches on one system' },
      { value: 'Daily', label: 'sales reporting, not weekly' },
    ],
    is_featured: 0,
  },
  {
    slug: 'manufacturer-automated-approvals',
    title: 'A manufacturer stopped chasing approvals by email',
    client_name: 'Sample manufacturer',
    industry: 'Manufacturing',
    country: 'India',
    service_slug: 'ai-automation',
    apps: 'Purchase, Manufacturing, Approvals',
    summary: 'Purchase approvals used to sit in inboxes. Now they route themselves and nothing waits on one person.',
    challenge:
      'Every purchase above a limit needed the owner to approve it by email. When he travelled, production waited.',
    approach: ['As-Is Process Mapping', 'Change Management', 'Implementation', 'Maintenance & AMC'],
    results: [
      { value: '[x] days', label: 'faster purchase approvals' },
      { value: '0', label: 'approvals lost in email' },
    ],
    is_featured: 0,
  },
];

export const posts = [
  {
    slug: 'uae-e-invoicing-what-changes',
    title: 'UAE e-invoicing: what changes for your business',
    category: 'uae-tax',
    excerpt:
      'From 2027, business invoices in the UAE must go through an accredited provider. Here is what that means in plain words.',
    read_minutes: 5,
    related_service: 'odoo-uae-vat-e-invoicing',
    body: `From 2027, a PDF invoice sent by email won't count on its own. Business invoices in the UAE must go through an Accredited Service Provider (ASP).

## How it works

Your system creates the invoice. Your ASP checks it and sends it to your customer's ASP, which delivers it to your customer. A copy goes to the Federal Tax Authority at the same time.

## Who it applies to

It depends on your revenue. Larger businesses go first, and most others follow later in 2027. A few points people often miss:

- **Not VAT-registered?** It still applies.
- **In a free zone?** You are not automatically exempt.
- **B2C only?** Out of scope for now.

## What to do first

Appoint an ASP before your deadline, then go live. Before that, make sure your data is clean: correct TRNs for every customer and supplier, tax codes that match your VAT return, and credit notes made in your system rather than by hand.

This is a plain-language guide, not tax advice. Check dates and penalties with the FTA or your adviser.`,
  },
  {
    slug: 'signs-you-have-outgrown-tally-and-excel',
    title: "Six signs you've outgrown Tally, Excel and WhatsApp",
    category: 'business',
    excerpt:
      'If you spend your days fixing problems instead of growing, your tools might be the reason. Here are the signs.',
    read_minutes: 4,
    related_service: 'business-consultation',
    story: 'trading-company-moved-off-tally',
    body: `Most growing businesses start on Tally, Excel and WhatsApp. They work, until they don't. These are the signs we see most often.

## 1. Nobody has the same numbers

Sales has one figure, accounts has another, and the warehouse has a third. There is no single source of truth.

## 2. Hours go into copying data

Your team retypes the same order into three places. That time could go into customers.

## 3. You can't see what's happening without asking

If you need to phone someone to know your stock or cash position, you don't have visibility or control.

## 4. One person holds it all together

When the one person who knows the spreadsheet is on leave, work stops.

## 5. Your team resists anything new

Usually because the last system was forced on them, not built around how they work.

## 6. You've been burned by a vendor before

That's fair. It's also why we start with a checkup, not a sales pitch.

If three or more of these sound familiar, a free Business Health Checkup is a good next step.`,
  },
  {
    slug: 'what-happens-in-a-business-health-checkup',
    title: 'What happens in a free Business Health Checkup',
    category: 'business',
    excerpt: 'Two hours, one conversation, no obligation. Here is exactly what we cover and what you walk away with.',
    read_minutes: 3,
    related_service: 'business-consultation',
    body: `The Business Health Checkup is the first step of our approach. It takes about two hours, in person or online, and it's free.

## What we cover

- How your business runs today, including the workarounds
- Where time and money are slipping away
- Which tools you use and where they get in the way

## What you walk away with

- A clear view of where time and money are slipping away
- Quick wins you can act on straight away
- An honest view of whether Odoo is right for you

If it isn't the right fit, we'll tell you. You're under no obligation to work with us afterwards.`,
  },
  {
    slug: 'moving-from-tally-to-odoo',
    title: 'Moving from Tally to Odoo: how the migration works',
    category: 'odoo',
    excerpt: 'Your history, your customers, your stock. How we move it all into Odoo without stopping your business.',
    read_minutes: 6,
    related_service: 'odoo-services',
    story: 'trading-company-moved-off-tally',
    body: `Moving systems feels risky because your data is your business. Here is how we make it safe.

## Map before you move

We start by documenting how your business actually runs: the ledgers, the stock lists, the spreadsheets people keep on the side.

## Clean as you go

Duplicate customers, old items and wrong tax codes are fixed before they reach Odoo, not after.

## Move in rehearsals

We load your data into a test system first. Your team checks it against Tally until the numbers match.

## Go live with support

On go-live day we stay beside your team, and hypercare continues until everything runs smoothly.`,
  },
  {
    slug: 'start-small-with-automation',
    title: 'Start small with automation: three wins for SMEs',
    category: 'ai-automation',
    excerpt: "You don't need a big AI project. Start with one repetitive task, prove the value, then expand.",
    read_minutes: 4,
    related_service: 'ai-automation',
    story: 'manufacturer-automated-approvals',
    body: `AI and automation work best when they solve a small, real problem first.

## 1. Approvals

Purchase and expense approvals that route themselves, with reminders, so nothing waits in an inbox.

## 2. Follow-ups

Payment reminders and quote follow-ups sent on time, every time, without anyone remembering to send them.

## 3. Reports

Daily summaries of sales, stock and cash, built from your own data and delivered where you'll read them.

Start small, prove the value, and expand when it makes sense.`,
  },
  {
    slug: 'getting-your-team-to-use-the-new-system',
    title: 'Getting your team to actually use the new system',
    category: 'odoo',
    excerpt: 'Most software projects fail on people, not technology. Change management is how we prevent that.',
    read_minutes: 5,
    related_service: 'business-consultation',
    body: `A system nobody uses is the most expensive kind. That's why change management is a step in our approach, not an afterthought.

## Involve people early

The people who do the work help map the process. They see their own steps in the new system.

## Train on real scenarios

Training uses your products, your customers and your documents, not a demo company.

## Test before go-live

User acceptance testing means your team tries real cases before anything goes live.

## Stay after launch

Hypercare means someone is there when questions come up in the first weeks.`,
  },
];
