"use client";

// 로그인 화면. 로그인 바텀시트와 같은 SignForm을 쓴다.
// 이미 로그인한 사람은 여기에 머물 이유가 없어 마이로 보낸다.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppBar, SignForm } from "@/app/conect3/_components/shell";
import { useSession } from "@/app/conect3/_lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { loaded, user } = useSession();

  useEffect(() => {
    if (loaded && user) router.replace("/conect3/my");
  }, [loaded, user, router]);

  if (!loaded || user) {
    return (
      <>
        <AppBar title="로그인" back />
        <main className="flex-1" />
      </>
    );
  }

  return (
    <>
      <AppBar title="로그인" back />

      <main className="flex-1 overflow-y-auto">
        <div className="px-(--gutter) py-8">
          <SignForm onDone={() => router.replace("/conect3/my")} />
        </div>
      </main>
    </>
  );
}
