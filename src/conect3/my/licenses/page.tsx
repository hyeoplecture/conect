"use client";

import { AppBar } from "@/app/conect3/_components/shell";
import { Divider } from "@/app/conect3/_components/ui";

// 오픈소스 고지 화면.
// SEED는 Apache-2.0이라 재배포 시 라이선스 사본 제공과 귀속 고지 전달 의무가 있다.
// NOTICE 원문은 그대로 싣는다. 요약하거나 다듬지 않는다.

type Entry = {
  name: string;
  copyright: string;
  license: string;
  url: string;
  note?: string;
};

const ENTRIES: Entry[] = [
  {
    name: "SEED Design System",
    copyright: "Copyright 2025 주식회사 당근마켓",
    license: "Apache License 2.0",
    url: "https://github.com/daangn/seed-design",
    note: "디자인 토큰(색·타이포·둥글기)을 사용합니다.",
  },
  {
    name: "Next.js",
    copyright: "Copyright (c) Vercel, Inc.",
    license: "MIT License",
    url: "https://github.com/vercel/next.js",
  },
  {
    name: "React",
    copyright: "Copyright (c) Meta Platforms, Inc. and affiliates.",
    license: "MIT License",
    url: "https://github.com/facebook/react",
  },
  {
    name: "Tailwind CSS",
    copyright: "Copyright (c) Tailwind Labs, Inc.",
    license: "MIT License",
    url: "https://github.com/tailwindlabs/tailwindcss",
  },
  {
    name: "IBM Plex Sans KR",
    copyright: "Copyright (c) 2017 IBM Corp.",
    license: "SIL Open Font License 1.1",
    url: "https://github.com/IBM/plex",
  },
];

const SEED_NOTICE = `SEED Design
Copyright 2025 주식회사 당근마켓

이 소프트웨어는 Apache License 2.0에 따라 배포되며, 상업적 목적을 포함하여 자유롭게 사용, 수정, 재배포할 수 있습니다.
재배포할 때에는 Apache License 2.0 제4조에 따라 라이선스 사본을 제공하고 이 파일에 담긴 귀속 고지를 전달해야 합니다.

아래 "브랜드 리소스"에 관한 내용은 상표에 관한 안내이며, Apache License 2.0이 정하는 조건을 변경하지 않습니다.

이 저장소에서 제공하는 "브랜드 리소스"는 주식회사 당근마켓(이하 "당근마켓")의 자산으로 대한민국 상표법의 보호를 받습니다.
브랜드 리소스란 로고, 상호명, 캐릭터 등 당근마켓이나 당근마켓의 제품으로 식별될 수 있는 모든 요소를 의미합니다.

당근마켓과 사전 협의가 없는 경우 비상업적 목적으로만 사용이 허가되며 당근마켓 브랜드 리소스 가이드라인을 준수해야 합니다.
상표 사용 허가는 당근마켓의 요청에 따라 언제든지 철회될 수 있습니다.

또한 브랜드 리소스를 다음과 같은 방식으로 사용할 수 없습니다.

- 당근마켓을 사칭하거나, 당근마켓이 제공하는 제품 또는 서비스인 것처럼 오인하게 하는 사용
- 당근마켓의 제품 또는 서비스와 제휴, 후원, 보증, 그 밖의 관련이 있는 것처럼 오인하게 하는 사용`;

export default function LicensesPage() {
  return (
    <>
      <AppBar title="오픈소스 라이선스" back />

      <main className="flex-1 overflow-y-auto">
        <section className="px-(--gutter) py-5">
          <p className="text-t3 text-fg-neutral-subtle">
            코넥트는 아래 오픈소스 소프트웨어를 사용합니다. 각 저작권자와 라이선스
            조건을 고지합니다.
          </p>
        </section>

        <ul className="border-t border-stroke-neutral-subtle">
          {ENTRIES.map((e) => (
            <li
              key={e.name}
              className="border-b border-stroke-neutral-subtle px-(--gutter) py-4"
            >
              <p className="text-t4 font-semibold">{e.name}</p>
              <p className="mt-1 text-t3 text-fg-neutral-subtle">{e.copyright}</p>
              <p className="mt-0.5 text-t3 text-fg-neutral-subtle">{e.license}</p>
              {e.note ? (
                <p className="mt-1 text-t3 text-fg-placeholder">{e.note}</p>
              ) : null}
              <a
                href={e.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block text-t3 text-fg-brand underline"
              >
                {e.url}
              </a>
            </li>
          ))}
        </ul>

        <Divider />

        <section className="px-(--gutter) py-5">
          <h2 className="text-t5 font-semibold">SEED Design NOTICE</h2>
          <p className="mt-1 text-t3 text-fg-placeholder">
            Apache License 2.0 제4조에 따라 전달하는 귀속 고지 원문입니다.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-r3 bg-bg-layer-basement p-4 text-t2 whitespace-pre-wrap text-fg-neutral-muted">
            {SEED_NOTICE}
          </pre>
        </section>

        <section className="px-(--gutter) pb-10">
          <p className="text-t3 text-fg-placeholder">
            당근마켓의 브랜드 리소스(로고·상호·캐릭터)는 사용하지 않습니다. 코넥트는
            SEED의 디자인 토큰만 사용하며 당근마켓과 제휴 관계가 없습니다.
          </p>
        </section>
      </main>
    </>
  );
}
