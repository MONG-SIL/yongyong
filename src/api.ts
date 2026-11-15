import type { Category, DocumentItem, Facility, FacilityType, Grade, Household, MatchLabel, Policy, PolicyStatus, Situation } from "./data";
import { GRADES, toMinutes } from "./data";

export const SERVER_ORIGIN = (import.meta.env.VITE_API_ORIGIN || "https://api.yongpale.kro.kr").replace(/\/$/, "");

let cookieSession = false;

export function markServerSession(active: boolean) {
  cookieSession = active;
}

export function hasServerSession() {
  return cookieSession || Boolean(loadSession());
}

const AUTH_KEY = "icare-yongin-auth";

export type Session = { accessToken: string; refreshToken: string };

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_KEY);
}

export function readHashSession(): Session | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("accessToken") ?? params.get("access_token");
  const refreshToken = params.get("refreshToken") ?? params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export function kakaoLoginUrl() {
  return `${SERVER_ORIGIN}/oauth2/authorization/kakao`;
}

function requestUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${SERVER_ORIGIN}${path}`;
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const session = loadSession();
  if (!session) return null;
  if (!refreshing) {
    refreshing = fetch(requestUrl("/api/v1/auth/refresh"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          clearSession();
          return null;
        }
        const body = (await response.json()) as { accessToken?: string; refreshToken?: string };
        if (!body.accessToken || !body.refreshToken) {
          clearSession();
          return null;
        }
        saveSession({ accessToken: body.accessToken, refreshToken: body.refreshToken });
        return body.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const session = loadSession();
  if (session) headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response = await fetch(requestUrl(path), { ...init, headers, credentials: "include" });
  if (response.status === 401 && session && !path.endsWith("/auth/refresh")) {
    const next = await refreshAccess();
    if (next) {
      headers.set("Authorization", `Bearer ${next}`);
      response = await fetch(requestUrl(path), { ...init, headers, credentials: "include" });
    }
  }
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    let message = "요청을 처리하지 못했어요.";
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      message = body.message || body.error || message;
    } catch {
      /* 본문이 없는 오류 */
    }
    throw new ApiError(response.status, message);
  }
  return (await response.json()) as T;
}

const CATEGORY: Record<string, Category> = {
  CARE: "돌봄",
  AFTERSCHOOL: "방과후",
  ARTS_SPORTS: "예체능",
  LEARNING: "교육비",
  CASH: "생활",
  OTHER: "가족",
};

const SITUATION_FROM: Record<string, Situation> = {
  DUAL_INCOME: "맞벌이",
  SINGLE_PARENT: "한부모",
  MULTI_CHILD: "다자녀",
};

const SITUATION_TO: Record<Situation, string> = {
  맞벌이: "DUAL_INCOME",
  한부모: "SINGLE_PARENT",
  다자녀: "MULTI_CHILD",
};

const GRADE_ORDER: Grade[] = [...GRADES];

export function toUiGrade(grade: string): Grade {
  const spaced = grade.startsWith("유치") && !grade.includes(" ") ? grade.replace("유치", "유치 ") : grade;
  return (GRADE_ORDER as string[]).includes(spaced) ? (spaced as Grade) : "초1";
}

function toApiGrade(grade: string) {
  return grade.replace("유치 ", "유치");
}

function gradesBetween(min?: number | null, max?: number | null) {
  if (min == null && max == null) return [];
  const start = Math.max(0, (min ?? 1) - 1);
  const end = Math.min(GRADE_ORDER.length - 1, (max ?? GRADE_ORDER.length) - 1);
  if (end < start || start > 8) return [];
  return GRADE_ORDER.slice(start, end + 1);
}

function policyStatus(status?: string | null): PolicyStatus {
  const value = (status ?? "").toUpperCase();
  if (value.includes("ALWAYS") || value.includes("상시")) return "always";
  if (value.includes("UPCOM") || value.includes("예정")) return "upcoming";
  if (value.includes("CLOSE") || value.includes("마감")) return "closed";
  return "open";
}

function endOffsetFrom(text: string) {
  const dates = text.match(/20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}/g);
  if (!dates?.length) return null;
  const last = dates[dates.length - 1].replace(/[./]/g, "-");
  const [year, month, day] = last.split("-").map(Number);
  const end = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - today.getTime()) / 86400000);
}

function matchLabel(status?: string): MatchLabel {
  if (status === "ELIGIBLE") return "eligible";
  if (status === "CHECK") return "check";
  return "none";
}

type Summary = {
  policyId: number;
  title: string;
  category: string;
  providerOrg?: string;
  targetGradeMin?: number;
  targetGradeMax?: number;
  applyUrl?: string;
  status?: string;
  asOfDate?: string;
};

type MatchItem = {
  policyId: number;
  title: string;
  category: string;
  providerOrg?: string;
  status: "ELIGIBLE" | "CHECK" | "INELIGIBLE";
  reasons?: string[];
  checkItems?: string[];
  targetChildren?: string[];
  notes?: string[];
  applyPeriod?: string;
};

type MatchList = { policies?: MatchItem[] };

export type RemoteMatch = {
  policy: Policy;
  label: MatchLabel;
  reasons: string[];
  missing: string[];
};

function blankPolicy(id: string, title: string, category: Category): Policy {
  return {
    id,
    title,
    category,
    tags: [category],
    org: "",
    benefit: "",
    benefitAmount: 0,
    eligibility: "",
    documents: [],
    startOffset: null,
    endOffset: null,
    periodLabel: "",
    status: "open",
    grades: [],
    requires: [],
    incomeCheck: false,
    source: "",
    sourceUrl: "",
    applyUrl: "",
    facilityIds: [],
    tip: "",
  };
}

export function mergePolicies(summaries: Summary[], matches: MatchItem[]): RemoteMatch[] {
  const byId = new Map(summaries.map((item) => [item.policyId, item]));
  const rows: MatchItem[] = matches.length ? matches : summaries.map((item) => ({
    policyId: item.policyId,
    title: item.title,
    category: item.category,
    providerOrg: item.providerOrg,
    status: "CHECK",
    applyPeriod: "",
  }));
  return rows.map((item) => {
    const summary = byId.get(item.policyId);
    const category = CATEGORY[item.category] ?? "돌봄";
    const period = item.applyPeriod || "";
    const policy = blankPolicy(String(item.policyId), item.title, category);
    policy.org = item.providerOrg || summary?.providerOrg || "";
    policy.benefit = period || policy.org;
    policy.periodLabel = period;
    policy.endOffset = period ? endOffsetFrom(period) : null;
    policy.status = policyStatus(summary?.status);
    policy.applyUrl = summary?.applyUrl || "";
    policy.source = policy.org;
    policy.grades = (item.targetChildren ?? []).map(toUiGrade);
    if (policy.grades.length === 0) policy.grades = gradesBetween(summary?.targetGradeMin, summary?.targetGradeMax);
    policy.incomeCheck = item.status === "CHECK";
    policy.tip = (item.notes ?? []).join(" ");
    policy.eligibility = (item.reasons ?? []).join(" · ");
    return {
      policy,
      label: matchLabel(item.status),
      reasons: item.reasons ?? [],
      missing: item.checkItems ?? [],
    };
  });
}

type FacilitySummary = {
  facilityId: number;
  name: string;
  facilityType?: string;
  guName?: string;
  dongName?: string;
  address?: string;
  phone?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  dataBaseDate?: string;
  detail?: {
    ageMin?: number;
    ageMax?: number;
    semesterHours?: { open?: string; close?: string };
    saturdayHours?: { open?: string; close?: string };
    meal?: boolean;
    snack?: boolean;
  };
};

function facilityKind(name: string, raw?: string): FacilityType {
  if (name.includes("야간")) return "야간연장";
  if (name.includes("초등돌봄") || name.includes("돌봄교실")) return "초등돌봄";
  if (name.includes("지역아동")) return "지역아동센터";
  if (name.includes("청소년")) return "청소년수련";
  if (name.includes("스포츠") || name.includes("예술") || name.includes("예체능")) return "예체능";
  if (raw === "CARE_CENTER") return "지역아동센터";
  return "다함께돌봄";
}

function project(lat?: number, lng?: number) {
  if (lat == null || lng == null) return { x: 50, y: 46 };
  const x = ((lng - 127.01) / (127.42 - 127.01)) * 100;
  const y = ((37.38 - lat) / (37.38 - 37.05)) * 100;
  return { x: Math.min(92, Math.max(8, x)), y: Math.min(88, Math.max(8, y)) };
}

function distanceKm(lat?: number, lng?: number) {
  if (lat == null || lng == null) return 99;
  const lat0 = 37.286;
  const lng0 = 127.111;
  const dy = (lat - lat0) * 111;
  const dx = (lng - lng0) * 88;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
}

export function mapFacility(item: FacilitySummary): Facility {
  const point = project(item.latitude, item.longitude);
  const open = item.detail?.semesterHours?.open || "09:00";
  const close = item.detail?.semesterHours?.close || "18:00";
  const ages = item.detail?.ageMin != null ? `${item.detail.ageMin}–${item.detail.ageMax ?? ""}세` : "연령 확인";
  return {
    id: String(item.facilityId),
    name: item.name,
    type: facilityKind(item.name, item.facilityType),
    gu: item.guName || "",
    dong: item.dongName || "",
    address: item.address || "",
    phone: item.phone || "",
    capacity: item.capacity ?? 0,
    current: -1,
    asOf: item.dataBaseDate || "",
    open,
    close,
    weekend: item.detail?.saturdayHours?.open ? `토요일 ${item.detail.saturdayHours.open}–${item.detail.saturdayHours.close ?? ""}` : "주말 운영은 시설에 확인해 주세요",
    holidayCare: Boolean(item.detail?.saturdayHours?.open),
    night: item.name.includes("야간") || close >= "20:00",
    ages,
    lat: item.latitude,
    lng: item.longitude,
    x: point.x,
    y: point.y,
    km: distanceKm(item.latitude, item.longitude),
    minutes: Math.round(distanceKm(item.latitude, item.longitude) * 4),
    policyIds: [],
  };
}

type RegionRow = { guName: string; dongName: string };

export function groupRegions(rows: RegionRow[]) {
  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    if (!row.guName || !row.dongName) continue;
    grouped[row.guName] ??= [];
    if (!grouped[row.guName].includes(row.dongName)) grouped[row.guName].push(row.dongName);
  }
  return grouped;
}

type HouseholdBody = {
  id?: number;
  region?: { guName?: string; dongName?: string };
  situations?: string[];
  children?: { id?: number; nickname?: string; grade?: string }[];
  careNeedStartTime?: string | null;
  careNeedEndTime?: string | null;
};

export function mapHousehold(body: HouseholdBody): Household {
  const start = body.careNeedStartTime || "13:00";
  const end = body.careNeedEndTime || "18:00";
  return {
    gu: body.region?.guName || "기흥구",
    dong: body.region?.dongName || "구갈동",
    situations: (body.situations ?? []).flatMap((item) => (SITUATION_FROM[item] ? [SITUATION_FROM[item]] : [])),
    careStart: start,
    careEnd: end,
    schoolEnd: start,
    workEnd: end,
    children: (body.children ?? []).map((child) => ({
      id: String(child.id ?? `child-${child.nickname}`),
      nickname: child.nickname || "",
      grade: toUiGrade(child.grade || "초1"),
      birth: "",
    })),
  };
}

export function householdRequest(household: Household) {
  return {
    region: { guName: household.gu, dongName: household.dong },
    situations: household.situations.map((item) => SITUATION_TO[item]),
    children: household.children.map((child) => ({ nickname: child.nickname.trim(), grade: toApiGrade(child.grade) })),
    careNeedStartTime: household.careStart,
    careNeedEndTime: household.careEnd,
  };
}

type Me = {
  name?: string;
  nickname?: string;
  email?: string | null;
  termsAgreementRequired?: boolean;
};

type Detail = {
  policyId: number;
  title?: string;
  providerOrg?: string;
  targetText?: string;
  benefitText?: string;
  benefitAmount?: number;
  applyMethodText?: string;
  applyUrl?: string;
  sourceUrl?: string;
  status?: string;
  asOfDate?: string;
};

type SummaryAi = {
  summary?: { title?: string; text?: string }[];
  tip?: { text?: string };
  apply?: { online_url?: string; deadline?: string; how_to_apply?: string };
  sources?: { title?: string; url?: string; updatedAt?: string }[];
  status?: string;
};

type Docs = {
  documents?: { code?: string; name?: string; note?: string; issuer?: string; issueUrl?: string; checked?: boolean }[];
};

export async function fetchPolicyExtras(id: string) {
  const [detail, summary, docs, match] = await Promise.all([
    api<Detail>(`/api/v1/policies/${id}`),
    api<SummaryAi>(`/api/v1/policies/${id}/summary`).catch(() => null),
    api<Docs>(`/api/v1/policies/${id}/required-documents`).catch(() => null),
    api<MatchItem>(`/api/v1/policies/${id}/match`).catch(() => null),
  ]);
  const documents: DocumentItem[] = (docs?.documents ?? []).map((doc, index) => ({
    id: doc.code || `doc-${index}`,
    name: doc.name || "서류",
    note: doc.note || "",
    issuer: doc.issuer || undefined,
    issueUrl: doc.issueUrl || undefined,
  }));
  const source = summary?.sources?.[0];
  return {
    patch: {
      org: detail.providerOrg,
      benefit: detail.benefitText || detail.applyMethodText || "",
      benefitAmount: detail.benefitAmount ?? 0,
      eligibility: detail.targetText || "",
      documents,
      status: policyStatus(detail.status),
      applyUrl: summary?.apply?.online_url || detail.applyUrl || "",
      source: source?.title || detail.providerOrg || "",
      sourceUrl: source?.url || detail.sourceUrl || "",
      tip: summary?.tip?.text || (summary?.summary ?? []).map((item) => item.text).filter(Boolean).join(" "),
      periodLabel: summary?.apply?.deadline || undefined,
    } as Partial<Policy>,
    checked: (docs?.documents ?? []).filter((doc) => doc.checked && doc.code).map((doc) => doc.code as string),
    label: match?.status ? matchLabel(match.status) : summary?.status ? matchLabel(summary.status) : undefined,
    reasons: match?.reasons,
    missing: match?.checkItems,
    asOf: detail.asOfDate || source?.updatedAt || "",
  };
}

export async function fetchFacility(id: string) {
  return mapFacility(await api<FacilitySummary>(`/api/v1/facilities/${id}`));
}

const MATCH_CATEGORY: Record<string, string> = {
  돌봄: "CARE",
  방과후: "AFTERSCHOOL",
  예체능: "ARTS_SPORTS",
};

export async function fetchMatchedPolicies(category?: string) {
  const code = category ? MATCH_CATEGORY[category] : undefined;
  const query = code ? `?category=${encodeURIComponent(code)}` : "";
  const [summaries, matchList] = await Promise.all([
    api<Summary[]>(`/api/v1/policies${query}`),
    api<MatchList>(`/api/v1/policies/matches${query}`),
  ]);
  return mergePolicies(summaries, matchList.policies ?? []);
}

export async function fetchCatalog() {
  const [summaries, matchList, facilities, regions] = await Promise.all([
    api<Summary[]>("/api/v1/policies"),
    api<MatchList>("/api/v1/policies/matches"),
    api<FacilitySummary[]>("/api/v1/facilities"),
    api<RegionRow[]>("/api/v1/regions"),
  ]);
  let household: HouseholdBody | null = null;
  try {
    household = await api<HouseholdBody>("/api/v1/households");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }
  return {
    matches: mergePolicies(summaries, matchList.policies ?? []),
    facilities: facilities.map(mapFacility),
    districts: groupRegions(regions),
    household: household ? mapHousehold(household) : null,
    householdId: household?.id ?? null,
  };
}

export async function fetchMe() {
  return api<Me>("/api/v1/auth/me");
}

type GapResponse = {
  gapMinutes?: number;
  plans?: {
    coveredMinutes?: number;
    coverageRate?: number;
    facilities?: {
      facilityId?: number;
      name?: string;
      facilityType?: string;
      guName?: string;
      dongName?: string;
      address?: string;
      phone?: string;
      latitude?: number;
      longitude?: number;
      hours?: { start?: string; end?: string };
      covers?: { start?: string; end?: string };
    }[];
  }[];
};

export async function analyzeCareGap(household: Household) {
  const child = household.children.find((item) => /^\d+$/.test(item.id));
  const data = await api<GapResponse>("/api/v1/care-gap/analyze", {
    method: "POST",
    body: JSON.stringify({
      childId: child ? Number(child.id) : undefined,
      period: "SEMESTER",
      schoolEndTime: household.schoolEnd,
      careNeedStartTime: household.careStart,
      careNeedEndTime: household.careEnd,
    }),
  });
  const plan = data.plans?.[0];
  const blocks = (plan?.facilities ?? []).map((item) => {
    const facility = mapFacility({
      facilityId: item.facilityId ?? 0,
      name: item.name || "돌봄 시설",
      facilityType: item.facilityType,
      guName: item.guName,
      dongName: item.dongName,
      address: item.address,
      phone: item.phone,
      latitude: item.latitude,
      longitude: item.longitude,
      detail: { semesterHours: { open: item.hours?.start, close: item.hours?.end } },
    });
    const start = toMinutes(item.covers?.start || item.hours?.start || household.schoolEnd);
    const end = toMinutes(item.covers?.end || item.hours?.end || household.workEnd);
    return { facility, start, end };
  });
  const rate = plan?.coverageRate ?? 0;
  const ratio = rate <= 1 ? Math.round(rate * 100) : Math.round(rate);
  const gap = data.gapMinutes ?? 0;
  const covered = plan?.coveredMinutes ?? blocks.reduce((sum, block) => sum + Math.max(0, block.end - block.start), 0);
  return {
    start: toMinutes(household.schoolEnd),
    end: toMinutes(household.workEnd),
    gap,
    blocks,
    covered,
    ratio,
    pool: blocks.map((block) => block.facility),
  };
}

export type ChatAnswer = {
  chatSessionId?: string;
  messageId?: number;
  grounded?: boolean;
  intro?: string;
  items?: { title?: string; text?: string }[];
  sources?: { title?: string; name?: string; url?: string; updatedAt?: string }[];
};

export function askChat(question: string, chatSessionId?: string) {
  return api<ChatAnswer>("/api/v1/chat/messages", {
    method: "POST",
    body: JSON.stringify({ question, chatSessionId: chatSessionId || undefined }),
  });
}

export function sendFeedback(messageId: number, chatSessionId: string, helpful: boolean) {
  return api<void>(`/api/v1/chat/messages/${messageId}/feedback`, {
    method: "POST",
    body: JSON.stringify({ chatSessionId, helpful }),
  });
}

export function saveHousehold(household: Household, householdId: number | null) {
  const path = "/api/v1/households";
  const body = JSON.stringify(householdRequest(household));
  if (householdId) return api<HouseholdBody>(path, { method: "PUT", body });
  return api<HouseholdBody>(path, { method: "POST", body });
}

export function agreeTerms() {
  return api<Me>("/api/v1/auth/terms", {
    method: "POST",
    body: JSON.stringify({ termsAgreed: true, privacyAgreed: true }),
  });
}

export function logoutSession() {
  const session = loadSession();
  return api<void>("/api/v1/auth/logout", {
    method: "POST",
    body: JSON.stringify(session ? { refreshToken: session.refreshToken } : {}),
  }).catch(() => undefined);
}

export function checkDocument(policyId: string, code: string, checked: boolean) {
  return api(`/api/v1/policies/${policyId}/required-documents/${encodeURIComponent(code)}/check`, {
    method: "PUT",
    body: JSON.stringify({ checked }),
  });
}
