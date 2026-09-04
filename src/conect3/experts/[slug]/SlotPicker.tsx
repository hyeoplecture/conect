"use client";

// 전문가가 연 시간 중에서 지금 예약할 수 있는 것만 골라 보여준다.
// 날짜를 먼저 고르고 그 날의 시간을 고르는 두 단계로 나눈다. 30일치를 한 번에
// 격자로 펴면 스크롤이 너무 길어진다.

import { useMemo, useState } from "react";
import { MIN_LEAD_HOURS, availability } from "@/app/conect3/_lib/data";
import { dateKey, dayLabel, formatTime } from "@/app/conect3/_lib/format";
import { EmptyState } from "@/app/conect3/_components/ui";

export function SlotPicker({
  expertId,
  value,
  onChange,
}: {
  expertId: string;
  value: string | null;
  onChange: (iso: string) => void;
}) {
  const { loaded, rows } = availability.useList();
  const [day, setDay] = useState<string | null>(null);
  // 렌더 중 Date.now()를 부르면 다시 그릴 때마다 기준이 달라진다. 한 번만 읽는다.
  const [now] = useState(() => Date.now());

  const days = useMemo(() => {
    // 지금부터 MIN_LEAD_HOURS 뒤보다 나중인 열린 시간만 남긴다.
    const limit = now + MIN_LEAD_HOURS * 3600000;
    const open = rows
      .filter(
        (a) =>
          a.expertId === expertId &&
          a.state === "open" &&
          new Date(a.startsAt).getTime() >= limit,
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

    const map = new Map<string, string[]>();
    open.forEach((a) => {
      const key = dateKey(a.startsAt);
      const list = map.get(key);
      if (list) list.push(a.startsAt);
      else map.set(key, [a.startsAt]);
    });
    return [...map.entries()].map(([key, slots]) => ({ key, slots }));
  }, [rows, expertId, now]);

  if (!loaded) return null;

  if (days.length === 0) {
    return <EmptyState title="지금은 열린 시간이 없어요" body="다른 전문가를 찾아보세요" />;
  }

  const selectedDay = days.find((d) => d.key === day) ?? days[0];

  return (
    <div>
      <p className="px-(--gutter) text-t2 text-fg-placeholder">한국 시간 기준</p>

      <div className="mt-3 flex gap-2 overflow-x-auto px-(--gutter) pb-1">
        {days.map((d) => {
          const on = d.key === selectedDay.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setDay(d.key)}
              className={`flex shrink-0 flex-col items-center rounded-r3 border px-3.5 py-2 transition-colors ${
                on
                  ? "border-bg-brand-solid bg-bg-brand-weak"
                  : "border-stroke-neutral-weak bg-bg-layer-default"
              }`}
            >
              <span
                className={`text-t3 font-semibold ${on ? "text-fg-brand" : "text-fg-neutral"}`}
              >
                {dayLabel(d.slots[0])}
              </span>
              <span className="mt-0.5 text-t1 text-fg-placeholder tabular-nums">
                {d.slots.length}개
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 px-(--gutter)">
        {selectedDay.slots.map((iso) => {
          const on = iso === value;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              className={`h-10 rounded-r2 border text-t3 tabular-nums transition-colors ${
                on
                  ? "border-bg-brand-solid bg-bg-brand-solid font-semibold text-fg-neutral-inverted"
                  : "border-stroke-neutral-weak bg-bg-layer-default text-fg-neutral-muted"
              }`}
            >
              {formatTime(iso)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
