"use client";

// 마이. 로그인하지 않았으면 안내 대신 로그인 폼을 바로 그린다.
// 한 번 더 눌러야 폼이 나오는 화면은 여기서 의미가 없다.

import { AppBar, Footer, SignForm, TabBar } from "@/app/conect3/_components/shell";
import { BookingRow } from "@/app/conect3/_components/cards";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Divider,
  EmptyState,
  Row,
  SectionTitle,
} from "@/app/conect3/_components/ui";
import { bookings } from "@/app/conect3/_lib/data";
import { completeBooking, needsConfirm } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";

export default function MyPage() {
  const { loaded, user, expert, isAdmin } = useSession();
  const { loaded: bookingsLoaded, rows } = bookings.useList();

  if (!loaded || !bookingsLoaded) {
    return (
      <>
        <AppBar title="마이" />
        <main className="flex-1" />
        <TabBar />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppBar title="마이" />
        <main className="flex-1 overflow-y-auto">
          <div className="px-(--gutter) py-8">
            <SignForm onDone={() => {}} />
          </div>
        </main>
        <TabBar />
      </>
    );
  }

  const mine = rows
    .filter((b) => b.userId === user.id)
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  // 확인이 밀린 예약이 여러 건이면 가장 오래된 것부터 하나씩 처리한다.
  const pending = needsConfirm(mine).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];

  return (
    <>
      <AppBar title="마이" />

      <main className="flex-1 overflow-y-auto">
        <section className="flex items-center gap-3 px-(--gutter) py-5">
          <Avatar size={56} name={user.name} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-t6 font-semibold">{user.name}</p>
              {expert ? <Badge>전문가</Badge> : null}
            </div>
            <p className="mt-0.5 truncate text-t3 text-fg-neutral-subtle">{user.email}</p>
          </div>
        </section>

        {pending ? (
          <section className="px-(--gutter) pb-5">
            <div className="rounded-r3 bg-bg-brand-weak px-4 py-4">
              <p className="text-t4 font-semibold">
                {pending.expertName} 전문가와의 상담은 잘 진행되었나요?
              </p>
              <p className="mt-1 text-t3 text-fg-neutral-subtle">
                진행되지 않았다면 결제하신 금액을 전액 돌려드립니다.
              </p>
              <div className="mt-3.5 flex gap-2">
                <Button size="md" onClick={() => completeBooking(pending.id, true)}>
                  네, 진행했어요
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => completeBooking(pending.id, false)}
                >
                  아니요
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <Divider />

        <section className="pt-5">
          <div className="px-(--gutter)">
            <SectionTitle
              action={
                <span className="text-t3 text-fg-neutral-subtle tabular-nums">{mine.length}건</span>
              }
            >
              내 상담
            </SectionTitle>
          </div>

          {mine.length === 0 ? (
            <EmptyState
              title="아직 예약한 상담이 없어요"
              action={
                <div className="mx-auto w-48">
                  <ButtonLink href="/conect3/search" size="md">
                    전문가 둘러보기
                  </ButtonLink>
                </div>
              }
            />
          ) : (
            <ul className="mt-2 border-t border-stroke-neutral-subtle">
              {mine.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  href={`/conect3/my/reservations/${b.id}`}
                />
              ))}
            </ul>
          )}
        </section>

        <Divider />

        <section className="px-(--gutter) py-5">
          {expert ? (
            <ButtonLink href="/conect3/expert" variant="outline" size="md">
              전문가 화면으로
            </ButtonLink>
          ) : (
            <ButtonLink href="/conect3/expert/apply" variant="outline" size="md">
              전문가로 등록하기
            </ButtonLink>
          )}
        </section>

        <Divider />

        <section className="divide-y divide-stroke-neutral-subtle px-(--gutter) py-1">
          <Row label="설정" href="/conect3/my/settings" />
          <Row label="오픈소스 라이선스" href="/conect3/my/licenses" />
          {isAdmin ? <Row label="운영자 화면" href="/conect3/admin" /> : null}
        </section>

        <Footer />
      </main>

      <TabBar />
    </>
  );
}
