"use client";

// 결제 완료. 여기까지 왔으면 예약과 결제가 이미 만들어져 있다.
// 남은 일은 무엇이 잡혔는지 보여주고 다음 화면으로 보내는 것뿐이다.

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BottomBar } from "@/app/conect3/_components/shell";
import { ButtonLink, DataRow, EmptyState } from "@/app/conect3/_components/ui";
import { IconCheck } from "@/app/conect3/_components/icons";
import { PAYMENT_LABELS, bookings, checkoutDraft, payments } from "@/app/conect3/_lib/data";
import { formatPrice, formatSlotRange, maskCard } from "@/app/conect3/_lib/format";

export default function CheckoutDonePage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Done />
    </Suspense>
  );
}

function Done() {
  const id = useSearchParams().get("id") ?? "";
  const { loaded, row: booking } = bookings.useOne(id);
  const { rows: paymentRows } = payments.useList();

  // 결제가 끝났으므로 임시로 담아 둔 값을 비운다. 뒤에 남으면 다음 예약에 섞인다.
  useEffect(() => {
    checkoutDraft.set(null);
  }, []);

  if (!loaded) return <main className="flex-1" />;

  if (!booking) {
    return (
      <main className="flex-1 overflow-y-auto">
        <EmptyState
          title="예약을 찾을 수 없습니다"
          action={
            <ButtonLink href="/conect3" size="md">
              홈으로
            </ButtonLink>
          }
        />
      </main>
    );
  }

  const payment = paymentRows.find((p) => p.bookingId === booking.id);
  const methodText =
    booking.method === "card" && payment
      ? `${PAYMENT_LABELS.card} ${maskCard(payment.cardLast4)}`
      : PAYMENT_LABELS[booking.method];

  return (
    <>
      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) pt-14 pb-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-bg-brand-weak text-fg-brand">
            <IconCheck size={32} />
          </span>
          <h1 className="mt-5 text-t8">예약이 확정되었습니다</h1>
          <p className="mt-2 text-t3 text-fg-neutral-subtle">
            {booking.expertName} {booking.expertJob}
          </p>
        </section>

        <section className="px-(--gutter) pb-6">
          <dl className="rounded-r3 bg-bg-neutral-weak px-4 py-2">
            <DataRow
              label="예약번호"
              value={<span className="font-semibold tabular-nums">{booking.code}</span>}
            />
            <DataRow label="전문가" value={booking.expertName} />
            <DataRow label="일시" value={formatSlotRange(booking.startsAt)} />
            <DataRow
              label="결제수단"
              value={<span className="tabular-nums">{methodText}</span>}
            />
            <DataRow
              label="결제 금액"
              value={
                <span className="font-semibold tabular-nums">{formatPrice(booking.amount)}</span>
              }
            />
          </dl>
        </section>

        <section className="px-(--gutter) pb-8">
          <ul className="space-y-1.5 text-t3 text-fg-neutral-subtle">
            <li className="flex gap-2">
              <span className="text-fg-placeholder">·</span>
              예약 확정 안내를 알림톡으로 보냈습니다
            </li>
            <li className="flex gap-2">
              <span className="text-fg-placeholder">·</span>
              상담 링크는 상담 1시간 전에 다시 보내드립니다
            </li>
            <li className="flex gap-2">
              <span className="text-fg-placeholder">·</span>
              한국 시간 기준입니다
            </li>
          </ul>
        </section>
      </main>

      <BottomBar>
        <div className="flex gap-2">
          <ButtonLink href="/conect3" variant="secondary">
            홈으로
          </ButtonLink>
          <ButtonLink href={`/conect3/my/reservations/${booking.id}`}>내 상담 보기</ButtonLink>
        </div>
      </BottomBar>
    </>
  );
}
