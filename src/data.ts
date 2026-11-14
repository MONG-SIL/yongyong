export const DISTRICTS: Record<string, string[]> = {
  기흥구: ["구갈동", "신갈동", "영덕동", "보정동", "구성동", "마북동", "동백동", "상하동", "보라동"],
  수지구: ["풍덕천동", "죽전동", "신봉동", "성복동", "상현동"],
  처인구: ["김량장동", "역북동", "삼가동", "유림동", "포곡읍", "모현읍", "이동읍", "남사읍", "원삼면", "백암면", "양지면"],
};

export const GRADES = ["유치 5세", "유치 6세", "유치 7세", "초1", "초2", "초3", "초4", "초5", "초6"] as const;
export type Grade = (typeof GRADES)[number];

export const SITUATIONS = ["맞벌이", "한부모", "다자녀"] as const;
export type Situation = (typeof SITUATIONS)[number];

export type MatchLabel = "eligible" | "check" | "none";
export type PolicyStatus = "open" | "upcoming" | "always" | "closed";
export type Category = "돌봄" | "방과후" | "예체능" | "교육비" | "가족" | "생활";

export type DocumentItem = {
  id: string;
  name: string;
  note: string;
  issuer?: string;
  issueUrl?: string;
};

export type Policy = {
  id: string;
  title: string;
  category: Category;
  tags: Category[];
  org: string;
  benefit: string;
  benefitAmount: number;
  eligibility: string;
  documents: DocumentItem[];
  startOffset: number | null;
  endOffset: number | null;
  periodLabel: string;
  status: PolicyStatus;
  grades: string[];
  requires: Situation[];
  incomeCheck: boolean;
  source: string;
  sourceUrl: string;
  applyUrl: string;
  facilityIds: string[];
  tip: string;
};

export type FacilityType = "다함께돌봄" | "지역아동센터" | "초등돌봄" | "야간연장" | "청소년수련" | "예체능";

export type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  gu: string;
  dong: string;
  address: string;
  phone: string;
  capacity: number;
  current: number;
  asOf: string;
  open: string;
  close: string;
  weekend: string;
  holidayCare: boolean;
  night: boolean;
  ages: string;
  lat?: number;
  lng?: number;
  x: number;
  y: number;
  km: number;
  minutes: number;
  policyIds: string[];
};

export type ChildProfile = {
  id: string;
  nickname: string;
  grade: Grade;
  birth: string;
};

export type Household = {
  gu: string;
  dong: string;
  situations: Situation[];
  careStart: string;
  careEnd: string;
  schoolEnd: string;
  workEnd: string;
  children: ChildProfile[];
};

const GOV = "https://www.gov.kr";
const BOKJI = "https://www.bokjiro.go.kr";
const YONGIN = "https://www.yongin.go.kr";
const IDOLBOM = "https://www.idolbom.go.kr";

export const POLICIES: Policy[] = [
  {
    id: "afterschool-voucher",
    title: "초등 1·2학년 방과후 프로그램 연 50만 원 이용권",
    category: "교육비",
    tags: ["교육비", "방과후"],
    org: "교육부 · 용인교육지원청",
    benefit: "방과후 프로그램 연 50만 원 이용권",
    benefitAmount: 500000,
    eligibility: "용인시 초등학교 1·2학년 재학생. 학교 방과후 프로그램 수강 신청 가구.",
    documents: [
      { id: "id", name: "주민등록등본", note: "최근 3개월 이내 발급", issueUrl: GOV },
      { id: "family", name: "가족관계증명서", note: "상세 증명서로 발급", issueUrl: GOV },
      { id: "form", name: "신청서", note: "온라인 작성 가능", issueUrl: BOKJI },
      { id: "school", name: "재학증명서", note: "부·모 각 1부 · 학교 발급", issueUrl: "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13410000017" },
    ],
    startOffset: -7,
    endOffset: 7,
    periodLabel: "",
    status: "open",
    grades: ["초1", "초2"],
    requires: [],
    incomeCheck: false,
    source: "교육부 사교육비 경감 정책 자료(예시)",
    sourceUrl: "https://www.moe.go.kr",
    applyUrl: BOKJI,
    facilityIds: ["giheung-care-class", "sports-singal"],
    tip: "첫째가 초1이면 학년 조건은 맞아요. 학교 방과후 수강 목록과 이용권 사용처를 함께 확인하면 신청이 빨라요.",
  },
  {
    id: "care-center-fee",
    title: "용인시 다함께돌봄센터 이용료 지원",
    category: "돌봄",
    tags: ["돌봄"],
    org: "용인시 아동청소년과",
    benefit: "다함께돌봄센터 이용료 지원",
    benefitAmount: 200000,
    eligibility: "용인시 거주 초등학생. 맞벌이·한부모·다자녀 가구 우선.",
    documents: [
      { id: "id", name: "주민등록등본", note: "주소지 용인시 확인", issueUrl: GOV },
      { id: "form", name: "이용 신청서", note: "센터 또는 시청 접수", issueUrl: YONGIN },
    ],
    startOffset: null,
    endOffset: null,
    periodLabel: "상시 신청",
    status: "always",
    grades: ["초1", "초2", "초3", "초4", "초5", "초6"],
    requires: [],
    incomeCheck: false,
    source: "용인시 돌봄 안내(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: ["care-3", "care-bojeong"],
    tip: "구갈동이면 3호점 하교 동선이 가장 가까워요. 정원은 기준일 현원이며 실시간 잔여석은 아니에요.",
  },
  {
    id: "idolbom",
    title: "맞벌이 가정 아이돌봄 서비스 정부지원",
    category: "가족",
    tags: ["가족", "돌봄"],
    org: "여성가족부 · 아이돌봄",
    benefit: "아이돌봄 서비스 정부 지원 시간 확대",
    benefitAmount: 300000,
    eligibility: "맞벌이·한부모 등 양육 공백이 있는 가정. 소득 기준은 별도 확인.",
    documents: [
      { id: "id", name: "주민등록등본", note: "정부24 발급", issueUrl: GOV },
      { id: "work", name: "취업 증명", note: "맞벌이 확인용" },
      { id: "income", name: "소득 증빙", note: "소득 구간은 여기서 입력받지 않아요" },
    ],
    startOffset: null,
    endOffset: null,
    periodLabel: "소득 기준 확인 필요",
    status: "open",
    grades: ["유치 5세", "유치 6세", "유치 7세", "초1", "초2", "초3", "초4", "초5", "초6"],
    requires: ["맞벌이"],
    incomeCheck: true,
    source: "아이돌봄 서비스 안내(예시)",
    sourceUrl: IDOLBOM,
    applyUrl: IDOLBOM,
    facilityIds: [],
    tip: "맞벌이 조건은 맞지만 소득 구간은 입력받지 않아요. 신청 전에 아이돌봄 사이트에서 소득 기준만 따로 확인하면 돼요.",
  },
  {
    id: "arts-voucher",
    title: "초등학생 예체능 학습 바우처",
    category: "예체능",
    tags: ["예체능", "교육비"],
    org: "교육부",
    benefit: "1인 1예술·스포츠 활동비 지원 예정",
    benefitAmount: 150000,
    eligibility: "초등학생. 2027년 대상 확대 예정안으로, 지금은 사전 관심 등록 단계.",
    documents: [{ id: "form", name: "사전 관심 등록", note: "신청 시작 전 알림으로 대체" }],
    startOffset: 60,
    endOffset: 90,
    periodLabel: "2027년 상반기 예정",
    status: "upcoming",
    grades: ["초1", "초2", "초3", "초4", "초5", "초6"],
    requires: [],
    incomeCheck: false,
    source: "교육부 1인 1예술·스포츠 확대안(예시)",
    sourceUrl: "https://www.moe.go.kr",
    applyUrl: "https://www.moe.go.kr",
    facilityIds: ["sports-singal", "art-dongbaek"],
    tip: "아직 신청 전이어도 캘린더에 올려 두면 확정 시기에 놓치지 않아요.",
  },
  {
    id: "daily-care",
    title: "초등 1·2학년 매일 2시간 맞춤형 돌봄",
    category: "돌봄",
    tags: ["돌봄"],
    org: "교육부 · 용인교육지원청",
    benefit: "하교 후 매일 2시간 돌봄교실",
    benefitAmount: 0,
    eligibility: "초등학교 1·2학년. 맞벌이 가구 우선 연계.",
    documents: [
      { id: "form", name: "돌봄교실 신청서", note: "학교 안내문 기준", issueUrl: YONGIN },
      { id: "id", name: "주민등록등본", note: "주소 확인", issueUrl: GOV },
    ],
    startOffset: -3,
    endOffset: 12,
    periodLabel: "",
    status: "open",
    grades: ["초1", "초2"],
    requires: [],
    incomeCheck: false,
    source: "초등돌봄교실 운영 안내(예시)",
    sourceUrl: "https://www.moe.go.kr",
    applyUrl: YONGIN,
    facilityIds: ["giheung-care-class"],
    tip: "13시 하교라면 돌봄교실 2시간이 첫 공백을 메워요. 이후 시간은 다함께돌봄과 이어 보면 퇴근까지 맞출 수 있어요.",
  },
  {
    id: "sports-club",
    title: "방과후 학교스포츠클럽",
    category: "예체능",
    tags: ["예체능", "방과후"],
    org: "용인교육지원청",
    benefit: "학교스포츠클럽 수강 연계",
    benefitAmount: 100000,
    eligibility: "관내 초등학생. 태권도·축구 등 학교 개설 종목.",
    documents: [{ id: "form", name: "수강 신청서", note: "학교알리미·학교 안내", issueUrl: "https://www.schoolinfo.go.kr" }],
    startOffset: 3,
    endOffset: 20,
    periodLabel: "",
    status: "open",
    grades: ["초1", "초2", "초3", "초4", "초5", "초6"],
    requires: [],
    incomeCheck: false,
    source: "용인교육지원청 방과후 안내(예시)",
    sourceUrl: "https://www.goeyonginedu.kr",
    applyUrl: "https://www.schoolinfo.go.kr",
    facilityIds: ["sports-singal"],
    tip: "예체능 공백을 학원 대신 학교 클럽으로 먼저 채워 보세요.",
  },
  {
    id: "local-center",
    title: "지역아동센터 방과후 이용",
    category: "돌봄",
    tags: ["돌봄", "생활"],
    org: "용인시 · 지역아동센터",
    benefit: "방과후 돌봄·학습·급식 연계",
    benefitAmount: 0,
    eligibility: "관내 초등학생. 센터별 이용 기준이 달라요.",
    documents: [
      { id: "id", name: "주민등록등본", note: "센터 제출", issueUrl: GOV },
      { id: "form", name: "이용 신청서", note: "센터 비치" },
    ],
    startOffset: null,
    endOffset: null,
    periodLabel: "상시 상담",
    status: "always",
    grades: ["초1", "초2", "초3", "초4", "초5", "초6"],
    requires: [],
    incomeCheck: false,
    source: "용인시 지역아동센터 현황(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: ["gugal-local"],
    tip: "학습과 돌봄을 한 곳에서 보고 싶다면 지역아동센터 상담을 일정에 넣어 두세요.",
  },
  {
    id: "school-care-priority",
    title: "초등돌봄교실 맞벌이 우선 연계",
    category: "돌봄",
    tags: ["돌봄"],
    org: "용인교육지원청",
    benefit: "돌봄교실 우선 배정 안내",
    benefitAmount: 0,
    eligibility: "초등 저학년. 맞벌이·한부모 가구를 우선 안내.",
    documents: [{ id: "work", name: "재직증명서", note: "맞벌이 확인", issueUrl: GOV }],
    startOffset: 1,
    endOffset: 18,
    periodLabel: "",
    status: "open",
    grades: ["초1", "초2", "초3"],
    requires: ["맞벌이"],
    incomeCheck: false,
    source: "초등돌봄교실 우선순위 안내(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: ["giheung-care-class"],
    tip: "맞벌이 조건을 이미 입력해 두어서 우선 연계 안내에 올라가요.",
  },
  {
    id: "pre-elementary",
    title: "예비 초1 돌봄 사전 가이드",
    category: "돌봄",
    tags: ["돌봄"],
    org: "용인시 · 용인교육지원청",
    benefit: "입학 전 돌봄 신청 타임라인",
    benefitAmount: 0,
    eligibility: "취학 예정 7세. 입학 6개월 전부터 단계 안내.",
    documents: [{ id: "id", name: "주민등록등본", note: "취학 예정 확인", issueUrl: GOV }],
    startOffset: 10,
    endOffset: 40,
    periodLabel: "",
    status: "upcoming",
    grades: ["유치 7세"],
    requires: [],
    incomeCheck: false,
    source: "예비 초등 돌봄 안내(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: ["giheung-care-class"],
    tip: "7세 자녀가 있으면 입학 전 돌봄 일정을 먼저 캘린더에 올려 두세요.",
  },
  {
    id: "night-care",
    title: "야간연장 어린이집 보육료",
    category: "돌봄",
    tags: ["돌봄"],
    org: "용인시",
    benefit: "야간연장 보육 이용",
    benefitAmount: 180000,
    eligibility: "미취학 영유아. 야간연장 지정 어린이집.",
    documents: [{ id: "id", name: "주민등록등본", note: "아동 연령 확인", issueUrl: GOV }],
    startOffset: null,
    endOffset: null,
    periodLabel: "상시",
    status: "always",
    grades: ["유치 5세", "유치 6세", "유치 7세"],
    requires: [],
    incomeCheck: true,
    source: "용인시 어린이집 현황(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: ["night-gugal"],
    tip: "초등 자녀에게는 학년 조건이 맞지 않아요. 미취학 자녀를 추가하면 다시 계산돼요.",
  },
  {
    id: "multi-child",
    title: "다자녀 방과후 추가 지원",
    category: "가족",
    tags: ["가족", "방과후"],
    org: "용인시",
    benefit: "다자녀 가구 방과후 추가 지원",
    benefitAmount: 120000,
    eligibility: "다자녀 가구의 초등학생.",
    documents: [{ id: "family", name: "가족관계증명서", note: "자녀 수 확인", issueUrl: GOV }],
    startOffset: 5,
    endOffset: 25,
    periodLabel: "",
    status: "open",
    grades: ["초1", "초2", "초3", "초4", "초5", "초6"],
    requires: ["다자녀"],
    incomeCheck: false,
    source: "용인시 다자녀 지원 안내(예시)",
    sourceUrl: YONGIN,
    applyUrl: YONGIN,
    facilityIds: [],
    tip: "가정 상황에서 다자녀를 선택하면 이 정책이 해당 가능으로 바뀌어요.",
  },
];

export const FACILITIES: Facility[] = [
  {
    id: "care-3",
    name: "다함께돌봄센터 3호점",
    type: "다함께돌봄",
    gu: "기흥구",
    dong: "구갈동",
    address: "경기도 용인시 기흥구 구갈로 12",
    phone: "031-000-0000",
    capacity: 30,
    current: 28,
    asOf: "2026.10.01",
    open: "13:00",
    close: "19:00",
    weekend: "토 09:00–13:00",
    holidayCare: false,
    night: false,
    ages: "만 6–12세 초등학생",
    lat: 37.275,
    lng: 127.116,
    x: 28,
    y: 28,
    km: 0.4,
    minutes: 6,
    policyIds: ["care-center-fee"],
  },
  {
    id: "gugal-local",
    name: "구갈 지역아동센터",
    type: "지역아동센터",
    gu: "기흥구",
    dong: "구갈동",
    address: "경기도 용인시 기흥구 구갈로 48",
    phone: "031-000-1100",
    capacity: 25,
    current: 20,
    asOf: "2026.10.01",
    open: "13:00",
    close: "19:00",
    weekend: "휴일 보육 없음",
    holidayCare: false,
    night: false,
    ages: "초등학생",
    lat: 37.278,
    lng: 127.109,
    x: 48,
    y: 48,
    km: 0.8,
    minutes: 11,
    policyIds: ["local-center"],
  },
  {
    id: "giheung-care-class",
    name: "기흥 초등돌봄교실",
    type: "초등돌봄",
    gu: "기흥구",
    dong: "구갈동",
    address: "경기도 용인시 기흥구 구갈로 80",
    phone: "031-000-2200",
    capacity: 20,
    current: 16,
    asOf: "2026.09.15",
    open: "13:00",
    close: "17:00",
    weekend: "방학 중 09:00–17:00",
    holidayCare: false,
    night: false,
    ages: "초등 1–2학년 우선",
    lat: 37.271,
    lng: 127.123,
    x: 62,
    y: 18,
    km: 1.2,
    minutes: 16,
    policyIds: ["daily-care", "school-care-priority", "afterschool-voucher"],
  },
  {
    id: "night-gugal",
    name: "구갈 야간연장 어린이집",
    type: "야간연장",
    gu: "기흥구",
    dong: "구갈동",
    address: "경기도 용인시 기흥구 구성로 21",
    phone: "031-000-3300",
    capacity: 40,
    current: 33,
    asOf: "2026.10.01",
    open: "07:30",
    close: "21:30",
    weekend: "휴일보육",
    holidayCare: true,
    night: true,
    ages: "만 0–5세",
    lat: 37.286,
    lng: 127.104,
    x: 22,
    y: 62,
    km: 1.1,
    minutes: 14,
    policyIds: ["night-care"],
  },
  {
    id: "care-bojeong",
    name: "보정 다함께돌봄센터",
    type: "다함께돌봄",
    gu: "기흥구",
    dong: "보정동",
    address: "경기도 용인시 기흥구 보정로 90",
    phone: "031-000-4400",
    capacity: 28,
    current: 21,
    asOf: "2026.10.01",
    open: "13:00",
    close: "20:00",
    weekend: "토요일 오전",
    holidayCare: false,
    night: false,
    ages: "초등학생",
    lat: 37.313,
    lng: 127.108,
    x: 72,
    y: 58,
    km: 3.4,
    minutes: 18,
    policyIds: ["care-center-fee"],
  },
  {
    id: "sports-singal",
    name: "신갈 학교스포츠클럽",
    type: "예체능",
    gu: "기흥구",
    dong: "신갈동",
    address: "경기도 용인시 기흥구 신갈로 15",
    phone: "031-000-5500",
    capacity: 24,
    current: 18,
    asOf: "2026.09.01",
    open: "15:00",
    close: "18:00",
    weekend: "없음",
    holidayCare: false,
    night: false,
    ages: "초등학생",
    lat: 37.286,
    lng: 127.107,
    x: 78,
    y: 34,
    km: 2.6,
    minutes: 15,
    policyIds: ["sports-club", "arts-voucher", "afterschool-voucher"],
  },
  {
    id: "art-dongbaek",
    name: "동백 예술동아리 교실",
    type: "예체능",
    gu: "기흥구",
    dong: "동백동",
    address: "경기도 용인시 기흥구 동백로 40",
    phone: "031-000-6600",
    capacity: 18,
    current: 12,
    asOf: "2026.09.01",
    open: "14:00",
    close: "18:30",
    weekend: "토요일",
    holidayCare: false,
    night: false,
    ages: "초등 3–6학년",
    lat: 37.269,
    lng: 127.152,
    x: 84,
    y: 72,
    km: 4.8,
    minutes: 22,
    policyIds: ["arts-voucher"],
  },
  {
    id: "youth-suji",
    name: "수지 공공청소년수련관",
    type: "청소년수련",
    gu: "수지구",
    dong: "풍덕천동",
    address: "경기도 용인시 수지구 포은대로 200",
    phone: "031-000-7700",
    capacity: 80,
    current: 40,
    asOf: "2026.08.20",
    open: "13:00",
    close: "21:00",
    weekend: "주말 운영",
    holidayCare: true,
    night: true,
    ages: "초등 고학년·청소년",
    lat: 37.322,
    lng: 127.096,
    x: 16,
    y: 40,
    km: 6.2,
    minutes: 28,
    policyIds: [],
  },
];

export const DEFAULT_HOUSEHOLD: Household = {
  gu: "기흥구",
  dong: "구갈동",
  situations: ["맞벌이"],
  careStart: "13:00",
  careEnd: "18:00",
  schoolEnd: "13:00",
  workEnd: "18:00",
  children: [{ id: "child-1", nickname: "첫째", grade: "초1", birth: "2019-03" }],
};

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(offset: number) {
  const d = startOfToday();
  d.setDate(d.getDate() + offset);
  return d;
}

export function formatDot(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function formatKorean(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function weekdayLabel(date: Date) {
  return "일월화수목금토"[date.getDay()];
}

export function policyEnd(policy: Policy) {
  return policy.endOffset == null ? null : addDays(policy.endOffset);
}

export function policyStart(policy: Policy) {
  return policy.startOffset == null ? null : addDays(policy.startOffset);
}

export function dday(policy: Policy) {
  const end = policyEnd(policy);
  if (!end) return null;
  return Math.round((end.getTime() - startOfToday().getTime()) / 86400000);
}

export function periodText(policy: Policy) {
  if (policy.periodLabel) return policy.periodLabel;
  const start = policyStart(policy);
  const end = policyEnd(policy);
  if (start && end) return `${formatDot(start)} – ${formatDot(end).slice(5)}`;
  if (end) return `${formatDot(end)} 마감`;
  return "일정 확인";
}

export function statusText(policy: Policy) {
  if (policy.status === "always") return "상시 신청";
  if (policy.status === "upcoming") return "신청 예정";
  if (policy.status === "closed") return "마감";
  const left = dday(policy);
  if (left != null && left < 0) return "마감";
  if (left === 0) return "오늘 마감";
  return "신청 중";
}

export type MatchResult = {
  policy: Policy;
  label: MatchLabel;
  reasons: string[];
  missing: string[];
};

export function matchPolicy(policy: Policy, household: Household): MatchResult {
  const reasons: string[] = [];
  const missing: string[] = [];
  const grades = household.children.map((child) => child.grade);
  const gradeHit =
    policy.grades.length === 0 || policy.grades.some((grade) => grades.includes(grade as Grade));
  if (gradeHit) {
    const hit = grades.filter((grade) => policy.grades.includes(grade));
    reasons.push(hit.length ? `${hit.join("·")} 대상` : "학년 제한 없음");
  } else {
    missing.push(`학년 (${policy.grades.join(", ")})`);
  }

  for (const need of policy.requires) {
    if (household.situations.includes(need)) reasons.push(`${need} 가구`);
    else missing.push(need);
  }

  if (policy.incomeCheck) missing.push("소득 기준 확인 필요");

  let label: MatchLabel = "eligible";
  if (!gradeHit || policy.requires.some((need) => !household.situations.includes(need))) label = "none";
  else if (policy.incomeCheck) label = "check";

  return { policy, reasons, missing, label };
}

export function matchAll(household: Household) {
  return POLICIES.map((policy) => matchPolicy(policy, household));
}

export function labelText(label: MatchLabel) {
  if (label === "eligible") return "해당 가능";
  if (label === "check") return "조건 확인 필요";
  return "해당 없음";
}

export function gradeBand(grade: Grade) {
  if (grade.startsWith("유치")) return "영유아";
  if (grade === "초1" || grade === "초2" || grade === "초3") return "초등 저학년";
  return "초등 고학년";
}

export function toMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(value: number) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export type GapBlock = {
  facility: Facility;
  start: number;
  end: number;
};

export function analyzeGap(household: Household) {
  const start = toMinutes(household.schoolEnd);
  const end = toMinutes(household.workEnd);
  const gap = Math.max(0, end - start);
  const elementary = household.children.some((child) => child.grade.startsWith("초"));
  const preschool = household.children.some((child) => child.grade.startsWith("유치"));
  const pool = FACILITIES.filter((facility) => {
    const open = toMinutes(facility.open);
    const close = toMinutes(facility.close);
    if (!(close > start && open < end)) return false;
    if (facility.gu !== household.gu && facility.dong !== household.dong) return false;
    if (elementary && !preschool && facility.type === "야간연장") return false;
    if (!elementary && preschool && (facility.type === "초등돌봄" || facility.type === "예체능")) return false;
    return true;
  });

  const blocks: GapBlock[] = [];
  let cursor = start;
  const used = new Set<string>();
  while (cursor < end) {
    const next = pool
      .filter((facility) => {
        if (used.has(facility.id)) return false;
        const open = toMinutes(facility.open);
        const close = toMinutes(facility.close);
        return open <= cursor + 30 && close >= cursor + 30;
      })
      .sort((a, b) => {
        const span = (facility: Facility) => Math.min(toMinutes(facility.close), end) - Math.max(toMinutes(facility.open), cursor);
        return Math.abs(span(a) - 120) - Math.abs(span(b) - 120) || a.km - b.km;
      })[0];
    if (!next) break;
    const open = Math.max(toMinutes(next.open), cursor);
    const close = Math.min(toMinutes(next.close), end);
    if (close - open < 30) break;
    blocks.push({ facility: next, start: open, end: close });
    used.add(next.id);
    cursor = close;
  }
  const covered = blocks.reduce((sum, block) => sum + (block.end - block.start), 0);
  const ratio = gap === 0 ? 100 : Math.min(100, Math.round((covered / gap) * 100));
  return { start, end, gap, blocks, covered, ratio, pool };
}

export function categoryCounts() {
  const counts: Record<string, number> = { 전체: POLICIES.length };
  for (const policy of POLICIES) {
    for (const tag of new Set([policy.category, ...policy.tags])) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export type ChatReply = {
  text: string;
  steps?: { title: string; body: string }[];
  source?: { title: string; url: string; date: string };
  unknown?: boolean;
};

export function answerQuestion(question: string, household: Household): ChatReply {
  const q = question.replace(/\s/g, "");
  const place = `${household.gu} ${household.dong}`;
  const grade = household.children[0]?.grade ?? "자녀";
  if (q.includes("신청기간") || q.includes("50만") || q.includes("이용권") || q.includes("방과후")) {
    const policy = POLICIES[0];
    return {
      text: `${household.children[0]?.nickname ?? "자녀"} 기준으로 보면 신청 가능성이 높아요. 아래 순서로 준비해 보세요.`,
      steps: [
        { title: "신청처", body: "교육부 방과후 이용권 온라인 페이지" },
        { title: "제출 서류", body: "주민등록등본, 가족관계증명서, 재학증명서" },
        { title: "접수 기간", body: periodText(policy) },
      ],
      source: { title: policy.title, url: policy.applyUrl, date: formatDot(startOfToday()) },
    };
  }
  if (q.includes("서류")) {
    return {
      text: "서류는 발급처마다 달라요. 정책 상세의 필요 서류에서 발급 링크를 확인해 주세요.",
      steps: [
        { title: "주민등록등본", body: "정부24에서 발급" },
        { title: "재직증명서", body: "직장 또는 정부24에서 발급" },
      ],
      source: { title: "필요 서류 안내", url: YONGIN, date: formatDot(startOfToday()) },
    };
  }
  if (q.includes("다함께") || q.includes("돌봄센터")) {
    return {
      text: `${place} 근처에서는 다함께돌봄센터 3호점이 하교 시간에 이어져요. 정원 30명, 현원 28명(기준일 2026.10.01)이에요.`,
      source: { title: "용인시 다함께돌봄센터 이용료 지원", url: YONGIN, date: "2026.10.01" },
    };
  }
  if (q.includes("공백") || q.includes("하교")) {
    const gap = analyzeGap(household);
    return {
      text: `${grade} 하교 ${household.schoolEnd}부터 퇴근 ${household.workEnd}까지 ${gap.gap}분 공백이 있어요. 돌봄 공백 분석에서 시간대별 조합을 볼 수 있어요.`,
      source: { title: "초등 1·2학년 매일 2시간 맞춤형 돌봄", url: YONGIN, date: formatDot(startOfToday()) },
    };
  }
  if (q.includes("모든초등") || q.includes("30만") || q.includes("무조건")) {
    return {
      text: "확인되지 않은 정보예요. 등록된 정책·시설 자료에서 근거를 찾지 못했어요. 확인되지 않은 내용은 사실처럼 답하지 않아요.",
      unknown: true,
      source: { title: "용인시청 아동청소년과", url: YONGIN, date: formatDot(startOfToday()) },
    };
  }
  if (q.includes("예비") || q.includes("7세") || q.includes("입학")) {
    return {
      text: "7세 자녀는 입학 6개월 전부터 초등 돌봄 신청 순서를 미리 볼 수 있어요. 예비 초1 가이드 정책을 열어 타임라인을 확인하세요.",
      source: { title: "예비 초1 돌봄 사전 가이드", url: YONGIN, date: formatDot(startOfToday()) },
    };
  }
  return {
    text: "확인되지 않은 질문이에요. 돌봄, 방과후 이용권, 다함께돌봄, 하교 후 공백처럼 구체적으로 물어보면 등록된 자료 안에서 답해요.",
    unknown: true,
    source: { title: "용인시청 대표전화 031-324-2114", url: YONGIN, date: formatDot(startOfToday()) },
  };
}

export const SUGGESTED_QUESTIONS = ["신청 기간 알려줘", "서류 발급처는?"];

export function icsFor(title: string, date: Date, details: string) {
  const stamp = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//아이케어 용인//KO",
    "BEGIN:VEVENT",
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function googleCalendarUrl(title: string, date: Date, details: string) {
  const day = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${day}/${day}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
