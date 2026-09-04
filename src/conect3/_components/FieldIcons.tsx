// 카테고리 아이콘. 색을 쓰지 않고 선만으로 그린다.
// 색은 상위에서 currentColor로 넘긴다.

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconAll() {
  return (
    <svg {...base}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

/** 법률: 저울 */
export function IconLaw() {
  return (
    <svg {...base}>
      <path d="M12 4v16M7 20h10M5 8h14M5 8l-2.5 5h5L5 8ZM19 8l-2.5 5h5L19 8Z" />
    </svg>
  );
}

/** 세무: 계산기 */
export function IconTax() {
  return (
    <svg {...base}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </svg>
  );
}

/** 부동산: 집 */
export function IconHouse() {
  return (
    <svg {...base}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

/** 진로: 나침반 */
export function IconCompass() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15 9-1.8 4.2L9 15l1.8-4.2L15 9Z" />
    </svg>
  );
}

/** 건강: 맥박 */
export function IconPulse() {
  return (
    <svg {...base}>
      <path d="M3.5 12h3.5l2-5 3 10 2.5-5h6" />
    </svg>
  );
}

/** 재테크: 성장 그래프 */
export function IconGrowth() {
  return (
    <svg {...base}>
      <path d="M4 19h16M7 19v-5M11.5 19v-9M16 19v-6" />
      <path d="m6 9 4.5-4L14 8l5-5" />
    </svg>
  );
}

/** IT: 코드 */
export function IconCode() {
  return (
    <svg {...base}>
      <path d="m8.5 8-4 4 4 4M15.5 8l4 4-4 4M13.5 5.5l-3 13" />
    </svg>
  );
}
