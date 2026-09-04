"use client";

// 정산. 전문가별로 묶고, 지급예정 건을 골라 한 번에 지급 처리한다.

import { useMemo, useState } from "react";
import { Modal } from "@/app/conect3/_components/shell";
import { Badge, Button, DataRow, EmptyState } from "@/app/conect3/_components/ui";
import { bookings, experts, settlements, type Settlement } from "@/app/conect3/_lib/data";
import { paySettlements } from "@/app/conect3/_lib/domain";
import { formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";

type Filter = Settlement["status"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "대기" },
  { value: "ready", label: "지급예정" },
  { value: "paid", label: "지급완료" },
];

const STATUS_LABEL: Record<Filter, string> = {
  pending: "대기",
  ready: "지급예정",
  paid: "지급완료",
};

export default function AdminSettlementsPage() {
  const { loaded, rows } = settlements.useList();
  const { rows: allExperts } = experts.useList();
  const { rows: allBookings } = bookings.useList();
  const [filter, setFilter] = useState<Filter>("ready");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmPay, setConfirmPay] = useState(false);

  const expertName = (id: string) => allExperts.find((e) => e.id === id)?.name ?? "탈퇴한 전문가";
  const bookingOf = (bookingId: string) => allBookings.find((b) => b.id === bookingId);

  const groups = useMemo(() => {
    const filtered = rows.filter((s) => s.status === filter);
    const map = new Map<string, Settlement[]>();
    filtered.forEach((s) => {
      const list = map.get(s.expertId) ?? [];
      list.push(s);
      map.set(s.expertId, list);
    });
    return [...map.entries()].sort((a, b) => expertName(a[0]).localeCompare(expertName(b[0])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter]);

  if (!loaded) return <main className="flex-1 overflow-y-auto" />;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
      <div className="flex gap-1.5 pb-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setFilter(f.value);
              setSelected(new Set());
            }}
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

      {groups.length === 0 ? (
        <EmptyState title="해당하는 정산이 없어요" />
      ) : (
        <div className="space-y-5">
          {groups.map(([expertId, list]) => {
            const net = list.reduce((sum, s) => sum + s.net, 0);
            return (
              <section key={expertId}>
                <div className="flex items-center justify-between">
                  <p className="text-t5 font-semibold">{expertName(expertId)}</p>
                  <p className="text-t3 text-fg-neutral-subtle">
                    {list.length}건 · {formatPrice(net)}
                  </p>
                </div>
                <ul className="mt-2 divide-y divide-stroke-neutral-subtle rounded-r3 bg-bg-neutral-weak px-3.5">
                  {list.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 py-3">
                      {filter === "ready" ? (
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggle(s.id)}
                          className="size-4 shrink-0 accent-bg-brand-solid"
                          aria-label="선택"
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setOpenId(openId === s.id ? null : s.id)}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-t4">{formatPrice(s.net)}</span>
                          <Badge
                            variant={s.status === "paid" ? "neutral" : s.status === "ready" ? "brand" : "warning"}
                          >
                            {STATUS_LABEL[s.status]}
                          </Badge>
                        </div>
                        {openId === s.id ? (
                          <dl className="mt-2 divide-y divide-stroke-neutral-subtle">
                            <DataRow
                              label="상담 일시"
                              value={bookingOf(s.bookingId) ? formatSlotRange(bookingOf(s.bookingId)!.startsAt) : "-"}
                            />
                            <DataRow label="총액" value={formatPrice(s.gross)} />
                            <DataRow label="수수료" value={formatPrice(s.fee)} />
                            <DataRow label="실수령" value={formatPrice(s.net)} />
                          </dl>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {filter === "ready" && selected.size > 0 ? (
        <div className="sticky bottom-0 mt-6 bg-bg-layer-default py-3">
          <Button onClick={() => setConfirmPay(true)}>선택 {selected.size}건 지급 완료 처리</Button>
        </div>
      ) : null}

      <Modal
        open={confirmPay}
        title={`${selected.size}건을 지급 완료로 처리할까요?`}
        confirmLabel="지급 완료"
        cancelLabel="취소"
        onConfirm={() => {
          paySettlements([...selected]);
          setSelected(new Set());
        }}
        onClose={() => setConfirmPay(false)}
      />
    </main>
  );
}
