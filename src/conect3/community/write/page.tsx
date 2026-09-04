"use client";

// 커뮤니티 글쓰기. 승인된 전문가만 들어올 수 있다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPost } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { AppBar, BottomBar } from "@/app/conect3/_components/shell";
import { Button, ButtonLink, EmptyState, TextArea } from "@/app/conect3/_components/ui";

export default function CommunityWritePage() {
  const router = useRouter();
  const { loaded, expert } = useSession();
  const [body, setBody] = useState("");

  if (!loaded) return <main className="flex-1" />;

  if (expert?.status !== "approved") {
    return (
      <>
        <AppBar title="글쓰기" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="전문가로 등록하면 글을 쓸 수 있어요"
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

  const submit = () => {
    if (!body.trim()) return;
    const post = addPost(expert.id, body.trim());
    router.replace(`/conect3/community/${post.id}`);
  };

  return (
    <>
      <AppBar title="글쓰기" back />

      <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
        <TextArea
          rows={10}
          placeholder="상담하면서 자주 받는 질문이나, 사람들이 잘못 알고 있는 것을 적어보세요"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          autoFocus
        />
        <p className="mt-2 text-right text-t2 text-fg-placeholder tabular-nums">{body.length}자</p>
      </main>

      <BottomBar>
        <Button disabled={!body.trim()} onClick={submit}>
          올리기
        </Button>
      </BottomBar>
    </>
  );
}
