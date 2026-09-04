"use client";

// 시간표. 요일별 기본값으로 한 번에 열고, 날짜별로 한 칸씩 손본다.

import { useMemo, useState } from "react";
import {
  SCHEDULE_DAYS,
  availability,
  openDefaultSchedule,
  type Expert,
} from "@/app/conect3/_lib/data";
import { newId } from "@/app/conect3/_lib/store";
import { useSession } from "@/app/conect3/_lib/session";
import { dayLabel, formatTime } from "@/app/conect3/_lib/format";
import { AppBar, ExpertTabBar, Modal } from "@/app/conect3/_components/shell";
import {
  Button,
  ButtonLink,
  Chip,
  Divider,
  EmptyState,
  SectionTitle,
} from "@/app/conect3/_components/ui";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];
const DEFAULT_HOURS = [10, 11, 12, 13, 14, 15, 16, 17];
/** 격자에 그리는 시간 범위. 기본값보다 넓게 둬서 이른 시간도 열 수 있다. */
const GRID_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export default function ExpertSchedulePage() {
  const { loaded, expert } = useSession();

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="시간표" />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="전문가로 등록하면 볼 수 있어요"
            action={
              <ButtonLink href="/conect3/expert/apply" size="md">
                전문가로 등록하기
              </ButtonLink>
            }
          />
        </main>
        <ExpertTabBar />
      </>
    );
  }

  return <Schedule expert={expert} />;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function Schedule({ expert }: { expert: Expert }) {
  const { rows: allSlots } = availability.useList();

  const [weekdays, setWeekdays] = useState<number[]>(DEFAULT_WEEKDAYS);
  const [hours, setHours] = useState<number[]>(DEFAULT_HOURS);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dayIndex, setDayIndex] = useState(0);

  const days = useMemo(() => {
    const base = startOfToday();
    return Array.from({ length: SCHEDULE_DAYS + 1 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const mine = allSlots.filter((a) => a.expertId === expert.id);
  const selected = days[dayIndex];
  const [now] = useState(() => Date.now());

  const toggle = (list: number[], value: number, set: (v: number[]) => void) => {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value].sort((a, b) => a - b));
  };

  const cells = GRID_HOURS.map((hour) => {
    const at = new Date(selected);
    at.setHours(hour, 0, 0, 0);
    const iso = at.toISOString();
    const slot = mine.find((a) => a.startsAt === iso);
    return { hour, iso, slot, past: at.getTime() <= now };
  });

  const openCell = (iso: string) => {
    availability.insert({
      id: newId("av"),
      expertId: expert.id,
      startsAt: iso,
      state: "open",
    });
  };

  const openCount = cells.filter((c) => c.slot?.state === "open").length;
  const bookedCount = cells.filter((c) => c.slot?.state === "booked").length;

  return (
    <>
      <AppBar title="시간표" />

      <main className="flex-1 overflow-y-auto">
        <p className="px-(--gutter) pt-3 text-t2 text-fg-placeholder">한국 시간 기준</p>

        <section className="px-(--gutter) py-4">
          <SectionTitle>요일별 기본값</SectionTitle>
          <p className="mt-1 text-t3 text-fg-neutral-subtle">
            고른 요일과 시간대로 오늘부터 {SCHEDULE_DAYS}일치를 한 번에 엽니다.
          </p>

          <p className="mt-4 mb-2 text-t3 text-fg-neutral-subtle">요일</p>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, i) => (
              <Chip
                key={label}
                selected={weekdays.includes(i)}
                onClick={() => toggle(weekdays, i, setWeekdays)}
              >
                {label}
              </Chip>
            ))}
          </div>

          <p className="mt-4 mb-2 text-t3 text-fg-neutral-subtle">시간대</p>
          <div className="flex flex-wrap gap-1.5">
            {GRID_HOURS.map((h) => (
              <Chip
                key={h}
                selected={hours.includes(h)}
                onClick={() => toggle(hours, h, setHours)}
              >
                {h}시
              </Chip>
            ))}
          </div>

          <div className="mt-4">
            <Button
              disabled={weekdays.length === 0 || hours.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              이 설정으로 {SCHEDULE_DAYS}일치 열기
            </Button>
          </div>
        </section>

        <Divider />

        <section className="py-4">
          <div className="px-(--gutter)">
            <SectionTitle>날짜별로 고치기</SectionTitle>
            <p className="mt-1 text-t3 text-fg-neutral-subtle">
              칸을 누르면 열고 닫습니다. 예약된 시간은 바꿀 수 없습니다.
            </p>
          </div>

          <div className="mt-3 flex gap-1.5 overflow-x-auto px-(--gutter) pb-1">
            {days.map((d, i) => (
              <button
                key={d.toISOString()}
                type="button"
                onClick={() => setDayIndex(i)}
                className={`flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-r3 border text-t2 ${
                  i === dayIndex
                    ? "border-bg-brand-solid bg-bg-brand-solid font-semibold text-fg-neutral-inverted"
                    : "border-stroke-neutral-weak text-fg-neutral-muted"
                }`}
              >
                <span>{WEEKDAY_LABELS[d.getDay()]}</span>
                <span className="text-t4 font-semibold tabular-nums">{d.getDate()}</span>
              </button>
            ))}
          </div>

          <div className="px-(--gutter) pt-4">
            <p className="text-t4 font-semibold">
              {dayLabel(selected.toISOString())}
              <span className="ml-2 text-t3 font-normal text-fg-neutral-subtle tabular-nums">
                열림 {openCount} · 예약 {bookedCount}
              </span>
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {cells.map(({ iso, slot, past }) => {
                const booked = slot?.state === "booked" || slot?.state === "held";
                const open = slot?.state === "open";
                const style = booked
                  ? "border-stroke-neutral-weak bg-bg-neutral-weak text-fg-neutral-subtle"
                  : open
                    ? "border-stroke-brand-solid bg-bg-brand-weak text-fg-brand font-semibold"
                    : "border-stroke-neutral-subtle text-fg-placeholder";
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={booked || past}
                    onClick={() => (open ? availability.remove(slot!.id) : openCell(iso))}
                    className={`flex h-14 flex-col items-center justify-center rounded-r3 border text-t3 disabled:opacity-50 ${style}`}
                  >
                    <span className="tabular-nums">{formatTime(iso)}</span>
                    <span className="text-t1">
                      {booked ? "예약됨" : open ? "열림" : "닫힘"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-3 text-t2 text-fg-placeholder">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-bg-brand-solid" />열림
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-bg-neutral-weak" />예약됨
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-stroke-neutral-weak" />
                닫힘
              </span>
            </div>
          </div>
        </section>
      </main>

      <Modal
        open={confirmOpen}
        title={`${SCHEDULE_DAYS}일치를 다시 열까요`}
        body="지금 열어 둔 시간은 지워지고 고른 설정으로 새로 만들어집니다. 이미 예약된 시간은 그대로 남습니다."
        cancelLabel="취소"
        confirmLabel="열기"
        onConfirm={() => openDefaultSchedule(expert.id, hours, weekdays)}
        onClose={() => setConfirmOpen(false)}
      />

      <ExpertTabBar />
    </>
  );
}
