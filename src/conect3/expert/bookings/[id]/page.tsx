"use client";

// 받은 예약 하나. 연락처는 상담이 가까워졌을 때만 연다.

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  PAYMENT_LABELS,
  bookings,
  reviews,
  settlements,
  type Booking,
} from "@/app/conect3/_lib/data";
import { cancelBooking, completeBooking } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";
import { AppBar, BottomBar, Modal, Sheet } from "@/app/conect3/_components/shell";
import {
  Badge,
  Button,
  ButtonLink,
  DataRow,
  Divider,
  EmptyState,
  SectionTitle,
  TextArea,
} from "@/app/conect3/_components/ui";
import { ReviewItem } from "@/app/conect3/_components/cards";

const STATUS: Record<Booking["status"], { text: string; variant: "brand" | "neutral" | "critical" | "positive" }> = {
  confirmed: { text: "예정", variant: "brand" },
  completed: { text: "완료", variant: "positive" },
  canceled: { text: "취소", variant: "neutral" },
  no_show: { text: "미진행", variant: "critical" },
};

export default function ExpertBookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { loaded: sessionLoaded, expert } = useSession();
  const { loaded, row } = bookings.useOne(id);

  if (!sessionLoaded || !loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="예약 상세" back />
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
      </>
    );
  }

  if (!row || row.expertId !== expert.id) {
    return (
      <>
        <AppBar title="예약 상세" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="예약을 찾을 수 없습니다"
            action={
              <ButtonLink href="/conect3/expert/bookings" size="md">
                예약 목록으로
              </ButtonLink>
            }
          />
        </main>
      </>
    );
  }

  return <Detail booking={row} />;
}

function Detail({ booking }: { booking: Booking }) {
  const { rows: allSettlements } = settlements.useList();
  const { rows: allReviews } = reviews.useList();

  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");

  const [now] = useState(() => Date.now());
  const startsAt = new Date(booking.startsAt).getTime();
  const settlement = allSettlements.find((s) => s.bookingId === booking.id);
  const review = allReviews.find((r) => r.bookingId === booking.id);

  const contactOpen = now >= startsAt - 24 * 3600000;
  const joinable = now >= startsAt - 30 * 60000 && now <= startsAt + 90 * 60000;
  const needsConfirm = booking.status === "confirmed" && now > startsAt + 3600000;
  const status = STATUS[booking.status];

  return (
    <>
      <AppBar title="예약 상세" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-t7 font-bold">{booking.guestName}</h2>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>
          <p className="mt-1 text-t3 text-fg-neutral-subtle">
            {formatSlotRange(booking.startsAt)} · 한국 시간 기준
          </p>

          <div className="mt-4">
            <Button
              variant={joinable ? "primary" : "secondary"}
              disabled={!joinable}
              onClick={() => window.open(booking.meetUrl, "_blank", "noopener")}
            >
              상담 참여하기
            </Button>
            {!joinable && booking.status === "confirmed" ? (
              <p className="mt-2 text-center text-t2 text-fg-placeholder">
                상담 30분 전부터 들어갈 수 있습니다
              </p>
            ) : null}
          </div>
        </section>

        {needsConfirm ? (
          <section className="px-(--gutter) pb-4">
            <div className="rounded-r3 border border-stroke-brand-solid bg-bg-brand-weak px-4 py-4">
              <p className="text-t4 font-semibold">상담을 진행하셨나요?</p>
              <p className="mt-1 text-t3 text-fg-neutral-muted">
                진행했다고 하면 정산 대상이 됩니다.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="md" variant="outline" onClick={() => setNoShowOpen(true)}>
                  아니요
                </Button>
                <Button size="md" onClick={() => completeBooking(booking.id, true)}>
                  네, 진행했습니다
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <Divider />

        <section className="px-(--gutter) py-4">
          <SectionTitle>예약 정보</SectionTitle>
          <dl className="mt-2">
            <DataRow label="예약번호" value={<span className="tabular-nums">{booking.code}</span>} />
            <DataRow label="일시" value={formatSlotRange(booking.startsAt)} />
            <DataRow label="결제수단" value={PAYMENT_LABELS[booking.method]} />
            <DataRow
              label="상담료"
              value={<span className="tabular-nums">{formatPrice(booking.amount)}</span>}
            />
            <DataRow
              label="실수령액"
              value={
                <span className="font-semibold tabular-nums">
                  {settlement ? formatPrice(settlement.net) : "-"}
                </span>
              }
            />
          </dl>
        </section>

        <Divider />

        <section className="px-(--gutter) py-4">
          <SectionTitle>신청자 연락처</SectionTitle>
          {contactOpen ? (
            <dl className="mt-2">
              <DataRow label="이름" value={booking.guestName} />
              <DataRow
                label="휴대폰"
                value={<span className="tabular-nums">{booking.guestPhone}</span>}
              />
              <DataRow label="이메일" value={booking.guestEmail} />
            </dl>
          ) : (
            <p className="mt-2 rounded-r3 bg-bg-neutral-weak px-3.5 py-4 text-t3 text-fg-neutral-subtle">
              상담 24시간 전부터 볼 수 있습니다
            </p>
          )}
        </section>

        <Divider />

        <section className="px-(--gutter) py-4">
          <SectionTitle>미리 전한 메시지</SectionTitle>
          <p className="mt-2 rounded-r3 bg-bg-neutral-weak px-3.5 py-3.5 text-t3 leading-relaxed text-fg-neutral-muted">
            {booking.note.trim() || "따로 남긴 메시지가 없습니다"}
          </p>
        </section>

        {review ? (
          <>
            <Divider />
            <section className="px-(--gutter) py-4">
              <SectionTitle>받은 후기</SectionTitle>
              <ul className="mt-1">
                <ReviewItem review={review} />
              </ul>
              <div className="mt-3">
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => {
                    setReply(review.reply ?? "");
                    setReplyOpen(true);
                  }}
                >
                  {review.reply ? "답글 고치기" : "답글 달기"}
                </Button>
              </div>
            </section>
          </>
        ) : null}

        <div className="h-4" />
      </main>

      {booking.status === "confirmed" ? (
        <BottomBar>
          <Button variant="critical" onClick={() => setCancelOpen(true)}>
            예약 취소하기
          </Button>
        </BottomBar>
      ) : null}

      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} title="예약 취소">
        <p className="text-t3 leading-relaxed text-fg-neutral-muted">
          전문가가 취소하면 시점과 관계없이 {formatPrice(booking.amount)} 전액이 신청자에게
          환불됩니다. 취소 수수료는 없고 이 예약의 정산도 사라집니다.
        </p>
        <div className="mt-4">
          <TextArea
            label="취소 사유"
            placeholder="신청자에게 전할 사유를 적어 주세요"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="mt-4">
          <Button
            variant="critical"
            disabled={reason.trim() === ""}
            onClick={() => {
              cancelBooking(booking.id, reason.trim(), true);
              setCancelOpen(false);
            }}
          >
            전액 환불하고 취소하기
          </Button>
        </div>
      </Sheet>

      <Sheet open={replyOpen} onClose={() => setReplyOpen(false)} title="후기 답글">
        <TextArea
          placeholder="후기에 답글을 남겨 주세요"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
        />
        <div className="mt-4">
          <Button
            disabled={reply.trim() === ""}
            onClick={() => {
              if (review) reviews.update(review.id, { reply: reply.trim() });
              setReplyOpen(false);
            }}
          >
            답글 등록
          </Button>
        </div>
      </Sheet>

      <Modal
        open={noShowOpen}
        title="상담이 진행되지 않았습니까"
        body={`${formatPrice(booking.amount)} 전액이 신청자에게 환불되고 이 예약의 정산은 사라집니다.`}
        cancelLabel="다시 볼게요"
        confirmLabel="진행되지 않았습니다"
        onConfirm={() => completeBooking(booking.id, false)}
        onClose={() => setNoShowOpen(false)}
      />
    </>
  );
}
