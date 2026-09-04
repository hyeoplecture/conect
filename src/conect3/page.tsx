"use client";

// 홈. "무엇을 파는 곳인지"를 보여주는 화면이다.
// 전체 목록과 정렬은 전문가 탭이 맡는다. 여기서는 분야 격자와 하이라이트만 둔다.

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppBar, Footer, TabBar } from "./_components/shell";
import { ExpertRow } from "./_components/cards";
import { Avatar, Divider, SectionTitle } from "./_components/ui";
import { IconSearch } from "./_components/icons";
import {
  IconAll,
  IconCode,
  IconCompass,
  IconGrowth,
  IconHouse,
  IconLaw,
  IconPulse,
  IconTax,
} from "./_components/FieldIcons";
import {
  MIN_LEAD_HOURS,
  availability,
  experts,
  posts,
  ratingOf,
  type Availability,
  type Expert,
} from "./_lib/data";
import { fromNow } from "./_lib/format";

/** 4 x 2로 놓이는 분야 여덟 칸. 누르면 전문가 탭으로 넘어간다. */
const TILES: { href: string; label: string; Icon: () => React.ReactElement }[] = [
  { href: "/conect3/experts", label: "전체 보기", Icon: IconAll },
  { href: "/conect3/experts?field=법률", label: "법률", Icon: IconLaw },
  { href: "/conect3/experts?field=세무", label: "세무", Icon: IconTax },
  { href: "/conect3/experts?field=부동산", label: "부동산", Icon: IconHouse },
  { href: "/conect3/experts?field=진로", label: "진로", Icon: IconCompass },
  { href: "/conect3/experts?field=건강", label: "건강", Icon: IconPulse },
  { href: "/conect3/experts?field=재테크", label: "재테크", Icon: IconGrowth },
  { href: "/conect3/experts?field=IT", label: "IT", Icon: IconCode },
];

/** 전문가별로 지금 잡을 수 있는 가장 이른 시간. */
function earliestSlots(slots: Availability[], now: number) {
  const from = now + MIN_LEAD_HOURS * 3600000;
  const map = new Map<string, number>();
  for (const slot of slots) {
    if (slot.state !== "open") continue;
    const t = new Date(slot.startsAt).getTime();
    if (t < from) continue;
    const seen = map.get(slot.expertId);
    if (seen === undefined || t < seen) map.set(slot.expertId, t);
  }
  return map;
}

export default function HomePage() {
  // 렌더 중 Date.now()를 부르면 서버와 브라우저가 달라진다. 한 번만 잡아 둔다.
  const [now] = useState(() => Date.now());
  const { loaded, rows } = experts.useList();
  const { rows: slots } = availability.useList();
  const { rows: postRows } = posts.useList();

  const approved = useMemo(() => rows.filter((e) => e.status === "approved"), [rows]);

  const earliest = useMemo(() => earliestSlots(slots, now), [slots, now]);

  // 오늘 자정 안에 시작하는 슬롯을 가진 사람.
  const today = useMemo(() => {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const limit = end.getTime();
    return approved
      .filter((e) => {
        const t = earliest.get(e.id);
        return t !== undefined && t <= limit;
      })
      .sort((a, b) => (earliest.get(a.id) ?? 0) - (earliest.get(b.id) ?? 0))
      .slice(0, 4);
  }, [approved, earliest, now]);

  const topRated = useMemo(() => {
    return approved
      .filter((e) => ratingOf(e) !== null)
      .sort(byRating)
      .slice(0, 5);
  }, [approved]);

  const feed = useMemo(() => {
    const byId = new Map(rows.map((e) => [e.id, e]));
    return [...postRows]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 3)
      .map((p) => ({ post: p, expert: byId.get(p.expertId) }));
  }, [postRows, rows]);

  if (!loaded) {
    return (
      <>
        <AppBar title="코넥트" bell />
        <main className="flex-1" />
        <TabBar />
      </>
    );
  }

  return (
    <>
      <AppBar title="코넥트" bell />

      <main className="flex-1 overflow-y-auto">
        {/* 검색이 첫 동작이다. 입력처럼 생겼지만 결과 화면으로 넘긴다. */}
        <div className="px-(--gutter) pt-1 pb-1">
          <Link
            href="/conect3/search"
            className="flex h-[46px] items-center gap-2 rounded-r3 bg-bg-neutral-weak px-[13px] text-fg-placeholder"
          >
            <IconSearch size={19} />
            <span className="text-t4">어떤 도움이 필요하세요?</span>
          </Link>
        </div>

        {/* 칸을 58px 고정 + space-between으로 둔다. 1fr로 두고 가운데 정렬하면
            첫 타일이 30.6px로 밀려 아래 목록 아바타와 왼쪽 선이 어긋난다. */}
        <div className="grid grid-cols-[repeat(4,58px)] justify-between gap-y-5 px-(--gutter) pt-5 pb-6">
          {TILES.map(({ href, label, Icon }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-2">
              <span className="grid size-[58px] place-items-center rounded-r4 bg-bg-neutral-weak text-fg-neutral-muted">
                <Icon />
              </span>
              <span className="whitespace-nowrap text-t3 text-fg-neutral-subtle">{label}</span>
            </Link>
          ))}
        </div>

        {today.length > 0 ? (
          <>
            <Divider />
            <section className="pt-5">
              <div className="px-(--gutter)">
                <SectionTitle action={<MoreLink href="/conect3/experts">전체 보기</MoreLink>}>
                  오늘 상담할 수 있는 전문가
                </SectionTitle>
              </div>
              <ul className="mt-1.5">
                {today.map((e) => (
                  <ExpertRow key={e.id} expert={e} />
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {topRated.length > 0 ? (
          <>
            <Divider />
            <section className="pt-5">
              <div className="px-(--gutter)">
                <SectionTitle action={<MoreLink href="/conect3/experts">전체 보기</MoreLink>}>
                  평점 높은 전문가
                </SectionTitle>
              </div>
              <ul className="mt-1.5">
                {topRated.map((e) => (
                  <ExpertRow key={e.id} expert={e} />
                ))}
              </ul>
            </section>
          </>
        ) : null}

        {feed.length > 0 ? (
          <>
            <Divider />
            <section className="pt-5 pb-2">
              <div className="px-(--gutter)">
                <SectionTitle action={<MoreLink href="/conect3/community">더 보기</MoreLink>}>
                  커뮤니티에서 읽을 만한 글
                </SectionTitle>
              </div>
              <ul className="mt-1.5">
                {feed.map(({ post, expert }) => (
                  <li key={post.id} className="border-b border-stroke-neutral-subtle last:border-0">
                    <Link
                      href={`/conect3/community/${post.id}`}
                      className="block px-(--gutter) py-3.5 active:bg-bg-neutral-weak"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar size={28} name={expert?.name} />
                        <p className="min-w-0 truncate text-t3 font-semibold">
                          {expert?.name ?? "전문가"}
                          <span className="ml-1.5 font-normal text-fg-neutral-subtle">
                            {expert?.job}
                          </span>
                        </p>
                        <span className="ml-auto shrink-0 text-t2 text-fg-placeholder">
                          {fromNow(post.createdAt, now)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-t3 leading-relaxed text-fg-neutral-muted">
                        {post.body}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : null}

        <Footer />
      </main>

      <TabBar />
    </>
  );
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-t3 text-fg-neutral-subtle">
      {children}
    </Link>
  );
}

/** 평점 내림차순, 동점이면 후기 수. */
function byRating(a: Expert, b: Expert) {
  const ra = ratingOf(a) ?? 0;
  const rb = ratingOf(b) ?? 0;
  if (rb !== ra) return rb - ra;
  return b.ratingCount - a.ratingCount;
}
