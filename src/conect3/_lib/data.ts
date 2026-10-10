"use client";

// 타입과 표. 화면은 여기서만 데이터를 가져간다.
// 표의 실제 저장은 store.ts가 맡는다.

import { cell, hydrate, newId, table, type Row } from "./store";
import { buildPreviewScenario, buildScenario } from "./seed-scenario";
import { isPreview, previewPersona } from "./preview";
import { PERSONA_USER_ID, SAMPLE } from "../../screens/samples";

/* ---------- 분야 ---------- */

export type Field = "법률" | "세무" | "부동산" | "진로" | "건강" | "재테크" | "IT";

export const FIELDS: Field[] = ["법률", "세무", "부동산", "진로", "건강", "재테크", "IT"];

/* ---------- 타입 ---------- */

export type PaymentMethod = "card" | "kakaopay" | "naverpay";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: "신용·체크카드",
  kakaopay: "카카오페이",
  naverpay: "네이버페이",
};

export type User = Row & {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: "user" | "admin";
  expertId: string | null;
  marketing: boolean;
  createdAt: string;
  deletedAt: string | null;
};

export type Payout = {
  bank: string;
  account: string;
  holder: string;
  /** 사업자등록번호. 없으면 개인으로 보고 3.3%를 뗀다 */
  business: string | null;
};

export type Expert = Row & {
  userId: string | null;
  slug: string;
  name: string;
  job: string;
  field: Field;
  headline: string;
  bio: string;
  pricePerHour: number;
  status: "pending" | "approved" | "suspended";
  ratingSum: number;
  ratingCount: number;
  payout: Payout | null;
  createdAt: string;
};

export type Availability = Row & {
  expertId: string;
  startsAt: string;
  state: "open" | "held" | "booked";
};

export type BookingStatus = "confirmed" | "canceled" | "completed" | "no_show";

export type Booking = Row & {
  code: string;
  expertId: string;
  expertSlug: string;
  expertName: string;
  expertJob: string;
  userId: string;
  startsAt: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  note: string;
  amount: number;
  method: PaymentMethod;
  status: BookingStatus;
  meetUrl: string;
  reviewId: string | null;
  createdAt: string;
};

export type Payment = Row & {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: "paid" | "canceled" | "partial_canceled";
  cardLast4: string;
  paidAt: string;
};

export type Refund = Row & {
  bookingId: string;
  paymentId: string;
  feeRate: number;
  amount: number;
  reason: string;
  refundedAt: string;
};

export type Settlement = Row & {
  expertId: string;
  bookingId: string;
  gross: number;
  fee: number;
  net: number;
  status: "pending" | "ready" | "paid";
  paidAt: string | null;
};

export type Review = Row & {
  bookingId: string;
  expertId: string;
  userId: string;
  userName: string;
  rating: number;
  body: string;
  reply: string | null;
  reportedAt: string | null;
  createdAt: string;
};

export type Post = Row & {
  expertId: string;
  body: string;
  likes: number;
  createdAt: string;
};

export type Comment = Row & {
  postId: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
};

export type NotifChannel = "알림톡" | "문자" | "이메일" | "앱";

export type Notification = Row & {
  userId: string;
  title: string;
  body: string;
  href: string | null;
  channel: NotifChannel;
  readAt: string | null;
  createdAt: string;
};

export type Report = Row & {
  kind: "review" | "post" | "booking" | "inquiry";
  targetId: string;
  userId: string;
  userName: string;
  body: string;
  status: "open" | "resolved";
  createdAt: string;
};

/* ---------- 표 ---------- */

export const users = table<User>("users");
export const experts = table<Expert>("experts");
export const availability = table<Availability>("availability");
export const bookings = table<Booking>("bookings");
export const payments = table<Payment>("payments");
export const refunds = table<Refund>("refunds");
export const settlements = table<Settlement>("settlements");
export const reviews = table<Review>("reviews");
export const posts = table<Post>("posts");
export const comments = table<Comment>("comments");
export const notifications = table<Notification>("notifications");
export const reports = table<Report>("reports");

export const session = cell<string | null>("session", null);
const seedVersion = cell<number>("seedVersion", 0);

/* ---------- 정책 ---------- */

export const PLATFORM_FEE_RATE = 0.2;
/** 지금부터 이 시간 뒤부터 예약할 수 있다 */
export const MIN_LEAD_HOURS = 3;
/** 시간표를 며칠 앞까지 여는가 */
export const SCHEDULE_DAYS = 30;
/** 후기를 이 개수 미만으로 받은 전문가는 평점을 감춘다 */
export const MIN_REVIEWS_TO_SHOW = 3;

export const ADMIN_EMAIL = "admin@conect.kr";

/* ---------- 씨앗 ---------- */

// 처음 열었을 때 운영 기록을 통째로 채운다. 전문가만 있고 예약도 후기도 없으면
// 죽은 앱으로 보이고, 운영자 화면에서는 볼 것이 아무것도 없다.
// 실제 데이터는 seed-scenario.ts가 만든다.
//
// 씨앗 내용을 바꾸면 이 숫자를 올린다. 이미 채워 둔 브라우저도 새로 받는다.
const SEED_VERSION = 3;

export function seedOnce() {
  // 미리보기는 모듈이 열릴 때 메모리에 이미 채웠다(아래 hydratePreview). 저장소에 쓰지 않는다.
  if (isPreview) return;
  if (seedVersion.get() >= SEED_VERSION) return;

  const d = buildScenario();
  users.replaceAll(d.users);
  experts.replaceAll(d.experts);
  availability.replaceAll(d.availability);
  bookings.replaceAll(d.bookings);
  payments.replaceAll(d.payments);
  refunds.replaceAll(d.refunds);
  settlements.replaceAll(d.settlements);
  reviews.replaceAll(d.reviews);
  posts.replaceAll(d.posts);
  comments.replaceAll(d.comments);
  notifications.replaceAll(d.notifications);
  reports.replaceAll(d.reports);
  seedVersion.set(SEED_VERSION);
}

/** 전문가가 새로 등록하면 시간표를 만들어 준다. */
export function openDefaultSchedule(expertId: string, hours: number[], weekdays: number[]) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const rows: Availability[] = [];

  for (let d = 0; d <= SCHEDULE_DAYS; d++) {
    const day = new Date(base);
    day.setDate(base.getDate() + d);
    if (!weekdays.includes(day.getDay())) continue;
    for (const hour of hours) {
      const startsAt = new Date(day);
      startsAt.setHours(hour, 0, 0, 0);
      rows.push({
        id: newId("av"),
        expertId,
        startsAt: startsAt.toISOString(),
        state: "open",
      });
    }
  }

  availability.replaceAll([
    ...availability.list().filter((a) => a.expertId !== expertId || a.state !== "open"),
    ...rows,
  ]);
}

/* ---------- 찾기 ---------- */

export function findExpertBySlug(slug: string) {
  return experts.list().find((e) => e.slug === slug);
}

export function ratingOf(e: Expert): number | null {
  if (e.ratingCount < MIN_REVIEWS_TO_SHOW) return null;
  return Math.round((e.ratingSum / e.ratingCount) * 10) / 10;
}

/* ---------- 결제 흐름 ---------- */

// 결제 화면 세 개가 값을 주고받는 곳. 주소창에 이름과 연락처를 실어 나르지 않기 위해서다.
export type CheckoutDraft = {
  expertSlug: string;
  startsAt: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  note: string;
  method: PaymentMethod;
};

export const checkoutDraft = cell<CheckoutDraft | null>("checkout", null);

/* ---------- 화면 보드 미리보기 ---------- */

// preview=1 로 열린 문서는 localStorage 와 무관하게 고정 시드를 메모리에만 올린다.
// 화면이 처음 그려질 때 이미 채워져 있어야 "없는 예약" 같은 빈 화면으로 튕기지 않는다.
// 세션은 as= 값에 해당하는 고정 회원으로 덮는다. guest 는 로그인하지 않은 상태다.
function hydratePreview() {
  const d = buildPreviewScenario(ADMIN_EMAIL);
  hydrate("users", d.users);
  hydrate("experts", d.experts);
  hydrate("availability", d.availability);
  hydrate("bookings", d.bookings);
  hydrate("payments", d.payments);
  hydrate("refunds", d.refunds);
  hydrate("settlements", d.settlements);
  hydrate("reviews", d.reviews);
  hydrate("posts", d.posts);
  hydrate("comments", d.comments);
  hydrate("notifications", d.notifications);
  hydrate("reports", d.reports);
  hydrate("seedVersion", SEED_VERSION);
  hydrate("session", PERSONA_USER_ID[previewPersona]);

  // 결제 화면 세 개는 앞 화면이 남긴 값을 읽는다. 쓰기가 막혀 있어 직접 채워 둔다.
  const slot = d.availability
    .filter((a) => a.expertId === SAMPLE.expertId && a.state === "open")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  const draft: CheckoutDraft = {
    expertSlug: SAMPLE.expertSlug,
    startsAt: slot ? slot.startsAt : new Date().toISOString(),
    guestName: "김미리",
    guestPhone: "010-1111-2222",
    guestEmail: "preview-user@conect.kr",
    note: "",
    method: "card",
  };
  hydrate("checkout", draft);
}

// 빌드 조건을 여기서도 직접 써야 운영 빌드에서 hydratePreview 와 미리보기 시드가 번들에서 빠진다.
if (import.meta.env.DEV || import.meta.env.VITE_SCREENS === "1") {
  if (isPreview) hydratePreview();
}
