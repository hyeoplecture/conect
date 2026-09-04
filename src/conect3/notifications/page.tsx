"use client";

// 알림 목록. 화면에 들어온 순간 전부 읽음으로 바꾼다.
// 안 읽음 표시는 탭바 점을 지우기 위한 것이라 목록을 연 시점이 곧 읽은 시점이다.

import { useEffect } from "react";
import { AppBar, TabBar, useLoginGate } from "@/app/conect3/_components/shell";
import { NotificationItem } from "@/app/conect3/_components/cards";
import { Button, EmptyState } from "@/app/conect3/_components/ui";
import { notifications } from "@/app/conect3/_lib/data";
import { markAllRead } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";

export default function NotificationsPage() {
  const { loaded: sessionLoaded, user } = useSession();
  const { loaded, rows } = notifications.useList();
  const gate = useLoginGate();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    markAllRead(userId);
  }, [userId]);

  const mine = userId
    ? rows
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];

  if (!loaded || !sessionLoaded) {
    return (
      <>
        <AppBar title="알림" />
        <main className="flex-1" />
        <TabBar />
      </>
    );
  }

  return (
    <>
      <AppBar title="알림" />

      <main className="flex-1 overflow-y-auto">
        {!user ? (
          <EmptyState
            title="로그인하면 알림을 받을 수 있어요"
            body="예약 확정과 상담 안내를 여기에 모아 둡니다."
            action={
              <div className="mx-auto w-40">
                <Button size="md" onClick={() => gate.require()}>
                  로그인
                </Button>
              </div>
            }
          />
        ) : mine.length === 0 ? (
          <EmptyState title="아직 받은 알림이 없어요" />
        ) : (
          <ul>
            {mine.map((n) => (
              <NotificationItem key={n.id} item={n} />
            ))}
          </ul>
        )}
      </main>

      <TabBar />
    </>
  );
}
