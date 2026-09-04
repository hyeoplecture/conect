"use client";

// 신고와 문의. 시트에서 처리 완료로 넘기고 대상으로 이동한다.

import { useState } from "react";
import { Sheet } from "@/app/conect3/_components/shell";
import { Badge, Button, EmptyState } from "@/app/conect3/_components/ui";
import { bookings, experts, reports, reviews, type Report } from "@/app/conect3/_lib/data";
import { formatDateShort } from "@/app/conect3/_lib/format";

type Filter = Report["status"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "open", label: "열림" },
  { value: "resolved", label: "처리됨" },
];

const KIND_LABEL: Record<Report["kind"], string> = {
  review: "후기",
  post: "글",
  booking: "예약",
  inquiry: "문의",
};

export default function AdminReportsPage() {
  const { loaded, rows } = reports.useList();
  const { rows: allReviews } = reviews.useList();
  const { rows: allExperts } = experts.useList();
  const { rows: allBookings } = bookings.useList();
  const [filter, setFilter] = useState<Filter>("open");
  const [openId, setOpenId] = useState<string | null>(null);

  if (!loaded) return <main className="flex-1 overflow-y-auto" />;

  const list = rows
    .filter((r) => r.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const open = rows.find((r) => r.id === openId) ?? null;

  const targetHref = (r: Report): string | null => {
    if (r.kind === "review") {
      const review = allReviews.find((v) => v.id === r.targetId);
      const expert = review ? allExperts.find((e) => e.id === review.expertId) : undefined;
      return expert ? `/conect3/experts/${expert.slug}/reviews` : null;
    }
    if (r.kind === "post") return `/conect3/community/${r.targetId}`;
    if (r.kind === "booking") {
      const booking = allBookings.find((b) => b.id === r.targetId);
      return booking ? `/conect3/admin/bookings` : null;
    }
    return null;
  };

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
      <div className="flex gap-1.5 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex h-8 flex-1 items-center justify-center rounded-full text-t3 ${
              filter === f.value
                ? "bg-bg-brand-solid font-semibold text-fg-neutral-inverted"
                : "bg-bg-neutral-weak text-fg-neutral-subtle"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="해당하는 신고가 없어요" />
      ) : (
        <ul className="divide-y divide-stroke-neutral-subtle">
          {list.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setOpenId(r.id)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="line">{KIND_LABEL[r.kind]}</Badge>
                    <p className="truncate text-t3 text-fg-neutral-subtle">{r.userName}</p>
                  </div>
                  <p className="mt-1 truncate text-t4">{r.body}</p>
                  <p className="mt-0.5 text-t2 text-fg-placeholder">{formatDateShort(r.createdAt)}</p>
                </div>
                <Badge variant={r.status === "open" ? "warning" : "neutral"}>
                  {r.status === "open" ? "열림" : "처리됨"}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!open} onClose={() => setOpenId(null)} title={open ? KIND_LABEL[open.kind] : undefined}>
        {open ? (
          <div>
            <p className="text-t3 text-fg-neutral-subtle">
              {open.userName} · {formatDateShort(open.createdAt)}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-t4">{open.body}</p>

            {targetHref(open) ? (
              <a href={targetHref(open)!} className="mt-4 block text-t3 text-fg-brand underline">
                신고 대상 보러가기
              </a>
            ) : null}

            {open.status === "open" ? (
              <div className="mt-6">
                <Button
                  onClick={() => {
                    reports.update(open.id, { status: "resolved" });
                    setOpenId(null);
                  }}
                >
                  처리 완료
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Sheet>
    </main>
  );
}
