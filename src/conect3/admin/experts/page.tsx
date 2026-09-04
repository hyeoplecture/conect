"use client";

// 전문가 상태 관리. 줄을 누르면 시트로 상세와 상태 변경.

import { useMemo, useState } from "react";
import { Sheet } from "@/app/conect3/_components/shell";
import {
  Badge,
  EmptyState,
  Rating,
  Segmented,
} from "@/app/conect3/_components/ui";
import { bookings, experts, ratingOf, type Expert } from "@/app/conect3/_lib/data";
import { setExpertStatus } from "@/app/conect3/_lib/domain";
import { formatPrice } from "@/app/conect3/_lib/format";

type Filter = "all" | "pending" | "approved" | "suspended";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "pending", label: "승인대기" },
  { value: "approved", label: "승인됨" },
  { value: "suspended", label: "정지" },
];

const STATUS_LABEL: Record<Expert["status"], string> = {
  pending: "승인대기",
  approved: "승인됨",
  suspended: "정지",
};

export default function AdminExpertsPage() {
  const { loaded, rows } = experts.useList();
  const { rows: allBookings } = bookings.useList();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const bookingCount = useMemo(() => {
    const map = new Map<string, number>();
    allBookings.forEach((b) => map.set(b.expertId, (map.get(b.expertId) ?? 0) + 1));
    return map;
  }, [allBookings]);

  if (!loaded) return <main className="flex-1 overflow-y-auto" />;

  const list = rows
    .filter((e) => (filter === "all" ? true : e.status === filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const open = rows.find((e) => e.id === openId) ?? null;

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
      <div className="flex gap-1.5 overflow-x-auto pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-t3 whitespace-nowrap ${
              filter === f.value
                ? "bg-bg-brand-solid font-semibold text-fg-neutral-inverted"
                : "bg-bg-neutral-weak text-fg-neutral-subtle"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="해당하는 전문가가 없어요" />
      ) : (
        <ul className="divide-y divide-stroke-neutral-subtle">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenId(e.id)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-t4 font-semibold">{e.name}</p>
                    <span className="shrink-0 text-t2 text-fg-neutral-subtle">{e.job}</span>
                  </div>
                  <p className="mt-0.5 truncate text-t3 text-fg-neutral-subtle">
                    {e.field} · {formatPrice(e.pricePerHour)} · 예약 {bookingCount.get(e.id) ?? 0}건
                  </p>
                  <div className="mt-1">
                    <Rating value={ratingOf(e)} count={e.ratingCount} />
                  </div>
                </div>
                <Badge
                  variant={
                    e.status === "approved" ? "positive" : e.status === "suspended" ? "critical" : "warning"
                  }
                >
                  {STATUS_LABEL[e.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.name}>
        {open ? (
          <div>
            <p className="text-t3 text-fg-neutral-subtle">{open.job} · {open.field}</p>
            <p className="mt-3 text-t4 font-semibold">소개</p>
            <p className="mt-1 whitespace-pre-wrap text-t3 text-fg-neutral-subtle">
              {open.bio || "등록된 소개가 없습니다"}
            </p>

            <p className="mt-4 text-t4 font-semibold">정산 계좌</p>
            {open.payout ? (
              <p className="mt-1 text-t3 text-fg-neutral-subtle">
                {open.payout.bank} {open.payout.account} ({open.payout.holder})
                <br />
                사업자번호 {open.payout.business ?? "없음 (사업소득 3.3% 원천징수)"}
              </p>
            ) : (
              <p className="mt-1 text-t3 text-fg-neutral-subtle">등록된 계좌가 없습니다</p>
            )}

            <p className="mt-5 text-t3 text-fg-neutral-subtle">상태 변경</p>
            <div className="mt-2">
              <Segmented
                options={[
                  { value: "approved", label: "승인" },
                  { value: "suspended", label: "정지" },
                  { value: "pending", label: "대기로" },
                ]}
                value={open.status}
                onChange={(v) => setExpertStatus(open.id, v)}
              />
            </div>
          </div>
        ) : null}
      </Sheet>
    </main>
  );
}
