"use client";

// 정산 내역. 상담 하나가 얼마로 남는지를 줄마다 다 보여준다.

import { useState } from "react";
import { bookings, settlements, type Expert } from "@/app/conect3/_lib/data";
import { withholding } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";
import { AppBar, ExpertTabBar } from "@/app/conect3/_components/shell";
import {
  Badge,
  ButtonLink,
  Divider,
  EmptyState,
  SectionTitle,
  Stat,
} from "@/app/conect3/_components/ui";

const STATUS: Record<
  "pending" | "ready" | "paid",
  { text: string; variant: "neutral" | "brand" | "positive" }
> = {
  pending: { text: "대기", variant: "neutral" },
  ready: { text: "지급예정", variant: "brand" },
  paid: { text: "지급완료", variant: "positive" },
};

export default function ExpertSettlementsPage() {
  const { loaded, expert } = useSession();

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="정산" />
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

  return <Settlements expert={expert} />;
}

function Settlements({ expert }: { expert: Expert }) {
  const { rows: allSettlements } = settlements.useList();
  const { rows: allBookings } = bookings.useList();

  const [now] = useState(() => new Date());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  const rows = allSettlements
    .filter((s) => s.expertId === expert.id)
    .map((s) => ({ settlement: s, booking: allBookings.find((b) => b.id === s.bookingId) }))
    .sort((a, b) =>
      (b.booking?.startsAt ?? "").localeCompare(a.booking?.startsAt ?? ""),
    );

  const waiting = rows
    .filter((r) => r.settlement.status === "ready")
    .reduce((sum, r) => sum + r.settlement.net, 0);
  const paid = rows
    .filter((r) => r.settlement.status === "paid")
    .reduce((sum, r) => sum + r.settlement.net, 0);
  const monthTotal = rows
    .filter((r) => {
      if (!r.booking) return false;
      const t = new Date(r.booking.startsAt).getTime();
      return t >= monthStart && t < monthEnd;
    })
    .reduce((sum, r) => sum + r.settlement.net, 0);

  return (
    <>
      <AppBar title="정산" />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="지급 대기" value={waiting} suffix="원" />
            <Stat label="지급 완료" value={paid} suffix="원" />
            <Stat label="이번 달" value={monthTotal} suffix="원" />
          </div>
        </section>

        <Divider />

        {rows.length === 0 ? (
          <EmptyState
            title="아직 정산 내역이 없습니다"
            body="상담이 완료되면 여기에 쌓입니다."
            action={
              <ButtonLink href="/conect3/expert/schedule" size="md">
                시간표 열기
              </ButtonLink>
            }
          />
        ) : (
          <section className="px-(--gutter) py-4">
            <SectionTitle>정산 내역</SectionTitle>
            <ul className="mt-1">
              {rows.map(({ settlement: s, booking }) => {
                const tax = withholding(s.net, expert.payout);
                const status = STATUS[s.status];
                return (
                  <li
                    key={s.id}
                    className="border-b border-stroke-neutral-subtle py-3.5 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-t3 text-fg-neutral-subtle">
                        {booking ? formatSlotRange(booking.startsAt) : "상담"}
                      </span>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </div>
                    <dl className="mt-2 space-y-1 text-t3">
                      <div className="flex justify-between">
                        <dt className="text-fg-neutral-subtle">상담료</dt>
                        <dd className="tabular-nums">{formatPrice(s.gross)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-fg-neutral-subtle">플랫폼 수수료 20%</dt>
                        <dd className="tabular-nums text-fg-critical">
                          - {formatPrice(s.fee)}
                        </dd>
                      </div>
                      {tax > 0 ? (
                        <div className="flex justify-between">
                          <dt className="text-fg-neutral-subtle">원천징수 3.3%</dt>
                          <dd className="tabular-nums text-fg-critical">
                            - {formatPrice(tax)}
                          </dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between border-t border-stroke-neutral-subtle pt-1.5 text-t4 font-semibold">
                        <dt>{tax > 0 ? "실지급액" : "실수령"}</dt>
                        <dd className="tabular-nums">{formatPrice(s.net - tax)}</dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <div className="px-(--gutter) pb-6">
          <p className="rounded-r3 bg-bg-neutral-weak px-3.5 py-3 text-t3 leading-relaxed text-fg-neutral-subtle">
            상담 완료 7일 뒤 지급 대상이 되고, 매월 1일과 16일에 지급합니다.
            {expert.payout?.business
              ? " 사업자로 등록되어 있어 원천징수 없이 지급합니다."
              : " 사업자등록번호가 없어 사업소득 3.3%를 떼고 지급합니다."}
          </p>
        </div>
      </main>

      <ExpertTabBar />
    </>
  );
}
