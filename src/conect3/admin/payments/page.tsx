"use client";

// 결제와 환불 원장. 고치거나 지우지 않고 조회만 한다.

import { useState } from "react";
import { Badge, DataRow, EmptyState, Segmented, Stat } from "@/app/conect3/_components/ui";
import { PAYMENT_LABELS, bookings, payments, refunds } from "@/app/conect3/_lib/data";
import { formatDateShort, formatPrice, maskCard } from "@/app/conect3/_lib/format";

type Tab = "payment" | "refund";

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: "결제완료",
  canceled: "결제취소",
  partial_canceled: "부분취소",
};

export default function AdminPaymentsPage() {
  const { loaded: pLoaded, rows: allPayments } = payments.useList();
  const { loaded: rLoaded, rows: allRefunds } = refunds.useList();
  const { rows: allBookings } = bookings.useList();
  const [tab, setTab] = useState<Tab>("payment");

  if (!pLoaded || !rLoaded) return <main className="flex-1 overflow-y-auto" />;

  const codeOf = (bookingId: string) => allBookings.find((b) => b.id === bookingId)?.code ?? bookingId;

  const paymentList = [...allPayments].sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const refundList = [...allRefunds].sort((a, b) => b.refundedAt.localeCompare(a.refundedAt));

  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = allRefunds.reduce((sum, r) => sum + r.amount, 0);

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="결제 합계" value={formatPrice(totalPaid)} />
        <Stat label="환불 합계" value={formatPrice(totalRefunded)} />
      </div>

      <div className="mt-4">
        <Segmented
          options={[
            { value: "payment", label: "결제" },
            { value: "refund", label: "환불" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "payment" ? (
        paymentList.length === 0 ? (
          <EmptyState title="결제 내역이 없어요" />
        ) : (
          <ul className="mt-3 divide-y divide-stroke-neutral-subtle">
            {paymentList.map((p) => (
              <li key={p.id} className="py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-t4 font-semibold">{formatPrice(p.amount)}</span>
                  <Badge variant={p.status === "paid" ? "positive" : "critical"}>
                    {PAYMENT_STATUS_LABEL[p.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-t3 text-fg-neutral-subtle">
                  {codeOf(p.bookingId)} · {PAYMENT_LABELS[p.method]}
                  {p.method === "card" ? ` · ${maskCard(p.cardLast4)}` : ""}
                </p>
                <p className="mt-0.5 text-t2 text-fg-placeholder">{formatDateShort(p.paidAt)}</p>
              </li>
            ))}
          </ul>
        )
      ) : refundList.length === 0 ? (
        <EmptyState title="환불 내역이 없어요" />
      ) : (
        <ul className="mt-3 divide-y divide-stroke-neutral-subtle">
          {refundList.map((r) => (
            <li key={r.id} className="py-3.5">
              <dl>
                <DataRow label="예약번호" value={codeOf(r.bookingId)} />
                <DataRow label="수수료율" value={`${Math.round(r.feeRate * 100)}%`} />
                <DataRow label="환불액" value={formatPrice(r.amount)} />
                <DataRow label="사유" value={r.reason} />
              </dl>
              <p className="mt-1 text-t2 text-fg-placeholder">{formatDateShort(r.refundedAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
