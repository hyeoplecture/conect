"use client";

// 운영자 껍데기. AppBar와 하위 메뉴 줄까지만 그리고 안쪽은 각 화면이 채운다.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppBar } from "@/app/conect3/_components/shell";
import { EmptyState } from "@/app/conect3/_components/ui";
import { useSession } from "@/app/conect3/_lib/session";

const MENU = [
  { href: "/conect3/admin", label: "홈" },
  { href: "/conect3/admin/experts", label: "전문가" },
  { href: "/conect3/admin/users", label: "회원" },
  { href: "/conect3/admin/bookings", label: "예약" },
  { href: "/conect3/admin/payments", label: "결제" },
  { href: "/conect3/admin/settlements", label: "정산" },
  { href: "/conect3/admin/reports", label: "신고" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { loaded, isAdmin } = useSession();
  const pathname = usePathname();

  if (!loaded) {
    return <main className="flex-1" />;
  }

  if (!isAdmin) {
    return (
      <>
        <AppBar title="운영자" back />
        <EmptyState title="접근 권한이 없습니다" />
      </>
    );
  }

  return (
    <>
      <AppBar title="운영자" />
      <nav className="flex shrink-0 gap-1.5 overflow-x-auto px-(--gutter) pb-3">
        {MENU.map((m) => {
          const active = m.href === "/conect3/admin" ? pathname === m.href : pathname.startsWith(m.href);
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`flex h-8 shrink-0 items-center rounded-full px-3.5 text-t3 whitespace-nowrap ${
                active
                  ? "bg-bg-brand-solid font-semibold text-fg-neutral-inverted"
                  : "bg-bg-neutral-weak text-fg-neutral-subtle"
              }`}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}
