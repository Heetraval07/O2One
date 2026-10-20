// Our Approach — from "O2One Consultants - Website" (final copy).

export const phases = [
  {
    id: 'plan',
    number: 1,
    name: 'Plan',
    tagline: 'Understand your business before we touch any software.',
    steps: [
      {
        n: 1,
        title: 'Business Health Checkup',
        short: 'Goals, and where time & money slip away',
        text: 'We start with your business, your goals, and where time and money are slipping away.',
      },
      {
        n: 2,
        title: 'As-Is Process Mapping',
        short: 'How the business actually runs today',
        text: 'We document how your business actually runs today, including the workarounds, delays, and manual steps.',
      },
      {
        n: 3,
        title: 'Solution Blueprint',
        short: 'Gaps, effort, risks up front',
        text: "We design the right solution for you, with gaps, effort, and risks laid out up front. If it isn't the right fit, we'll tell you.",
      },
    ],
    callout: "If it isn't the right fit, we'll tell you.",
  },
  {
    id: 'build',
    number: 2,
    name: 'Build',
    tagline: 'Create a system your team will actually use.',
    steps: [
      {
        n: 4,
        title: 'Change Management',
        short: 'Prepare people & processes',
        text: 'We prepare your people and processes for the shift, so the new system gets used and not ignored.',
      },
      {
        n: 5,
        title: 'Implementation',
        short: 'Build, configure, connect',
        text: 'We build, configure, and connect everything around the way you work.',
      },
      {
        n: 6,
        title: 'Training & UAT',
        short: 'Learn & test real scenarios',
        text: 'Your team learns the system and tests it in real scenarios before anything goes live.',
      },
    ],
    callout: 'A system that gets used, not ignored.',
  },
  {
    id: 'launch',
    number: 3,
    name: 'Launch & Support',
    tagline: 'Go live with confidence, and never be left alone.',
    steps: [
      {
        n: 7,
        title: 'Go-Live',
        short: 'Launch with a clear plan',
        text: 'We launch with a clear plan and stay beside you while your team makes the switch.',
      },
      {
        n: 8,
        title: 'Hypercare',
        short: 'Hands-on support after launch',
        text: 'Close, hands-on support right after launch, until everything runs smoothly.',
      },
      {
        n: 9,
        title: 'Maintenance & AMC',
        short: 'Your accountable tech partner',
        text: "Ongoing support, updates, and improvements. We don't disappear after go-live. We grow with you.",
        ongoing: true,
      },
    ],
    callout: "We don't disappear after go-live.",
  },
];
