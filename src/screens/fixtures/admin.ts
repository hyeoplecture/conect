import type { ScreenDef } from "../types";

// 운영자 영역. AdminLayout 이 isAdmin 일 때만 내용을 그리므로 대표 칸은 as=admin.
// 권한 없음은 ADM-S01 한 곳에서만 확인한다.
// 각 화면의 필터·탭은 useState 라 주소로 열 수 없어 skip "조작" 글줄로 남긴다.
export const adminScreens: ScreenDef[] = [
  {
    code: "ADM-S01",
    path: "/admin",
    name: "운영자 홈",
    area: "admin",
    cases: [
      { code: "ADM-S01.1", label: "오늘 숫자 · 처리할 것", href: "/admin", as: "admin" },
      {
        code: "ADM-S01.2",
        label: "권한 없음",
        href: "/admin",
        as: "user",
        note: "운영자가 아닌 회원은 '접근 권한이 없습니다'만 보임. 다른 운영자 화면도 같음",
      },
    ],
  },
  {
    code: "ADM-S02",
    path: "/admin/bookings",
    name: "예약 관리",
    area: "admin",
    cases: [
      { code: "ADM-S02.1", label: "전체 예약", href: "/admin/bookings", as: "admin" },
      {
        code: "ADM-S02.2",
        label: "상태 필터 (예정·완료·취소·미진행)",
        href: null,
        as: "admin",
        skip: "조작",
        note: "상단 필터 칩을 눌러야 바뀜",
      },
      {
        code: "ADM-S02.3",
        label: "예약 상세 시트 · 강제 취소 확인",
        href: null,
        as: "admin",
        skip: "조작",
        note: "줄을 누르면 상세 시트, 시트의 취소 버튼을 누르면 확인 모달",
      },
    ],
  },
  {
    code: "ADM-S03",
    path: "/admin/experts",
    name: "전문가 관리",
    area: "admin",
    cases: [
      { code: "ADM-S03.1", label: "전체 전문가", href: "/admin/experts", as: "admin" },
      {
        code: "ADM-S03.2",
        label: "승인대기 · 승인됨 · 정지 필터",
        href: null,
        as: "admin",
        skip: "조작",
        note: "상단 필터 칩을 눌러야 바뀜",
      },
      {
        code: "ADM-S03.3",
        label: "전문가 상세 시트 · 상태 변경",
        href: null,
        as: "admin",
        skip: "조작",
        note: "줄을 누르면 시트가 열림",
      },
    ],
  },
  {
    code: "ADM-S04",
    path: "/admin/payments",
    name: "결제·환불 원장",
    area: "admin",
    cases: [
      { code: "ADM-S04.1", label: "결제 탭", href: "/admin/payments", as: "admin" },
      {
        code: "ADM-S04.2",
        label: "환불 탭",
        href: null,
        as: "admin",
        skip: "조작",
        note: "결제/환불 전환 버튼에서 환불을 눌러야 보임",
      },
    ],
  },
  {
    code: "ADM-S05",
    path: "/admin/reports",
    name: "신고·문의",
    area: "admin",
    cases: [
      { code: "ADM-S05.1", label: "열린 신고", href: "/admin/reports", as: "admin" },
      {
        code: "ADM-S05.2",
        label: "처리된 신고",
        href: null,
        as: "admin",
        skip: "조작",
        note: "필터 칩에서 처리됨을 눌러야 보임",
      },
      {
        code: "ADM-S05.3",
        label: "신고 상세 시트 · 처리 완료",
        href: null,
        as: "admin",
        skip: "조작",
        note: "줄을 누르면 시트가 열림",
      },
    ],
  },
  {
    code: "ADM-S06",
    path: "/admin/settlements",
    name: "정산 관리",
    area: "admin",
    cases: [
      { code: "ADM-S06.1", label: "지급예정 정산", href: "/admin/settlements", as: "admin" },
      {
        code: "ADM-S06.2",
        label: "대기 · 지급완료 필터",
        href: null,
        as: "admin",
        skip: "조작",
        note: "상단 필터 칩을 눌러야 바뀜",
      },
      {
        code: "ADM-S06.3",
        label: "선택 지급 확인",
        href: null,
        as: "admin",
        skip: "조작",
        note: "지급예정 건을 골라 지급 버튼을 누르면 확인 모달",
      },
    ],
  },
  {
    code: "ADM-S07",
    path: "/admin/users",
    name: "회원 관리",
    area: "admin",
    cases: [
      { code: "ADM-S07.1", label: "회원 목록", href: "/admin/users", as: "admin" },
      {
        code: "ADM-S07.2",
        label: "검색 결과 없음",
        href: null,
        as: "admin",
        skip: "조작",
        note: "어떤 회원과도 맞지 않는 검색어를 넣어야 보임",
      },
    ],
  },
];
