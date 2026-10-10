// 화면 보드 레지스트리 타입. 명세: .omc/specs/screens-board.md 4.1

export type Area = "user" | "expert" | "admin";
export type Persona = "guest" | "user" | "expert" | "admin";
export type SkipKind = "조작" | "만들 화면" | "앱 밖" | "기다림";

export interface Case {
  /** 'USR-S06.2' */
  code: string;
  /** '예약 상세 · 결제 완료' */
  label: string;
  /** 해시 라우트 경로. 예: '/my/reservations/bk_preview_completed'. skip 이면 null */
  href: string | null;
  /** 기본 guest */
  as?: Persona;
  note?: string;
  /** 있으면 칸 대신 글줄 */
  skip?: SkipKind;
}

export interface ScreenDef {
  /** 'USR-S06' */
  code: string;
  /** 라우트 패턴. 예: '/my/reservations/:id' */
  path: string;
  name: string;
  area: Area;
  /** 비어 있으면 안 됨. 기본 칸 하나 이상 또는 skip */
  cases: Case[];
}
