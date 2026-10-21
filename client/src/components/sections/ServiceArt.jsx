import styles from './ServiceArt.module.css';

const ORANGE = '#ff7a3d';

/** The O2One mark: ring + orange core, used as the focal point of each illustration. */
const Core = ({ x = 200, y = 150, r = 22 }) => (
  <g>
    <circle cx={x} cy={y} r={r + 16} fill="url(#sa-glow)" />
    <circle cx={x} cy={y} r={r} fill="#1a1a1a" stroke="#f2f2f2" strokeWidth="3.5" />
    <circle cx={x} cy={y} r={r * 0.46} fill={ORANGE} className={styles.pulse} />
  </g>
);

const Chip = ({ x, y, w = 72, label, accent = false }) => (
  <g className={styles.chip}>
    <rect x={x - w / 2} y={y - 12} width={w} height="24" rx="2" className={accent ? styles.chipAccent : styles.chipBox} />
    <text x={x} y={y + 3.6} textAnchor="middle" className={accent ? styles.chipTextAccent : styles.chipText}>
      {label}
    </text>
  </g>
);

/* 01: understand first. Concentric rings around the core, three stages of the checkup on the outer ring. */
function Consultation() {
  const stages = [
    { x: 200, y: 50, label: 'Checkup', ly: 34 },
    { x: 286.6, y: 200, label: 'Process map', ly: 222 },
    { x: 113.4, y: 200, label: 'Blueprint', ly: 222 },
  ];
  return (
    <>
      <circle cx="200" cy="150" r="42" className={styles.ring} />
      <circle cx="200" cy="150" r="72" className={styles.ring} />
      <circle cx="200" cy="150" r="100" className={`${styles.ring} ${styles.flowSlow}`} />
      <path d="M200 50A100 100 0 0 1 286.6 200" className={styles.arc} />
      {stages.map((s) => (
        <g key={s.label}>
          <line x1="200" y1="150" x2={s.x} y2={s.y} className={styles.spoke} />
          <circle cx={s.x} cy={s.y} r="6" fill="#1a1a1a" stroke={ORANGE} strokeWidth="2" />
          <text x={s.x} y={s.ly} textAnchor="middle" className={styles.label}>
            {s.label}
          </text>
        </g>
      ))}
      <Core />
    </>
  );
}

/* 02: one system. The six modules wired to a single core. */
function Odoo() {
  const modules = [
    { x: 200, y: 62, label: 'Sales' },
    { x: 312.6, y: 107.5, label: 'Inventory' },
    { x: 312.6, y: 192.5, label: 'Accounting' },
    { x: 200, y: 238, label: 'Reports' },
    { x: 87.4, y: 192.5, label: 'HR & Payroll', w: 84 },
    { x: 87.4, y: 107.5, label: 'CRM' },
  ];
  return (
    <>
      {modules.map((m, i) => (
        <g key={m.label}>
          <line x1="200" y1="150" x2={m.x} y2={m.y} className={`${styles.spoke} ${styles.flow}`} />
          <circle r="2.6" fill={ORANGE}>
            <animateMotion dur="3.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={`M${m.x} ${m.y} L200 150`} />
          </circle>
        </g>
      ))}
      {modules.map((m) => (
        <Chip key={m.label} x={m.x} y={m.y} w={m.w} label={m.label} />
      ))}
      <Core r={24} />
    </>
  );
}

/* 03: built for you. A grid of standard modules with one custom piece fitted into the gap. */
function Custom() {
  const cell = 46;
  const gap = 8;
  const x0 = 200 - (4 * cell + 3 * gap) / 2;
  const y0 = 150 - (3 * cell + 2 * gap) / 2;
  const slot = { c: 2, r: 1 };
  const cells = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) cells.push({ c, r, x: x0 + c * (cell + gap), y: y0 + r * (cell + gap) });
  const slotCell = cells.find((k) => k.c === slot.c && k.r === slot.r);
  return (
    <>
      {cells
        .filter((k) => k !== slotCell)
        .map((k) => (
          <rect key={`${k.c}-${k.r}`} x={k.x} y={k.y} width={cell} height={cell} rx="2" className={(k.c + k.r) % 3 === 0 ? styles.cellFill : styles.cell} />
        ))}
      <rect x={slotCell.x} y={slotCell.y} width={cell} height={cell} rx="2" className={styles.slot} />
      <circle cx={slotCell.x + cell / 2 - 10} cy={slotCell.y + cell / 2 - 10} r="46" fill="url(#sa-glow)" className={styles.bob} />
      <g className={styles.bob}>
        <rect x={slotCell.x - 10} y={slotCell.y - 10} width={cell} height={cell} rx="2" fill={ORANGE} />
        <circle cx={slotCell.x - 10 + cell / 2} cy={slotCell.y - 10 + cell / 2} r="9" fill="none" stroke="#1a1a1a" strokeWidth="3" />
        <circle cx={slotCell.x - 10 + cell / 2} cy={slotCell.y - 10 + cell / 2} r="3.4" fill="#1a1a1a" />
      </g>
    </>
  );
}

/* 04: less manual work. Messy inputs go in, the core does the work, clean results come out. */
function Automation() {
  const ins = [96, 150, 204];
  const outs = [112, 150, 188];
  return (
    <>
      {ins.map((y, i) => (
        <g key={`i${y}`}>
          <path d={`M96 ${y} C 140 ${y}, 150 150, 176 150`} className={`${styles.spoke} ${styles.flow}`} />
          <circle r="2.6" fill={ORANGE}>
            <animateMotion dur="2.8s" begin={`${i * 0.7}s`} repeatCount="indefinite" path={`M96 ${y} C 140 ${y}, 150 150, 176 150`} />
          </circle>
          <rect x="36" y={y - 11} width="60" height="22" rx="2" className={styles.chipBox} />
          <rect x="44" y={y - 2} width={30 + ((i * 11) % 14)} height="4" rx="1" className={styles.bar} />
        </g>
      ))}
      {outs.map((y, i) => (
        <g key={`o${y}`}>
          <path d={`M224 150 C 250 150, 262 ${y}, 304 ${y}`} className={`${styles.spoke} ${styles.flow}`} />
          <circle r="2.6" fill={ORANGE}>
            <animateMotion dur="2.8s" begin={`${1.2 + i * 0.7}s`} repeatCount="indefinite" path={`M224 150 C 250 150, 262 ${y}, 304 ${y}`} />
          </circle>
          <rect x="304" y={y - 11} width="60" height="22" rx="2" className={styles.chipAccent} />
          <path d={`M314 ${y} l4 4 l8 -8`} className={styles.tick} />
          <rect x="332" y={y - 2} width="22" height="4" rx="1" className={styles.barAccent} />
        </g>
      ))}
      <circle cx="200" cy="150" r="46" className={`${styles.ring} ${styles.flowSlow}`} />
      <Core r={26} />
      <path d="M200 134l3.4 9.6 9.6 3.4-9.6 3.4-3.4 9.6-3.4-9.6-9.6-3.4 9.6-3.4z" fill="#1a1a1a" opacity=".9" />
    </>
  );
}

const ART = {
  'business-consultation': Consultation,
  'odoo-services': Odoo,
  'custom-industry-solutions': Custom,
  'ai-automation': Automation,
};

/** Premium illustrative card for a service, drawn in the O2One mark's own language (ring + orange core). */
export default function ServiceArt({ service }) {
  const Art = ART[service.slug] || Consultation;
  return (
    <div className={styles.card} aria-hidden="true">
      <svg viewBox="0 0 400 300" className={styles.svg} role="presentation">
        <defs>
          <radialGradient id="sa-glow">
            <stop offset="0" stopColor={ORANGE} stopOpacity=".5" />
            <stop offset="1" stopColor={ORANGE} stopOpacity="0" />
          </radialGradient>
        </defs>
        <Art />
      </svg>
      <div className={styles.cap}>
        <span className={`num ${styles.capNum}`}>{service.number}</span>
        <span className={styles.capName}>{service.name}</span>
      </div>
    </div>
  );
}
