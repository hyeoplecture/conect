// 선으로만 그린 아이콘. 색은 상위에서 currentColor로 넘긴다.
// 크기 기본값은 design-system.md의 규격을 따른다 (앱바·탭바 22).

type IconProps = { size?: number; filled?: boolean };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconBack({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
    </svg>
  );
}

export function IconChevron({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function IconSearch({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function IconBell({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSort({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.7" {...stroke}>
      <path d="M4 7h16M7 12h10M10 17h4" />
    </svg>
  );
}

export function IconSparkle({ size = 19 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.6" {...stroke}>
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9 12 3.5z" />
    </svg>
  );
}

export function IconCheck({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2" {...stroke}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function IconHome({ size = 22, filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
    >
      <path d="M3.5 10 12 3.5l8.5 6.5V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V10z" />
    </svg>
  );
}

export function IconFeed({ size = 22, filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
    >
      <path d="M4 5h16v11a2 2 0 0 1-2 2H8l-4 3V5z" />
    </svg>
  );
}

export function IconUser({ size = 22, filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1.8"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6" />
    </svg>
  );
}

export function IconHeart({ size = 20, filled = false }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth="1.6"
      {...stroke}
      fill={filled ? "currentColor" : "none"}
    >
      <path d="M12 19.5S4.5 15 4.5 10.3A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7.5 2.3c0 4.7-7.5 9.2-7.5 9.2z" />
    </svg>
  );
}

export function IconComment({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.6" {...stroke}>
      <path d="M4.5 5.5h15v10a2 2 0 0 1-2 2H8.5l-4 3v-15z" />
    </svg>
  );
}

export function IconImage({ size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" strokeWidth="1.6" {...stroke}>
      <rect x="3.5" y="5.5" width="21" height="17" rx="2.5" />
      <circle cx="10" cy="11.5" r="1.8" />
      <path d="m5 19 5.5-5 4 3.5 3.5-3 5 4.5" />
    </svg>
  );
}

export function IconGoogle({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.94a9 9 0 0 0 0 8.1l3.03-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.95l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function IconKakao({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#191600"
        d="M9 1.5c-4.14 0-7.5 2.64-7.5 5.9 0 2.1 1.4 3.94 3.5 4.98l-.88 3.24a.3.3 0 0 0 .45.33l3.86-2.55c.19.01.38.02.57.02 4.14 0 7.5-2.65 7.5-5.91S13.14 1.5 9 1.5Z"
      />
    </svg>
  );
}

/* ---------- conect3에서 추가한 것 ---------- */

export function IconStar({ size = 14, filled = true }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.6"
      {...stroke} fill={filled ? "currentColor" : "none"}>
      <path d="m12 3.8 2.6 5.3 5.9.9-4.3 4.2 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 10l5.9-.9L12 3.8z" />
    </svg>
  );
}

export function IconCalendar({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

export function IconClock({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconWallet({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="3.5" y="6" width="17" height="13" rx="3" />
      <path d="M3.5 10.5h17M16.5 14.5h1" />
    </svg>
  );
}

export function IconGrid({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </svg>
  );
}

export function IconClose({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.9" {...stroke}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPlus({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.9" {...stroke}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconFilter({ size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

export function IconShield({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <path d="M12 3.5 5 6v6c0 4.2 3 7.4 7 8.5 4-1.1 7-4.3 7-8.5V6l-7-2.5z" />
    </svg>
  );
}

export function IconVideo({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="1.8" {...stroke}>
      <rect x="3" y="6.5" width="12" height="11" rx="3" />
      <path d="m15 11 5-2.5v7L15 13z" />
    </svg>
  );
}
