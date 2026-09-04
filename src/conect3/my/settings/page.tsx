"use client";

// 설정. 프로필 수정과 계정 정리를 한 화면에 둔다.
// 되돌릴 수 없는 것(탈퇴, 데이터 삭제)은 맨 아래에 두고 반드시 한 번 더 묻는다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar, Modal } from "@/app/conect3/_components/shell";
import { Button, Divider, Field, Row, SectionTitle, Toggle } from "@/app/conect3/_components/ui";
import { users } from "@/app/conect3/_lib/data";
import { resetAll } from "@/app/conect3/_lib/store";
import { signOut, useSession, withdraw } from "@/app/conect3/_lib/session";

type Ask = "none" | "saved" | "withdraw" | "reset";

export default function SettingsPage() {
  const router = useRouter();
  const { loaded, user } = useSession();
  // 저장된 값은 늦게 도착한다. 손대기 전까지는 draft를 비워 두고 저장된 값을 그대로 보여준다.
  const [draft, setDraft] = useState<{ name: string; phone: string } | null>(null);
  const [ask, setAsk] = useState<Ask>("none");

  if (!loaded || !user) {
    return (
      <>
        <AppBar title="설정" back />
        <main className="flex-1" />
      </>
    );
  }

  const name = draft?.name ?? user.name;
  const phone = draft?.phone ?? user.phone;

  const save = () => {
    users.update(user.id, { name: name.trim(), phone: phone.trim() });
    setDraft(null);
    setAsk("saved");
  };

  return (
    <>
      <AppBar title="설정" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-5">
          <SectionTitle>프로필</SectionTitle>
          <div className="mt-3.5 space-y-3">
            <Field
              label="이름"
              value={name}
              autoComplete="name"
              onChange={(e) => setDraft({ name: e.target.value, phone })}
            />
            <Field
              label="휴대폰 번호"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setDraft({ name, phone: e.target.value })}
              hint="예약 확정과 상담 링크를 이 번호로 보냅니다"
            />
            <Button size="md" onClick={save} disabled={!name.trim()}>
              저장
            </Button>
          </div>
        </section>

        <Divider />

        {/* Row는 안쪽이 버튼이라 Toggle을 넣으면 버튼이 겹친다. 이 줄만 직접 그린다. */}
        <section className="flex items-center justify-between px-(--gutter) py-4">
          <div>
            <p className="text-t4">마케팅 정보 수신 동의</p>
            <p className="mt-0.5 text-t2 text-fg-placeholder">
              할인과 새 전문가 소식을 받습니다
            </p>
          </div>
          <Toggle
            checked={user.marketing}
            label="마케팅 정보 수신 동의"
            onChange={(v) => users.update(user.id, { marketing: v })}
          />
        </section>

        <Divider />

        <section className="divide-y divide-stroke-neutral-subtle px-(--gutter) py-1">
          <Row label="오픈소스 라이선스" href="/conect3/my/licenses" />
          <Row
            label="로그아웃"
            onClick={() => {
              signOut();
              router.push("/conect3");
            }}
          />
          <Row label="회원 탈퇴" onClick={() => setAsk("withdraw")} />
        </section>

        <section className="px-(--gutter) py-6">
          <button
            type="button"
            onClick={() => setAsk("reset")}
            className="text-t2 text-fg-placeholder underline"
          >
            저장된 데이터 모두 지우기
          </button>
          <p className="mt-1.5 text-t2 text-fg-placeholder">
            이 기기에 저장된 회원·예약·후기 기록을 비우고 처음 상태로 되돌립니다.
          </p>
        </section>
      </main>

      <Modal
        open={ask === "saved"}
        title="저장했습니다"
        onClose={() => setAsk("none")}
      />

      <Modal
        open={ask === "withdraw"}
        title="회원 탈퇴"
        body="탈퇴하면 다시 로그인할 수 없습니다. 예약과 결제 기록은 법에 따라 보관됩니다."
        confirmLabel="탈퇴하기"
        cancelLabel="닫기"
        onConfirm={() => {
          withdraw(user.id);
          router.push("/conect3");
        }}
        onClose={() => setAsk("none")}
      />

      <Modal
        open={ask === "reset"}
        title="저장된 데이터를 모두 지울까요?"
        body="이 기기에 쌓인 기록이 사라지고 처음 상태로 돌아갑니다."
        confirmLabel="지우기"
        cancelLabel="닫기"
        onConfirm={() => {
          resetAll();
          router.push("/conect3");
          router.refresh();
        }}
        onClose={() => setAsk("none")}
      />
    </>
  );
}
