"use client";

// 전문가 신청. 신청과 동시에 승인되므로 다음 화면은 시간표다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FIELDS, PLATFORM_FEE_RATE, type Field as FieldName } from "@/app/conect3/_lib/data";
import { applyExpert } from "@/app/conect3/_lib/domain";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice } from "@/app/conect3/_lib/format";
import { AppBar, BottomBar, Modal, useLoginGate } from "@/app/conect3/_components/shell";
import {
  Button,
  Divider,
  EmptyState,
  Field,
  Select,
  SectionTitle,
  TextArea,
} from "@/app/conect3/_components/ui";

const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "카카오뱅크",
  "토스뱅크",
  "새마을금고",
];

export default function ExpertApplyPage() {
  const { loaded, user, expert } = useSession();
  const router = useRouter();
  const gate = useLoginGate();

  // 이미 전문가면 신청 화면에 머물 이유가 없다.
  useEffect(() => {
    if (expert) router.replace("/conect3/expert");
  }, [expert, router]);

  if (!loaded) return <main className="flex-1" />;

  if (!user) {
    return (
      <>
        <AppBar title="전문가 등록" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="로그인하면 전문가로 등록할 수 있어요"
            body="예약과 정산을 받을 계정이 필요합니다."
            action={
              <Button size="md" onClick={() => gate.require()}>
                로그인하기
              </Button>
            }
          />
        </main>
      </>
    );
  }

  if (expert) return <main className="flex-1" />;

  return <ApplyForm userId={user.id} userName={user.name} />;
}

function ApplyForm({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();

  const [name, setName] = useState(userName);
  const [job, setJob] = useState("");
  const [field, setField] = useState<FieldName>(FIELDS[0]);
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");

  const [bank, setBank] = useState(BANKS[0]);
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [business, setBusiness] = useState("");

  const [done, setDone] = useState(false);

  const priceNumber = Number(price.replace(/[^0-9]/g, "")) || 0;
  const fee = Math.round(priceNumber * PLATFORM_FEE_RATE);
  const net = priceNumber - fee;
  const tax = business.trim() ? 0 : Math.round(net * 0.033);

  const ready =
    name.trim() !== "" &&
    job.trim() !== "" &&
    headline.trim() !== "" &&
    bio.trim() !== "" &&
    priceNumber > 0 &&
    account.trim() !== "" &&
    holder.trim() !== "";

  const submit = () => {
    if (!ready) return;
    applyExpert({
      userId,
      name: name.trim(),
      job: job.trim(),
      field,
      headline: headline.trim(),
      bio: bio.trim(),
      pricePerHour: priceNumber,
      payout: {
        bank,
        account: account.trim(),
        holder: holder.trim(),
        business: business.trim() || null,
      },
    });
    setDone(true);
  };

  return (
    <>
      <AppBar title="전문가 등록" back />

      <main className="flex-1 overflow-y-auto">
        <section className="space-y-3 px-(--gutter) py-4">
          <SectionTitle>어떤 상담을 하시나요</SectionTitle>
          <Field label="이름" value={name} onChange={(e) => setName(e.target.value)} />
          <Field
            label="직업"
            placeholder="예: 변호사"
            value={job}
            onChange={(e) => setJob(e.target.value)}
          />
          <Select
            label="분야"
            value={field}
            onChange={(e) => setField(e.target.value as FieldName)}
          >
            {FIELDS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Field
            label="한 줄 소개"
            placeholder="계약서 검토와 분쟁 대응을 도와드립니다"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <TextArea
            label="자기소개"
            placeholder="어떤 경력을 쌓았고 어떤 상담을 잘하는지 적어 주세요."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </section>

        <Divider />

        <section className="space-y-3 px-(--gutter) py-4">
          <SectionTitle>1시간 상담료</SectionTitle>
          <Field
            inputMode="numeric"
            placeholder="60000"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
            hint="원 단위로 적어 주세요"
          />
          <div className="rounded-r3 bg-bg-neutral-weak px-3.5 py-3">
            <p className="text-t3 text-fg-neutral-subtle">
              결제 금액의 20%가 플랫폼 수수료로 차감됩니다
            </p>
            <dl className="mt-2 space-y-1 text-t3">
              <div className="flex justify-between">
                <dt className="text-fg-neutral-subtle">상담료</dt>
                <dd className="tabular-nums">{formatPrice(priceNumber)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-fg-neutral-subtle">플랫폼 수수료 20%</dt>
                <dd className="tabular-nums text-fg-critical">- {formatPrice(fee)}</dd>
              </div>
              {tax > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-fg-neutral-subtle">사업소득 원천징수 3.3%</dt>
                  <dd className="tabular-nums text-fg-critical">- {formatPrice(tax)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-stroke-neutral-subtle pt-1.5 text-t4 font-semibold">
                <dt>실수령액</dt>
                <dd className="tabular-nums">{formatPrice(net - tax)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <Divider />

        <section className="space-y-3 px-(--gutter) py-4">
          <SectionTitle>정산 받을 계좌</SectionTitle>
          <Select label="은행" value={bank} onChange={(e) => setBank(e.target.value)}>
            {BANKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
          <Field
            label="계좌번호"
            inputMode="numeric"
            placeholder="- 없이 숫자만"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <Field
            label="예금주"
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
          <Field
            label="사업자등록번호 (선택)"
            inputMode="numeric"
            placeholder="- 없이 숫자만"
            value={business}
            onChange={(e) => setBusiness(e.target.value.replace(/[^0-9]/g, ""))}
            hint={
              business.trim()
                ? "세금계산서 발행 대상으로 정산합니다"
                : "사업소득 3.3%를 떼고 지급합니다"
            }
          />
        </section>
      </main>

      <BottomBar>
        <Button disabled={!ready} onClick={submit}>
          등록 신청하기
        </Button>
      </BottomBar>

      <Modal
        open={done}
        title="전문가 등록이 승인되었습니다"
        body="시간표를 열면 예약을 받을 수 있습니다."
        onClose={() => router.replace("/conect3/expert/schedule")}
        onConfirm={() => router.replace("/conect3/expert/schedule")}
      />
    </>
  );
}
