"use client";

// 전문가 상세. 데이터가 브라우저 저장소에 있어서 서버가 못 읽는다.
// 그래서 useParams로 slug를 읽고 전부 브라우저에서 그린다.

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  checkoutDraft,
  experts,
  ratingOf,
  reviews,
  session,
  users,
} from "@/app/conect3/_lib/data";
import { dayLabel, formatPrice, formatTime } from "@/app/conect3/_lib/format";
import { AppBar, BottomBar, useLoginGate } from "@/app/conect3/_components/shell";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Divider,
  EmptyState,
  Rating,
  SectionTitle,
} from "@/app/conect3/_components/ui";
import { ReviewItem } from "@/app/conect3/_components/cards";
import { IconChevron } from "@/app/conect3/_components/icons";
import { SlotPicker } from "./SlotPicker";

export default function ExpertDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const gate = useLoginGate();

  const { loaded, rows } = experts.useList();
  const { rows: allReviews } = reviews.useList();
  const [startsAt, setStartsAt] = useState<string | null>(null);

  const expert = rows.find((e) => e.slug === slug);

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="전문가" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="찾을 수 없는 전문가입니다"
            body="주소가 바뀌었거나 활동을 멈춘 전문가일 수 있어요"
            action={
              <ButtonLink href="/conect3" size="md">
                홈으로
              </ButtonLink>
            }
          />
        </main>
      </>
    );
  }

  const rating = ratingOf(expert);
  const mine = allReviews
    .filter((r) => r.expertId === expert.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const book = () => {
    if (!startsAt) return;
    // 로그인 시트가 올라갔다 내려온 직후에는 화면이 아직 새 사용자로 다시 그려지기
    // 전이라, 세션을 직접 읽어 이름과 연락처를 채운다.
    const go = () => {
      const uid = session.get();
      const me = uid ? users.find(uid) : undefined;
      checkoutDraft.set({
        expertSlug: expert.slug,
        startsAt,
        guestName: me?.name ?? "",
        guestPhone: me?.phone ?? "",
        guestEmail: me?.email ?? "",
        note: "",
        method: "card",
      });
      router.push("/conect3/checkout");
    };
    if (gate.require(go)) go();
  };

  return (
    <>
      <AppBar title={expert.name} back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) pt-2 pb-5">
          <div className="flex items-start gap-3.5">
            <Avatar size={56} name={expert.name} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="truncate text-t7 font-bold">{expert.name}</h2>
                <span className="shrink-0 text-t3 text-fg-neutral-subtle">{expert.job}</span>
                <Badge variant="line">{expert.field}</Badge>
              </div>
              <div className="mt-1.5">
                <Rating value={rating} count={rating === null ? undefined : expert.ratingCount} />
              </div>
            </div>
          </div>

          <p className="mt-3.5 text-t4 leading-relaxed text-fg-neutral-muted">
            {expert.headline}
          </p>

          <div className="mt-4 flex items-baseline justify-between rounded-r3 bg-bg-neutral-weak px-4 py-3.5">
            <span className="text-t4 text-fg-neutral-subtle">1시간 상담</span>
            <span className="text-t7 font-bold tabular-nums">
              {formatPrice(expert.pricePerHour)}
            </span>
          </div>
        </section>

        <Divider />

        <section className="px-(--gutter) py-5">
          <SectionTitle>소개</SectionTitle>
          <p className="mt-3 text-t4 leading-relaxed whitespace-pre-line text-fg-neutral-muted">
            {expert.bio}
          </p>
        </section>

        <Divider />

        <section className="py-5">
          <div className="px-(--gutter)">
            <SectionTitle
              action={
                mine.length > 0 ? (
                  <Link
                    href={`/conect3/experts/${expert.slug}/reviews`}
                    className="flex items-center gap-0.5 text-t3 text-fg-neutral-subtle"
                  >
                    전체보기
                    <IconChevron size={14} />
                  </Link>
                ) : undefined
              }
            >
              후기{" "}
              <span className="text-fg-neutral-subtle tabular-nums">{expert.ratingCount}</span>
            </SectionTitle>
          </div>

          {mine.length === 0 ? (
            <EmptyState title="아직 후기가 없어요" body="첫 후기를 남겨 주세요" />
          ) : (
            <ul className="mt-1 px-(--gutter)">
              {mine.slice(0, 3).map((r) => (
                <ReviewItem key={r.id} review={r} />
              ))}
            </ul>
          )}
        </section>

        <Divider />

        <section className="py-5">
          <div className="mb-3 px-(--gutter)">
            <SectionTitle>시간 고르기</SectionTitle>
          </div>
          <SlotPicker expertId={expert.id} value={startsAt} onChange={setStartsAt} />
        </section>
      </main>

      <BottomBar>
        <Button disabled={!startsAt} onClick={book}>
          {startsAt
            ? `${dayLabel(startsAt)} ${formatTime(startsAt)} 예약하기`
            : "시간을 선택해 주세요"}
        </Button>
      </BottomBar>
    </>
  );
}
