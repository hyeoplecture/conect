"use client";

// 검색 결과. 앱바 자리에 입력을 직접 두어 들어오자마자 타이핑할 수 있게 한다.
// 필터는 시트 안에서 고르고 "적용"을 눌러야 목록에 반영한다. 고르는 도중에 결과가
// 흔들리면 무엇 때문에 줄었는지 알 수 없다.

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "../_components/shell";
import { ExpertRow } from "../_components/cards";
import { Button, Chip, EmptyState } from "../_components/ui";
import { IconBack, IconClose, IconFilter, IconSearch } from "../_components/icons";
import {
  FIELDS,
  MIN_LEAD_HOURS,
  availability,
  experts,
  type Availability,
  type Expert,
  type Field,
} from "../_lib/data";

type PriceBand = "low" | "mid" | "high";

const PRICE_BANDS: { value: PriceBand; label: string; test: (won: number) => boolean }[] = [
  { value: "low", label: "10만원 이하", test: (w) => w <= 100000 },
  { value: "mid", label: "10~20만원", test: (w) => w > 100000 && w <= 200000 },
  { value: "high", label: "20만원 이상", test: (w) => w > 200000 },
];

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
];

type Filters = { fields: Field[]; prices: PriceBand[]; days: number[] };

const NO_FILTER: Filters = { fields: [], prices: [], days: [] };

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/** 전문가별로 앞으로 열려 있는 슬롯의 요일 모음. 요일 필터가 여기서 나온다. */
function openWeekdays(slots: Availability[]) {
  const from = Date.now() + MIN_LEAD_HOURS * 3600000;
  const map = new Map<string, Set<number>>();
  for (const slot of slots) {
    if (slot.state !== "open") continue;
    const d = new Date(slot.startsAt);
    if (d.getTime() < from) continue;
    let set = map.get(slot.expertId);
    if (!set) {
      set = new Set();
      map.set(slot.expertId, set);
    }
    set.add(d.getDay());
  }
  return map;
}

function matchQuery(e: Expert, q: string) {
  const hay = `${e.name} ${e.job} ${e.field} ${e.headline} ${e.bio}`.toLowerCase();
  return hay.includes(q);
}

export default function SearchPage() {
  const router = useRouter();
  const { loaded, rows } = experts.useList();
  const { rows: slots } = availability.useList();

  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(NO_FILTER);
  const [draft, setDraft] = useState<Filters>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const weekdays = useMemo(() => openWeekdays(slots), [slots]);
  const filterCount = filters.fields.length + filters.prices.length + filters.days.length;
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    return rows.filter((e) => {
      if (e.status !== "approved") return false;
      if (q && !matchQuery(e, q)) return false;
      if (filters.fields.length && !filters.fields.includes(e.field)) return false;
      if (filters.prices.length) {
        const hit = PRICE_BANDS.some(
          (b) => filters.prices.includes(b.value) && b.test(e.pricePerHour),
        );
        if (!hit) return false;
      }
      if (filters.days.length) {
        const open = weekdays.get(e.id);
        if (!open || !filters.days.some((d) => open.has(d))) return false;
      }
      return true;
    });
  }, [rows, q, filters, weekdays]);

  const openFilter = () => {
    setDraft(filters);
    setFilterOpen(true);
  };

  const reset = () => {
    setFilters(NO_FILTER);
    setDraft(NO_FILTER);
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 bg-bg-layer-default pr-3 pl-(--gutter)">
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="-ml-2 grid size-9 shrink-0 place-items-center"
        >
          <IconBack />
        </button>
        <div className="flex h-[42px] flex-1 items-center gap-2 rounded-r3 bg-bg-neutral-weak px-3">
          <span className="shrink-0 text-fg-placeholder">
            <IconSearch size={18} />
          </span>
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 분야, 고민을 적어 보세요"
            aria-label="검색어"
            className="w-full bg-transparent text-t4 text-fg-neutral outline-none placeholder:text-fg-placeholder"
          />
          {query ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="shrink-0 text-fg-placeholder"
            >
              <IconClose size={16} />
            </button>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between border-t border-stroke-neutral-subtle px-(--gutter) py-2.5">
          <span className="text-t3 text-fg-neutral-subtle">
            {loaded ? (
              <>
                전문가 <span className="tabular-nums">{list.length}</span>명
              </>
            ) : null}
          </span>
          <button
            type="button"
            onClick={openFilter}
            className="flex items-center gap-1 text-t3 text-fg-neutral-muted"
          >
            <IconFilter />
            필터
            {filterCount > 0 ? (
              <span className="ml-0.5 grid size-[18px] place-items-center rounded-full bg-bg-brand-solid text-t1 font-semibold text-fg-neutral-inverted tabular-nums">
                {filterCount}
              </span>
            ) : null}
          </button>
        </div>

        {!loaded ? null : !q && filterCount === 0 ? (
          <div className="px-(--gutter) pt-5">
            <p className="text-t4 font-semibold">많이 찾는 분야</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {FIELDS.map((f) => (
                <Chip key={f} onClick={() => setQuery(f)}>
                  {f}
                </Chip>
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="찾는 조건에 맞는 전문가가 없어요"
            body="검색어를 줄이거나 필터를 풀어 보세요"
            action={
              <div className="mx-auto w-40">
                <Button variant="secondary" size="md" onClick={reset}>
                  필터 초기화
                </Button>
              </div>
            }
          />
        ) : (
          <ul>
            {list.map((e) => (
              <ExpertRow key={e.id} expert={e} />
            ))}
          </ul>
        )}
      </main>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="필터">
        <section>
          <p className="text-t4 font-semibold">분야</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FIELDS.map((f) => (
              <Chip
                key={f}
                selected={draft.fields.includes(f)}
                onClick={() => setDraft({ ...draft, fields: toggle(draft.fields, f) })}
              >
                {f}
              </Chip>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="text-t4 font-semibold">가격대</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRICE_BANDS.map((b) => (
              <Chip
                key={b.value}
                selected={draft.prices.includes(b.value)}
                onClick={() => setDraft({ ...draft, prices: toggle(draft.prices, b.value) })}
              >
                {b.label}
              </Chip>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <p className="text-t4 font-semibold">상담 가능 요일</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => (
              <Chip
                key={d.value}
                selected={draft.days.includes(d.value)}
                onClick={() => setDraft({ ...draft, days: toggle(draft.days, d.value) })}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </section>

        <div className="mt-7 flex gap-2">
          <div className="w-[38%]">
            <Button variant="secondary" onClick={() => setDraft(NO_FILTER)}>
              초기화
            </Button>
          </div>
          <Button
            onClick={() => {
              setFilters(draft);
              setFilterOpen(false);
            }}
          >
            적용
          </Button>
        </div>
      </Sheet>
    </>
  );
}
