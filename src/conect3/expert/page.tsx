"use client";

// 전문가 대시보드. 오늘 할 일이 맨 위, 숫자는 그 아래에 둔다.

import Link from "next/link";
import { useState } from "react";
import {
  availability,
  bookings,
  ratingOf,
  settlements,
  type Expert,
} from "@/app/conect3/_lib/data";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice, formatTime } from "@/app/conect3/_lib/format";
import { AppBar, ExpertTabBar } from "@/app/conect3/_components/shell";
import {
  Button,
  ButtonLink,
  Divider,
  EmptyState,
  SectionTitle,
  Stat,
} from "@/app/conect3/_components/ui";
import { BookingRow } from "@/app/conect3/_components/cards";

export default function ExpertHomePage() {
  const { loaded, expert } = useSession();

  if (!loaded) return <main className="flex-1" />;
  if (!expert) return <NotExpert />;

  return <Dashboard expert={expert} />;
}

function NotExpert() {
  return (
    <>
      <AppBar title="전문가 홈" />
      <main className="flex-1 overflow-y-auto">
        <EmptyState
          title="전문가로 등록하면 볼 수 있어요"
          body="직업과 상담료를 적으면 바로 예약을 받을 수 있습니다."
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

/** 상담 30분 전부터 들어갈 수 있다. */
function canJoin(startsAt: string, now: number) {
  const t = new Date(startsAt).getTime();
  return now >= t - 30 * 60000 && now <= t + 90 * 60000;
}

function Dashboard({ expert }: { expert: Expert }) {
  const { rows: allBookings } = bookings.useList();
  const { rows: allSettlements } = settlements.useList();
  const { rows: allSlots } = availability.useList();

  const [now] = useState(() => Date.now());
  const today = new Date(now);
  const dayStart = new Date(today).setHours(0, 0, 0, 0);
  const dayEnd = dayStart + 86400000;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();

  const mine = allBookings.filter((b) => b.expertId === expert.id);
  const mySettlements = allSettlements.filter((s) => s.expertId === expert.id);
  const mySlots = allSlots.filter((a) => a.expertId === expert.id);

  const todayList = mine
    .filter((b) => {
      const t = new Date(b.startsAt).getTime();
      return b.status === "confirmed" && t >= dayStart && t < dayEnd;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const inThisMonth = (bookingId: string) => {
    const b = allBookings.find((x) => x.id === bookingId);
    if (!b) return false;
    const t = new Date(b.startsAt).getTime();
    return t >= monthStart && t < monthEnd;
  };

  const monthBookings = mine.filter((b) => {
    const t = new Date(b.startsAt).getTime();
    return t >= monthStart && t < monthEnd && b.status !== "canceled";
  }).length;

  const monthIncome = mySettlements
    .filter((s) => s.status !== "pending" && inThisMonth(s.bookingId))
    .reduce((sum, s) => sum + s.net, 0);

  const waiting = mySettlements
    .filter((s) => s.status === "ready")
    .reduce((sum, s) => sum + s.net, 0);

  const rating = ratingOf(expert);

  const openCount = mySlots.filter((a) => a.state === "open").length;
  const bookedCount = mySlots.filter((a) => a.state === "booked").length;
  const total = openCount + bookedCount;
  const usage = total === 0 ? 0 : Math.round((bookedCount / total) * 100);

  const upcoming = mine
    .filter((b) => b.status === "confirmed" && new Date(b.startsAt).getTime() >= now)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, 3);

  return (
    <>
      <AppBar title="전문가 홈" bell />

      <main className="flex-1 overflow-y-auto">
        {total === 0 ? (
          <section className="px-(--gutter) pt-4">
            <div className="rounded-r3 border border-stroke-brand-solid bg-bg-brand-weak px-4 py-4">
              <p className="text-t4 font-semibold">예약을 받으려면 시간표를 열어야 합니다</p>
              <p className="mt-1 text-t3 text-fg-neutral-muted">
                요일과 시간대를 고르면 30일치를 한 번에 열 수 있습니다.
              </p>
              <div className="mt-3">
                <ButtonLink href="/conect3/expert/schedule" size="md">
                  시간표 열기
                </ButtonLink>
              </div>
            </div>
          </section>
        ) : null}

        <section className="px-(--gutter) py-4">
          <SectionTitle>오늘의 상담</SectionTitle>
          {todayList.length === 0 ? (
            <p className="mt-3 rounded-r3 bg-bg-neutral-weak px-3.5 py-4 text-t3 text-fg-neutral-subtle">
              오늘 예정된 상담이 없습니다
            </p>
          ) : (
            <ul className="mt-2">
              {todayList.map((b) => {
                const joinable = canJoin(b.startsAt, now);
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 border-b border-stroke-neutral-subtle py-3 last:border-0"
                  >
                    <span className="w-[70px] shrink-0 text-t3 font-semibold tabular-nums">
                      {formatTime(b.startsAt)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-t4">{b.guestName}</span>
                    <span className="shrink-0">
                      <Button
                        size="sm"
                        variant={joinable ? "primary" : "secondary"}
                        disabled={!joinable}
                        onClick={() => window.open(b.meetUrl, "_blank", "noopener")}
                      >
                        참여하기
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <Divider />

        <section className="px-(--gutter) py-4">
          <SectionTitle>이번 달</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="예약 건수" value={monthBookings} suffix="건" />
            <Stat label="확정 수입" value={monthIncome} suffix="원" />
            <Stat label="지급 대기" value={waiting} suffix="원" />
            <Stat label="평점" value={rating === null ? "-" : rating.toFixed(1)} />
          </div>
          <p className="mt-3 text-t3 text-fg-neutral-subtle tabular-nums">
            열어 둔 {total}시간 중 {bookedCount}시간이 예약됐습니다 · 가동률 {usage}%
          </p>
        </section>

        <Divider />

        <section className="py-4">
          <div className="px-(--gutter)">
            <SectionTitle
              action={
                <Link href="/conect3/expert/bookings" className="text-t3 text-fg-neutral-subtle">
                  전체 보기
                </Link>
              }
            >
              다음 예약
            </SectionTitle>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-3 px-(--gutter) text-t3 text-fg-neutral-subtle">
              아직 잡힌 예약이 없습니다
            </p>
          ) : (
            <ul className="mt-1">
              {upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  side="expert"
                  href={`/conect3/expert/bookings/${b.id}`}
                />
              ))}
            </ul>
          )}
        </section>

        <p className="px-(--gutter) pb-6 text-t2 text-fg-placeholder tabular-nums">
          지급 대기 금액 {formatPrice(waiting)}은 매월 1일과 16일에 지급합니다
        </p>
      </main>

      <ExpertTabBar />
    </>
  );
}
