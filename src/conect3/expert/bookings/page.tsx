"use client";

// 받은 예약 목록. 상태로만 걸러 본다.

import { useState } from "react";
import { bookings, type Expert } from "@/app/conect3/_lib/data";
import { useSession } from "@/app/conect3/_lib/session";
import { AppBar, ExpertTabBar } from "@/app/conect3/_components/shell";
import { ButtonLink, EmptyState, Segmented } from "@/app/conect3/_components/ui";
import { BookingRow } from "@/app/conect3/_components/cards";

type Filter = "all" | "upcoming" | "done" | "canceled";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "upcoming", label: "예정" },
  { value: "done", label: "완료" },
  { value: "canceled", label: "취소" },
];

export default function ExpertBookingsPage() {
  const { loaded, expert } = useSession();

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="예약" />
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

  return <List expert={expert} />;
}

function List({ expert }: { expert: Expert }) {
  const { rows } = bookings.useList();
  const [filter, setFilter] = useState<Filter>("all");

  const mine = rows
    .filter((b) => b.expertId === expert.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  const list = mine.filter((b) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return b.status === "confirmed";
    if (filter === "done") return b.status === "completed";
    return b.status === "canceled" || b.status === "no_show";
  });

  return (
    <>
      <AppBar title="예약" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-(--gutter) py-3">
          <Segmented options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {list.length === 0 ? (
          <EmptyState
            title="해당하는 예약이 없습니다"
            body={
              mine.length === 0
                ? "시간표를 열어 두면 예약을 받을 수 있습니다."
                : "다른 상태를 골라 보세요."
            }
            action={
              mine.length === 0 ? (
                <ButtonLink href="/conect3/expert/schedule" size="md">
                  시간표 열기
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          <ul>
            {list.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                side="expert"
                href={`/conect3/expert/bookings/${b.id}`}
              />
            ))}
          </ul>
        )}
      </main>

      <ExpertTabBar />
    </>
  );
}
