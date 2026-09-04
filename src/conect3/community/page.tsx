"use client";

// 커뮤니티 목록. 승인된 전문가가 쓴 글만 모여 있다.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FIELDS, comments, experts, posts, type Field } from "@/app/conect3/_lib/data";
import { useSession } from "@/app/conect3/_lib/session";
import { AppBar, TabBar } from "@/app/conect3/_components/shell";
import { Chip, EmptyState } from "@/app/conect3/_components/ui";
import { PostCard } from "@/app/conect3/_components/cards";
import { IconPlus } from "@/app/conect3/_components/icons";

const PAGE_SIZE = 6;

export default function CommunityPage() {
  const { loaded, rows: allPosts } = posts.useList();
  const { rows: allExperts } = experts.useList();
  const { rows: allComments } = comments.useList();
  const { expert } = useSession();
  const [field, setField] = useState<Field | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [renderedField, setRenderedField] = useState(field);
  const sentinelRef = useRef<HTMLLIElement>(null);

  const canWrite = expert?.status === "approved";

  const list = allPosts
    .filter((p) => {
      if (!field) return true;
      const e = allExperts.find((ex) => ex.id === p.expertId);
      return e?.field === field;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // 분야 칩을 바꾸면 처음 개수부터 다시 보여준다 (렌더 중 상태 조정, 효과 아님)
  if (field !== renderedField) {
    setRenderedField(field);
    setVisibleCount(PAGE_SIZE);
  }

  const visibleList = list.slice(0, visibleCount);
  const hasMore = visibleCount < list.length;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => c + PAGE_SIZE);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  return (
    <>
      <AppBar title="커뮤니티" bell />

      <main className="flex-1 overflow-y-auto">
        <p className="px-(--gutter) pt-1 pb-3 text-t3 text-fg-neutral-subtle">
          전문가들이 직접 쓰는 글
        </p>

        <div className="flex gap-1.5 overflow-x-auto px-(--gutter) pb-3">
          <Chip selected={field === null} onClick={() => setField(null)}>
            전체
          </Chip>
          {FIELDS.map((f) => (
            <Chip key={f} selected={field === f} onClick={() => setField(f)}>
              {f}
            </Chip>
          ))}
        </div>

        {!loaded ? null : list.length === 0 ? (
          <EmptyState title="아직 글이 없어요" body="선택한 분야의 첫 글을 기다리고 있어요" />
        ) : (
          <ul>
            {visibleList.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                expert={allExperts.find((e) => e.id === post.expertId)}
                commentCount={allComments.filter((c) => c.postId === post.id).length}
              />
            ))}
            {hasMore ? (
              <li ref={sentinelRef} className="px-(--gutter) py-4">
                <div className="h-24 animate-pulse rounded-r3 bg-bg-neutral-weak" />
              </li>
            ) : null}
          </ul>
        )}
      </main>

      {canWrite ? (
        <Link
          href="/conect3/community/write"
          aria-label="글쓰기"
          className="absolute right-4 bottom-[74px] z-10 grid size-13 place-items-center rounded-full bg-bg-brand-solid text-fg-neutral-inverted shadow-lg"
        >
          <IconPlus size={22} />
        </Link>
      ) : null}

      <TabBar />
    </>
  );
}
