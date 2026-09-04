"use client";

// 프로필 편집. 신청 화면과 같은 항목을 고칠 수 있게 둔다.

import Link from "next/link";
import { useState } from "react";
import {
  FIELDS,
  PLATFORM_FEE_RATE,
  experts,
  type Expert,
  type Field as FieldName,
} from "@/app/conect3/_lib/data";
import { useSession } from "@/app/conect3/_lib/session";
import { formatPrice } from "@/app/conect3/_lib/format";
import { AppBar, BottomBar, ExpertTabBar, Modal } from "@/app/conect3/_components/shell";
import {
  Button,
  ButtonLink,
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

export default function ExpertProfilePage() {
  const { loaded, expert } = useSession();

  if (!loaded) return <main className="flex-1" />;

  if (!expert) {
    return (
      <>
        <AppBar title="프로필" back />
        <main className="flex-1 overflow-y-auto">
          <EmptyState
            title="전문가로 등록하면 볼 수 있어요"
            action={
              <ButtonLink href="/conect3/expert/apply" size="md">
                전문가로 등록하기
              </ButtonLink>
            }
          />
        </main>
        <ExpertTabBar />
      </>
    );
  }

  return <ProfileForm key={expert.id} expert={expert} />;
}

function ProfileForm({ expert }: { expert: Expert }) {
  const [job, setJob] = useState(expert.job);
  const [field, setField] = useState<FieldName>(expert.field);
  const [headline, setHeadline] = useState(expert.headline);
  const [bio, setBio] = useState(expert.bio);
  const [price, setPrice] = useState(String(expert.pricePerHour));

  const [bank, setBank] = useState(expert.payout?.bank ?? BANKS[0]);
  const [account, setAccount] = useState(expert.payout?.account ?? "");
  const [holder, setHolder] = useState(expert.payout?.holder ?? expert.name);
  const [business, setBusiness] = useState(expert.payout?.business ?? "");

  const [saved, setSaved] = useState(false);

  const priceNumber = Number(price.replace(/[^0-9]/g, "")) || 0;
  const fee = Math.round(priceNumber * PLATFORM_FEE_RATE);

  const ready =
    job.trim() !== "" &&
    headline.trim() !== "" &&
    bio.trim() !== "" &&
    priceNumber > 0 &&
    account.trim() !== "" &&
    holder.trim() !== "";

  const save = () => {
    if (!ready) return;
    experts.update(expert.id, {
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
    setSaved(true);
  };

  return (
    <>
      <AppBar title="프로필" back />

      <main className="flex-1 overflow-y-auto">
        <section className="space-y-3 px-(--gutter) py-4">
          <SectionTitle>소개</SectionTitle>
          <Field label="직업" value={job} onChange={(e) => setJob(e.target.value)} />
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
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
          <TextArea label="자기소개" value={bio} onChange={(e) => setBio(e.target.value)} />
          <Field
            label="1시간 상담료"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
            hint={`수수료 ${formatPrice(fee)}를 뺀 ${formatPrice(priceNumber - fee)}이 정산됩니다`}
          />
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
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <Field label="예금주" value={holder} onChange={(e) => setHolder(e.target.value)} />
          <Field
            label="사업자등록번호 (선택)"
            inputMode="numeric"
            value={business}
            onChange={(e) => setBusiness(e.target.value.replace(/[^0-9]/g, ""))}
            hint={
              business.trim()
                ? "세금계산서 발행 대상으로 정산합니다"
                : "사업소득 3.3%를 떼고 지급합니다"
            }
          />
        </section>

        <Divider />

        <div className="px-(--gutter) py-4">
          <Link
            href={`/conect3/experts/${expert.slug}`}
            className="block text-t4 text-fg-brand underline"
          >
            내 프로필 보기
          </Link>
        </div>
      </main>

      <BottomBar>
        <Button disabled={!ready} onClick={save}>
          저장하기
        </Button>
      </BottomBar>

      <Modal open={saved} title="저장했습니다" onClose={() => setSaved(false)} />

      <ExpertTabBar />
    </>
  );
}
