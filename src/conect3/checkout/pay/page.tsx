"use client";

// 결제창. 카드 정보를 받고 승인을 기다린다.
// 승인 중에는 화면을 잠근다. 두 번 눌려서 예약이 두 개 생기는 일을 막기 위해서다.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar, BottomBar } from "@/app/conect3/_components/shell";
import { Button } from "@/app/conect3/_components/ui";
import { IconShield } from "@/app/conect3/_components/icons";
import {
  PAYMENT_LABELS,
  availability,
  checkoutDraft,
  experts,
} from "@/app/conect3/_lib/data";
import { createBooking } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";

type Stage = "form" | "approving" | "declined" | "taken";

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export default function PayPage() {
  const router = useRouter();
  const { loaded, value: draft } = checkoutDraft.use();
  const { loaded: expertsLoaded, rows: expertRows } = experts.useList();
  const { user } = useSession();

  const [stage, setStage] = useState<Stage>("form");
  const [card, setCard] = useState(["", "", "", ""]);
  const [mm, setMm] = useState("");
  const [yy, setYy] = useState("");
  const [birth, setBirth] = useState("");
  const [pw2, setPw2] = useState("");

  const cardRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 승인 중에는 뒤로가기를 되돌린다. 결제가 걸린 채로 화면을 떠나면 안 된다.
  useEffect(() => {
    if (stage !== "approving") return;
    const block = () => window.history.pushState(null, "", window.location.href);
    block();
    window.addEventListener("popstate", block);
    return () => window.removeEventListener("popstate", block);
  }, [stage]);

  // 정보가 없으면 처음으로 돌려보낸다.
  useEffect(() => {
    if (loaded && !draft) router.replace("/conect3");
  }, [loaded, draft, router]);

  if (!loaded || !expertsLoaded) return <main className="flex-1" />;

  const expert = draft ? expertRows.find((e) => e.slug === draft.expertSlug) : undefined;
  if (!draft || !expert) return <main className="flex-1" />;

  const amount = expert.pricePerHour;
  const cardFilled = card.every((c) => c.length === 4);
  const ready =
    draft.method === "card"
      ? cardFilled &&
        mm.length === 2 &&
        yy.length === 2 &&
        (birth.length === 6 || birth.length === 10) &&
        pw2.length === 2
      : true;

  const setCardAt = (i: number, raw: string) => {
    const v = onlyDigits(raw).slice(0, 4);
    setCard((prev) => prev.map((c, n) => (n === i ? v : c)));
    if (v.length === 4 && i < 3) cardRefs.current[i + 1]?.focus();
  };

  const approve = () => {
    // 같은 시간을 다른 사람이 먼저 가져갔는지 승인 전에 한 번 더 본다.
    const slot = availability
      .list()
      .find((a) => a.expertId === expert.id && a.startsAt === draft.startsAt);
    if (!slot || slot.state !== "open") {
      setStage("taken");
      return;
    }

    const last4 = draft.method === "card" ? card[3] : "0000";
    setStage("approving");

    window.setTimeout(() => {
      if (draft.method === "card" && last4 === "0000") {
        setStage("declined");
        setCard(["", "", "", ""]);
        return;
      }

      const booking = createBooking({
        expert,
        userId: user?.id ?? "",
        startsAt: draft.startsAt,
        guestName: draft.guestName,
        guestPhone: draft.guestPhone,
        guestEmail: draft.guestEmail,
        note: draft.note,
        method: draft.method,
        cardLast4: last4,
      });

      router.replace(`/conect3/checkout/done?id=${booking.id}`);
    }, 2000);
  };

  if (stage === "approving") {
    return (
      <>
        <AppBar title="결제" />
        <main className="flex flex-1 flex-col items-center justify-center px-(--gutter)">
          <div className="flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ animationDelay: `${i * 0.16}s` }}
                className="size-2.5 animate-bounce rounded-full bg-bg-brand-solid"
              />
            ))}
          </div>
          <p className="mt-6 text-t5 font-semibold">카드사 승인을 기다리는 중입니다</p>
          <p className="mt-2 text-t3 text-fg-neutral-subtle tabular-nums">
            {formatPrice(amount)}
          </p>
        </main>
      </>
    );
  }

  if (stage === "taken") {
    return (
      <>
        <AppBar title="결제" />
        <main className="flex flex-1 flex-col items-center justify-center px-(--gutter) text-center">
          <p className="text-t6 font-semibold">방금 다른 분이 예약했습니다</p>
          <p className="mt-2 text-t3 text-fg-neutral-subtle">
            {formatSlotRange(draft.startsAt)}
          </p>
        </main>
        <BottomBar>
          <Button onClick={() => router.replace(`/conect3/experts/${draft.expertSlug}`)}>
            다른 시간 고르기
          </Button>
        </BottomBar>
      </>
    );
  }

  return (
    <>
      <AppBar title="결제" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-4">
          <div className="rounded-r3 border border-stroke-neutral-weak px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-t3 text-fg-neutral-subtle">가맹점</span>
              <span className="inline-flex items-center gap-1.5 text-t3 font-medium">
                <span className="text-fg-brand">
                  <IconShield size={16} />
                </span>
                코넥트
              </span>
            </div>
            <div className="mt-3 flex items-baseline justify-between border-t border-stroke-neutral-subtle pt-3">
              <span className="text-t4 font-semibold">결제 금액</span>
              <span className="text-t8 font-bold tabular-nums">{formatPrice(amount)}</span>
            </div>
            <p className="mt-2 text-t2 text-fg-placeholder">
              {PAYMENT_LABELS[draft.method]}
            </p>
          </div>
        </section>

        {stage === "declined" ? (
          <div className="px-(--gutter) pb-2">
            <p
              role="alert"
              className="rounded-r3 bg-bg-critical-weak px-3.5 py-3 text-t3 text-fg-critical"
            >
              카드사에서 승인이 거절되었습니다. 다른 카드로 시도해 주세요
            </p>
          </div>
        ) : null}

        {draft.method === "card" ? (
          <section className="space-y-5 px-(--gutter) py-4">
            <div>
              <span className="mb-2 block text-t3 text-fg-neutral-subtle">카드번호</span>
              <div className="flex items-center gap-1.5">
                {card.map((value, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      cardRefs.current[i] = el;
                    }}
                    value={value}
                    onChange={(e) => setCardAt(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !value && i > 0) {
                        cardRefs.current[i - 1]?.focus();
                      }
                    }}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    aria-label={`카드번호 ${i + 1}번째 자리`}
                    type={i === 1 || i === 2 ? "password" : "text"}
                    className="h-[46px] w-full min-w-0 rounded-r3 border border-transparent bg-bg-neutral-weak text-center text-t5 tabular-nums text-fg-neutral outline-none placeholder:text-fg-placeholder focus:border-stroke-brand-solid"
                    placeholder="0000"
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="mb-2 block text-t3 text-fg-neutral-subtle">유효기간</span>
                <div className="flex items-center gap-1.5">
                  <input
                    value={mm}
                    onChange={(e) => setMm(onlyDigits(e.target.value).slice(0, 2))}
                    inputMode="numeric"
                    maxLength={2}
                    aria-label="유효기간 월"
                    placeholder="MM"
                    className="h-[46px] w-full min-w-0 rounded-r3 border border-transparent bg-bg-neutral-weak text-center text-t4 tabular-nums outline-none placeholder:text-fg-placeholder focus:border-stroke-brand-solid"
                  />
                  <span className="text-t4 text-fg-placeholder">/</span>
                  <input
                    value={yy}
                    onChange={(e) => setYy(onlyDigits(e.target.value).slice(0, 2))}
                    inputMode="numeric"
                    maxLength={2}
                    aria-label="유효기간 연도"
                    placeholder="YY"
                    className="h-[46px] w-full min-w-0 rounded-r3 border border-transparent bg-bg-neutral-weak text-center text-t4 tabular-nums outline-none placeholder:text-fg-placeholder focus:border-stroke-brand-solid"
                  />
                </div>
              </div>

              <div>
                <span className="mb-2 block text-t3 text-fg-neutral-subtle">
                  비밀번호 앞 2자리
                </span>
                <input
                  value={pw2}
                  onChange={(e) => setPw2(onlyDigits(e.target.value).slice(0, 2))}
                  type="password"
                  inputMode="numeric"
                  maxLength={2}
                  aria-label="카드 비밀번호 앞 2자리"
                  placeholder="••"
                  className="h-[46px] w-full rounded-r3 border border-transparent bg-bg-neutral-weak px-[13px] text-t4 tabular-nums outline-none placeholder:text-fg-placeholder focus:border-stroke-brand-solid"
                />
              </div>
            </div>

            <div>
              <span className="mb-2 block text-t3 text-fg-neutral-subtle">
                생년월일 6자리 또는 사업자번호
              </span>
              <input
                value={birth}
                onChange={(e) => setBirth(onlyDigits(e.target.value).slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                aria-label="생년월일 또는 사업자번호"
                placeholder="900101"
                className="h-[46px] w-full rounded-r3 border border-transparent bg-bg-neutral-weak px-[13px] text-t4 tabular-nums outline-none placeholder:text-fg-placeholder focus:border-stroke-brand-solid"
              />
            </div>
          </section>
        ) : (
          <section className="px-(--gutter) py-4">
            <div className="rounded-r3 bg-bg-neutral-weak px-4 py-5">
              <p className="text-t5 font-semibold">{PAYMENT_LABELS[draft.method]}</p>
              <p className="mt-1.5 text-t3 text-fg-neutral-subtle">결제를 진행합니다</p>
              <dl className="mt-4 space-y-2 border-t border-stroke-neutral-subtle pt-4">
                <div className="flex justify-between text-t3">
                  <dt className="text-fg-neutral-subtle">상품</dt>
                  <dd>{expert.name} 1시간 상담</dd>
                </div>
                <div className="flex justify-between text-t3">
                  <dt className="text-fg-neutral-subtle">일시</dt>
                  <dd>{formatSlotRange(draft.startsAt)}</dd>
                </div>
                <div className="flex justify-between text-t4">
                  <dt className="text-fg-neutral-subtle">결제 금액</dt>
                  <dd className="font-semibold tabular-nums">{formatPrice(amount)}</dd>
                </div>
              </dl>
            </div>
          </section>
        )}
      </main>

      <BottomBar>
        <Button disabled={!ready} onClick={approve}>
          {formatPrice(amount)} 결제
        </Button>
      </BottomBar>
    </>
  );
}
