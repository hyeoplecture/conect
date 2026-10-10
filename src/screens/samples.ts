// 화면 보드가 동적 주소에 쓰는 고정 id.
// preview 모드의 시드(seed-scenario.ts buildPreviewScenario)가 이 id 를 실제로 만든다.
// 값을 바꾸면 seed-scenario.ts 와 같이 바꾼다.

import type { Persona } from "./types";

export const SAMPLE = {
  /** as=user 로 로그인하는 회원. 예약 4건(확정·완료·취소·노쇼)과 알림을 가짐 */
  userId: "usr_preview",
  /** as=expert 로 로그인하는 전문가 계정의 회원 id */
  expertUserId: "usr_preview_expert",
  /** as=admin 으로 로그인하는 운영자 (이메일은 data.ts ADMIN_EMAIL) */
  adminUserId: "usr_preview_admin",

  /** 승인된 전문가. 후기 5개 이상이라 평점이 보임. 위 전문가 계정의 프로필 */
  expertId: "exp_preview",
  expertSlug: "preview-expert",
  /** 승인된 신규 전문가. 후기가 없어 평점이 감춰짐 */
  newcomerExpertId: "exp_preview_newcomer",
  newcomerSlug: "preview-newcomer",

  /** 예약 4건. userId=userId, expertId=expertId */
  bookingConfirmed: "bk_preview_confirmed",
  bookingCompleted: "bk_preview_completed",
  bookingCanceled: "bk_preview_canceled",
  bookingNoShow: "bk_preview_noshow",

  /** 완료 예약에 달린 후기 */
  reviewId: "rev_preview_1",
  /** 전문가가 쓴 커뮤니티 글. 댓글 2개 */
  postId: "post_preview",
} as const;

/** persona 가 가리키는 회원 id. guest 는 로그인하지 않은 상태라 null */
export const PERSONA_USER_ID: Record<Persona, string | null> = {
  guest: null,
  user: SAMPLE.userId,
  expert: SAMPLE.expertUserId,
  admin: SAMPLE.adminUserId,
};
