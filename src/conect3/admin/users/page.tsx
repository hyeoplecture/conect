"use client";

// 회원 목록. 검색하고, 탈퇴 회원도 목록에 남긴다.

import { useMemo, useState } from "react";
import { Badge, EmptyState, Field } from "@/app/conect3/_components/ui";
import { bookings, users } from "@/app/conect3/_lib/data";
import { formatDateShort } from "@/app/conect3/_lib/format";

export default function AdminUsersPage() {
  const { loaded, rows } = users.useList();
  const { rows: allBookings } = bookings.useList();
  const [q, setQ] = useState("");

  const bookingCount = useMemo(() => {
    const map = new Map<string, number>();
    allBookings.forEach((b) => map.set(b.userId, (map.get(b.userId) ?? 0) + 1));
    return map;
  }, [allBookings]);

  if (!loaded) return <main className="flex-1 overflow-y-auto" />;

  const keyword = q.trim().toLowerCase();
  const list = rows
    .filter((u) => (keyword ? u.name.toLowerCase().includes(keyword) || u.email.toLowerCase().includes(keyword) : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-4">
      <Field
        placeholder="이름 또는 이메일로 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="해당하는 회원이 없어요" />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-stroke-neutral-subtle">
          {list.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-t4 font-semibold">{u.name}</p>
                  {u.deletedAt ? <Badge variant="critical">탈퇴</Badge> : null}
                  {u.expertId ? <Badge variant="line">전문가</Badge> : null}
                </div>
                <p className="mt-0.5 truncate text-t3 text-fg-neutral-subtle">{u.email}</p>
              </div>
              <div className="shrink-0 text-right text-t2 text-fg-neutral-subtle">
                <p>가입 {formatDateShort(u.createdAt)}</p>
                <p className="mt-0.5 tabular-nums">예약 {bookingCount.get(u.id) ?? 0}건</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
