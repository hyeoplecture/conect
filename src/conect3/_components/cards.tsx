"use client";

// 여러 화면에 같은 모양으로 반복되는 목록 조각.
// 전문가 한 줄이 홈·검색·어드민에서 다르게 생기면 같은 앱으로 안 보인다.

import Link from "next/link";
import {
  PAYMENT_LABELS,
  ratingOf,
  type Booking,
  type Expert,
  type Notification,
  type Post,
  type Review,
} from "@/app/conect3/_lib/data";
import { dayLabel, formatPrice, formatTime, fromNow } from "@/app/conect3/_lib/format";
import { Avatar, Badge, Rating } from "./ui";
import { IconChevron, IconComment, IconHeart, IconStar } from "./icons";

/* ---------- 전문가 한 줄 ---------- */

// 가격을 행의 오른쪽 끝에 두고 자릿수를 세로로 맞춘다.
// 왼쪽은 아바타부터 화면 여백 선에 정확히 선다.
export function ExpertRow({ expert }: { expert: Expert }) {
  const rating = ratingOf(expert);
  return (
    <li className="border-b border-stroke-neutral-subtle last:border-0">
      <Link
        href={`/conect3/experts/${expert.slug}`}
        className="flex items-start gap-[14px] px-(--gutter) py-4 active:bg-bg-neutral-weak"
      >
        <Avatar size={46} name={expert.name} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-t5 font-semibold">{expert.name}</span>
            <span className="text-t3 text-fg-neutral-subtle">{expert.job}</span>
            <Badge variant="line">{expert.field}</Badge>
          </div>
          <span className="mt-[3px] block truncate text-t3 text-fg-neutral-muted">
            {expert.headline}
          </span>
          <div className="mt-1">
            <Rating value={rating} count={expert.ratingCount} />
          </div>
        </div>
        <span className="shrink-0 pt-0.5 text-right">
          <span className="block text-t5 font-bold tabular-nums">
            {expert.pricePerHour.toLocaleString("ko-KR")}
          </span>
          <span className="block text-t1 text-fg-placeholder">원 / 1시간</span>
        </span>
      </Link>
    </li>
  );
}

/* ---------- 후기 하나 ---------- */

export function ReviewItem({
  review,
  onReport,
}: {
  review: Review;
  onReport?: () => void;
}) {
  return (
    <li className="border-b border-stroke-neutral-subtle py-4 last:border-0">
      <div className="flex items-center gap-2">
        <span className="flex text-fg-warning">
          {[1, 2, 3, 4, 5].map((n) => (
            <IconStar key={n} size={12} filled={n <= review.rating} />
          ))}
        </span>
        <span className="text-t2 text-fg-neutral-subtle">{review.userName}</span>
        <span className="text-t2 text-fg-placeholder">{fromNow(review.createdAt)}</span>
        {onReport ? (
          <button
            onClick={onReport}
            className="ml-auto text-t2 text-fg-placeholder underline"
          >
            신고
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-t3 leading-relaxed text-fg-neutral-muted">{review.body}</p>
      {review.reply ? (
        <div className="mt-2.5 rounded-r3 bg-bg-neutral-weak px-3.5 py-3">
          <p className="text-t2 font-semibold text-fg-neutral-subtle">전문가 답글</p>
          <p className="mt-1 text-t3 text-fg-neutral-muted">{review.reply}</p>
        </div>
      ) : null}
    </li>
  );
}

/* ---------- 커뮤니티 글 ---------- */

export function PostCard({
  post,
  expert,
  commentCount,
}: {
  post: Post;
  expert: Expert | undefined;
  commentCount: number;
}) {
  return (
    <li className="border-b border-stroke-neutral-subtle last:border-0">
      <Link href={`/conect3/community/${post.id}`} className="block px-(--gutter) py-4">
        <div className="flex items-center gap-2">
          <Avatar size={32} name={expert?.name} />
          <div className="min-w-0">
            <p className="truncate text-t3 font-semibold">
              {expert?.name ?? "전문가"}
              <span className="ml-1.5 font-normal text-fg-neutral-subtle">{expert?.job}</span>
            </p>
            <p className="text-t2 text-fg-placeholder">{fromNow(post.createdAt)}</p>
          </div>
        </div>
        <p className="mt-2.5 line-clamp-3 text-t4 leading-relaxed text-fg-neutral-muted">
          {post.body}
        </p>
        <div className="mt-2.5 flex items-center gap-3.5 text-t2 text-fg-placeholder">
          <span className="flex items-center gap-1">
            <IconHeart size={14} />
            <span className="tabular-nums">{post.likes}</span>
          </span>
          <span className="flex items-center gap-1">
            <IconComment size={14} />
            <span className="tabular-nums">{commentCount}</span>
          </span>
        </div>
      </Link>
    </li>
  );
}

/* ---------- 예약 한 줄 ---------- */

const STATUS_LABEL: Record<Booking["status"], { text: string; variant: "brand" | "neutral" | "critical" | "positive" }> = {
  confirmed: { text: "예정", variant: "brand" },
  completed: { text: "완료", variant: "positive" },
  canceled: { text: "취소", variant: "neutral" },
  no_show: { text: "미진행", variant: "critical" },
};

export function BookingRow({
  booking,
  href,
  side = "user",
}: {
  booking: Booking;
  href: string;
  /** user면 전문가 이름을, expert면 신청자 이름을 앞에 둔다 */
  side?: "user" | "expert";
}) {
  const status = STATUS_LABEL[booking.status];
  const title = side === "user" ? booking.expertName : booking.guestName;
  const sub = side === "user" ? booking.expertJob : "신청자";

  return (
    <li className="border-b border-stroke-neutral-subtle last:border-0">
      <Link href={href} className="flex items-center gap-3 px-(--gutter) py-3.5">
        <Avatar size={40} name={title} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-t4 font-semibold">{title}</span>
            <span className="shrink-0 text-t3 text-fg-neutral-subtle">{sub}</span>
            <span className="ml-auto shrink-0">
              <Badge variant={status.variant}>{status.text}</Badge>
            </span>
          </div>
          <p className="mt-0.5 text-t3 text-fg-neutral-subtle">
            {dayLabel(booking.startsAt)} {formatTime(booking.startsAt)}
          </p>
          <p className="mt-0.5 text-t2 text-fg-placeholder tabular-nums">
            {formatPrice(booking.amount)} · {PAYMENT_LABELS[booking.method]} · {booking.code}
          </p>
        </div>
        <span className="shrink-0 text-fg-placeholder">
          <IconChevron />
        </span>
      </Link>
    </li>
  );
}

/* ---------- 알림 하나 ---------- */

export function NotificationItem({ item }: { item: Notification }) {
  const inner = (
    <div
      className={`flex gap-3 px-(--gutter) py-3.5 ${item.readAt ? "" : "bg-bg-brand-weak/40"}`}
    >
      <span
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
          item.readAt ? "bg-transparent" : "bg-bg-brand-solid"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="truncate text-t4 font-semibold">{item.title}</p>
          <span className="ml-auto shrink-0 text-t1 text-fg-placeholder">
            {fromNow(item.createdAt)}
          </span>
        </div>
        {item.body ? (
          <p className="mt-0.5 text-t3 text-fg-neutral-subtle">{item.body}</p>
        ) : null}
        <p className="mt-1 text-t1 text-fg-placeholder">{item.channel}으로 보냈습니다</p>
      </div>
    </div>
  );

  return (
    <li className="border-b border-stroke-neutral-subtle last:border-0">
      {item.href ? <Link href={item.href}>{inner}</Link> : inner}
    </li>
  );
}
