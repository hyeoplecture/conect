"use client";

// 화면 껍데기. 모바일 폭 하나로 만들고 데스크톱에서는 480px를 가운데 둔다.
// 앱바와 탭바는 고정, 가운데만 스크롤한다.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { seedOnce, notifications, session, users, type User } from "@/app/conect3/_lib/data";
import { newId } from "@/app/conect3/_lib/store";
import { signIn, signUp, useSession } from "@/app/conect3/_lib/session";
import { Button, Field } from "./ui";
import {
  IconBack,
  IconBell,
  IconCalendar,
  IconClose,
  IconFeed,
  IconGoogle,
  IconGrid,
  IconHome,
  IconKakao,
  IconUser,
  IconWallet,
} from "./icons";

/* ---------- 로그인이 필요한 순간 ---------- */

type Gate = { require: (then?: () => void) => boolean };

const GateContext = createContext<Gate>({ require: () => false });

export function useLoginGate() {
  return useContext(GateContext);
}

export function MobileFrame({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<{ open: boolean; then?: () => void }>({ open: false });
  const { user } = useSession();

  // 처음 열 때 씨앗 데이터를 채운다. 전문가도 후기도 없는 빈 앱으로 시작하지 않게 한다.
  useEffect(() => {
    seedOnce();
  }, []);

  const require = (then?: () => void) => {
    if (user) return true;
    setPending({ open: true, then });
    return false;
  };

  return (
    <div className="min-h-dvh lg:flex lg:justify-center">
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg-layer-default lg:w-[480px] lg:border-x lg:border-stroke-neutral-subtle">
        <GateContext.Provider value={{ require }}>{children}</GateContext.Provider>

        <Sheet open={pending.open} onClose={() => setPending({ open: false })}>
          <SignForm
            onDone={() => {
              const then = pending.then;
              setPending({ open: false });
              then?.();
            }}
          />
        </Sheet>
      </div>
    </div>
  );
}

/* ---------- 로그인·회원가입 ---------- */

// 카카오·구글로 들어온 회원. 구글은 번호를 주지 않아 phone이 빈 채로 시작한다.
const SOCIAL = {
  kakao: { email: "kakao@conect.kr", name: "김서연", phone: "010-3456-7890", label: "카카오로 시작하기" },
  google: { email: "google@conect.kr", name: "이도현", phone: "", label: "Google로 시작하기" },
} as const;

function socialSignIn(kind: keyof typeof SOCIAL) {
  const spec = SOCIAL[kind];
  const found = users.list().find((u) => u.email === spec.email && !u.deletedAt);
  if (found) {
    session.set(found.id);
    return;
  }
  const user: User = {
    id: newId("usr"),
    email: spec.email,
    password: "social",
    name: spec.name,
    phone: spec.phone,
    role: "user",
    expertId: null,
    marketing: false,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  users.insert(user);
  session.set(user.id);
}

export function SignForm({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [openEmail, setOpenEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const result =
      mode === "in" ? signIn(email, password) : signUp({ email, password, name, phone });
    if (result.ok) onDone();
    else setError(result.message);
  };

  const signedUp = openEmail && mode === "up";

  return (
    <div>
      <h2 className="text-t8">{signedUp ? "회원가입" : "로그인"}</h2>
      <p className="mt-2 text-t3 text-fg-neutral-subtle">
        {signedUp
          ? "예약 확인과 알림을 받을 정보를 입력해 주세요."
          : "코넥트 계정으로 로그인합니다."}
      </p>

      {/* 대부분 여기서 끝난다. 간편 로그인을 위에 크게 둔다. */}
      <div className="mt-5 space-y-2.5">
        <SocialButton kind="kakao" onClick={() => { socialSignIn("kakao"); onDone(); }} />
        <SocialButton kind="google" onClick={() => { socialSignIn("google"); onDone(); }} />
      </div>

      {!openEmail ? (
        <button
          type="button"
          onClick={() => setOpenEmail(true)}
          className="mt-5 block w-full text-center text-t3 text-fg-placeholder underline"
        >
          이메일로 로그인
        </button>
      ) : (
        <>
        <form
          className="mt-5 space-y-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Field
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === "up" ? (
            <>
              <Field
                placeholder="이름"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Field
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="휴대폰 번호"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                hint="예약 확정과 상담 링크를 이 번호로 보냅니다"
              />
            </>
          ) : null}

          {error ? <p className="text-t3 text-fg-critical">{error}</p> : null}

          <div className="pt-1.5">
            <Button type="submit">{mode === "in" ? "로그인" : "가입하고 시작하기"}</Button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError("");
          }}
          className="mt-3 block w-full text-center text-t3 text-fg-neutral-subtle underline"
        >
          {mode === "in" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpenEmail(false);
            setError("");
          }}
          className="mt-2 block w-full text-center text-t3 text-fg-placeholder underline"
        >
          접기
        </button>
        </>
      )}
    </div>
  );
}

function SocialButton({ kind, onClick }: { kind: "kakao" | "google"; onClick: () => void }) {
  const style =
    kind === "kakao"
      ? "bg-[#FEE500] text-[#191600]"
      : "border border-stroke-neutral-weak bg-bg-layer-default text-fg-neutral";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={SOCIAL[kind].label}
      className={`flex h-[50px] w-full items-center justify-center gap-2 rounded-r3 text-t5 font-semibold ${style}`}
    >
      {kind === "kakao" ? <IconKakao /> : <IconGoogle />}
      {kind === "kakao" ? "카카오로 시작하기" : "Google로 시작하기"}
    </button>
  );
}

/* ---------- 바텀시트 ---------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`absolute inset-0 z-40 bg-bg-overlay transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={`absolute inset-x-0 bottom-0 z-50 max-h-[88%] overflow-y-auto rounded-t-r4 bg-bg-layer-default px-(--gutter) pt-2 pb-6 transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] motion-reduce:transition-none ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-stroke-neutral-weak" />
        {title ? (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-t7">{title}</h2>
            <button onClick={onClose} aria-label="닫기" className="text-fg-neutral-subtle">
              <IconClose />
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </>
  );
}

/* ---------- 확인 창 ---------- */

export function Modal({
  open,
  title,
  body,
  confirmLabel = "확인",
  cancelLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-bg-overlay" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full rounded-r4 bg-bg-layer-default px-5 pt-6 pb-4 text-center"
      >
        <p className="text-t5 font-semibold">{title}</p>
        {body ? <p className="mt-2 text-t3 text-fg-neutral-subtle">{body}</p> : null}
        <div className="mt-5 flex gap-2">
          {cancelLabel ? (
            <Button variant="secondary" size="md" onClick={onClose}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button
            size="md"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 앱바 ---------- */

export function AppBar({
  title,
  back = false,
  right,
  bell = false,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
  bell?: boolean;
}) {
  const router = useRouter();
  const { user } = useSession();
  const { rows } = notifications.useList();
  const unread = user ? rows.filter((n) => n.userId === user.id && !n.readAt).length : 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 bg-bg-layer-default pr-3 pl-(--gutter)">
      {back ? (
        <button
          onClick={() => router.back()}
          aria-label="뒤로가기"
          className="-ml-2 grid size-9 place-items-center"
        >
          <IconBack />
        </button>
      ) : null}
      <h1 className="truncate text-t8">{title}</h1>
      <span className="flex-1" />
      {right}
      {bell ? (
        <Link
          href="/conect3/notifications"
          aria-label={unread ? `알림 ${unread}개` : "알림"}
          className="relative grid size-9 place-items-center"
        >
          <IconBell />
          {unread > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-bg-critical-solid" />
          ) : null}
        </Link>
      ) : null}
    </header>
  );
}

/* ---------- 하단 고정 버튼 ---------- */

export function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="shrink-0 border-t border-stroke-neutral-subtle bg-bg-layer-default px-(--gutter) py-3.5">
      {children}
    </div>
  );
}

/* ---------- 푸터 ---------- */

export function Footer() {
  return (
    <footer className="px-(--gutter) py-6">
      <p className="text-t3 font-semibold text-fg-neutral-subtle">코넥트 Conect</p>
      <p className="mt-2 text-t2 text-fg-placeholder">
        코넥트는 통신판매중개자이며 거래의 당사자가 아닙니다.
        <br />
        상담 내용과 결과에 대한 책임은 전문가에게 있습니다.
      </p>
      <p className="mt-2 text-t2 text-fg-placeholder">
        문의 카카오톡 채널 @conect · help@conect.kr
      </p>
      <Link
        href="/conect3/my/licenses"
        className="mt-2 block text-t2 text-fg-placeholder underline"
      >
        오픈소스 라이선스
      </Link>
      <p className="mt-2 text-t1 text-fg-placeholder">© 2026 Conect</p>
    </footer>
  );
}

/* ---------- 탭바 ---------- */

type Tab = { href: string; label: string; Icon: (p: { size?: number; filled?: boolean }) => React.ReactElement };

// 알림은 탭에서 빼고 앱바의 종으로 들어간다. 탭 넷은 홈·전문가·커뮤니티·마이다.
const USER_TABS: Tab[] = [
  { href: "/conect3", label: "홈", Icon: IconHome },
  { href: "/conect3/experts", label: "전문가", Icon: IconGrid },
  { href: "/conect3/community", label: "커뮤니티", Icon: IconFeed },
  { href: "/conect3/my", label: "마이", Icon: IconUser },
];

const EXPERT_TABS: Tab[] = [
  { href: "/conect3/expert", label: "홈", Icon: IconGrid },
  { href: "/conect3/expert/bookings", label: "예약", Icon: IconFeed },
  { href: "/conect3/expert/schedule", label: "시간표", Icon: IconCalendar },
  { href: "/conect3/expert/settlements", label: "정산", Icon: IconWallet },
];

function Tabs({ tabs, exact }: { tabs: Tab[]; exact: string }) {
  const pathname = usePathname();

  return (
    <nav className="z-20 flex h-[58px] shrink-0 border-t border-stroke-neutral-subtle bg-bg-layer-default">
      {tabs.map(({ href, label, Icon }) => {
        // 홈은 정확히 일치할 때만, 나머지는 하위 경로까지 그 탭으로 본다.
        const active = href === exact ? pathname === exact : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-[3px] text-t1 tracking-tight ${
              active ? "text-fg-brand" : "text-fg-placeholder"
            }`}
          >
            <Icon size={22} filled={active} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabBar() {
  return <Tabs tabs={USER_TABS} exact="/conect3" />;
}

export function ExpertTabBar() {
  return <Tabs tabs={EXPERT_TABS} exact="/conect3/expert" />;
}
