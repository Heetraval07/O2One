// Small line icons, drawn to a 24px grid, inheriting currentColor.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

const make = (paths, extra = {}) =>
  function Icon({ size = 20, className, ...rest }) {
    return (
      <svg
        {...base}
        width={size}
        height={size}
        className={[extra.className, className].filter(Boolean).join(' ') || undefined}
        {...rest}
      >
        {paths}
      </svg>
    );
  };

export const ArrowRight = make(<path d="M4 12h15M13 6l6 6-6 6" />, { className: 'icon-arrow' });
export const ArrowDown = make(<path d="M12 4v15M6 13l6 6 6-6" />);
export const ArrowLeft = make(<path d="M20 12H5M11 6l-6 6 6 6" />);
export const ChevronDown = make(<path d="M6 9l6 6 6-6" />);
export const ChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const ChevronLeft = make(<path d="M15 6l-6 6 6 6" />);
export const Check = make(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const Close = make(<path d="M6 6l12 12M18 6L6 18" />);
export const Menu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const Plus = make(<path d="M12 5v14M5 12h14" />);
export const Minus = make(<path d="M5 12h14" />);
export const Search = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </>,
);
export const Mail = make(
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="1" />
    <path d="M3.5 6.5l8.5 7 8.5-7" />
  </>,
);
export const Phone = make(
  <path d="M6.6 3.5h2.6l1.4 4.2-2 1.4a12 12 0 006.3 6.3l1.4-2 4.2 1.4v2.6a1.6 1.6 0 01-1.7 1.6C11 18.4 5.6 13 5 5.2a1.6 1.6 0 011.6-1.7z" />,
);
export const Pin = make(
  <>
    <path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0113 0c0 4.8-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </>,
);
export const Chat = make(
  <path d="M4 19.5l1.3-3.9A7.8 7.8 0 1112 19.8a7.7 7.7 0 01-4-1.1L4 19.5zM9 10.5h6M9 13.5h4" />,
);
export const Calendar = make(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="1" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
  </>,
);
export const Clock = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);
export const Video = make(
  <>
    <rect x="3" y="6.5" width="12.5" height="11" rx="1" />
    <path d="M15.5 10.5l5-3v9l-5-3" />
  </>,
);
export const Users = make(
  <>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 5.6a3.2 3.2 0 010 5.8M17.5 14.3c1.6.6 2.7 2.1 3 4.7" />
  </>,
);
export const Download = make(<path d="M12 4v11M7 10l5 5 5-5M5 19.5h14" />);
export const Linkedin = make(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
    <path d="M8 10.5v6M8 7.5v.01M11.5 16.5v-6M11.5 13c0-1.6 1-2.5 2.3-2.5s2.2.9 2.2 2.5v3.5" />
  </>,
);
export const Instagram = make(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="3.8" />
    <path d="M17.2 6.8v.01" />
  </>,
);
export const Facebook = make(<path d="M14 21v-8h2.7l.5-3.2H14V7.8c0-.9.4-1.6 1.7-1.6h1.6V3.4C16.9 3.3 16 3.2 15 3.2c-2.4 0-4 1.5-4 4.1v2.5H8.3V13H11v8z" />);
export const Twitter = make(<path d="M4 4l6.8 9.2L4.2 20h1.9l5.6-5.9 4.3 5.9H20l-7.2-9.8L19.1 4h-1.9l-5.2 5.5L8 4z" />);

// Value icons
export const Award = make(
  <>
    <circle cx="12" cy="9" r="5.5" />
    <path d="M8.5 13.8L7 21l5-3 5 3-1.5-7.2" />
  </>,
);
export const ShieldCheck = make(
  <>
    <path d="M12 3l7 3v5.5c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6z" />
    <path d="M9 12l2.5 2.5L15.5 9.5" />
  </>,
);
export const Eye = make(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
export const Link2 = make(
  <>
    <circle cx="9" cy="12" r="5" />
    <circle cx="15" cy="12" r="5" />
  </>,
);

/** The WhatsApp logo (filled, so it doesn't use the line-icon helper above). */
export function WhatsApp({ size = 20, className, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" className={className} {...rest}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
