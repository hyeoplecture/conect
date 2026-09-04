"use client";

// 후기 전체. 상세 화면이 최근 3개만 보여주므로 나머지는 여기서 본다.

import { useState } from "react";
import { useParams } from "next/navigation";
import { experts, reviews } from "@/app/conect3/_lib/data";
import { report } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { AppBar, Modal, Sheet } from "@/app/conect3/_components/shell";
import { Button, ButtonLink, EmptyState, TextArea } from "@/app/conect3/_components/ui";
import { ReviewItem } from "@/app/conect3/_components/cards";
import { IconStar } from "@/app/conect3/_components/icons";

export default function ExpertReviewsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { user } = useSession();

  const { loaded, rows } = experts.useList();
  const { rows: allReviews } = reviews.useList();

  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  const expert = rows.find((e) => e.slug === slug);

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="후기" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="찾을 수 없는 전문가입니다"
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

  const list = allReviews
    .filter((r) => r.expertId === expert.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // 분포는 실제로 쌓인 후기로만 센다. 평균은 전문가에 미리 더해 둔 값을 쓴다.
  const average = expert.ratingCount > 0 ? expert.ratingSum / expert.ratingCount : 0;
  const buckets = [5, 4, 3, 2, 1].map((n) => ({
    score: n,
    count: list.filter((r) => r.rating === n).length,
  }));

  const submitReport = () => {
    if (!user || !reportTarget || !reason.trim()) return;
    report({
      kind: "review",
      targetId: reportTarget,
      userId: user.id,
      userName: user.name,
      body: reason.trim(),
    });
    setReportTarget(null);
    setReason("");
    setDone(true);
  };

  return (
    <>
      <AppBar title="후기" back />

      <main className="flex-1 overflow-y-auto">
        {list.length === 0 ? (
          <EmptyState title="아직 후기가 없어요" body="상담이 끝나면 후기를 남길 수 있어요" />
        ) : (
          <>
            <section className="flex items-center gap-6 px-(--gutter) py-6">
              <div className="shrink-0 text-center">
                <p className="text-t10 font-bold tabular-nums">{average.toFixed(1)}</p>
                <span className="mt-1 flex justify-center text-fg-warning">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <IconStar key={n} size={14} filled={n <= Math.round(average)} />
                  ))}
                </span>
                <p className="mt-1 text-t2 text-fg-placeholder tabular-nums">
                  후기 {expert.ratingCount}개
                </p>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                {buckets.map((b) => (
                  <div key={b.score} className="flex items-center gap-2">
                    <span className="w-3 shrink-0 text-t2 text-fg-placeholder tabular-nums">
                      {b.score}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-neutral-weak">
                      <span
                        className="block h-full rounded-full bg-bg-brand-solid"
                        style={{ width: `${list.length ? (b.count / list.length) * 100 : 0}%` }}
                      />
                    </span>
                    <span className="w-5 shrink-0 text-right text-t2 text-fg-placeholder tabular-nums">
                      {b.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <ul className="px-(--gutter) pb-6">
              {list.map((r) => (
                <ReviewItem
                  key={r.id}
                  review={r}
                  onReport={user ? () => setReportTarget(r.id) : undefined}
                />
              ))}
            </ul>
          </>
        )}
      </main>

      <Sheet
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        title="후기 신고"
      >
        <TextArea
          label="어떤 점이 문제인가요"
          placeholder="사실과 다른 내용, 욕설, 광고 등"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4">
          <Button disabled={!reason.trim()} onClick={submitReport}>
            신고하기
          </Button>
        </div>
      </Sheet>

      <Modal
        open={done}
        title="접수했습니다"
        body="확인 후 처리 결과를 알림으로 보내 드립니다"
        onClose={() => setDone(false)}
      />
    </>
  );
}
