import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LazyFrame } from "./LazyFrame";
import { SCREENS } from "./registry";
import type { Area, Case, Persona, ScreenDef } from "./types";
import "./screens.css";

const AREAS: { key: Area; label: string }[] = [
  { key: "user", label: "사용자" },
  { key: "expert", label: "전문가" },
  { key: "admin", label: "운영자" },
];

const PERSONA_LABEL: Record<Persona, string> = {
  guest: "손님",
  user: "사용자",
  expert: "전문가",
  admin: "운영자",
};

// 칸 크기. 사용자·전문가는 모바일 390x844 를 0.6배, 운영자는 PC 1280x800 을 0.375배
const SIZE: Record<Area, { width: number; height: number; scale: number }> = {
  user: { width: 390, height: 844, scale: 0.6 },
  expert: { width: 390, height: 844, scale: 0.6 },
  admin: { width: 1280, height: 800, scale: 0.375 },
};

// 묶음 칩 이름. path 첫 세그먼트로 묶고, 표에 없거나 혼자뿐인 세그먼트는 '기타'
const GROUP_LABEL: Record<string, string> = {
  my: "내 정보",
  experts: "전문가 찾기",
  community: "커뮤니티",
  checkout: "결제",
  expert: "전문가센터",
  admin: "운영",
};
const ETC = "기타";

function segmentOf(path: string) {
  return path.split("/")[1] ?? "";
}

function isArea(v: string | null): v is Area {
  return v === "user" || v === "expert" || v === "admin";
}

function frameSrc(href: string, as: Persona | undefined) {
  const sep = href.includes("?") ? "&" : "?";
  return `${window.location.pathname}#${href}${sep}preview=1&as=${as ?? "guest"}`;
}

function normalHref(href: string) {
  return `${window.location.pathname}#${href}`;
}

function CaseCell({ screen, c }: { screen: ScreenDef; c: Case }) {
  const persona = c.as ?? "guest";
  const { width, height, scale } = SIZE[screen.area];
  return (
    <div className="screens-cell">
      {c.href && (
        <LazyFrame
          src={frameSrc(c.href, c.as)}
          open={normalHref(c.href)}
          title={`${screen.name} - ${c.label}`}
          width={width}
          height={height}
          scale={scale}
        />
      )}
      <div className="screens-cell-head">
        <span className="screens-cell-label">{c.label}</span>
        <span className="screens-badge">{PERSONA_LABEL[persona]}</span>
      </div>
      <div className="screens-cell-code">{c.code}</div>
      {c.note && <p className="screens-note">{c.note}</p>}
    </div>
  );
}

function ScreenSection({ screen }: { screen: ScreenDef }) {
  // skip 이거나 주소가 없는 경우는 칸 대신 글줄
  const frames = screen.cases.filter((c) => !c.skip && c.href);
  const lines = screen.cases.filter((c) => c.skip || !c.href);
  return (
    <section className="screens-section">
      <h3 className="screens-section-title">
        {screen.name}
        <span className="screens-meta">
          {screen.code} · {screen.path}
        </span>
      </h3>
      {frames.length > 0 && (
        <div className="screens-grid">
          {frames.map((c) => (
            <CaseCell key={c.code} screen={screen} c={c} />
          ))}
        </div>
      )}
      {lines.length > 0 && (
        <ul className="screens-lines">
          {lines.map((c) => (
            <li key={c.code} className="screens-line">
              <span className="screens-badge screens-badge-skip">{c.skip ?? "주소 없음"}</span>
              <b>{c.label}</b>
              <span className="screens-meta">{c.code}</span>
              {c.note && <span className="screens-line-note">{c.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Board() {
  const [params, setParams] = useSearchParams();
  const areaParam = params.get("area");
  const area: Area = isArea(areaParam) ? areaParam : "user";
  const [group, setGroup] = useState<string | null>(null);

  const inArea = SCREENS.filter((s) => s.area === area);

  // 같은 영역 안에서 첫 세그먼트가 하나뿐인 화면(/, /search 등)은 기타
  const segCount = new Map<string, number>();
  for (const s of inArea) segCount.set(segmentOf(s.path), (segCount.get(segmentOf(s.path)) ?? 0) + 1);
  const groupOf = (s: ScreenDef) => {
    const seg = segmentOf(s.path);
    if ((segCount.get(seg) ?? 0) < 2) return ETC;
    return GROUP_LABEL[seg] ?? `/${seg}`;
  };

  const groups: string[] = [];
  for (const s of inArea) {
    const g = groupOf(s);
    if (!groups.includes(g)) groups.push(g);
  }
  const activeGroup = group && groups.includes(group) ? group : null;
  const shown = inArea.filter((s) => !activeGroup || groupOf(s) === activeGroup);
  const countOf = (a: Area) => SCREENS.filter((s) => s.area === a).length;

  function selectArea(a: Area) {
    setGroup(null);
    setParams({ area: a }, { replace: true });
  }

  return (
    <main className="screens-page">
      <h1 className="screens-title">
        화면 보드 <span className="screens-meta">{SCREENS.length}개 화면</span>
      </h1>
      <nav className="screens-tabs" aria-label="영역">
        {AREAS.map((a) => (
          <button
            key={a.key}
            type="button"
            className="screens-tab"
            aria-current={a.key === area ? "page" : undefined}
            onClick={() => selectArea(a.key)}
          >
            {a.label} <span className="screens-meta">{countOf(a.key)}</span>
          </button>
        ))}
      </nav>
      {groups.length > 1 && (
        <nav className="screens-chips" aria-label="묶음">
          <button
            type="button"
            className="screens-chip"
            aria-current={!activeGroup ? "true" : undefined}
            onClick={() => setGroup(null)}
          >
            전체
          </button>
          {groups.map((g) => (
            <button
              key={g}
              type="button"
              className="screens-chip"
              aria-current={g === activeGroup ? "true" : undefined}
              onClick={() => setGroup(g)}
            >
              {g}
            </button>
          ))}
        </nav>
      )}
      {shown.length === 0 ? (
        <p className="screens-empty">등록된 화면이 없음</p>
      ) : (
        shown.map((s) => <ScreenSection key={s.code} screen={s} />)
      )}
    </main>
  );
}
