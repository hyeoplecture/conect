"use client";

// 돈과 상태가 함께 움직이는 일은 전부 여기서 한다.
// 화면은 이 함수만 부른다. 예약 하나를 만드는데 화면마다 다른 순서로 표를 건드리면
// 결제는 남고 예약은 없는 상태가 반드시 생긴다.

import {
  PLATFORM_FEE_RATE,
  availability,
  bookings,
  comments,
  experts,
  notifications,
  payments,
  posts,
  refunds,
  reports,
  reviews,
  settlements,
  users,
  type Booking,
  type Expert,
  type Field,
  type NotifChannel,
  type PaymentMethod,
  type Payout,
} from "./data";
import { newCode, newId } from "./store";

const nowIso = () => new Date().toISOString();

/* ---------- 알림 ---------- */

export function notify(input: {
  userId: string;
  title: string;
  body: string;
  href?: string | null;
  channel?: NotifChannel;
}) {
  if (!input.userId) return;
  notifications.insert({
    id: newId("ntf"),
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href ?? null,
    channel: input.channel ?? "알림톡",
    readAt: null,
    createdAt: nowIso(),
  });
}

export function markAllRead(userId: string) {
  const at = nowIso();
  notifications
    .list()
    .filter((n) => n.userId === userId && !n.readAt)
    .forEach((n) => notifications.update(n.id, { readAt: at }));
}

export function unreadCount(userId: string | undefined) {
  if (!userId) return 0;
  return notifications.list().filter((n) => n.userId === userId && !n.readAt).length;
}

/* ---------- 환불 계산 ---------- */

export const REFUND_STEPS = [
  { minHoursBefore: 24, feeRate: 0, label: "상담 24시간 전까지" },
  { minHoursBefore: 6, feeRate: 0.3, label: "상담 6시간 전까지" },
  { minHoursBefore: 0, feeRate: 0.5, label: "상담 시작 전까지" },
];

/** 지금 취소하면 떼는 비율. 상담이 시작된 뒤에는 null. */
export function refundFeeRate(startsAt: string, now = new Date()): number | null {
  const hoursLeft = (new Date(startsAt).getTime() - now.getTime()) / 3600000;
  if (hoursLeft <= 0) return null;
  return REFUND_STEPS.find((s) => hoursLeft >= s.minHoursBefore)?.feeRate ?? 0.5;
}

export function refundNotice(): string[] {
  return [
    ...REFUND_STEPS.map((s) =>
      s.feeRate === 0 ? `${s.label} 무료 취소` : `${s.label} 수수료 ${Math.round(s.feeRate * 100)}%`,
    ),
    "상담 시작 후에는 환불되지 않습니다",
    "전문가 사정으로 취소되면 시점과 관계없이 전액 환불합니다",
  ];
}

/* ---------- 예약 ---------- */

export type BookingInput = {
  expert: Expert;
  userId: string;
  startsAt: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  note: string;
  method: PaymentMethod;
  cardLast4: string;
};

/** 결제창에서 승인이 끝난 직후에 부른다. 예약·결제·정산·알림이 한 번에 만들어진다. */
export function createBooking(input: BookingInput): Booking {
  const slot = availability
    .list()
    .find((a) => a.expertId === input.expert.id && a.startsAt === input.startsAt);

  const booking: Booking = {
    id: newId("bkg"),
    code: newCode(),
    expertId: input.expert.id,
    expertSlug: input.expert.slug,
    expertName: input.expert.name,
    expertJob: input.expert.job,
    userId: input.userId,
    startsAt: input.startsAt,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    guestEmail: input.guestEmail,
    note: input.note,
    amount: input.expert.pricePerHour,
    method: input.method,
    status: "confirmed",
    meetUrl: `https://meet.google.com/${randomMeetCode()}`,
    reviewId: null,
    createdAt: nowIso(),
  };

  bookings.insert(booking);
  if (slot) availability.update(slot.id, { state: "booked" });

  payments.insert({
    id: newId("pay"),
    bookingId: booking.id,
    amount: booking.amount,
    method: input.method,
    status: "paid",
    cardLast4: input.cardLast4,
    paidAt: booking.createdAt,
  });

  const fee = Math.round(booking.amount * PLATFORM_FEE_RATE);
  settlements.insert({
    id: newId("stl"),
    expertId: input.expert.id,
    bookingId: booking.id,
    gross: booking.amount,
    fee,
    net: booking.amount - fee,
    status: "pending",
    paidAt: null,
  });

  notify({
    userId: input.userId,
    title: "예약이 확정되었습니다",
    body: `${booking.expertName} ${booking.expertJob} · ${booking.code}`,
    href: `/conect3/my/reservations/${booking.id}`,
  });
  if (input.expert.userId) {
    notify({
      userId: input.expert.userId,
      title: "새 예약이 들어왔습니다",
      body: `${booking.guestName}님 · ${booking.code}`,
      href: `/conect3/expert/bookings/${booking.id}`,
    });
  }

  return booking;
}

function randomMeetCode() {
  const a = "abcdefghijkmnpqrstuvwxyz";
  const pick = (n: number) =>
    Array.from({ length: n }, () => a[Math.floor(Math.random() * a.length)]).join("");
  return `${pick(3)}-${pick(4)}-${pick(3)}`;
}

/** 이용자 또는 운영자가 취소한다. byExpert면 수수료 없이 전액 돌려준다. */
export function cancelBooking(bookingId: string, reason: string, byExpert = false) {
  const booking = bookings.find(bookingId);
  if (!booking || booking.status !== "confirmed") return null;

  const rate = byExpert ? 0 : (refundFeeRate(booking.startsAt) ?? 0.5);
  const amount = Math.round(booking.amount * (1 - rate));
  const payment = payments.list().find((p) => p.bookingId === bookingId);

  bookings.update(bookingId, { status: "canceled" });

  const slot = availability
    .list()
    .find((a) => a.expertId === booking.expertId && a.startsAt === booking.startsAt);
  if (slot) availability.update(slot.id, { state: "open" });

  refunds.insert({
    id: newId("rfd"),
    bookingId,
    paymentId: payment?.id ?? "",
    feeRate: rate,
    amount,
    reason,
    refundedAt: nowIso(),
  });

  if (payment) {
    payments.update(payment.id, {
      status: amount === booking.amount ? "canceled" : "partial_canceled",
    });
  }

  // 취소 수수료는 전액 전문가 몫이다. 그 시간을 비워 뒀는데 못 팔았기 때문이다.
  const stl = settlements.list().find((s) => s.bookingId === bookingId);
  if (stl) {
    const gross = booking.amount - amount;
    settlements.update(stl.id, {
      gross,
      fee: 0,
      net: gross,
      status: gross > 0 ? "ready" : "paid",
    });
  }

  notify({
    userId: booking.userId,
    title: byExpert ? "전문가 사정으로 예약이 취소되었습니다" : "예약이 취소되었습니다",
    body: `${amount.toLocaleString("ko-KR")}원을 환불했습니다`,
    href: `/conect3/my/reservations/${booking.id}`,
  });

  const expert = experts.find(booking.expertId);
  if (expert?.userId) {
    notify({
      userId: expert.userId,
      title: "예약이 취소되었습니다",
      body: `${booking.guestName}님 · ${booking.code}`,
      href: `/conect3/expert/bookings/${booking.id}`,
    });
  }

  return { amount, rate };
}

/** 상담 시각이 지난 예약을 마무리한다. 상세 화면에서 확인을 받을 때 부른다. */
export function completeBooking(bookingId: string, done: boolean) {
  const booking = bookings.find(bookingId);
  if (!booking || booking.status !== "confirmed") return;

  if (!done) {
    // 진행되지 않았다고 하면 즉시 전액 환불한다. 이용자 쪽에 유리하게 둔다.
    cancelBooking(bookingId, "상담이 진행되지 않음", true);
    bookings.update(bookingId, { status: "no_show" });
    return;
  }

  bookings.update(bookingId, { status: "completed" });
  const stl = settlements.list().find((s) => s.bookingId === bookingId);
  if (stl) settlements.update(stl.id, { status: "ready" });

  notify({
    userId: booking.userId,
    title: "상담은 어떠셨나요",
    body: "후기를 남기면 다음 사람에게 큰 도움이 됩니다",
    href: `/conect3/my/reservations/${booking.id}`,
    channel: "앱",
  });
}

/** 상담 시각이 지났는데 아직 확정 상태인 예약을 찾는다. 확인 카드를 띄우는 데 쓴다. */
export function needsConfirm(list: Booking[], now = new Date()) {
  return list.filter(
    (b) => b.status === "confirmed" && new Date(b.startsAt).getTime() + 3600000 < now.getTime(),
  );
}

/* ---------- 후기 ---------- */

export function addReview(input: {
  bookingId: string;
  rating: number;
  body: string;
  userId: string;
  userName: string;
}) {
  const booking = bookings.find(input.bookingId);
  if (!booking || booking.reviewId) return null;

  const review = reviews.insert({
    id: newId("rev"),
    bookingId: booking.id,
    expertId: booking.expertId,
    userId: input.userId,
    userName: maskName(input.userName),
    rating: input.rating,
    body: input.body,
    reply: null,
    reportedAt: null,
    createdAt: nowIso(),
  });

  bookings.update(booking.id, { reviewId: review.id });

  const expert = experts.find(booking.expertId);
  if (expert) {
    experts.update(expert.id, {
      ratingSum: expert.ratingSum + input.rating,
      ratingCount: expert.ratingCount + 1,
    });
    if (expert.userId) {
      notify({
        userId: expert.userId,
        title: "새 후기가 등록되었습니다",
        body: `${"★".repeat(input.rating)} ${input.body.slice(0, 20)}`,
        href: `/conect3/experts/${expert.slug}/reviews`,
        channel: "앱",
      });
    }
  }

  return review;
}

function maskName(name: string) {
  if (name.length < 2) return name;
  return `${name[0]}O${name.slice(2)}`;
}

/* ---------- 전문가 ---------- */

export function applyExpert(input: {
  userId: string;
  name: string;
  job: string;
  field: Field;
  headline: string;
  bio: string;
  pricePerHour: number;
  payout: Payout;
}) {
  const slug = `me-${input.userId.slice(-6)}`;
  const expert = experts.insert({
    id: newId("exp"),
    userId: input.userId,
    slug,
    name: input.name,
    job: input.job,
    field: input.field,
    headline: input.headline,
    bio: input.bio,
    pricePerHour: input.pricePerHour,
    // 껍데기에서는 신청과 동시에 승인된다. 정식 서비스에서는 운영자가 검토한다.
    status: "approved",
    ratingSum: 0,
    ratingCount: 0,
    payout: input.payout,
    createdAt: nowIso(),
  });

  users.update(input.userId, { expertId: expert.id });

  notify({
    userId: input.userId,
    title: "전문가 등록이 승인되었습니다",
    body: "시간표를 열면 예약을 받을 수 있습니다",
    href: "/conect3/expert/schedule",
  });

  return expert;
}

export function setExpertStatus(expertId: string, status: Expert["status"]) {
  const expert = experts.update(expertId, { status });
  if (expert?.userId) {
    notify({
      userId: expert.userId,
      title:
        status === "approved"
          ? "전문가 등록이 승인되었습니다"
          : status === "suspended"
            ? "전문가 활동이 중지되었습니다"
            : "전문가 등록을 검토 중입니다",
      body: status === "suspended" ? "문의는 고객센터로 연락해 주세요" : "",
    });
  }
  return expert;
}

/* ---------- 정산 ---------- */

export function paySettlements(ids: string[]) {
  const at = nowIso();
  ids.forEach((id) => {
    const s = settlements.update(id, { status: "paid", paidAt: at });
    if (!s) return;
    const expert = experts.find(s.expertId);
    if (expert?.userId) {
      notify({
        userId: expert.userId,
        title: "정산금이 지급되었습니다",
        body: `${s.net.toLocaleString("ko-KR")}원`,
        href: "/conect3/expert/settlements",
        channel: "이메일",
      });
    }
  });
}

/** 사업자가 없으면 사업소득 3.3%를 뗀다. */
export function withholding(net: number, payout: Payout | null) {
  if (payout?.business) return 0;
  return Math.round(net * 0.033);
}

/* ---------- 커뮤니티 ---------- */

export function addPost(expertId: string, body: string) {
  return posts.insert({
    id: newId("post"),
    expertId,
    body,
    likes: 0,
    createdAt: nowIso(),
  });
}

export function addComment(input: {
  postId: string;
  userId: string;
  userName: string;
  body: string;
}) {
  const comment = comments.insert({
    id: newId("cmt"),
    postId: input.postId,
    userId: input.userId,
    userName: input.userName,
    body: input.body,
    createdAt: nowIso(),
  });

  const post = posts.find(input.postId);
  const expert = post ? experts.find(post.expertId) : undefined;
  if (expert?.userId && expert.userId !== input.userId) {
    notify({
      userId: expert.userId,
      title: "글에 댓글이 달렸습니다",
      body: input.body.slice(0, 30),
      href: `/conect3/community/${input.postId}`,
      channel: "앱",
    });
  }
  return comment;
}

/* ---------- 신고와 문의 ---------- */

export function report(input: {
  kind: "review" | "post" | "booking" | "inquiry";
  targetId: string;
  userId: string;
  userName: string;
  body: string;
}) {
  if (input.kind === "review") reviews.update(input.targetId, { reportedAt: nowIso() });
  return reports.insert({
    id: newId("rpt"),
    kind: input.kind,
    targetId: input.targetId,
    userId: input.userId,
    userName: input.userName,
    body: input.body,
    status: "open",
    createdAt: nowIso(),
  });
}
