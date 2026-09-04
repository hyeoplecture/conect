"use client";

// 예약 상세. 예약 하나에 붙은 결제·환불·후기를 한 화면에서 다 본다.
// 입장 버튼은 시간이 되기 전에는 아예 누를 수 없게 두고, 대신 언제부터 되는지를 적는다.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppBar, BottomBar, Modal } from "@/app/conect3/_components/shell";
import {
  Badge,
  Button,
  ButtonLink,
  DataRow,
  Divider,
  EmptyState,
  RatingInput,
  SectionTitle,
  TextArea,
} from "@/app/conect3/_components/ui";
import {
  PAYMENT_LABELS,
  bookings,
  payments,
  refunds,
  reviews,
  type Booking,
} from "@/app/conect3/_lib/data";
import { addReview, cancelBooking, refundFeeRate, refundNotice } from "@/app/conect3/_lib/domain";
import { formatDateShort, formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";
import { useSession } from "@/app/conect3/_lib/session";

const STATUS: Record<Booking["status"], { text: string; variant: "brand" | "neutral" | "critical" | "positive" }> = {
  confirmed: { text: "예정", variant: "brand" },
  completed: { text: "완료", variant: "positive" },
  canceled: { text: "취소", variant: "neutral" },
  no_show: { text: "미진행", variant: "critical" },
};

const HOUR = 3600000;
/** 상담 시작 이 시간 전부터 입장할 수 있다 */
const ENTER_BEFORE = 30 * 60000;
const ENTER_AFTER = 30 * 60000;

/** 남은 시간을 사람이 읽는 말로. 입장 안내 아래에 붙인다. */
function untilLabel(ms: number) {
  if (ms <= 0) return "";
  const min = Math.ceil(ms / 60000);
  if (min < 60) return `${min}분 남았습니다`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 남았습니다`;
  return `${Math.floor(hour / 24)}일 남았습니다`;
}

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { user } = useSession();
  const { loaded, row: booking } = bookings.useOne(id);
  const { rows: paymentRows } = payments.useList();
  const { rows: refundRows } = refunds.useList();
  const { rows: reviewRows } = reviews.useList();

  const [now, setNow] = useState(() => Date.now());
  const [askCancel, setAskCancel] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");

  // 입장 가능 시각이 지나면 버튼이 저절로 열려야 한다.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  if (!loaded) {
    return (
      <>
        <AppBar title="예약 상세" back />
        <main className="flex-1" />
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <AppBar title="예약 상세" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="예약을 찾을 수 없어요"
            body="이미 지워졌거나 주소가 잘못되었습니다."
            action={
              <div className="mx-auto w-40">
                <ButtonLink href="/conect3/my" size="md" variant="outline">
                  마이로 가기
                </ButtonLink>
              </div>
            }
          />
        </main>
      </>
    );
  }

  const status = STATUS[booking.status];
  const payment = paymentRows.find((p) => p.bookingId === booking.id);
  const refund = refundRows.find((r) => r.bookingId === booking.id);
  const myReview = booking.reviewId
    ? reviewRows.find((r) => r.id === booking.reviewId)
    : undefined;

  const startsAt = new Date(booking.startsAt).getTime();
  const canEnter =
    booking.status === "confirmed" &&
    now >= startsAt - ENTER_BEFORE &&
    now <= startsAt + HOUR + ENTER_AFTER;

  const feeRate = booking.status === "confirmed" ? refundFeeRate(booking.startsAt) : null;
  const cancelable = feeRate !== null;
  const refundAmount = feeRate === null ? 0 : Math.round(booking.amount * (1 - feeRate));
  const feeAmount = booking.amount - refundAmount;

  const canWriteReview = booking.status === "completed" && !booking.reviewId;

  return (
    <>
      <AppBar title="예약 상세" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-5">
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.text}</Badge>
            <span className="text-t2 text-fg-placeholder tabular-nums">{booking.code}</span>
          </div>
          <Link
            href={`/conect3/experts/${booking.expertSlug}`}
            className="mt-2.5 flex items-baseline gap-1.5"
          >
            <span className="text-t7 font-bold">{booking.expertName}</span>
            <span className="text-t3 text-fg-neutral-subtle">{booking.expertJob}</span>
          </Link>
          <p className="mt-1.5 text-t4 text-fg-neutral-muted">
            {formatSlotRange(booking.startsAt)}
          </p>
        </section>

        {booking.status === "confirmed" ? (
          <section className="px-(--gutter) pb-5">
            {canEnter ? (
              <a
                href={booking.meetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-[50px] w-full items-center justify-center rounded-r3 bg-bg-brand-solid text-t5 font-semibold text-fg-neutral-inverted"
              >
                상담 참여하기
              </a>
            ) : (
              <div className="rounded-r3 bg-bg-neutral-weak px-4 py-4 text-center">
                <p className="text-t4 font-medium text-fg-neutral-muted">
                  상담 30분 전부터 입장할 수 있습니다
                </p>
                <p className="mt-1 text-t3 text-fg-neutral-subtle">
                  {untilLabel(startsAt - ENTER_BEFORE - now) || "입장 시간이 지났습니다"}
                </p>
              </div>
            )}
          </section>
        ) : null}

        {booking.note ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-5">
              <SectionTitle>미리 전한 메시지</SectionTitle>
              <p className="mt-2.5 rounded-r3 bg-bg-neutral-weak px-3.5 py-3 text-t3 leading-relaxed text-fg-neutral-muted">
                {booking.note}
              </p>
            </section>
          </>
        ) : null}

        <Divider />

        <section className="px-(--gutter) py-5">
          <SectionTitle>결제 내역</SectionTitle>
          <dl className="mt-2">
            {payment ? (
              <DataRow label="결제일" value={formatDateShort(payment.paidAt)} />
            ) : null}
            <DataRow label="결제수단" value={PAYMENT_LABELS[booking.method]} />
            <DataRow label="구매자" value={booking.guestName} />
            <DataRow
              label="결제 금액"
              value={<span className="font-semibold tabular-nums">{formatPrice(booking.amount)}</span>}
            />
          </dl>
        </section>

        {refund ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-5">
              <SectionTitle>환불 내역</SectionTitle>
              <dl className="mt-2">
                <DataRow label="환불일" value={formatDateShort(refund.refundedAt)} />
                <DataRow label="취소 사유" value={refund.reason} />
                <DataRow
                  label="취소 수수료"
                  value={
                    <span className="tabular-nums">
                      {Math.round(refund.feeRate * 100)}% ·{" "}
                      {formatPrice(booking.amount - refund.amount)}
                    </span>
                  }
                />
                <DataRow
                  label="환불 금액"
                  value={
                    <span className="font-semibold tabular-nums">{formatPrice(refund.amount)}</span>
                  }
                />
              </dl>
            </section>
          </>
        ) : null}

        {cancelable ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-5">
              <SectionTitle>취소·환불</SectionTitle>
              <dl className="mt-2">
                <DataRow
                  label="취소 수수료"
                  value={
                    <span className="tabular-nums">
                      {Math.round((feeRate ?? 0) * 100)}% · {formatPrice(feeAmount)}
                    </span>
                  }
                />
                <DataRow
                  label="지금 취소하면"
                  value={
                    <span className="font-semibold tabular-nums">{formatPrice(refundAmount)} 환불</span>
                  }
                />
              </dl>
              <ul className="mt-3 space-y-1">
                {refundNotice().map((line) => (
                  <li key={line} className="text-t2 text-fg-placeholder">
                    · {line}
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {canWriteReview ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-5">
              <SectionTitle>후기 남기기</SectionTitle>
              <div className="mt-3.5">
                <RatingInput value={rating} onChange={setRating} />
              </div>
              <div className="mt-3.5">
                <TextArea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="어떤 점이 도움이 되었는지 적어 주세요"
                />
              </div>
              <div className="mt-3">
                <Button
                  size="md"
                  disabled={!body.trim()}
                  onClick={() => {
                    addReview({
                      bookingId: booking.id,
                      rating,
                      body: body.trim(),
                      userId: user?.id ?? booking.userId,
                      userName: user?.name ?? booking.guestName,
                    });
                    setBody("");
                  }}
                >
                  후기 등록
                </Button>
              </div>
            </section>
          </>
        ) : myReview ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-5">
              <SectionTitle>내가 쓴 후기</SectionTitle>
              <p className="mt-2 text-t4 text-fg-warning">{"★".repeat(myReview.rating)}</p>
              <p className="mt-1.5 text-t3 leading-relaxed text-fg-neutral-muted">
                {myReview.body}
              </p>
              <p className="mt-2 text-t2 text-fg-placeholder">
                {formatDateShort(myReview.createdAt)}
              </p>
            </section>
          </>
        ) : null}

        <div className="h-6" />
      </main>

      {cancelable ? (
        <BottomBar>
          <Button variant="critical" onClick={() => setAskCancel(true)}>
            예약 취소하기
          </Button>
        </BottomBar>
      ) : null}

      <Modal
        open={askCancel}
        title="예약을 취소할까요?"
        body={`취소 수수료 ${formatPrice(feeAmount)}를 뺀 ${formatPrice(refundAmount)}을 환불합니다.`}
        confirmLabel="취소하기"
        cancelLabel="닫기"
        onConfirm={() => cancelBooking(booking.id, "이용자 취소")}
        onClose={() => setAskCancel(false)}
      />
    </>
  );
}
