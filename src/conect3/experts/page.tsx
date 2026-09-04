"use client";

// 전문가 탭. 전체 목록과 정렬을 맡는다.
// 120명을 한 번에 그리면 스크롤이 끝없이 길어지므로 20명씩 이어붙인다.

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppBar, Sheet, TabBar } from "../_components/shell";
import { ExpertRow } from "../_components/cards";
import { Chip, EmptyState } from "../_components/ui";
import { IconCheck, IconSort } from "../_components/icons";
import {
  FIELDS,
  MIN_LEAD_HOURS,
  availability,
  experts,
  ratingOf,
  type Availability,
  type Expert,
  type Field,
} from "../_lib/data";

type Sort = "recommend" | "price" | "soon";

const SORTS: { value: Sort; label: string }[] = [
  { value: "recommend", label: "추천순" },
  { value: "price", label: "가격 낮은순" },
  { value: "soon", label: "빠른 예약순" },
];

const PAGE = 20;

/** 전문가별로 지금 잡을 수 있는 가장 이른 시간. 빠른 예약순이 여기서 나온다. */
function earliestSlots(slots: Availability[], now: number) {
  const from = now + MIN_LEAD_HOURS * 3600000;
  const map = new Map<string, number>();
  for (const slot of slots) {
    if (slot.state !== "open") continue;
    const t = new Date(slot.startsAt).getTime();
    if (t < from) continue;
    const seen = map.get(slot.expertId);
    if (seen === undefined || t < seen) map.set(slot.expertId, t);
  }
  return map;
}

/** 평점이 있는 사람을 먼저, 그 안에서 높은 순. 평점이 감춰진 사람은 뒤로 민다. */
function byRating(a: Expert, b: Expert) {
  const ra = ratingOf(a);
  const rb = ratingOf(b);
  if (ra === null && rb === null) return b.ratingCount - a.ratingCount;
  if (ra === null) return 1;
  if (rb === null) return -1;
  if (rb !== ra) return rb - ra;
  return b.ratingCount - a.ratingCount;
}

export default function ExpertsPage() {
  // useSearchParams는 Suspense 경계 안에 있어야 빌드가 통과한다.
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <ExpertsBody />
    </Suspense>
  );
}

function ExpertsBody() {
  const params = useSearchParams();
  const initial = params.get("field");

  const [now] = useState(() => Date.now());
  const { loaded, rows } = experts.useList();
  const { rows: slots } = availability.useList();

  const [field, setField] = useState<Field | null>(
    FIELDS.includes(initial as Field) ? (initial as Field) : null,
  );
  const [sort, setSort] = useState<Sort>("recommend");
  const [sortOpen, setSortOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);

  const earliest = useMemo(() => earliestSlots(slots, now), [slots, now]);

  const list = useMemo(() => {
    const picked = rows.filter(
      (e) => e.status === "approved" && (field === null || e.field === field),
    );
    return picked.sort((a, b) => {
      if (sort === "price") return a.pricePerHour - b.pricePerHour;
      if (sort === "soon") {
        const ta = earliest.get(a.id) ?? Infinity;
        const tb = earliest.get(b.id) ?? Infinity;
        return ta - tb;
      }
      return byRating(a, b);
    });
  }, [rows, field, sort, earliest]);

  // 분야나 정렬이 바뀌면 처음부터 다시 센다. 효과가 아니라 누르는 곳에서 되돌린다.
  const pickField = (f: Field | null) => {
    setField(f);
    setShown(PAGE);
  };
  const pickSort = (s: Sort) => {
    setSort(s);
    setShown(PAGE);
    setSortOpen(false);
  };

  const hasMore = shown < list.length;
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShown((n) => n + PAGE);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, list.length]);

  const sortLabel = SORTS.find((s) => s.value === sort)!.label;

  return (
    <>
      <AppBar title="전문가" bell />

      <main className="flex-1 overflow-y-auto">
        <div className="flex gap-2 overflow-x-auto px-(--gutter) pt-1 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip selected={field === null} onClick={() => pickField(null)}>
            전체
          </Chip>
          {FIELDS.map((f) => (
            <Chip key={f} selected={field === f} onClick={() => pickField(f)}>
              {f}
            </Chip>
          ))}
        </div>

        <div className="flex items-center justify-between px-(--gutter) py-2.5">
          <span className="text-t3 text-fg-neutral-subtle">
            {loaded ? (
              <>
                전문가 <span className="tabular-nums">{list.length}</span>명
              </>
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-1 text-t3 text-fg-neutral-muted"
          >
            <IconSort />
            {sortLabel}
          </button>
        </div>

        {!loaded ? null : list.length === 0 ? (
          <EmptyState title="이 분야에 등록된 전문가가 없어요" body="다른 분야를 눌러 보세요" />
        ) : (
          <>
            <ul className="border-t border-stroke-neutral-subtle">
              {list.slice(0, shown).map((e) => (
                <ExpertRow key={e.id} expert={e} />
              ))}
            </ul>
            {/* 스크롤이 닿으면 20명씩 더 붙인다. 더 없으면 감지 요소를 없앤다. */}
            {hasMore ? <div ref={sentinel} className="h-10" aria-hidden /> : null}
          </>
        )}
      </main>

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="정렬">
        <ul>
          {SORTS.map((s) => (
            <li key={s.value}>
              <button
                type="button"
                onClick={() => pickSort(s.value)}
                className="flex w-full items-center justify-between py-3.5 text-left text-t4"
              >
                <span className={sort === s.value ? "font-semibold text-fg-brand" : ""}>
                  {s.label}
                </span>
                {sort === s.value ? (
                  <span className="text-fg-brand">
                    <IconCheck />
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <TabBar />
    </>
  );
}
