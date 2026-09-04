"use client";

// 오늘 숫자. 운영자가 접속하면 가장 먼저 보는 화면.

import Link from "next/link";
import {
  PLATFORM_FEE_RATE,
  bookings,
  experts,
  reports,
  settlements,
  users,
} from "@/app/conect3/_lib/data";
import { formatDate, formatPrice, formatTime } from "@/app/conect3/_lib/format";
import { Badge, EmptyState, SectionTitle, Stat } from "@/app/conect3/_components/ui";

const STATUS_LABEL: Record<string, string> = {
  confirmed: "예정",
  completed: "완료",
  canceled: "취소",
  no_show: "미진행",
};

export default function AdminHomePage() {
  const { loaded: bLoaded, rows: allBookings } = bookings.useList();
  const { loaded: uLoaded, rows: allUsers } = users.useList();
  const { loaded: eLoaded, rows: allExperts } = experts.useList();
  const { loaded: sLoaded, rows: allSettlements } = settlements.useList();
  const { loaded: rLoaded, rows: allReports } = reports.useList();

  if (!bLoaded || !uLoaded || !eLoaded || !sLoaded || !rLoaded) {
    return <main className="flex-1 overflow-y-auto" />;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isToday = (iso: string) => new Date(iso).getTime() >= startOfDay.getTime();
  const isThisMonth = (iso: string) => new Date(iso).getTime() >= startOfMonth.getTime();

  const paidBookings = allBookings.filter((b) => b.status !== "canceled");

  const todayBookings = allBookings.filter((b) => isToday(b.createdAt));
  const todayRevenue = paidBookings
    .filter((b) => isToday(b.createdAt))
    .reduce((sum, b) => sum + b.amount, 0);

  const monthBookings = paidBookings.filter((b) => isThisMonth(b.createdAt));
  const monthRevenue = monthBookings.reduce((sum, b) => sum + b.amount, 0);
  const monthFee = Math.round(monthRevenue * PLATFORM_FEE_RATE);

  const completedCount = allBookings.filter((b) => b.status === "completed").length;
  const canceledCount = allBookings.filter((b) => b.status === "canceled").length;

  const pendingExperts = allExperts.filter((e) => e.status === "pending").length;
  const openReports = allReports.filter((r) => r.status === "open").length;
  const readySettlements = allSettlements.filter((s) => s.status === "ready").length;

  const recent = [...allBookings]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <main className="flex-1 overflow-y-auto px-(--gutter) py-5">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="오늘 예약" value={todayBookings.length} suffix="건" />
        <Stat label="오늘 매출" value={formatPrice(todayRevenue)} />
        <Stat label="이번 달 매출" value={formatPrice(monthRevenue)} />
        <Stat label="이번 달 수수료 수입" value={formatPrice(monthFee)} />
        <Stat label="전체 회원" value={allUsers.length} suffix="명" />
        <Stat label="전체 전문가" value={allExperts.length} suffix="명" />
        <Stat label="상담 완료" value={completedCount} suffix="건" />
        <Stat label="취소" value={canceledCount} suffix="건" />
      </div>

      <div className="mt-7">
        <SectionTitle>지금 처리할 것</SectionTitle>
        <ul className="mt-2 divide-y divide-stroke-neutral-subtle">
          <li>
            <Link
              href="/conect3/admin/experts"
              className="flex items-center justify-between py-3"
            >
              <span className="text-t4">승인 대기 전문가</span>
              <span className="flex items-center gap-1.5 text-t3 text-fg-neutral-subtle">
                {pendingExperts > 0 ? <Badge variant="warning">{pendingExperts}</Badge> : "0"}
              </span>
            </Link>
          </li>
          <li>
            <Link href="/conect3/admin/reports" className="flex items-center justify-between py-3">
              <span className="text-t4">열린 신고</span>
              <span className="flex items-center gap-1.5 text-t3 text-fg-neutral-subtle">
                {openReports > 0 ? <Badge variant="critical">{openReports}</Badge> : "0"}
              </span>
            </Link>
          </li>
          <li>
            <Link
              href="/conect3/admin/settlements"
              className="flex items-center justify-between py-3"
            >
              <span className="text-t4">지급 대기 정산</span>
              <span className="flex items-center gap-1.5 text-t3 text-fg-neutral-subtle">
                {readySettlements > 0 ? <Badge>{readySettlements}</Badge> : "0"}
              </span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-7">
        <SectionTitle>최근 예약</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState title="아직 예약이 없어요" />
        ) : (
          <ul className="mt-2 divide-y divide-stroke-neutral-subtle">
            {recent.map((b) => (
              <li key={b.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-t4 font-semibold">
                    {b.expertName} · {b.guestName}
                  </span>
                  <Badge variant={b.status === "canceled" ? "critical" : b.status === "completed" ? "neutral" : "brand"}>
                    {STATUS_LABEL[b.status]}
                  </Badge>
                </div>
                <p className="mt-0.5 text-t3 text-fg-neutral-subtle">
                  {formatDate(b.startsAt)} {formatTime(b.startsAt)} · {formatPrice(b.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
