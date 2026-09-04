const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function formatPrice(won: number) {
  return `${won.toLocaleString("ko-KR")}원`;
}

/** 3월 4일 (화) */
export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

/** 오후 2:00 */
export function formatTime(iso: string) {
  const d = new Date(iso);
  const h = d.getHours();
  const meridiem = h < 12 ? "오전" : "오후";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${meridiem} ${h12}:00`;
}

/** 3월 4일 (화) 오후 2:00 ~ 오후 3:00 */
export function formatSlotRange(iso: string) {
  const end = new Date(iso);
  end.setHours(end.getHours() + 1);
  return `${formatDate(iso)} ${formatTime(iso)} ~ ${formatTime(end.toISOString())}`;
}

/** 날짜 탭용 키: 2026-03-04 */
export function dateKey(iso: string) {
  const d = new Date(iso);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** 3시간 전 / 2일 전 */
export function timeAgo(hours: number) {
  if (hours < 1) return "방금";
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/* ---------- conect3에서 추가한 것 ---------- */

/** 2026. 3. 4 */
export function formatDateShort(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

/** 방금 / 3시간 전 / 2일 전. 저장된 시각과 지금을 비교한다. */
export function fromNow(iso: string, now = Date.now()) {
  const diff = now - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  return formatDateShort(iso);
}

/** 목록의 날짜 머리에 쓴다. 오늘·내일은 이름으로 부른다. */
export function dayLabel(iso: string, now = new Date()) {
  const d = new Date(iso);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  if (diff === 0) return "오늘";
  if (diff === 1) return "내일";
  return formatDate(iso);
}

/** 카드번호 뒤 네 자리만 남긴다. */
export function maskCard(last4: string) {
  return `**** **** **** ${last4}`;
}
