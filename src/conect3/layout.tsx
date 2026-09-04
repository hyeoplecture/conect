import type { Metadata } from "next";
import { IBM_Plex_Sans_KR } from "next/font/google";
import { MobileFrame } from "@/app/conect3/_components/shell";
import "./conect3.css";

// conect3 전용 레이아웃. html/body는 루트 app/layout.tsx가 담당한다.
// data-seed-color-mode="light-only"로 라이트를 고정한다. SEED의 색 토큰은
// 기본값이 prefers-color-scheme을 따라가는데 다크모드를 쓰지 않기로 했다.

const plex = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "코넥트",
  description: "필요한 전문가와 1시간을 연결합니다.",
};

export default function Conect3Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${plex.variable} conect3-root`}
      data-seed
      data-seed-color-mode="light-only"
    >
      <MobileFrame>{children}</MobileFrame>
    </div>
  );
}
