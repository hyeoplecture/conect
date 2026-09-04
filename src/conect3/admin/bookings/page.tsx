"use client";

// 예약 전체. 상세 시트에서 운영자 강제 취소까지 처리한다.

import { useState } from "react";
import { Modal, Sheet } from "@/app/conect3/_components/shell";
import { Badge, Button, DataRow, EmptyState } from "@/app/conect3/_components/ui";
import { bookings, payments, type BookingStatus } from "@/app/conect3/_lib/data";
import { cancelBooking } from "@/app/conect3/_lib/domain";
import { formatDate, formatPrice, formatSlotRange, formatTime, maskCard } from "@/app/conect3/_lib/format";

type Filter = "all" | "confirmed" | "completed" | "canceled" | "no_show";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "confirmed", label: "예정" },
  { value: "completed", label: "완료" },
  { value: "canceled", label: "취소" },
  { value: "no_show", label: "미진행" },
];

const STATUS_LABEL: Record<BookingStatus, string> = {
  confirmed: "예정",
  completed: "완료",
  canceled: "취소",
  no_show: "미진행",
};

const STATUS_VARIANT: Record<BookingStatus, "brand" | "neutral" | "critical" | "warning"> = {
  confirmed: "brand",
  completed: "neutral",
  canceled: "critical",
  no_show: "warning",
};

export default function AdminBookingsPage() {
  const { loaded, rows } = bookings.useList();
  const { rows: allPayments } = payments.useList();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!loaded) return <main className="flex-1 overflow-y-auto" />;

  const list = rows
    .filter((b) => (filter === "all" ? true : b.status === filter))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  const open = rows.find((b) => b.id === openId) ?? null;
  const openPayment = open ? allPayments.find((p) => p.bookingId === open.id) : undefined;

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
        <EmptyState title="해당하는 예약이 없어요" />
      ) : (
        <ul className="divide-y divide-stroke-neutral-subtle">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setOpenId(b.id)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-t4 font-semibold">{b.code}</p>
                  </div>
                  <p className="mt-0.5 truncate text-t3 text-fg-neutral-subtle">
                    {b.expertName} · {b.guestName}
                  </p>
                  <p className="mt-0.5 text-t2 text-fg-placeholder">
                    {formatDate(b.startsAt)} {formatTime(b.startsAt)} · {formatPrice(b.amount)}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[b.status]}>{STATUS_LABEL[b.status]}</Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open?.code}>
        {open ? (
          <div>
            <Badge variant={STATUS_VARIANT[open.status]}>{STATUS_LABEL[open.status]}</Badge>

            <dl className="mt-3 divide-y divide-stroke-neutral-subtle">
              <DataRow label="전문가" value={`${open.expertName} · ${open.expertJob}`} />
              <DataRow label="신청자" value={`${open.guestName} · ${open.guestPhone}`} />
              <DataRow label="상담 일시" value={formatSlotRange(open.startsAt)} />
              <DataRow label="금액" value={formatPrice(open.amount)} />
              {openPayment ? (
                <DataRow label="결제" value={`${maskCard(openPayment.cardLast4)}`} />
              ) : null}
            </dl>

            <p className="mt-4 text-t4 font-semibold">사전 메시지</p>
            <p className="mt-1 whitespace-pre-wrap text-t3 text-fg-neutral-subtle">
              {open.note || "전달된 메시지가 없습니다"}
            </p>

            {open.status === "confirmed" ? (
              <div className="mt-6">
                <Button variant="critical" onClick={() => setConfirmCancel(true)}>
                  운영자 강제 취소
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>

      <Modal
        open={confirmCancel}
        title="이 예약을 취소할까요?"
        body="전문가 사정으로 처리되어 전액 환불됩니다."
        confirmLabel="취소하기"
        cancelLabel="닫기"
        onConfirm={() => {
          if (open) cancelBooking(open.id, "운영자 취소", true);
        }}
        onClose={() => setConfirmCancel(false)}
      />
    </main>
  );
}
