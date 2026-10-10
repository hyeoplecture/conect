// 운영 화면용 시나리오 데이터. 전문가·회원·예약·결제·정산·후기·신고를 한 번에 만든다.
// 운영자가 들어왔을 때 "처리해야 할 일"이 눈에 띄어야 하므로
// 승인 대기 전문가, 열린 신고, 지급 대기 정산, 오늘·내일 상담을 일부러 남겨 둔다.
//
// 값(표·함수)을 data.ts에서 가져오면 순환 참조가 되므로 타입만 가져온다.
//
// 실측 건수(직렬화 약 730KB):
// users 70 / experts 120 / availability 1,920 / bookings 220 / payments 220
// refunds 24 / settlements 220 / reviews 1,118(예약 연결 97 + 이력 1,021)
// posts 30 / comments 80 / notifications 60 / reports 22

import type {
  Availability,
  Booking,
  BookingStatus,
  Comment,
  Expert,
  Field,
  Notification,
  NotifChannel,
  Payment,
  PaymentMethod,
  Post,
  Refund,
  Report,
  Review,
  Settlement,
  User,
} from "./data";
import { SEED_EXPERTS } from "./seed";
import { SAMPLE } from "../../screens/samples";

export type ScenarioData = {
  users: User[];
  experts: Expert[];
  availability: Availability[];
  bookings: Booking[];
  payments: Payment[];
  refunds: Refund[];
  settlements: Settlement[];
  reviews: Review[];
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
};

/* ---------- 결정적 난수 ---------- */
// Math.random()을 쓰면 새로고침마다 화면이 달라져 확인이 안 된다.
// Math.imul을 쓰는 이유는 32비트 곱셈을 정확히 하기 위해서다.

let s = 20260830;
const rnd = () => {
  s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
  return s / 0x7fffffff;
};
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;

/* ---------- 시간 ---------- */
// 며칠 뒤에 열어도 "다음 주 예약"이 미래로 남도록 전부 지금 기준 상대값이다.

const NOW = Date.now();
const DAY = 86400000;
const HOUR = 3600000;
const iso = (ms: number) => new Date(ms).toISOString();
const daysAgo = (n: number) => iso(NOW - Math.round(n * DAY));

/** 그날의 특정 시각을 만든다. 주말이면 앞 평일로 당긴다. */
function dayAt(offsetDays: number, hour: number): number {
  const d = new Date(NOW + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  const wd = d.getDay();
  if (wd === 0) d.setDate(d.getDate() + 1);
  if (wd === 6) d.setDate(d.getDate() + 2);
  return d.getTime();
}

/* ---------- 회원 이름 70개 ---------- */

const USER_NAMES: [string, string][] = [
  ["김서준", "seojun"], ["이하윤", "hayun"], ["박도윤", "doyun"], ["최지호", "jiho"],
  ["정예은", "yeeun"], ["강민준", "minjun"], ["조수아", "sua"], ["윤건우", "geonwoo"],
  ["장서윤", "seoyun"], ["임채원", "chaewon"], ["한지민", "jimin"], ["오세훈", "sehun"],
  ["서다은", "daeun"], ["신유진", "yujin"], ["권태윤", "taeyun"], ["황보라", "bora"],
  ["안준서", "junseo"], ["송하은", "haeun"], ["홍시우", "siwoo"], ["유가온", "gaon"],
  ["전예린", "yerin"], ["고은우", "eunwoo"], ["문지안", "jian"], ["손채린", "chaerin"],
  ["배도현", "dohyun"], ["백승우", "seungwoo"], ["허수빈", "subin"], ["남지후", "jihu"],
  ["심아영", "ayoung"], ["노태호", "taeho"], ["하윤슬", "yunseul"], ["곽민서", "minseo"],
  ["성지환", "jihwan"], ["차예나", "yena"], ["주영민", "yeongmin"], ["우다인", "dain"],
  ["구재희", "jaehee"], ["민서연", "seoyeon"], ["유상현", "sanghyun"], ["류하진", "hajin"],
  ["진소윤", "soyun"], ["지우빈", "woobin"], ["엄현서", "hyeonseo"], ["표지훈", "jihoon"],
  ["마세영", "seyoung"], ["감유리", "yuri"], ["모나윤", "nayun"], ["계민호", "minho"],
  ["위서아", "seoa"], ["은다솔", "dasol"], ["복지원", "jiwon"], ["탁현우", "hyunwoo"],
  ["옥소민", "somin"], ["피준영", "junyoung"], ["도수현", "suhyun"], ["설유하", "yuha"],
  ["방태경", "taekyung"], ["염지수", "jisu"], ["길나연", "nayeon"], ["석민재", "minjae"],
  ["태윤아", "yuna"], ["현지완", "jiwan"], ["편성훈", "sunghoon"], ["여은채", "eunchae"],
  ["선우빈", "ubin"], ["국지영", "jiyoung"], ["반하늘", "haneul"], ["옥승현", "seunghyun"],
  ["추민경", "minkyung"], ["강다희", "dahee"],
];

/** 후기와 신고에 쓰는 이름 가리기. 김민수 -> 김O수 */
function maskName(name: string) {
  if (name.length >= 3) return name[0] + "O" + name.slice(2);
  return name[0] + "O";
}

/* ---------- 문장 재료 ---------- */

const NOTES: Record<Field, string[]> = {
  법률: [
    "전세 계약서 특약에 뭘 넣어야 할지 모르겠습니다. 등기부등본은 떼어 놨어요.",
    "회사에서 권고사직을 제안받았는데 그냥 받아들여도 되는 건지 모르겠습니다.",
    "거래처가 대금을 3개월째 안 주고 있습니다. 내용증명부터 보내야 할까요.",
    "동업자와 지분 정리 중인데 구두로만 정한 게 많습니다. 지금이라도 문서로 만들 수 있나요.",
    "온라인으로 물건을 파는데 환불 요구가 계속 들어옵니다. 어디까지 응해야 하는지 알고 싶습니다.",
    "상대 쪽 변호사한테 답변서를 받았습니다. 읽어도 무슨 뜻인지 모르겠어서 가져갑니다.",
    "부모님 명의 집을 형제끼리 어떻게 나눌지 얘기가 길어지고 있습니다.",
  ],
  세무: [
    "작년에 프리랜서 소득이 처음 생겼는데 사업자를 내야 하는지 모르겠습니다.",
    "부가세 신고 기한이 다음 주인데 매입 자료 정리가 안 됐습니다.",
    "아파트를 팔려고 하는데 2주택이라 세금이 얼마나 나올지 미리 알고 싶습니다.",
    "법인 전환을 권유받았습니다. 지금 매출은 4억 정도입니다.",
    "해외 플랫폼에서 받은 수입이 있는데 어디에 신고하는지 모르겠습니다.",
    "연말정산에서 놓친 게 있는 것 같아 원천징수영수증 가져갑니다.",
    "폐업을 정리 중인데 남은 재고 처리가 걸립니다.",
  ],
  부동산: [
    "전세 계약 앞두고 있는데 근저당이 잡혀 있어서 불안합니다. 등기부 보내드릴게요.",
    "첫 집을 알아보고 있습니다. 예산은 대출 포함 5억 정도로 보고 있어요.",
    "상가 권리금 5천을 요구받았는데 적정한지 모르겠습니다.",
    "리모델링 견적을 세 군데서 받았는데 금액 차이가 두 배입니다.",
    "경매로 나온 물건이 있는데 임차인이 살고 있어서 망설여집니다.",
    "부모님이 물려주신 시골 땅이 있는데 뭘 할 수 있는지 알고 싶습니다.",
    "월세 세입자가 두 달째 연락이 안 됩니다.",
  ],
  진로: [
    "이직 제안을 받았는데 연봉은 비슷하고 직급만 오릅니다. 가는 게 맞을까요.",
    "서류에서 계속 떨어집니다. 이력서 파일 미리 보내드릴게요.",
    "3년 공백이 있습니다. 면접에서 어떻게 말해야 할지 모르겠습니다.",
    "비전공인데 개발로 넘어가려고 합니다. 부트캠프를 등록해도 될까요.",
    "다음 주에 최종 면접이 있습니다. 예상 질문을 같이 정리하고 싶습니다.",
    "아이 학과 선택을 두고 집에서 의견이 갈립니다. 성적표 준비했습니다.",
    "연봉 협상 자리에서 어떻게 말해야 할지 시나리오가 필요합니다.",
  ],
  건강: [
    "건강검진에서 간 수치가 높게 나왔는데 병원에서는 지켜보자고만 합니다.",
    "허리가 6개월째 아픕니다. MRI 찍었는데 큰 문제는 없다고 합니다.",
    "아이가 밤에 자주 열이 납니다. 언제 응급실을 가야 하는지 기준을 알고 싶습니다.",
    "요즘 잠을 3~4시간밖에 못 잡니다. 약을 먹어야 하는 상태인지 궁금합니다.",
    "당뇨 전단계라는 말을 들었습니다. 식단을 어디부터 바꿔야 할지 모르겠습니다.",
    "무릎 수술을 권유받았는데 다른 의견을 듣고 싶어서 예약했습니다.",
    "운동을 늘렸는데 체중이 그대로입니다. 사흘치 식단 적어 놨습니다.",
  ],
  재테크: [
    "월급에서 남는 돈을 어디에 넣어야 할지 몰라 통장에 그냥 쌓아 두고 있습니다.",
    "보험을 다섯 개 들고 있는데 겹치는 게 있는지 봐 주셨으면 합니다.",
    "대출 금리가 올라서 갈아탈지 고민입니다. 지금 조건 정리해 놨습니다.",
    "퇴직금을 IRP로 받으라고 하는데 뭐가 유리한지 모르겠습니다.",
    "신용카드 대금이 계속 밀립니다. 어떻게 정리해야 할지 상담받고 싶습니다.",
    "첫 월급을 받았습니다. 어떤 순서로 모아야 하는지 알고 싶습니다.",
    "해외 송금을 매달 하는데 수수료가 아깝다는 생각이 듭니다.",
  ],
  IT: [
    "서비스가 사용자 늘면서 느려졌습니다. 어디부터 봐야 할지 모르겠습니다.",
    "앱 심사에서 두 번 반려됐습니다. 받은 메시지 그대로 가져가겠습니다.",
    "데이터는 쌓이는데 뭘 봐야 할지 모르겠습니다. 대시보드는 있습니다.",
    "기획서를 썼는데 개발 기간이 너무 길게 나옵니다. 줄일 방법을 찾고 싶습니다.",
    "관리자 페이지 보안이 걱정됩니다. 지금 구조를 설명드리겠습니다.",
    "매일 엑셀을 손으로 합치는 작업이 있습니다. 자동화가 가능할까요.",
    "광고비를 늘렸는데 매출이 그대로입니다. 지표를 같이 봐 주세요.",
  ],
};

const REVIEW_HIGH = [
  "막연했던 게 한 시간 만에 정리됐습니다. 다음에 뭘 해야 하는지가 분명해졌어요.",
  "제 상황을 먼저 들으시고 나서 답을 주셔서 좋았습니다. 일반론이 아니라 제 얘기였어요.",
  "굳이 진행할 필요 없다고 솔직하게 말씀해 주셨습니다. 오히려 더 신뢰가 갔습니다.",
  "질문을 열 개 적어 갔는데 하나도 안 빠뜨리고 답해 주셨어요.",
  "상담 끝나고 정리한 내용을 따로 보내 주셨습니다. 그게 제일 도움이 됐습니다.",
  "인터넷에서 본 것과 제 경우가 왜 다른지를 짚어 주셔서 헷갈리던 게 풀렸습니다.",
  "괜히 미뤘다 싶었어요. 진작 볼 걸 그랬습니다.",
  "숫자로 계산해서 보여 주시니까 결정이 바로 됐습니다.",
  "말이 빠르지도 느리지도 않아서 따라가기 좋았습니다. 녹음해도 된다고 하셔서 편했어요.",
  "제가 놓치고 있던 조항 두 개를 찾아 주셨습니다. 그거 하나로 상담비는 뽑았습니다.",
];

const REVIEW_MID = [
  "내용은 알찼는데 시간이 조금 부족했습니다. 두 번에 나눠 받을 걸 그랬어요.",
  "도움은 됐지만 제가 이미 알고 있던 내용이 절반 정도였습니다.",
  "설명은 친절하셨는데 결론이 조금 두루뭉술했습니다.",
  "말이 빨라서 따라가기 힘든 구간이 있었습니다. 내용 자체는 괜찮았어요.",
  "자료를 미리 보냈는데 상담 중에 처음 보시는 느낌이었습니다. 답변은 정확했습니다.",
  "일반적인 이야기가 많아서 제 상황에 맞는 부분은 뒤에 조금이었습니다.",
];

const REVIEW_LOW = [
  "예정 시간보다 15분 늦게 시작했는데 그만큼 더 해 주시지는 않았습니다.",
  "제가 물어본 것과 다른 답이 계속 돌아왔습니다. 정리된 게 없이 끝났어요.",
  "결국 자기 사무실로 정식 의뢰하라는 말만 들었습니다. 상담이라기엔 아쉽습니다.",
  "연결이 계속 끊겼는데 다시 잡아 주지도 않았습니다.",
  "질문에 대한 답이 검색하면 나오는 수준이었습니다.",
];

const REVIEW_REPORTED = [
  "이 사람 자격증이 없는 것 같습니다. 말하는 게 전혀 전문가 같지 않았어요.",
  "돈만 받고 아무것도 안 해 주는 곳입니다. 다들 거르세요.",
  "다른 후기들은 전부 지인이 쓴 것 같습니다. 실제로는 이 정도가 아닙니다.",
  "상담 중에 무시당하는 기분이었습니다. 사람을 뭘로 보는지 모르겠습니다.",
  "여기 후기 좋은 거 믿지 마세요. 저는 시간만 버렸습니다.",
  "말투가 계속 비꼬는 식이었습니다. 이런 사람이 왜 전문가로 올라와 있는지 모르겠습니다.",
];

const REVIEW_REPLIES = [
  "남겨 주신 후기 잘 봤습니다. 다음에는 시간 배분을 더 신경 쓰겠습니다.",
  "도움이 되셨다니 다행입니다. 말씀드린 서류 준비하시고 막히시면 언제든 다시 오세요.",
  "설명이 부족했던 부분은 죄송합니다. 정리 자료를 메일로 한 번 더 보내 드렸습니다.",
  "좋게 봐 주셔서 감사합니다. 진행하시다 상황이 바뀌면 그때 다시 보겠습니다.",
  "지적해 주신 부분은 다음 상담부터 바로 반영하겠습니다.",
];

const REFUND_REASONS = [
  "개인 일정이 겹쳐 취소했습니다",
  "다른 곳에서 먼저 해결되어 취소",
  "전문가 사정으로 일정 취소",
  "상담 시간에 나타나지 않음",
  "결제 수단을 잘못 골라 재결제",
  "회사 일정이 잡혀 참석 불가",
  "건강 문제로 참석하지 못함",
  "상담 내용이 필요한 분야와 달라 취소",
];

const POST_SEEDS: [string, string][] = [
  ["hyunsik-ma", "경찰서에서 연락이 오면 가장 먼저 할 일은 조사 날짜를 뒤로 미루는 겁니다. 당장 오라고 해도 일정 조율은 됩니다. 그 며칠 동안 사건 성격을 파악하고 무슨 말을 할지 정리하는 것과, 아무 준비 없이 앉는 것은 결과가 다릅니다."],
  ["jieun-baek", "주주간 계약에서 가장 많이 다투는 조항은 이탈 시 지분 처리입니다. 초기에는 아무도 나갈 생각이 없으니 대충 넘어가는데, 실제로 한 명이 나가면 남은 사람이 회사를 못 팔게 되는 구조가 생깁니다."],
  ["sujin-bae", "보증금을 못 받은 상태에서 이사부터 하면 대항력이 사라집니다. 임차권등기명령을 신청하고 등기가 완료된 것을 확인한 다음에 짐을 빼세요. 순서가 반대면 소송에서 훨씬 불리해집니다."],
  ["dahye-oh", "특허를 낼지 말지 고민이라면 먼저 공개 여부부터 확인하세요. 전시회나 SNS에 먼저 공개했다면 그날부터 12개월 안에 출원해야 합니다. 이 기한을 넘기면 내 발명 때문에 내 특허가 거절됩니다."],
  ["wonjun-seo", "직원이 5명이 되는 순간 연장근로수당, 연차, 해고 제한이 한꺼번에 적용됩니다. 4명일 때 만든 근로계약서를 그대로 쓰면 대부분 위반 상태가 됩니다. 인원이 늘어날 때 계약서를 다시 보세요."],
  ["jaewon-koo", "접대비로 처리하려던 식대가 부가세 공제가 안 된다는 걸 신고 직전에 아는 분이 많습니다. 거래처와의 식사는 매입세액 공제 대상이 아닙니다. 직원 식대와 구분해서 기록해 두세요."],
  ["hosik-yang", "1가구 1주택 비과세는 보유만으로 되지 않습니다. 조정대상지역에서 취득했다면 2년 거주 요건이 붙습니다. 팔기 전에 이 조건을 채웠는지 확인하는 것만으로 수천만원이 갈립니다."],
  ["chaewon-sung", "월세 세액공제는 확정일자가 없어도 됩니다. 전입신고와 임대차계약서만 있으면 신청할 수 있는데 모르고 넘어가는 분이 많습니다. 지난 5년치는 경정청구로 돌려받을 수 있습니다."],
  ["seulgi-min", "은행에 대출을 신청하기 전에 재무제표의 부채비율과 이자보상배율을 먼저 보세요. 이 두 숫자가 심사에서 가장 먼저 걸립니다. 결산 전에 정리할 수 있는 항목이 생각보다 많습니다."],
  ["nayeon-jo", "법인을 만들면 세율은 낮아지지만 회사 돈은 내 돈이 아닙니다. 대표 급여와 배당으로 꺼낼 때 다시 세금이 붙습니다. 이 두 단계를 합쳐서 계산해야 개인사업자와 제대로 비교가 됩니다."],
  ["sohee-lim", "상가 계약에서 임대료 인상률 상한을 계약서에 넣지 않으면 재계약 때 협상력이 없습니다. 5% 상한 조항 한 줄이 몇 년 뒤 수백만원 차이를 만듭니다."],
  ["gyuho-ahn", "경매에서 낙찰가만 보고 예산을 짜면 반드시 모자랍니다. 명도 비용, 밀린 관리비, 수리비를 더하면 보통 낙찰가의 10~15%가 더 듭니다. 이걸 넣고도 시세보다 싸야 의미가 있습니다."],
  ["minjae-ko", "대출 한도가 은행마다 다른 이유는 소득 인정 방식이 달라서입니다. 프리랜서라면 종합소득세 신고 소득으로 보는 곳과 매출로 보는 곳이 갈립니다. 한 군데서 거절됐다고 포기하지 마세요."],
  ["arin-koh", "땅을 사기 전에 진입로가 도로로 인정되는지부터 확인하세요. 지도상 길이 있어도 사유지면 건축 허가가 안 납니다. 이 한 가지 때문에 못 쓰는 땅을 산 사례를 여러 번 봤습니다."],
  ["dongsu-im", "이직 제안을 받았을 때 연봉보다 먼저 물어야 할 건 그 자리가 왜 비었는지입니다. 사람이 자주 바뀌는 자리라면 이유가 있습니다. 면접에서 물어봐도 실례가 아닙니다."],
  ["jiho-song", "면접에서 답변이 길어지면 준비를 많이 한 것처럼 보일 것 같지만 반대입니다. 1분을 넘어가면 듣는 쪽은 요점을 놓칩니다. 결론을 먼저 말하고 이유를 두 개만 붙이세요."],
  ["hyeonjun-tae", "연봉 협상에서 먼저 숫자를 말하면 진다는 말은 반쯤만 맞습니다. 시장 데이터를 근거로 범위를 제시하면 오히려 기준을 내가 잡게 됩니다. 근거 없는 숫자만 위험합니다."],
  ["saebom-gwon", "비전공에서 IT로 넘어올 때 언어를 먼저 고르는 것은 순서가 틀렸습니다. 어떤 직무로 갈지에 따라 배울 것이 완전히 달라집니다. 채용 공고 열 개를 먼저 읽어 보세요."],
  ["hana-yoo", "경력 공백을 설명할 때 가장 안 좋은 답은 개인 사정이었습니다입니다. 그 기간에 무엇을 했고 지금 왜 돌아오려는지를 두 문장으로 준비하면 질문 자체가 짧아집니다."],
  ["kyungho", "건강검진 결과지에서 빨간 글씨 하나에 놀라기보다 지난 몇 년치를 나란히 놓고 보세요. 한 번 높은 것보다 계속 오르고 있는 항목이 훨씬 중요합니다."],
  ["dowon-chae", "정신과 진료 기록 때문에 보험 가입이 막힐까 걱정하시는데, 실제로는 진단명과 기간에 따라 다릅니다. 막연히 미루다 상태가 나빠지는 쪽이 훨씬 손해입니다."],
  ["hyunsoo-gam", "허리가 아플 때 무조건 눕는 것은 이제 권하지 않습니다. 통증이 심한 이틀을 지나면 걷는 것이 회복을 앞당깁니다. 다만 앉아 있는 시간을 줄이는 게 먼저입니다."],
  ["jieun-tak", "잠이 안 온다고 침대에 오래 누워 있으면 침대가 잠자는 곳이 아니게 됩니다. 20분 안에 못 자면 일어나서 다른 방으로 가세요. 이것만 지켜도 2주 뒤에 달라집니다."],
  ["haerim-goo", "근육을 늘리려는데 체중이 안 늘면 대개 총 섭취량이 부족한 겁니다. 보충제를 추가하기 전에 하루 세 끼를 그대로 적어 보세요. 생각보다 적게 먹고 있는 경우가 많습니다."],
  ["arang-hwang", "가계부를 쓰는 목적은 절약이 아니라 큰 지출을 찾는 겁니다. 커피값 만원을 줄이는 것보다 매달 나가는 구독과 보험료를 한 번 정리하는 게 효과가 큽니다."],
  ["hyeonu-mun", "적립식 투자에서 가장 흔한 실패는 금액이 커서 못 버티는 겁니다. 3년을 못 넘기면 아무 의미가 없습니다. 지금 넣을 수 있는 금액의 절반으로 시작하세요."],
  ["bora-ji", "연체가 시작되면 카드론으로 막는 분이 많은데 그때부터 회복이 어려워집니다. 한 달 이상 밀릴 것 같으면 그 시점에 채무조정을 알아보는 것이 훨씬 빠릅니다."],
  ["sungmin-jo", "서버가 느려졌을 때 장비부터 늘리면 돈은 쓰고 문제는 남습니다. 느린 요청 상위 열 개만 뽑아 보면 대개 쿼리 한두 개가 전체를 잡고 있습니다."],
  ["hyeonjin-do", "작은 서비스에서 가장 흔한 사고는 관리자 페이지가 그냥 열려 있는 겁니다. 주소를 아무도 모를 거라는 가정은 통하지 않습니다. 오늘 접근 제한부터 걸어 두세요."],
  ["yeonwoo-sun", "기능을 열 개 넣고 내는 것보다 세 개를 제대로 넣고 반응을 보는 쪽이 빠릅니다. 무엇을 뺄지 정하지 못하는 팀은 출시 날짜도 못 정합니다."],
];

const COMMENT_BODIES = [
  "이 글 보고 바로 계약서 다시 봤습니다. 감사합니다.",
  "혹시 5인 미만 사업장도 같은가요?",
  "저도 비슷한 상황인데 도움이 됐습니다.",
  "이런 건 어디서 확인할 수 있나요?",
  "말씀하신 서류는 온라인으로도 뗄 수 있나요?",
  "정확히 제가 궁금했던 내용이었습니다.",
  "예시를 하나만 더 들어 주실 수 있을까요?",
  "저는 반대로 알고 있었는데 다시 확인해 봐야겠네요.",
  "상담 신청했습니다. 잘 부탁드립니다.",
  "이 경우에 기한이 언제까지인지 궁금합니다.",
  "글이 짧은데 핵심만 있어서 좋네요.",
  "작년에 이걸 몰라서 손해를 봤습니다.",
  "저희 회사도 딱 이 상황입니다.",
  "다음 편도 기다리겠습니다.",
  "프리랜서인 경우에도 해당되나요?",
  "읽고 바로 확인해 봤는데 저는 해당이 안 되네요.",
  "이런 정보는 처음 봅니다. 감사합니다.",
  "관련해서 준비할 서류 목록이 있을까요?",
  "가족에게도 공유했습니다.",
  "숫자로 설명해 주셔서 이해가 됐습니다.",
  "저도 그렇게 하다가 크게 물린 적이 있습니다.",
  "지역마다 다를 수도 있나요?",
  "생각보다 기한이 짧네요. 서둘러야겠습니다.",
  "이 부분은 좀 더 자세히 알고 싶습니다.",
  "실제로 해 보니 말씀하신 대로였습니다.",
  "질문 하나만 더 드려도 될까요?",
  "저장해 두고 몇 번 더 읽어야겠습니다.",
  "이런 걸 미리 알았으면 좋았을 텐데요.",
  "상담 받아 보니 확실히 다르더라고요.",
  "혹시 관련 법이 최근에 바뀐 게 있나요?",
  "저는 여기서 반대로 처리했는데 문제가 될까요?",
  "설명이 명확해서 좋았습니다.",
  "직접 해 보려다 포기했는데 다시 시도해 보겠습니다.",
  "회사에 이야기해 볼 근거가 생겼습니다.",
  "댓글 보고 저도 확인했습니다. 다행히 괜찮네요.",
  "이 기준은 언제부터 적용된 건가요?",
  "부모님께 알려 드려야겠습니다.",
  "무료로 이런 내용을 알려 주셔서 감사합니다.",
  "저는 반대 사례를 겪어서 남깁니다.",
  "정리가 잘 되어 있어서 바로 실행했습니다.",
];

const REPORT_REVIEW_BODIES = [
  "사실과 다른 내용이 적혀 있습니다. 자격증은 프로필에 등록되어 있고 확인도 받았습니다.",
  "상담을 진행하지도 않은 분이 남긴 후기입니다. 예약 내역을 확인해 주세요.",
  "후기 내용 중 인신공격에 가까운 표현이 있어 삭제를 요청합니다.",
  "경쟁 업체에서 남긴 것으로 보입니다. 같은 문장이 다른 전문가 후기에도 있습니다.",
  "상담 내용과 전혀 다른 이야기가 적혀 있습니다. 녹음 파일이 있습니다.",
  "환불까지 마친 건인데 후기만 남아 있습니다. 처리 부탁드립니다.",
];

const REPORT_POST_BODIES = [
  "이 글은 자기 사무실 광고 같습니다. 정보는 없고 연락처만 있습니다.",
  "같은 내용을 여러 번 올리고 있습니다. 도배로 보입니다.",
  "글에 특정 상품을 사라는 내용이 들어 있습니다. 규정 위반 아닌가요.",
  "다른 사이트에 있는 글을 그대로 복사한 것 같습니다.",
  "내용이 사실과 달라서 오해를 만들 것 같습니다. 확인 부탁드립니다.",
];

const REPORT_BOOKING_BODIES = [
  "상담 시간에 전문가가 20분 늦게 입장했습니다. 그만큼 더 해주지도 않았습니다.",
  "예약한 분야와 전혀 다른 이야기만 하다 끝났습니다. 환불을 요청합니다.",
  "상담 링크가 열리지 않아 결국 진행하지 못했습니다.",
  "전문가가 나타나지 않았는데 상담 완료로 처리되어 있습니다.",
  "약속한 자료를 보내 주기로 했는데 일주일째 오지 않습니다.",
  "상담 중에 다른 업체를 계속 소개했습니다. 이런 것도 허용되나요.",
  "예약 시간을 임의로 바꿔 달라는 연락을 세 번 받았습니다.",
];

const REPORT_INQUIRY_BODIES = [
  "결제는 됐는데 알림톡을 못 받았습니다. 예약이 된 게 맞나요.",
  "현금영수증을 발급받고 싶은데 어디서 신청하는지 모르겠습니다.",
  "예약을 변경하려는데 버튼이 보이지 않습니다.",
  "탈퇴하면 지난 상담 기록도 같이 사라지나요.",
];

/* ---------- 이력 후기 문장 ---------- */
// 최근 90일치 예약만으로는 후기가 100개도 안 나와 전문가 대부분의 평점이 감춰진다.
// 그 전에도 상담이 있었다고 보고 예약에 연결되지 않은 이력 후기를 따로 만든다.
// 같은 문장이 여러 전문가에게 반복되지 않도록 분야별로 다르게 썼다.

const HISTORY_BY_FIELD: Record<Field, string[]> = {
  법률: [
    "계약서 초안을 통째로 들고 갔는데 위험한 조항 세 개를 표시해 주셨습니다. 그대로 수정 요청해서 반영됐어요.",
    "소송까지 갈 일이 아니라고 먼저 말씀해 주셨습니다. 결국 내용증명 한 장으로 끝났습니다.",
    "회사에서 하는 말이 맞는지 확인하려고 갔는데, 어디까지가 회사 재량이고 어디부터 위법인지 선을 알려 주셨습니다.",
    "상대방이 보낸 서면을 같이 읽으면서 무슨 의도로 쓴 문장인지 설명해 주셨어요. 혼자 봤으면 못 봤을 겁니다.",
    "가족끼리 이야기가 안 풀렸는데, 법이 정한 기준을 들으니 다들 납득하더라고요.",
    "준비할 서류를 순서대로 적어 주셔서 관공서를 한 번만 다녀왔습니다.",
    "질문이 두서없었는데 정리해서 되물어 주시니 제가 진짜 걱정하던 게 뭔지 알겠더군요.",
  ],
  세무: [
    "경비로 넣을 수 있는 항목과 안 되는 항목을 표로 정리해 주셨습니다. 올해 신고는 훨씬 수월했어요.",
    "법인 전환을 미루라고 하셨는데 이유가 명확해서 납득했습니다. 3년 뒤에 다시 뵙겠습니다.",
    "양도세를 미리 계산해 주셔서 파는 시점을 반년 늦췄습니다. 차이가 컸어요.",
    "홈택스 화면을 같이 보면서 어디를 누르는지 알려 주셔서 다음부터는 혼자 합니다.",
    "5년치 경정청구가 된다는 걸 처음 알았습니다. 실제로 환급받았어요.",
    "숫자를 대충 말했는데도 어디가 이상한지 바로 짚어 내셨습니다.",
    "부가세 신고 직전에 급하게 갔는데 자료 정리 순서부터 잡아 주셨습니다.",
  ],
  부동산: [
    "등기부를 같이 보면서 근저당이 얼마나 위험한 수준인지 계산해 주셨습니다. 그 집은 결국 안 들어갔어요.",
    "특약에 넣을 문구를 문장 그대로 적어 주셔서 부동산에 바로 요구했습니다.",
    "예산으로 가능한 지역을 현실적으로 좁혀 주셨습니다. 막연하던 게 세 군데로 정리됐어요.",
    "견적서 항목을 하나씩 풀어 주셔서 어느 업체가 뭘 빼놨는지 보였습니다.",
    "경매 물건을 보고 계산해 보니 생각보다 안 싸더라고요. 덕분에 안 들어갔습니다.",
    "진입로 문제를 짚어 주셨습니다. 이걸 몰랐으면 못 쓰는 땅을 살 뻔했어요.",
    "세입자 문제로 감정만 상하고 있었는데 대응 절차를 정해 주시니 마음이 편해졌습니다.",
  ],
  진로: [
    "이력서에서 뭘 지울지가 제일 어려웠는데 과감하게 잘라 주셨습니다. 그 뒤로 서류가 붙었어요.",
    "지금 회사에 남는 게 낫다고 하셨습니다. 듣고 싶던 답은 아니었지만 맞는 말이었습니다.",
    "공백기를 어떻게 말할지 두 문장으로 정리해 주셨습니다. 면접에서 그대로 썼어요.",
    "연봉 협상 자리에서 쓸 문장을 미리 연습했더니 실제로 올려 받았습니다.",
    "제가 무슨 일을 하고 싶은지 모르겠다고 했는데, 지금까지 한 일 중에 뭐가 견딜 만했는지부터 물어봐 주셨습니다.",
    "아이와 저의 의견이 갈렸는데 중간에서 정리해 주셔서 집안 분위기가 나아졌습니다.",
    "부트캠프를 등록하기 전에 상담받길 잘했습니다. 목표 직무가 완전히 바뀌었어요.",
  ],
  건강: [
    "검진 결과지를 몇 년치 나란히 놓고 봐 주셨습니다. 한 번 높은 것과 계속 오르는 것이 다르다는 걸 알았어요.",
    "수술을 서두르지 않아도 된다고 하셔서 6개월 지켜보기로 했습니다. 지금은 많이 나아졌습니다.",
    "아이 열이 날 때 어떤 신호를 봐야 하는지 목록으로 받았습니다. 밤에 덜 불안해요.",
    "약을 먹을 단계인지 아닌지를 명확히 말씀해 주셔서 미루던 걸 결정했습니다.",
    "식단을 다 바꾸라고 하지 않고 지금 먹는 것에서 두 가지만 고치라고 하셨습니다. 그래서 지켜졌어요.",
    "자세 영상을 보내니 어디가 문제인지 바로 짚어 주셨습니다. 집에서 할 동작만 주셔서 부담이 없었습니다.",
    "잠 문제로 몇 년을 고생했는데 침대에 누워 있는 시간을 줄이라는 조언이 제일 효과가 컸습니다.",
  ],
  재테크: [
    "통장에 쌓아 두기만 하던 돈을 어디에 어떤 순서로 넣을지 정리해 주셨습니다.",
    "보험 다섯 개 중 두 개가 겹친다는 걸 알았습니다. 정리하니 월 12만원이 줄었어요.",
    "대출을 갈아타는 게 손해라고 계산해 주셨습니다. 중도상환수수료까지 넣어 보니 그렇더군요.",
    "상품을 팔지 않으셔서 오히려 믿음이 갔습니다. 필요 없는 건 필요 없다고 하셨어요.",
    "퇴직금을 언제 어떻게 꺼내야 세금이 적은지 표로 받았습니다.",
    "연체가 시작돼서 급했는데 지금 상황에 맞는 절차부터 정리해 주셨습니다.",
    "첫 월급을 어떻게 나눠야 할지 몰랐는데 비율까지 정해 주셔서 그대로 하고 있습니다.",
  ],
  IT: [
    "느린 화면 로그를 보시더니 쿼리 하나를 지목하셨습니다. 고치니 응답이 3초에서 0.4초가 됐어요.",
    "기능 목록에서 절반을 빼자고 하셨습니다. 덕분에 출시가 두 달 앞당겨졌습니다.",
    "관리자 페이지가 그냥 열려 있던 걸 알려 주셨습니다. 그날 바로 막았어요.",
    "대시보드를 늘리는 대신 볼 지표를 세 개로 줄여 주셨습니다. 회의가 짧아졌습니다.",
    "심사 반려 메시지를 보시고 진짜 원인을 짚어 주셨습니다. 다음 제출에서 통과했어요.",
    "자동화가 가능한 부분과 사람이 봐야 하는 부분을 선 그어 주셔서 헛돈을 안 썼습니다.",
    "모델을 붙일 일이 아니라고 하셨습니다. 규칙 몇 줄로 끝났어요.",
  ],
};

// 분야를 안 타는 칭찬 문장. 인기 전문가는 후기가 20개를 넘어가서
// 분야별 7문장만으로는 한 사람 안에서 같은 문장이 반복된다.
const HISTORY_GENERAL = [
  "무엇을 물어야 할지도 모르고 갔는데 질문부터 같이 정리해 주셨습니다.",
  "제 사정을 다 듣고 나서 답을 주셔서 일반론이 아니라 제 이야기였습니다.",
  "안 해도 된다고 말리는 상담은 처음이었습니다. 그래서 더 믿음이 갔어요.",
  "한 시간이 이렇게 밀도 있을 수 있구나 싶었습니다.",
  "메모할 틈도 없이 답이 나와서 녹음해도 되냐고 여쭀는데 흔쾌히 허락해 주셨습니다.",
  "상담 다음 날 정리 메모를 보내 주셨습니다. 그게 제일 도움이 됐어요.",
  "어려운 용어를 하나도 안 쓰고 설명해 주셨습니다.",
  "제가 이해했는지 중간중간 확인해 주셔서 끝까지 따라갈 수 있었습니다.",
  "비용이 더 드는 방법과 덜 드는 방법을 같이 알려 주시고 고르게 해 주셨습니다.",
  "예약 시간보다 조금 넘겼는데도 끝까지 봐 주셨습니다.",
  "인터넷에서 본 정보 중에 뭐가 틀린 건지 짚어 주셔서 헷갈리던 게 풀렸습니다.",
  "결론을 먼저 말씀해 주시고 이유를 붙여 주셔서 정리가 잘 됐습니다.",
  "제가 걱정하던 최악의 경우가 실제로는 일어나기 어렵다는 걸 알았습니다.",
  "다음에 무엇을 언제까지 해야 하는지 날짜까지 정해 주셨습니다.",
  "혼자 알아보느라 두 달을 썼는데 한 시간에 정리됐습니다.",
  "제 상황에서는 굳이 돈 쓸 필요 없다고 하셨습니다. 그 말 한마디가 제일 값졌어요.",
  "말투가 편해서 부끄러운 것까지 다 말할 수 있었습니다.",
  "질문을 열 개 적어 갔는데 예상보다 빨리 끝나서 남은 시간에 다른 것도 물었습니다.",
  "제가 놓친 부분을 지적하실 때도 몰아세우지 않으셔서 좋았습니다.",
  "자료를 미리 보냈더니 이미 다 읽고 계셨습니다. 그래서 본론부터 시작했어요.",
  "두 번째 상담인데 지난번 이야기를 기억하고 계셨습니다.",
  "숫자로 비교해 주시니까 고민하던 게 바로 결론이 났습니다.",
  "제 판단이 맞았다는 확인만 받으러 갔는데 생각 못 한 위험 하나를 더 알려 주셨습니다.",
  "가족에게 설명할 말까지 정리해 주셔서 집에 가서 그대로 전했습니다.",
];

const HISTORY_MID = [
  "필요한 답은 들었는데 한 시간이 짧게 느껴졌습니다. 다음에는 두 번에 나눠 받으려고요.",
  "설명은 좋았지만 제가 기대한 만큼 구체적이지는 않았습니다.",
  "절반은 이미 알고 있던 내용이었고 나머지 절반이 도움이 됐습니다.",
  "중간에 연결이 몇 번 끊겨서 흐름이 끊겼습니다. 내용 자체는 괜찮았어요.",
  "제 상황이 특이해서 그런지 확실한 답보다 가능성 위주로 들었습니다.",
  "친절하셨는데 결론을 좀 더 분명히 말씀해 주셨으면 했습니다.",
  "자료를 미리 보냈는데 상담 시작하고 나서 보시는 것 같았습니다.",
  "무난했습니다. 큰 기대 없이 갔고 딱 그만큼 얻었습니다.",
  "말씀은 빠르셨지만 요약을 잘 해 주셔서 따라갈 수는 있었습니다.",
  "다음에 뭘 해야 하는지는 알겠는데 어떻게 하는지는 더 알아봐야 할 것 같습니다.",
  "제가 질문을 정리해 가지 않아서 시간을 많이 썼습니다. 그건 제 잘못입니다.",
  "일반적인 이야기가 앞에 길었고 제 얘기는 뒤에 조금이었습니다.",
];

const HISTORY_LOW = [
  "제가 물어본 것과 다른 답이 계속 돌아왔습니다.",
  "결국 따로 의뢰하라는 이야기로 끝났습니다. 상담이라기에는 아쉬웠습니다.",
  "시작 시간이 15분 밀렸는데 그만큼 늘려 주지는 않으셨습니다.",
  "검색하면 나오는 수준의 답이었습니다.",
  "중간에 다른 전화를 받으셨습니다. 집중이 안 되더군요.",
  "제 자료를 제대로 안 보고 오신 것 같았습니다.",
  "약속한 정리 자료가 끝내 오지 않았습니다.",
  "말이 계속 겉돌아서 뭘 하라는 건지 모르고 끝났습니다.",
  "질문을 세 개 준비했는데 하나도 제대로 못 물었습니다.",
  "다시 예약할 생각은 없습니다.",
];

const HISTORY_REPLIES = [
  "그때 말씀드린 대로 잘 진행되셨다니 다행입니다. 또 필요하시면 언제든 오세요.",
  "후기 감사합니다. 말씀하신 부분은 다음 상담부터 시간을 더 두겠습니다.",
  "기대에 못 미쳐 죄송합니다. 지적해 주신 점은 실제로 고쳤습니다.",
  "도움이 되셨다니 기쁩니다. 이후 상황이 바뀌면 그때 다시 보겠습니다.",
  "자료 전달이 늦었던 점 사과드립니다. 이후로는 상담 당일에 보내고 있습니다.",
  "짧은 시간에 다 담기 어려운 주제였습니다. 다음에는 범위를 좁혀서 보시죠.",
];

const NOTIF_KINDS: [string, string, NotifChannel][] = [
  ["예약이 확정됐습니다", "상담 하루 전에 다시 안내드립니다. 링크는 예약 상세에 있습니다.", "알림톡"],
  ["결제가 완료됐습니다", "영수증은 마이페이지에서 확인하실 수 있습니다.", "이메일"],
  ["내일 상담이 있습니다", "시작 10분 전에 링크로 들어와 주세요.", "문자"],
  ["예약이 취소됐습니다", "환불은 결제 수단에 따라 3~5영업일이 걸립니다.", "알림톡"],
  ["환불이 처리됐습니다", "취소 수수료를 뺀 금액이 입금됩니다.", "이메일"],
  ["후기가 등록됐습니다", "남겨 주신 후기는 전문가에게 바로 전달됩니다.", "앱"],
  ["새 후기가 달렸습니다", "답글을 남기면 다음 상담 예약에 도움이 됩니다.", "앱"],
  ["정산이 지급됐습니다", "이번 회차 정산 내역은 정산 화면에서 볼 수 있습니다.", "이메일"],
  ["정산 예정 안내", "이번 주 금요일에 지급될 예정입니다.", "알림톡"],
  ["프로필 승인이 완료됐습니다", "이제 예약을 받을 수 있습니다. 시간표를 열어 주세요.", "이메일"],
  ["열린 시간이 모두 찼습니다", "다음 주 시간표를 추가로 열어 주세요.", "앱"],
  ["상담 시작 1시간 전입니다", "미리 전달받은 질문을 확인해 주세요.", "문자"],
];

/* ---------- 본체 ---------- */

export function buildScenario(): ScenarioData {
  // 여러 번 불러도 같은 결과가 나오도록 난수 씨앗을 되돌린다
  s = 20260830;

  /* ----- 전문가 ----- */
  // 승인 대기 6명과 정지 3명을 일부러 남긴다. 운영자 화면의 처리 대기 목록이 비면 안 된다.
  const PENDING = new Set([103, 107, 111, 114, 117, 119]);
  const SUSPENDED = new Set([37, 63, 88]);
  // 계정을 가진 전문가 12명. 승인 상태인 인덱스만 골랐다.
  const WITH_ACCOUNT = [0, 1, 3, 5, 7, 10, 13, 16, 19, 22, 25, 30];
  const BANKS = ["국민은행", "신한은행", "우리은행", "하나은행", "카카오뱅크", "농협은행"];

  const experts: Expert[] = SEED_EXPERTS.map((e, i) => {
    const status: Expert["status"] = PENDING.has(i)
      ? "pending"
      : SUSPENDED.has(i)
        ? "suspended"
        : "approved";
    const accountAt = WITH_ACCOUNT.indexOf(i);
    const payout =
      accountAt >= 0
        ? {
            bank: BANKS[accountAt % BANKS.length],
            account: `${100 + accountAt}-${String(202600 + accountAt * 37).slice(0, 6)}-${String(10 + accountAt)}`,
            holder: e.name,
            // 앞 5명은 개인이라 3.3% 원천징수 대상이다
            business: accountAt < 5 ? null : `${120 + accountAt}-${81}-${String(10000 + accountAt * 731).slice(0, 5)}`,
          }
        : null;
    return {
      id: `exp_${e.slug}`,
      userId: null,
      slug: e.slug,
      name: e.name,
      job: e.job,
      field: e.field as Field,
      headline: e.headline,
      bio: e.bio,
      pricePerHour: e.pricePerHour,
      status,
      ratingCount: 0,
      ratingSum: 0,
      payout,
      createdAt: PENDING.has(i) ? daysAgo(1 + (i % 9)) : daysAgo(30 + ((i * 3) % 190)),
    };
  });

  const byExpertId = new Map(experts.map((e) => [e.id, e]));
  const approved = experts.filter((e) => e.status === "approved");

  /* ----- 회원 ----- */
  const users: User[] = USER_NAMES.map(([name, latin], i) => ({
    id: `usr_${i + 1}`,
    email: `${latin}${i + 1}@example.com`,
    password: "conect1234",
    name,
    phone: `010-${String(3000 + i * 7).padStart(4, "0")}-${String(1000 + i * 13).padStart(4, "0")}`,
    role: "user" as const,
    expertId: null as string | null,
    marketing: i % 3 !== 0,
    createdAt: daysAgo(2 + ((i * 11) % 178)),
    deletedAt: null as string | null,
  }));

  // 앞 12명은 전문가 계정이다. 양쪽 참조를 맞춘다.
  WITH_ACCOUNT.forEach((expertIdx, k) => {
    const ex = experts[expertIdx];
    const u = users[k];
    u.expertId = ex.id;
    u.name = ex.name;
    u.email = `${ex.slug.replace(/-/g, "")}@conect.kr`;
    ex.userId = u.id;
  });

  // 탈퇴 회원 3명. 이름과 연락처를 가린다.
  [67, 68, 69].forEach((idx, k) => {
    const u = users[idx];
    u.name = u.name[0] + "OO";
    u.email = `deleted_${k + 1}@conect.kr`;
    u.phone = "";
    u.deletedAt = daysAgo(5 + k * 12);
    u.marketing = false;
  });

  const activeUsers = users.filter((u) => !u.deletedAt);

  /* ----- 시간표 ----- */
  // 브라우저 저장소에 들어가는 값이라 크기를 조인다.
  // 승인된 전문가만, 오늘부터 14일, 평일 중 3일, 하루 3~4개.
  const HOUR_SETS = [
    [10, 11, 14],
    [13, 15, 17],
    [9, 10, 16],
    [11, 14, 19],
    [10, 15, 20],
    [14, 16, 18],
    [10, 11, 13, 14],
    [15, 16, 17, 18],
  ];
  const WEEKDAY_SETS = [
    [1, 3, 5],
    [2, 4],
    [1, 2, 4],
    [3, 4, 5],
    [2, 3, 5],
    [1, 4],
  ];

  const base = new Date(NOW);
  base.setHours(0, 0, 0, 0);

  const availability: Availability[] = [];
  approved.forEach((e, k) => {
    const hours = HOUR_SETS[k % HOUR_SETS.length];
    const wdays = WEEKDAY_SETS[k % WEEKDAY_SETS.length];
    for (let d = 0; d < 14; d++) {
      const day = new Date(base);
      day.setDate(base.getDate() + d);
      if (!wdays.includes(day.getDay())) continue;
      for (const h of hours) {
        const t = new Date(day);
        t.setHours(h, 0, 0, 0);
        availability.push({
          id: `av_${e.id}_${t.getTime()}`,
          expertId: e.id,
          startsAt: t.toISOString(),
          state: "open",
        });
      }
    }
  });

  /* ----- 예약 ----- */
  const bookings: Booking[] = [];
  const taken = new Set<string>();

  // 예약을 120명에게 고르게 뿌리면 아무도 후기 3개를 못 채워 평점이 전부 감춰진다.
  // 실제 시장처럼 소수에게 몰리게 해서, 예약이 쌓인 전문가는 평점이 보이고
  // 나머지 신규 전문가는 후기 0~2개로 남게 한다.
  const popular = approved.filter((_, k) => k % 3 === 1).slice(0, 32);
  const expertPool: Expert[] = [...approved];
  popular.forEach((e) => {
    for (let k = 0; k < 40; k++) expertPool.push(e);
  });
  let codeSeq = 0;
  let noteSeq = 0;

  const METHODS: PaymentMethod[] = ["card", "kakaopay", "naverpay"];
  const LETTERS = "abcdefghijkmnopqrstuvwxyz";
  const meetUrl = () => {
    let out = "";
    for (let i = 0; i < 11; i++) {
      out += i === 3 || i === 8 ? "-" : LETTERS[int(0, LETTERS.length - 1)];
    }
    return `https://meet.google.com/${out}`;
  };

  const codeOf = (startsAt: number) => {
    const d = new Date(startsAt);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    codeSeq += 1;
    return `C${yy}${mm}${dd}${String(1000 + codeSeq)}`;
  };

  function addBooking(expert: Expert, startsMs: number, status: BookingStatus) {
    const key = `${expert.id}|${startsMs}`;
    if (taken.has(key)) return null;
    taken.add(key);
    const user = pick(activeUsers);
    const notes = NOTES[expert.field];
    noteSeq += 1;
    const note = chance(0.6) ? notes[noteSeq % notes.length] : "";
    const b: Booking = {
      id: `bk_${bookings.length + 1}`,
      code: codeOf(startsMs),
      expertId: expert.id,
      expertSlug: expert.slug,
      expertName: expert.name,
      expertJob: expert.job,
      userId: user.id,
      startsAt: iso(startsMs),
      guestName: user.name,
      guestPhone: user.phone,
      guestEmail: user.email,
      note,
      amount: expert.pricePerHour,
      method: pick(METHODS),
      status,
      meetUrl: meetUrl(),
      reviewId: null,
      createdAt: iso(startsMs - int(2, 12) * DAY),
    };
    bookings.push(b);
    return b;
  }

  // 과거 170건. 취소 18, 노쇼 7, 나머지는 완료.
  const pastPlan: BookingStatus[] = [];
  for (let i = 0; i < 170; i++) pastPlan.push("completed");
  for (let k = 0; k < 18; k++) pastPlan[Math.floor((k * 170) / 18)] = "canceled";
  for (let k = 0; k < 7; k++) pastPlan[Math.floor((k * 170) / 7) + 3] = "no_show";

  let guard = 0;
  for (let i = 0; i < pastPlan.length && guard < 3000; ) {
    guard += 1;
    const expert = pick(expertPool);
    const offset = -int(1, 89);
    const hour = pick([9, 10, 11, 13, 14, 15, 16, 17, 18, 19]);
    const startsMs = dayAt(offset, hour);
    if (startsMs > NOW) continue;
    const made = addBooking(expert, startsMs, pastPlan[i]);
    if (made) i += 1;
  }

  // 미래 50건. 35건은 열린 시간을 실제로 잡아 booked로 바꾸고,
  // 15건은 14일 이후라 시간표가 없는 구간에 둔다.
  const futureSlots = availability
    .filter((a) => new Date(a.startsAt).getTime() > NOW + HOUR)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  let slotTaken = 0;
  for (let i = 0; i < futureSlots.length && slotTaken < 35; i++) {
    // 앞쪽(오늘·내일)은 촘촘히, 뒤로 갈수록 띄엄띄엄 잡는다.
    const dense = slotTaken < 8;
    if (!dense && !chance(0.06)) continue;
    const slot = futureSlots[i];
    const expert = byExpertId.get(slot.expertId);
    if (!expert) continue;
    const made = addBooking(expert, new Date(slot.startsAt).getTime(), "confirmed");
    if (made) {
      slot.state = "booked";
      slotTaken += 1;
    }
  }

  let far = 0;
  guard = 0;
  while (far < 15 && guard < 500) {
    guard += 1;
    const expert = pick(expertPool);
    const startsMs = dayAt(int(15, 29), pick([10, 11, 14, 15, 16, 17]));
    if (addBooking(expert, startsMs, "confirmed")) far += 1;
  }

  /* ----- 후기 ----- */
  const reviews: Review[] = [];
  const userById = new Map(users.map((u) => [u.id, u]));

  const completed = bookings.filter((b) => b.status === "completed");
  completed.forEach((b) => {
    if (!chance(0.65)) return;
    const r = rnd();
    const rating = r < 0.55 ? 5 : r < 0.8 ? 4 : r < 0.9 ? 3 : r < 0.96 ? 2 : 1;
    const bodyPool = rating >= 5 ? REVIEW_HIGH : rating >= 3 ? REVIEW_MID : REVIEW_LOW;
    const u = userById.get(b.userId)!;
    const rv: Review = {
      id: `rev_${reviews.length + 1}`,
      bookingId: b.id,
      expertId: b.expertId,
      userId: b.userId,
      userName: maskName(u.name),
      rating,
      body: rating === 4 ? pick(REVIEW_HIGH) : pick(bodyPool),
      reply: chance(0.2) ? pick(REVIEW_REPLIES) : null,
      reportedAt: null,
      createdAt: iso(new Date(b.startsAt).getTime() + int(1, 6) * DAY),
    };
    reviews.push(rv);
    b.reviewId = rv.id;
  });

  // 신고당한 후기 6건. 내용도 신고당할 만한 것으로 바꾼다.
  const reportable = reviews.filter((r) => r.rating <= 2);
  const reportedReviews: Review[] = [];
  for (let i = 0; i < 6; i++) {
    const target = reportable[i] ?? reviews[i * 7];
    if (!target || reportedReviews.includes(target)) continue;
    target.body = REVIEW_REPORTED[i % REVIEW_REPORTED.length];
    target.rating = Math.min(target.rating, 2);
    target.reportedAt = iso(new Date(target.createdAt).getTime() + int(1, 4) * DAY);
    reportedReviews.push(target);
  }

  /* ----- 이력 후기 ----- */
  // 예약은 최근 90일치만 있어 후기가 100개도 안 나온다. 그대로 두면 전문가 대부분이
  // 후기 3개 미만이라 평점이 전부 감춰진다. 90일 이전에도 상담이 있었다고 보고
  // 예약에 연결되지 않은 후기를 채운다. bookingId와 userId는 빈 값이다.
  const bookedCount = new Map<string, number>();
  reviews.forEach((r) => bookedCount.set(r.expertId, (bookedCount.get(r.expertId) ?? 0) + 1));

  const popularIds = new Set(popular.map((e) => e.id));
  const others = approved.filter((e) => !popularIds.has(e.id));
  // 신규 전문가 25명은 후기 0~2개로 남긴다. 평점이 감춰지는 경우도 화면에 보여야 한다.
  const newcomerIds = new Set(
    others
      .filter((e) => (bookedCount.get(e.id) ?? 0) <= 1)
      .filter((_, k) => k % 2 === 0)
      .slice(0, 25)
      .map((e) => e.id),
  );

  const maskedNames = USER_NAMES.map(([n]) => maskName(n));

  approved.forEach((e, k) => {
    const have = bookedCount.get(e.id) ?? 0;
    const target = newcomerIds.has(e.id)
      ? int(0, 2)
      : popularIds.has(e.id)
        ? int(15, 30)
        : int(4, 10);
    const add = Math.max(0, target - have);
    // 분야 문장이 앞에 오도록 붙인다. 인기 전문가는 후기가 20개를 넘어
    // 분야 문장 7개만으로는 한 사람 안에서 문장이 반복된다.
    const highPool = [...HISTORY_BY_FIELD[e.field], ...HISTORY_GENERAL];
    let hi = 0;
    let mi = 0;
    let lo = 0;

    for (let i = 0; i < add; i++) {
      const r = rnd();
      const rating = r < 0.58 ? 5 : r < 0.82 ? 4 : r < 0.92 ? 3 : r < 0.97 ? 2 : 1;
      // 걸음 폭을 풀 길이와 서로소로 잡아 한 전문가 안에서 같은 문장이 안 나오게 한다
      const body =
        rating >= 4
          ? highPool[(k + hi++ * 3) % highPool.length]
          : rating === 3
            ? HISTORY_MID[(k * 2 + mi++ * 5) % HISTORY_MID.length]
            : HISTORY_LOW[(k + lo++ * 3) % HISTORY_LOW.length];
      reviews.push({
        id: `rev_h_${reviews.length + 1}`,
        bookingId: "",
        expertId: e.id,
        userId: "",
        userName: maskedNames[(k * 7 + i * 5) % maskedNames.length],
        rating,
        body,
        reply: chance(0.14) ? pick(HISTORY_REPLIES) : null,
        reportedAt: null,
        createdAt: daysAgo(int(91, 400)),
      });
    }
  });

  // 전문가 평점은 실제 후기 합과 정확히 맞춘다. 예약 기반 후기와 이력 후기를 함께 센다.
  reviews.forEach((r) => {
    const e = byExpertId.get(r.expertId);
    if (!e) return;
    e.ratingCount += 1;
    e.ratingSum += r.rating;
  });

  /* ----- 결제 · 환불 · 정산 ----- */
  const payments: Payment[] = [];
  const refunds: Refund[] = [];
  const settlements: Settlement[] = [];
  const FEE = 0.2;

  // 지급 대기(ready)로 남길 완료 건을 미리 고른다. 운영자 화면에 처리할 일이 보여야 한다.
  const oldCompleted = bookings.filter(
    (b) => b.status === "completed" && new Date(b.startsAt).getTime() < NOW - 7 * DAY,
  );
  const readySet = new Set<string>();
  for (let k = 0; k < 25 && oldCompleted.length > 0; k++) {
    const idx = Math.floor((k * oldCompleted.length) / 25);
    readySet.add(oldCompleted[idx].id);
  }

  bookings.forEach((b, i) => {
    const startsMs = new Date(b.startsAt).getTime();
    const paidAt = b.createdAt;

    let feeRate = 0;
    if (b.status === "canceled") feeRate = pick([0, 0.3, 0.5]);

    const payStatus: Payment["status"] =
      b.status === "canceled"
        ? feeRate === 0
          ? "canceled"
          : "partial_canceled"
        : b.status === "no_show"
          ? "canceled" // 노쇼는 전액 환불이라 결제도 취소로 남긴다
          : "paid";

    payments.push({
      id: `pay_${b.id}`,
      bookingId: b.id,
      amount: b.amount,
      method: b.method,
      status: payStatus,
      cardLast4: String(1000 + ((i * 373) % 9000)),
      paidAt,
    });

    if (b.status === "canceled" || b.status === "no_show") {
      const rate = b.status === "no_show" ? 0 : feeRate;
      refunds.push({
        id: `rfd_${b.id}`,
        bookingId: b.id,
        paymentId: `pay_${b.id}`,
        feeRate: rate,
        amount: Math.round(b.amount * (1 - rate)),
        reason:
          b.status === "no_show"
            ? "상담 시간에 나타나지 않음"
            : pick(REFUND_REASONS),
        refundedAt: iso(Math.min(NOW - HOUR, startsMs + int(1, 3) * DAY)),
      });
    }

    // 정산
    let gross = b.amount;
    let status: Settlement["status"] = "pending";
    let paidOn: string | null = null;

    if (b.status === "completed") {
      if (startsMs < NOW - 7 * DAY) {
        if (readySet.has(b.id)) {
          status = "ready";
        } else {
          status = "paid";
          paidOn = iso(Math.min(NOW - HOUR, startsMs + 8 * DAY));
        }
      } else {
        status = "pending";
      }
    } else if (b.status === "confirmed") {
      status = "pending";
    } else if (b.status === "no_show") {
      gross = 0;
      status = "paid";
      paidOn = iso(Math.min(NOW - HOUR, startsMs + 5 * DAY));
    } else {
      // 취소 건은 취소 수수료만 남는다
      gross = Math.round(b.amount * feeRate);
      if (chance(0.7)) {
        status = "paid";
        paidOn = iso(Math.min(NOW - HOUR, startsMs + 6 * DAY));
      } else {
        status = "ready";
      }
    }

    const fee = Math.round(gross * FEE);
    settlements.push({
      id: `stl_${b.id}`,
      expertId: b.expertId,
      bookingId: b.id,
      gross,
      fee,
      net: gross - fee,
      status,
      paidAt: paidOn,
    });
  });

  /* ----- 커뮤니티 ----- */
  const bySlug = new Map(experts.map((e) => [e.slug, e]));
  const posts: Post[] = POST_SEEDS.map(([slug, body], i) => {
    const found = bySlug.get(slug);
    const author = found && found.status === "approved" ? found : approved[(i * 7) % approved.length];
    return {
      id: `post_${i + 1}`,
      expertId: author.id,
      body,
      likes: int(0, 60),
      createdAt: daysAgo(1 + i * 2 + (i % 3)),
    };
  });

  const comments: Comment[] = [];
  for (let i = 0; i < 80; i++) {
    const post = posts[i % posts.length];
    const u = pick(activeUsers);
    comments.push({
      id: `cmt_${i + 1}`,
      postId: post.id,
      userId: u.id,
      userName: maskName(u.name),
      body: COMMENT_BODIES[(i * 3 + Math.floor(i / COMMENT_BODIES.length)) % COMMENT_BODIES.length],
      createdAt: iso(new Date(post.createdAt).getTime() + int(1, 40) * HOUR),
    });
  }

  /* ----- 알림 ----- */
  // 전문가 계정을 가진 회원과 예약이 있는 회원에게 보낸다.
  const notifTargets: string[] = [];
  WITH_ACCOUNT.forEach((_, k) => notifTargets.push(users[k].id));
  bookings.slice(0, 40).forEach((b) => {
    if (!notifTargets.includes(b.userId)) notifTargets.push(b.userId);
  });

  const notifications: Notification[] = [];
  for (let i = 0; i < 60; i++) {
    const [title, body, channel] = NOTIF_KINDS[i % NOTIF_KINDS.length];
    const createdMs = NOW - int(1, 60 * 24) * HOUR;
    notifications.push({
      id: `ntf_${i + 1}`,
      userId: notifTargets[i % notifTargets.length],
      title,
      body,
      href: i % 4 === 3 ? null : "/conect3/my",
      channel: i % 5 === 0 ? "앱" : channel,
      readAt: i % 2 === 0 ? null : iso(createdMs + int(1, 20) * HOUR),
      createdAt: iso(createdMs),
    });
  }

  /* ----- 신고 · 문의 ----- */
  // 14건은 열어 둔다. 운영자 화면에서 처리 대기가 보여야 한다.
  const reports: Report[] = [];
  const pushReport = (
    kind: Report["kind"],
    targetId: string,
    body: string,
    status: Report["status"],
    ageDays: number,
  ) => {
    const u = pick(activeUsers);
    reports.push({
      id: `rpt_${reports.length + 1}`,
      kind,
      targetId,
      userId: u.id,
      userName: maskName(u.name),
      body,
      status,
      createdAt: daysAgo(ageDays),
    });
  };

  reportedReviews.forEach((r, i) => {
    pushReport("review", r.id, REPORT_REVIEW_BODIES[i % REPORT_REVIEW_BODIES.length], i < 4 ? "open" : "resolved", 1 + i * 3);
  });
  REPORT_POST_BODIES.forEach((body, i) => {
    pushReport("post", posts[(i * 5 + 2) % posts.length].id, body, i < 3 ? "open" : "resolved", 2 + i * 4);
  });
  REPORT_BOOKING_BODIES.forEach((body, i) => {
    const target = bookings[(i * 17 + 5) % bookings.length];
    pushReport("booking", target.id, body, i < 5 ? "open" : "resolved", 1 + i * 2);
  });
  REPORT_INQUIRY_BODIES.forEach((body, i) => {
    const target = bookings[(i * 29 + 11) % bookings.length];
    pushReport("inquiry", target.id, body, i < 2 ? "open" : "resolved", 1 + i * 5);
  });

  return {
    users,
    experts,
    availability,
    bookings,
    payments,
    refunds,
    settlements,
    reviews,
    posts,
    comments,
    notifications,
    reports,
  };
}

/* ---------- 화면 보드 미리보기용 고정 데이터 ---------- */
// 일반 씨앗(buildScenario)은 그대로 두고, 미리보기에서만 이 데이터를 덧붙인다.
// 화면 보드는 동적 주소(예약 상세, 전문가 상세 등)에 쓸 id 가 매번 같아야 하므로
// src/screens/samples.ts 의 SAMPLE 값과 같은 id 로 행을 만든다.

export function buildPreviewScenario(adminEmail: string): ScenarioData {
  const d = buildScenario();

  const userId = SAMPLE.userId;
  const expertUserId = SAMPLE.expertUserId;
  const expertId = SAMPLE.expertId;
  const created = daysAgo(60);

  const previewUsers: User[] = [
    {
      id: userId,
      email: "preview-user@conect.kr",
      password: "conect1234",
      name: "김미리",
      phone: "010-1111-2222",
      role: "user",
      expertId: null,
      marketing: true,
      createdAt: created,
      deletedAt: null,
    },
    {
      id: expertUserId,
      email: "preview-expert@conect.kr",
      password: "conect1234",
      name: "박전문",
      phone: "010-3333-4444",
      role: "user",
      expertId,
      marketing: false,
      createdAt: created,
      deletedAt: null,
    },
    {
      id: SAMPLE.adminUserId,
      email: adminEmail,
      password: "conect1234",
      name: "운영자",
      phone: "",
      role: "admin",
      expertId: null,
      marketing: false,
      createdAt: created,
      deletedAt: null,
    },
  ];

  const previewExperts: Expert[] = [
    {
      id: expertId,
      userId: expertUserId,
      slug: SAMPLE.expertSlug,
      name: "박전문",
      job: "세무사",
      field: "세무",
      headline: "프리랜서와 소상공인 세금 상담",
      bio: "10년간 개인사업자와 프리랜서의 종합소득세, 부가세 신고를 맡아 왔습니다.",
      pricePerHour: 80000,
      status: "approved",
      ratingCount: 0,
      ratingSum: 0,
      payout: { bank: "국민은행", account: "123-456-789012", holder: "박전문", business: null },
      createdAt: created,
    },
    {
      id: SAMPLE.newcomerExpertId,
      userId: null,
      slug: SAMPLE.newcomerSlug,
      name: "최신입",
      job: "변호사",
      field: "법률",
      headline: "임대차와 계약 분쟁 상담",
      bio: "올해 활동을 시작한 변호사입니다. 임대차 분쟁과 계약서 검토를 주로 맡습니다.",
      pricePerHour: 50000,
      status: "approved",
      ratingCount: 0,
      ratingSum: 0,
      payout: null,
      createdAt: daysAgo(3),
    },
  ];

  // 시간표: 두 전문가 모두 내일부터 14일, 매일 10·14·16시
  const previewAvailability: Availability[] = [];
  const base = new Date(NOW);
  base.setHours(0, 0, 0, 0);
  for (const eid of [expertId, SAMPLE.newcomerExpertId]) {
    for (let k = 1; k <= 14; k++) {
      for (const h of [10, 14, 16]) {
        const t = new Date(base);
        t.setDate(base.getDate() + k);
        t.setHours(h, 0, 0, 0);
        previewAvailability.push({
          id: `av_${eid}_${t.getTime()}`,
          expertId: eid,
          startsAt: t.toISOString(),
          state: "open",
        });
      }
    }
  }

  const code = (ms: number, n: number) => {
    const t = new Date(ms);
    const yy = String(t.getFullYear()).slice(2);
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    return `C${yy}${mm}${dd}${9000 + n}`;
  };

  const mk = (
    id: string,
    n: number,
    startsMs: number,
    status: BookingStatus,
    method: PaymentMethod,
    note: string,
    reviewId: string | null,
  ): Booking => ({
    id,
    code: code(startsMs, n),
    expertId,
    expertSlug: SAMPLE.expertSlug,
    expertName: "박전문",
    expertJob: "세무사",
    userId,
    startsAt: iso(startsMs),
    guestName: "김미리",
    guestPhone: "010-1111-2222",
    guestEmail: "preview-user@conect.kr",
    note,
    amount: 80000,
    method,
    status,
    meetUrl: `https://meet.google.com/prv-${String(n).padStart(4, "0")}-xyz`,
    reviewId,
    createdAt: iso(startsMs - 5 * DAY),
  });

  // 예약 4건(확정·완료·취소·노쇼) + 정산 지급 완료 표시용 완료 1건
  const previewBookings: Booking[] = [
    mk(SAMPLE.bookingConfirmed, 1, dayAt(2, 14), "confirmed", "card", "종합소득세 신고를 처음 해 봅니다. 자료 준비 방법이 궁금합니다.", null),
    mk(SAMPLE.bookingCompleted, 2, dayAt(-10, 11), "completed", "kakaopay", "부가세 환급이 가능한지 알고 싶습니다.", SAMPLE.reviewId),
    mk(SAMPLE.bookingCanceled, 3, dayAt(-3, 15), "canceled", "card", "", null),
    mk(SAMPLE.bookingNoShow, 4, dayAt(-6, 10), "no_show", "naverpay", "", null),
    mk("bk_preview_completed_paid", 5, dayAt(-25, 16), "completed", "card", "", "rev_preview_2"),
  ];

  // 시간표에 같은 시각이 있으면 예약됨으로 바꾼다
  const confirmedAt = new Date(previewBookings[0].startsAt).getTime();
  previewAvailability.forEach((a) => {
    if (a.expertId === expertId && new Date(a.startsAt).getTime() === confirmedAt) a.state = "booked";
  });

  const previewPayments: Payment[] = previewBookings.map((b) => ({
    id: `pay_${b.id}`,
    bookingId: b.id,
    amount: b.amount,
    method: b.method,
    status: b.status === "canceled" ? "partial_canceled" : b.status === "no_show" ? "canceled" : "paid",
    cardLast4: "4242",
    paidAt: b.createdAt,
  }));

  const previewRefunds: Refund[] = [
    {
      id: "rfd_bk_preview_canceled",
      bookingId: SAMPLE.bookingCanceled,
      paymentId: "pay_bk_preview_canceled",
      feeRate: 0.3,
      amount: Math.round(80000 * 0.7),
      reason: "일정이 바뀌어 취소합니다",
      refundedAt: daysAgo(3),
    },
    {
      id: "rfd_bk_preview_noshow",
      bookingId: SAMPLE.bookingNoShow,
      paymentId: "pay_bk_preview_noshow",
      feeRate: 0,
      amount: 80000,
      reason: "상담 시간에 나타나지 않음",
      refundedAt: daysAgo(5),
    },
  ];

  const stl = (b: Booking, gross: number, status: Settlement["status"], paidAt: string | null): Settlement => {
    const fee = Math.round(gross * 0.2);
    return {
      id: `stl_${b.id}`,
      expertId,
      bookingId: b.id,
      gross,
      fee,
      net: gross - fee,
      status,
      paidAt,
    };
  };

  const [bConfirmed, bCompleted, bCanceled, bNoShow, bPaid] = previewBookings;
  const previewSettlements: Settlement[] = [
    stl(bConfirmed, 80000, "pending", null),
    stl(bCompleted, 80000, "ready", null),
    stl(bCanceled, Math.round(80000 * 0.3), "ready", null),
    stl(bNoShow, 0, "paid", daysAgo(1)),
    stl(bPaid, 80000, "paid", daysAgo(16)),
  ];

  // 후기 6개. 예약에 묶인 2개와 이력 4개라 평점이 보이고, 신고된 후기 1개는 운영자 화면용이다.
  const rv = (
    id: string,
    bookingId: string,
    rating: number,
    body: string,
    reply: string | null,
    ageDays: number,
    reportedAt: string | null = null,
  ): Review => ({
    id,
    bookingId,
    expertId,
    userId: bookingId ? userId : "",
    userName: "김O리",
    rating,
    body,
    reply,
    reportedAt,
    createdAt: daysAgo(ageDays),
  });

  const previewReviews: Review[] = [
    rv(SAMPLE.reviewId, SAMPLE.bookingCompleted, 5, "자료를 어떻게 모아야 하는지 차근차근 알려 주셔서 신고가 훨씬 수월했습니다.", null, 8),
    rv("rev_preview_2", "bk_preview_completed_paid", 4, "질문마다 근거를 같이 설명해 주셔서 믿고 맡길 수 있었습니다.", "좋게 봐 주셔서 감사합니다.", 23),
    rv("rev_preview_h1", "", 5, "세금 구조를 쉽게 풀어 주셔서 이해가 잘 됐습니다.", null, 120),
    rv("rev_preview_h2", "", 5, "시간이 부족할 줄 알았는데 핵심만 정확히 짚어 주셨어요.", null, 150),
    rv("rev_preview_h3", "", 3, "내용은 좋았지만 시간이 조금 부족했습니다.", null, 200),
    rv("rev_preview_h4", "", 2, "기대한 답을 듣지 못했습니다. 설명이 너무 빨랐어요.", null, 90, daysAgo(88)),
  ];

  // 전문가 평점은 후기 합과 맞춘다 (일반 씨앗과 같은 규칙)
  previewExperts[0].ratingCount = previewReviews.length;
  previewExperts[0].ratingSum = previewReviews.reduce((sum, r) => sum + r.rating, 0);

  const previewPosts: Post[] = [
    {
      id: SAMPLE.postId,
      expertId,
      body: "프리랜서 5월 종합소득세 신고, 올해 달라진 점 세 가지를 정리했습니다. 경비 처리 기준이 특히 바뀌었으니 영수증을 미리 모아 두세요.",
      likes: 12,
      createdAt: daysAgo(2),
    },
  ];

  const previewComments: Comment[] = [
    {
      id: "cmt_preview_1",
      postId: SAMPLE.postId,
      userId,
      userName: "김O리",
      body: "경비 처리 기준 바뀐 부분 더 궁금합니다.",
      createdAt: iso(NOW - 30 * HOUR),
    },
    {
      id: "cmt_preview_2",
      postId: SAMPLE.postId,
      userId,
      userName: "김O리",
      body: "정리해 주셔서 감사합니다. 도움이 많이 됐어요.",
      createdAt: iso(NOW - 20 * HOUR),
    },
  ];

  const previewNotifications: Notification[] = [
    {
      id: "ntf_preview_1",
      userId,
      title: "예약이 확정됐습니다",
      body: "상담 하루 전에 다시 안내드립니다. 링크는 예약 상세에 있습니다.",
      href: `/conect3/my/reservations/${SAMPLE.bookingConfirmed}`,
      channel: "알림톡",
      readAt: null,
      createdAt: iso(NOW - 2 * HOUR),
    },
    {
      id: "ntf_preview_2",
      userId,
      title: "결제가 완료됐습니다",
      body: "영수증은 마이페이지에서 확인하실 수 있습니다.",
      href: "/conect3/my",
      channel: "이메일",
      readAt: iso(NOW - 20 * HOUR),
      createdAt: iso(NOW - 26 * HOUR),
    },
    {
      id: "ntf_preview_3",
      userId: expertUserId,
      title: "새 예약이 들어왔습니다",
      body: "상담 전에 전달받은 질문을 확인해 주세요.",
      href: `/conect3/expert/bookings/${SAMPLE.bookingConfirmed}`,
      channel: "앱",
      readAt: null,
      createdAt: iso(NOW - 3 * HOUR),
    },
    {
      id: "ntf_preview_4",
      userId: expertUserId,
      title: "정산 예정 안내",
      body: "이번 주 금요일에 지급될 예정입니다.",
      href: null,
      channel: "알림톡",
      readAt: iso(NOW - 10 * HOUR),
      createdAt: iso(NOW - 40 * HOUR),
    },
  ];

  // 운영자 화면: 열린 신고 2건(후기 1, 문의 1)
  const previewReports: Report[] = [
    {
      id: "rpt_preview_1",
      kind: "review",
      targetId: "rev_preview_h4",
      userId,
      userName: "김O리",
      body: "근거 없는 비난이 담긴 후기라 신고합니다.",
      status: "open",
      createdAt: daysAgo(1),
    },
    {
      id: "rpt_preview_2",
      kind: "inquiry",
      targetId: SAMPLE.bookingCompleted,
      userId,
      userName: "김O리",
      body: "상담 링크가 열리지 않았던 건에 대해 문의드립니다.",
      status: "open",
      createdAt: daysAgo(2),
    },
  ];

  return {
    users: [...d.users, ...previewUsers],
    experts: [...d.experts, ...previewExperts],
    availability: [...d.availability, ...previewAvailability],
    bookings: [...d.bookings, ...previewBookings],
    payments: [...d.payments, ...previewPayments],
    refunds: [...d.refunds, ...previewRefunds],
    settlements: [...d.settlements, ...previewSettlements],
    reviews: [...d.reviews, ...previewReviews],
    posts: [...d.posts, ...previewPosts],
    comments: [...d.comments, ...previewComments],
    notifications: [...d.notifications, ...previewNotifications],
    reports: [...d.reports, ...previewReports],
  };
}
