"use client";

// 예약 정보 입력. 결제창으로 넘어가기 전에 사람 정보를 받는 마지막 화면이다.
// 간편 로그인으로 들어온 사람은 번호가 비어 있어서 여기서 반드시 받아야 한다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppBar, BottomBar, useLoginGate } from "@/app/conect3/_components/shell";
import {
  Avatar,
  Button,
  ButtonLink,
  Divider,
  EmptyState,
  Field,
  SectionTitle,
  TextArea,
} from "@/app/conect3/_components/ui";
import { IconCheck } from "@/app/conect3/_components/icons";
import {
  PAYMENT_LABELS,
  checkoutDraft,
  experts,
  type PaymentMethod,
} from "@/app/conect3/_lib/data";
import { refundNotice } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice, formatSlotRange } from "@/app/conect3/_lib/format";

const METHODS: PaymentMethod[] = ["card", "kakaopay", "naverpay"];

export default function CheckoutPage() {
  const router = useRouter();
  const gate = useLoginGate();

  const { loaded, value: draft } = checkoutDraft.use();
  const { loaded: expertsLoaded, rows: expertRows } = experts.useList();
  const { user } = useSession();

  // 저장된 값이 있으면 그것을, 없으면 로그인한 사람의 값을 쓴다.
  // 효과로 채우면 화면이 한 번 더 그려지고 로그인이 늦게 들어올 때 값이 튄다.
  // 고친 것만 edit에 담고 나머지는 렌더에서 바로 계산한다.
  type Edit = {
    name?: string;
    phone?: string;
    email?: string;
    note?: string;
    method?: PaymentMethod;
  };
  const [edit, setEdit] = useState<Edit>({});

  const name = edit.name ?? draft?.guestName ?? user?.name ?? "";
  const phone = edit.phone ?? draft?.guestPhone ?? user?.phone ?? "";
  const email = edit.email ?? draft?.guestEmail ?? user?.email ?? "";
  const note = edit.note ?? draft?.note ?? "";
  const method: PaymentMethod = edit.method ?? draft?.method ?? "card";

  const setName = (v: string) => setEdit((p) => ({ ...p, name: v }));
  const setPhone = (v: string) => setEdit((p) => ({ ...p, phone: v }));
  const setEmail = (v: string) => setEdit((p) => ({ ...p, email: v }));
  const setNote = (v: string) => setEdit((p) => ({ ...p, note: v }));
  const setMethod = (v: PaymentMethod) => setEdit((p) => ({ ...p, method: v }));

  if (!loaded || !expertsLoaded) return <main className="flex-1" />;

  const expert = draft ? expertRows.find((e) => e.slug === draft.expertSlug) : undefined;

  if (!draft || !expert) {
    return (
      <>
        <AppBar title="예약하기" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="예약 정보가 없습니다"
            body="전문가를 고르고 시간을 선택해 주세요"
            action={
              <ButtonLink href="/conect3" size="md">
                홈으로
              </ButtonLink>
            }
          />
        </main>
      </>
    );
  }

  const ready = name.trim().length > 0 && phone.trim().length > 0;

  const submit = () => {
    checkoutDraft.set({
      expertSlug: draft.expertSlug,
      startsAt: draft.startsAt,
      guestName: name.trim(),
      guestPhone: phone.trim(),
      guestEmail: email.trim(),
      note: note.trim(),
      method,
    });
    router.push("/conect3/checkout/pay");
  };

  return (
    <>
      <AppBar title="예약하기" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-4">
          <div className="rounded-r3 bg-bg-neutral-weak p-4">
            <div className="flex items-center gap-3">
              <Avatar size={46} name={expert.name} />
              <div className="min-w-0">
                <p className="truncate text-t5 font-semibold">{expert.name}</p>
                <p className="mt-0.5 truncate text-t3 text-fg-neutral-subtle">{expert.job}</p>
              </div>
            </div>
            <dl className="mt-3.5 space-y-1.5 text-t3">
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-fg-neutral-subtle">일시</dt>
                <dd className="font-medium">{formatSlotRange(draft.startsAt)}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-14 shrink-0 text-fg-neutral-subtle">방식</dt>
                <dd className="font-medium">1시간 온라인 상담</dd>
              </div>
            </dl>
            <p className="mt-2.5 text-t2 text-fg-placeholder">한국 시간 기준</p>
          </div>
        </section>

        <Divider />

        <section className="space-y-3 px-(--gutter) py-5">
          <SectionTitle>신청자 정보</SectionTitle>
          <Field
            label="이름"
            placeholder="이름"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            label="휴대폰 번호"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            hint="예약 확정과 상담 링크를 이 번호로 보냅니다"
          />
          <Field
            label="이메일"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </section>

        <Divider />

        <section className="space-y-3 px-(--gutter) py-5">
          <SectionTitle>미리 전할 메시지</SectionTitle>
          <TextArea
            placeholder="무엇이 궁금한지 미리 적어두면 상담이 훨씬 빨라집니다"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            hint="선택 사항입니다"
          />
        </section>

        <Divider />

        <section className="px-(--gutter) py-5">
          <SectionTitle>결제 수단</SectionTitle>
          <div
            role="radiogroup"
            aria-label="결제 수단"
            className="mt-3 overflow-hidden rounded-r3 border border-stroke-neutral-weak"
          >
            {METHODS.map((m, i) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-t4 ${
                  i > 0 ? "border-t border-stroke-neutral-subtle" : ""
                } ${method === m ? "font-semibold text-fg-neutral" : "text-fg-neutral-muted"}`}
              >
                {PAYMENT_LABELS[m]}
                <span className={method === m ? "text-fg-brand" : "text-fg-placeholder"}>
                  {method === m ? <IconCheck size={18} /> : null}
                </span>
              </button>
            ))}
          </div>
        </section>

        <Divider />

        <section className="px-(--gutter) py-5">
          <SectionTitle>결제 금액</SectionTitle>
          <dl className="mt-2">
            <div className="flex justify-between py-2 text-t4">
              <dt className="text-fg-neutral-subtle">상담료</dt>
              <dd className="tabular-nums">{formatPrice(expert.pricePerHour)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between border-t border-stroke-neutral-subtle pt-3">
              <dt className="text-t4 font-semibold">결제 금액</dt>
              <dd className="text-t7 font-bold tabular-nums">
                {formatPrice(expert.pricePerHour)}
              </dd>
            </div>
          </dl>
        </section>

        <Divider />

        <section className="px-(--gutter) py-5">
          <SectionTitle>취소·환불 규정</SectionTitle>
          <ul className="mt-3 space-y-1.5">
            {refundNotice().map((line) => (
              <li key={line} className="flex gap-2 text-t3 text-fg-neutral-subtle">
                <span className="text-fg-placeholder">·</span>
                {line}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <BottomBar>
        <Button
          disabled={!ready}
          onClick={() => {
            if (!gate.require(submit)) return;
            submit();
          }}
        >
          {formatPrice(expert.pricePerHour)} 결제하기
        </Button>
      </BottomBar>
    </>
  );
}
