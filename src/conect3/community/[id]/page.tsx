"use client";

// 글 상세. 데이터가 브라우저 저장소에 있어서 useParams로 id를 읽고 전부 브라우저에서 그린다.

import { useState } from "react";
import { useParams } from "next/navigation";
import { comments, experts, posts } from "@/app/conect3/_lib/data";
import { addComment, report } from "@/app/conect3/_lib/domain";
import { fromNow, formatPrice } from "@/app/conect3/_lib/format";
import { useSession } from "@/app/conect3/_lib/session";
import { AppBar, BottomBar, Modal, Sheet, useLoginGate } from "@/app/conect3/_components/shell";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  TextArea,
} from "@/app/conect3/_components/ui";
import { IconHeart } from "@/app/conect3/_components/icons";

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { loaded, row: post } = posts.useOne(id);
  const { rows: allExperts } = experts.useList();
  const { rows: allComments } = comments.useList();
  const { user } = useSession();
  const gate = useLoginGate();

  const [liked, setLiked] = useState(false);
  const [body, setBody] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBody, setReportBody] = useState("");
  const [reportDone, setReportDone] = useState(false);

  if (!loaded) return <main className="flex-1" />;

  if (!post) {
    return (
      <>
        <AppBar title="게시글" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="찾을 수 없는 글입니다"
            body="삭제되었거나 주소가 바뀌었을 수 있어요"
            action={
              <ButtonLink href="/conect3/community" size="md">
                커뮤니티로
              </ButtonLink>
            }
          />
        </main>
      </>
    );
  }

  const expert = allExperts.find((e) => e.id === post.expertId);
  const postComments = allComments
    .filter((c) => c.postId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function like() {
    if (liked || !post) return;
    posts.update(post.id, { likes: post.likes + 1 });
    setLiked(true);
  }

  function submitComment() {
    if (!body.trim() || !post) return;
    const go = () => {
      if (!user) return;
      addComment({ postId: post.id, userId: user.id, userName: user.name, body: body.trim() });
      setBody("");
    };
    if (gate.require(go)) go();
  }

  function submitReport() {
    if (!reportBody.trim() || !post || !user) return;
    report({
      kind: "post",
      targetId: post.id,
      userId: user.id,
      userName: user.name,
      body: reportBody.trim(),
    });
    setReportOpen(false);
    setReportBody("");
    setReportDone(true);
  }

  return (
    <>
      <AppBar
        title="게시글"
        back
        right={
          <button
            onClick={() => gate.require(() => setReportOpen(true))}
            className="mr-1 text-t2 text-fg-placeholder underline"
          >
            신고
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto pb-4">
        <section className="px-(--gutter) pt-2 pb-4">
          <ButtonLink
            href={expert ? `/conect3/experts/${expert.slug}` : "/conect3/community"}
            variant="secondary"
            size="sm"
            className="!inline-flex !w-auto items-center gap-2 !justify-start !rounded-r3 !bg-transparent !px-0"
          >
            <Avatar size={40} name={expert?.name} />
            <span className="text-left">
              <span className="flex items-center gap-1.5">
                <span className="text-t4 font-semibold text-fg-neutral">{expert?.name ?? "전문가"}</span>
                <span className="text-t3 text-fg-neutral-subtle">{expert?.job}</span>
                {expert ? <Badge variant="line">{expert.field}</Badge> : null}
              </span>
              <span className="mt-0.5 block text-t2 text-fg-placeholder">
                {fromNow(post.createdAt)}
              </span>
            </span>
          </ButtonLink>

          <p className="mt-4 whitespace-pre-line text-t4 leading-relaxed text-fg-neutral">
            {post.body}
          </p>

          <button
            onClick={like}
            disabled={liked}
            className={`mt-4 flex items-center gap-1.5 text-t3 ${
              liked ? "text-fg-critical" : "text-fg-neutral-subtle"
            }`}
          >
            <IconHeart size={18} filled={liked} />
            <span className="tabular-nums">{post.likes + (liked ? 1 : 0)}</span>
          </button>
        </section>

        {expert ? (
          <section className="mx-(--gutter) rounded-r3 bg-bg-neutral-weak px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar size={44} name={expert.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-t4 font-semibold">
                  {expert.name} <span className="font-normal text-fg-neutral-subtle">{expert.job}</span>
                </p>
                <p className="truncate text-t3 text-fg-neutral-subtle">{expert.headline}</p>
                <p className="mt-0.5 text-t3 font-semibold tabular-nums">
                  {formatPrice(expert.pricePerHour)} / 1시간
                </p>
              </div>
            </div>
            <div className="mt-3.5">
              <ButtonLink href={`/conect3/experts/${expert.slug}`} size="md">
                상담 예약하기
              </ButtonLink>
            </div>
          </section>
        ) : null}

        <section className="mt-5 px-(--gutter)">
          <p className="text-t4 font-semibold">
            댓글 <span className="text-fg-neutral-subtle tabular-nums">{postComments.length}</span>
          </p>
          {postComments.length === 0 ? (
            <p className="py-8 text-center text-t3 text-fg-placeholder">첫 댓글을 남겨보세요</p>
          ) : (
            <ul className="mt-2">
              {postComments.map((c) => (
                <li key={c.id} className="border-b border-stroke-neutral-subtle py-3 last:border-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-t3 font-semibold">{c.userName}</span>
                    <span className="text-t1 text-fg-placeholder">{fromNow(c.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-t4 text-fg-neutral-muted">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomBar>
        <div className="flex items-center gap-2">
          <Field
            placeholder="댓글을 남겨보세요"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitComment();
            }}
          />
          <Button size="md" className="!w-auto shrink-0 px-4" disabled={!body.trim()} onClick={submitComment}>
            등록
          </Button>
        </div>
      </BottomBar>

      <Sheet open={reportOpen} onClose={() => setReportOpen(false)} title="신고하기">
        <TextArea
          placeholder="신고 사유를 적어 주세요"
          value={reportBody}
          onChange={(e) => setReportBody(e.target.value)}
        />
        <div className="mt-4">
          <Button disabled={!reportBody.trim()} onClick={submitReport}>
            접수하기
          </Button>
        </div>
      </Sheet>

      <Modal open={reportDone} title="접수했습니다" onClose={() => setReportDone(false)} />
    </>
  );
}
