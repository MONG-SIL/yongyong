import type { ReactNode } from "react";

type IconProps = { name: string; size?: number };

const paths: Record<string, ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  map: (
    <>
      <path d="m9 18-5 2V6l5-2 6 2 5-2v14l-5 2-6-2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.2c1.4-2.6 3.7-3.7 6.5-3.7s5.1 1.1 6.5 3.7" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  back: <path d="M15 5 8 12l7 7" />,
  pin: (
    <>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle cx="12" cy="11" r="1.6" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  sparkle: (
    <>
      <path d="M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9z" />
      <path d="M18 15.5 18.6 17.4 20.5 18 18.6 18.6 18 20.5 17.4 18.6 15.5 18 17.4 17.4z" />
    </>
  ),
  filter: (
    <>
      <path d="M5 7h14M7 12h10M9 17h6" />
    </>
  ),
  bot: (
    <>
      <rect x="5" y="8" width="14" height="10" rx="3" />
      <path d="M12 8V5M9 13h.01M15 13h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M5 19V10M12 19V5M19 19v-7" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.2" />
    </>
  ),
  check: <path d="m5 12 4.2 4.2L19 7.5" />,
  shield: (
    <>
      <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 6.8-7 8.8-4.2-2-7-4.6-7-8.8V6.5z" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.8 6.2l1.6 1.6M17.6 16.2l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.8 17.8l1.6-1.6M17.6 7.8l1.6-1.6" />
    </>
  ),
  camera: (
    <>
      <path d="M8 8.5 9.2 6.5h5.6L16 8.5h2.2v9H5.8v-9z" />
      <circle cx="12" cy="12.5" r="2.2" />
    </>
  ),
  heart: <path d="M12 19s-6.5-3.8-6.5-8A3.5 3.5 0 0 1 12 8.2 3.5 3.5 0 0 1 18.5 11c0 4.2-6.5 8-6.5 8z" />,
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.8v3.2M16 3.8v3.2M4 10h16" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v4.5" />
      <path d="M12 8h.01" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l4 4V20.5H7z" />
      <path d="M14 3.5v4h4" />
    </>
  ),
  logout: (
    <>
      <path d="M10 6H6.5v12H10" />
      <path d="M10 12h9M16 8.5 19.5 12 16 15.5" />
    </>
  ),
  bookmark: (
    <>
      <path d="M7 4.5h10v15l-5-3-5 3z" />
    </>
  ),
  plus: <path d="M12 6v12M6 12h12" />,
  minus: <path d="M6 12h12" />,
  phone: (
    <>
      <path d="M8 4.5h2.2l1.2 3-1.6 1a12 12 0 0 0 5.7 5.7l1-1.6 3 1.2V16a2 2 0 0 1-2.2 2A14.5 14.5 0 0 1 6 6.7 2 2 0 0 1 8 4.5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8v4.5l3 2" />
    </>
  ),
  share: (
    <>
      <circle cx="7" cy="12" r="2" />
      <circle cx="17" cy="7" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="m8.8 11 6.2-3.2M8.8 13l6.2 3.2" />
    </>
  ),
  close: <path d="m7 7 10 10M17 7 7 17" />,
  send: <path d="m4 12 16-7-6 16-2.2-6.2z" />,
  building: (
    <>
      <path d="M5 20V6l7-2.5L19 6v14" />
      <path d="M9 20v-4h6v4M9 9h.01M12 9h.01M15 9h.01M9 12.5h.01M12 12.5h.01M15 12.5h.01" />
    </>
  ),
  school: (
    <>
      <path d="m3.5 10 8.5-5 8.5 5-8.5 5z" />
      <path d="M7 12.2V17c1.6 1.3 3.2 2 5 2s3.4-.7 5-2v-4.8" />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="8" r="2.4" />
      <path d="M8 20v-2.2a4 4 0 0 1 8 0V20" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="6.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 3.5V6M12 18v2.5M3.5 12H6M18 12h2.5" />
    </>
  ),
  list: (
    <>
      <path d="M8 7h11M8 12h11M8 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4.5v1.8M12 17.7v1.8M4.5 12h1.8M17.7 12h1.8M6.7 6.7l1.3 1.3M16 16l1.3 1.3M17.3 6.7 16 8M8 16l-1.3 1.3" />
    </>
  ),
};

export function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] ?? null}
    </svg>
  );
}
