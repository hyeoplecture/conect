import type { ScreenDef } from "../types";
import { SAMPLE } from "../samples";

// 전문가 영역 화면과 경우 목록.
// as=expert 는 SAMPLE.expertId 전문가(예약 5건, 정산 5건, 후기 6개)로 열린다.
// 전문가가 아닌 상태는 손님과 일반 회원이 같은 화면이라 as=user 칸 하나로 둔다(신청 화면만 다름).

export const expertScreens: ScreenDef[] = [
  {
    code: "EXP-S01",
    path: "/expert",
    name: "전문가 홈",
    area: "expert",
    cases: [
      {
        code: "EXP-S01.1",
        label: "전문가 홈 · 대시보드",
        href: "/expert",
        as: "expert",
        note: "오늘 상담 없음, 다음 예약 1건, 이번 달 숫자와 평점",
      },
      {
        code: "EXP-S01.2",
        label: "전문가 홈 · 전문가 아님",
        href: "/expert",
        as: "user",
        note: "등록 유도 빈 화면. 손님도 같은 화면",
      },
      {
        code: "EXP-S01.3",
        label: "전문가 홈 · 오늘의 상담 있음",
        href: null,
        skip: "기다림",
        note: "확정 예약 당일이 되면 오늘의 상담 목록과 참여하기 버튼(30분 전부터 활성)이 보임",
      },
      {
        code: "EXP-S01.4",
        label: "전문가 홈 · 시간표 없음 안내",
        href: null,
        skip: "조작",
        note: "전문가 등록 직후 시간표를 열지 않은 상태에서 '시간표 열기' 안내 상자가 보임",
      },
    ],
  },
  {
    code: "EXP-S02",
    path: "/expert/apply",
    name: "전문가 등록",
    area: "expert",
    cases: [
      {
        code: "EXP-S02.1",
        label: "전문가 등록 · 로그인 전",
        href: "/expert/apply",
        note: "로그인 유도 빈 화면",
      },
      {
        code: "EXP-S02.2",
        label: "전문가 등록 · 신청서",
        href: "/expert/apply",
        as: "user",
        note: "이미 전문가면 전문가 홈으로 보냄",
      },
      {
        code: "EXP-S02.3",
        label: "전문가 등록 · 승인 완료",
        href: null,
        skip: "조작",
        note: "신청서를 채워 제출하면 '전문가 등록이 승인되었습니다' 모달이 뜨고 시간표로 이동",
      },
    ],
  },
  {
    code: "EXP-S03",
    path: "/expert/bookings",
    name: "받은 예약",
    area: "expert",
    cases: [
      {
        code: "EXP-S03.1",
        label: "받은 예약 · 전체",
        href: "/expert/bookings",
        as: "expert",
        note: "확정 1, 완료 2, 취소 1, 노쇼 1",
      },
      {
        code: "EXP-S03.2",
        label: "받은 예약 · 전문가 아님",
        href: "/expert/bookings",
        as: "user",
      },
      {
        code: "EXP-S03.3",
        label: "받은 예약 · 상태 필터",
        href: null,
        skip: "조작",
        note: "예정/완료/취소 탭을 눌러야 걸러진 목록이 보임. 주소로 필터를 넘기지 않음",
      },
      {
        code: "EXP-S03.4",
        label: "받은 예약 · 예약 없음",
        href: null,
        skip: "조작",
        note: "전문가 등록 직후 예약이 없을 때 '시간표 열기' 빈 화면이 보임",
      },
    ],
  },
  {
    code: "EXP-S04",
    path: "/expert/bookings/:id",
    name: "받은 예약 상세",
    area: "expert",
    cases: [
      {
        code: "EXP-S04.1",
        label: "예약 상세 · 확정",
        href: `/expert/bookings/${SAMPLE.bookingConfirmed}`,
        as: "expert",
        note: "이틀 뒤 상담. 연락처 가림, 참여 비활성, 하단 예약 취소 버튼",
      },
      {
        code: "EXP-S04.2",
        label: "예약 상세 · 완료, 후기 받음",
        href: `/expert/bookings/${SAMPLE.bookingCompleted}`,
        as: "expert",
        note: "받은 후기와 '답글 달기' 버튼",
      },
      {
        code: "EXP-S04.3",
        label: "예약 상세 · 취소",
        href: `/expert/bookings/${SAMPLE.bookingCanceled}`,
        as: "expert",
      },
      {
        code: "EXP-S04.4",
        label: "예약 상세 · 미진행(노쇼)",
        href: `/expert/bookings/${SAMPLE.bookingNoShow}`,
        as: "expert",
      },
      {
        code: "EXP-S04.5",
        label: "예약 상세 · 찾을 수 없음",
        href: "/expert/bookings/bk_not_found",
        as: "expert",
        note: "없는 예약이거나 다른 전문가의 예약",
      },
      {
        code: "EXP-S04.6",
        label: "예약 상세 · 전문가 아님",
        href: `/expert/bookings/${SAMPLE.bookingConfirmed}`,
        as: "user",
      },
      {
        code: "EXP-S04.7",
        label: "예약 상세 · 진행 여부 확인",
        href: null,
        skip: "기다림",
        note: "확정 예약의 상담 시작 1시간이 지나면 '상담을 진행하셨나요?' 상자가 보임. 24시간 전부터 연락처, 30분 전부터 참여 버튼도 열림",
      },
      {
        code: "EXP-S04.8",
        label: "예약 상세 · 취소 시트와 답글 시트",
        href: null,
        skip: "조작",
        note: "확정 예약에서 '예약 취소하기', 후기 있는 예약에서 '답글 달기'를 눌러야 시트가 열림",
      },
    ],
  },
  {
    code: "EXP-S05",
    path: "/expert/profile",
    name: "전문가 프로필 편집",
    area: "expert",
    cases: [
      {
        code: "EXP-S05.1",
        label: "프로필 편집 · 기존 값",
        href: "/expert/profile",
        as: "expert",
      },
      {
        code: "EXP-S05.2",
        label: "프로필 편집 · 전문가 아님",
        href: "/expert/profile",
        as: "user",
      },
      {
        code: "EXP-S05.3",
        label: "프로필 편집 · 저장 완료",
        href: null,
        skip: "조작",
        note: "저장하기를 누르면 '저장했습니다' 모달이 뜸",
      },
    ],
  },
  {
    code: "EXP-S06",
    path: "/expert/schedule",
    name: "시간표",
    area: "expert",
    cases: [
      {
        code: "EXP-S06.1",
        label: "시간표 · 오늘",
        href: "/expert/schedule",
        as: "expert",
        note: "처음엔 오늘이 선택됨. 시드의 열린 시간은 내일부터라 오늘 칸은 닫힘",
      },
      {
        code: "EXP-S06.2",
        label: "시간표 · 전문가 아님",
        href: "/expert/schedule",
        as: "user",
      },
      {
        code: "EXP-S06.3",
        label: "시간표 · 열림과 예약됨 칸",
        href: null,
        skip: "조작",
        note: "날짜 줄에서 내일 이후를 눌러야 열림 칸이, 확정 예약 날을 눌러야 예약됨 칸이 보임",
      },
      {
        code: "EXP-S06.4",
        label: "시간표 · 일괄 열기 확인",
        href: null,
        skip: "조작",
        note: "'이 설정으로 N일치 열기'를 누르면 확인 모달이 뜸",
      },
    ],
  },
  {
    code: "EXP-S07",
    path: "/expert/settlements",
    name: "정산 내역",
    area: "expert",
    cases: [
      {
        code: "EXP-S07.1",
        label: "정산 내역 · 대기, 지급예정, 지급완료",
        href: "/expert/settlements",
        as: "expert",
        note: "대기 1, 지급예정 2, 지급완료 2. 사업자번호가 없어 원천징수 3.3% 줄이 보임",
      },
      {
        code: "EXP-S07.2",
        label: "정산 내역 · 전문가 아님",
        href: "/expert/settlements",
        as: "user",
      },
      {
        code: "EXP-S07.3",
        label: "정산 내역 · 내역 없음",
        href: null,
        skip: "조작",
        note: "전문가 등록 직후 정산이 없을 때 '아직 정산 내역이 없습니다' 빈 화면이 보임",
      },
    ],
  },
];
