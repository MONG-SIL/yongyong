import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  agreeTerms as postTerms,
  analyzeCareGap,
  askChat,
  checkDocument,
  clearSession,
  fetchCatalog,
  fetchFacility,
  fetchMe,
  fetchPolicyExtras,
  hasServerSession,
  kakaoLoginUrl,
  loadSession,
  logoutSession,
  markServerSession,
  readHashSession,
  saveHousehold,
  saveSession,
  sendFeedback,
} from "./api";
import type { RemoteMatch } from "./api";
import {
  DEFAULT_HOUSEHOLD,
  DISTRICTS,
  FACILITIES,
  POLICIES,
  addDays,
  answerQuestion,
  formatDot,
  matchAll,
} from "./data";
import type { ChildProfile, Facility, Grade, Household, Policy, Situation } from "./data";

export type AppEvent = {
  id: string;
  date: string;
  title: string;
  time: string;
  kind: "정책" | "돌봄" | "상담" | "메모";
  detail: string;
  policyId?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  steps?: { title: string; body: string }[];
  source?: { title: string; url: string; date: string };
  unknown?: boolean;
  feedback?: "up" | "down" | null;
  messageId?: number;
};

type User = {
  name: string;
  email: string;
  loggedIn: boolean;
  notify: boolean;
  termsRequired?: boolean;
};

type Persisted = {
  user: User | null;
  household: Household;
  savedIds: string[];
  events: AppEvent[];
  checkedDocs: Record<string, string[]>;
};

const KEY = "icare-yongin-v1";

function seedEvents(): AppEvent[] {
  const consult = addDays(3);
  const deadline = addDays(7);
  return [
    {
      id: "evt-consult",
      date: formatDot(consult),
      title: "다함께돌봄센터 상담",
      time: "15:00",
      kind: "돌봄",
      detail: "3호점 · 전화 상담 예약",
    },
    {
      id: "evt-deadline",
      date: formatDot(deadline),
      title: "방과후 이용권 신청 마감",
      time: "종일",
      kind: "정책",
      detail: "온라인 신청",
      policyId: "afterschool-voucher",
    },
  ];
}

function load(): Persisted {
  const fallback: Persisted = {
    user: null,
    household: DEFAULT_HOUSEHOLD,
    savedIds: [],
    events: seedEvents(),
    checkedDocs: { "afterschool-voucher": ["id", "school"] },
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Persisted;
    return { ...fallback, ...parsed, household: { ...fallback.household, ...parsed.household } };
  } catch {
    return fallback;
  }
}

type GapView = {
  start: number;
  end: number;
  gap: number;
  blocks: { facility: Facility; start: number; end: number }[];
  covered: number;
  ratio: number;
  pool: Facility[];
};

type Store = {
  user: User | null;
  connected: boolean;
  household: Household;
  policies: Policy[];
  facilities: Facility[];
  districts: Record<string, string[]>;
  results: RemoteMatch[];
  remoteGap: GapView | null;
  savedIds: string[];
  events: AppEvent[];
  checkedDocs: Record<string, string[]>;
  messages: ChatMessage[];
  toast: string | null;
  notify: (message: string) => void;
  login: (name: string, email: string) => void;
  startKakao: () => void;
  acceptTerms: () => void;
  logout: () => void;
  setNotifyEnabled: (on: boolean) => void;
  updateHousehold: (next: Household) => void;
  saveHousehold: (next: Household) => Promise<boolean>;
  toggleSaved: (id: string) => void;
  toggleDoc: (policyId: string, docId: string) => void;
  addEvent: (event: Omit<AppEvent, "id">) => void;
  removeEvent: (id: string) => void;
  ask: (question: string) => void;
  feedback: (id: string, value: "up" | "down") => void;
  hydratePolicy: (id: string) => void;
  hydrateFacility: (id: string) => void;
  refreshGap: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(load, []);
  const [user, setUser] = useState<User | null>(loadSession() ? initial.user : null);
  const [household, setHousehold] = useState<Household>(initial.household);
  const [savedIds, setSavedIds] = useState<string[]>(initial.savedIds);
  const [events, setEvents] = useState<AppEvent[]>(initial.events);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, string[]>>(initial.checkedDocs);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [connected, setConnected] = useState(Boolean(loadSession()));
  const [remoteMatches, setRemoteMatches] = useState<RemoteMatch[] | null>(null);
  const [remoteFacilities, setRemoteFacilities] = useState<Facility[] | null>(null);
  const [remoteDistricts, setRemoteDistricts] = useState<Record<string, string[]> | null>(null);
  const [householdId, setHouseholdId] = useState<number | null>(null);
  const [remoteGap, setRemoteGap] = useState<GapView | null>(null);
  const [chatSessionId, setChatSessionId] = useState<string | undefined>();
  const [booted, setBooted] = useState(0);

  useEffect(() => {
    const tokens = readHashSession();
    if (!tokens) return;
    saveSession(tokens);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setConnected(true);
    setBooted((value) => value + 1);
  }, []);

  useEffect(() => {
    const data: Persisted = { user, household, savedIds, events, checkedDocs };
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [user, household, savedIds, events, checkedDocs]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const me = await fetchMe();
        if (cancel) return;
        markServerSession(true);
        setConnected(true);
        const catalog = await fetchCatalog();
        if (cancel) return;
        setUser({
          name: me.name || me.nickname || "회원",
          email: me.email || "",
          loggedIn: true,
          notify: true,
          termsRequired: me.termsAgreementRequired,
        });
        setRemoteMatches(catalog.matches);
        setRemoteFacilities(catalog.facilities);
        if (Object.keys(catalog.districts).length) setRemoteDistricts(catalog.districts);
        setHouseholdId(catalog.householdId);
        if (catalog.household) setHousehold(catalog.household);
      } catch (error) {
        const status = error instanceof Error && "status" in error ? Number((error as { status: number }).status) : 0;
        if (status === 401 || status === 403) {
          markServerSession(false);
          return;
        }
        if (!cancel && loadSession()) setToast("서버 정보를 불러오지 못했어요. 다시 로그인해 주세요.");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [booted]);

  useEffect(() => {
    if (!remoteMatches?.length) return;
    const ids = new Set(remoteMatches.map((item) => item.policy.id));
    setSavedIds((current) => {
      const next = current.filter((id) => ids.has(id));
      return next.length === current.length ? current : next;
    });
  }, [remoteMatches]);

  const localResults = useMemo(() => matchAll(household), [household]);
  const results = remoteMatches ?? localResults;
  const policies = remoteMatches?.map((item) => item.policy) ?? POLICIES;
  const facilities = remoteFacilities ?? FACILITIES;
  const districts = remoteDistricts ?? DISTRICTS;

  const value = useMemo<Store>(
    () => ({
      user,
      connected,
      household,
      policies,
      facilities,
      districts,
      results,
      remoteGap,
      savedIds,
      events,
      checkedDocs,
      messages,
      toast,
      notify: (message) => setToast(message),
      login: (name, email) => setUser({ name, email, loggedIn: true, notify: user?.notify ?? true }),
      startKakao: () => {
        window.location.href = kakaoLoginUrl();
      },
      acceptTerms: () => {
        postTerms()
          .then(() => setUser((prev) => (prev ? { ...prev, termsRequired: false } : prev)))
          .catch(() => setToast("약관 동의를 저장하지 못했어요."));
      },
      logout: () => {
        logoutSession().finally(() => {
          markServerSession(false);
          clearSession();
          setConnected(false);
          setRemoteMatches(null);
          setRemoteFacilities(null);
          setRemoteDistricts(null);
          setRemoteGap(null);
          setHouseholdId(null);
          setUser(null);
        });
      },
      setNotifyEnabled: (on) => setUser((prev) => (prev ? { ...prev, notify: on } : prev)),
      updateHousehold: setHousehold,
      saveHousehold: async (next) => {
        setHousehold(next);
        if (!hasServerSession()) return true;
        try {
          let saved;
          try {
            saved = await saveHousehold(next, householdId);
          } catch (error) {
            const status = error instanceof Error && "status" in error ? Number((error as { status: number }).status) : 0;
            if (status === 409) saved = await saveHousehold(next, -1);
            else if (status === 404) saved = await saveHousehold(next, null);
            else throw error;
          }
          if (saved?.id) setHouseholdId(saved.id);
          const catalog = await fetchCatalog();
          setRemoteMatches(catalog.matches);
          setHouseholdId(catalog.householdId);
          if (catalog.household) setHousehold(catalog.household);
          return true;
        } catch {
          setToast("가족 정보를 서버에 저장하지 못했어요.");
          return false;
        }
      },
      toggleSaved: (id) =>
        setSavedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])),
      toggleDoc: (policyId, docId) => {
        const current = checkedDocs[policyId] ?? [];
        const checked = !current.includes(docId);
        const next = checked ? [...current, docId] : current.filter((item) => item !== docId);
        setCheckedDocs((prev) => ({ ...prev, [policyId]: next }));
        if (hasServerSession() && /^\d+$/.test(policyId)) {
          checkDocument(policyId, docId, checked).catch(() => setToast("서류 체크를 서버에 저장하지 못했어요."));
        }
      },
      addEvent: (event) => setEvents((prev) => [{ ...event, id: `evt-${Date.now()}` }, ...prev]),
      removeEvent: (id) => setEvents((prev) => prev.filter((event) => event.id !== id)),
      ask: (question) => {
        const text = question.trim();
        if (!text) return;
        if (!hasServerSession()) {
          const reply = answerQuestion(text, household);
          setMessages((prev) => [
            ...prev,
            { id: `u-${Date.now()}`, role: "user", text },
            { id: `b-${Date.now()}`, role: "bot", feedback: null, ...reply },
          ]);
          return;
        }
        const pending = `u-${Date.now()}`;
        setMessages((prev) => [...prev, { id: pending, role: "user", text }]);
        askChat(text, chatSessionId)
          .then((answer) => {
            if (answer.chatSessionId) setChatSessionId(answer.chatSessionId);
            const source = answer.sources?.[0];
            setMessages((prev) => [
              ...prev,
              {
                id: `b-${answer.messageId ?? Date.now()}`,
                role: "bot",
                text: answer.intro || (answer.grounded ? "등록된 자료를 기준으로 답했어요." : "확인되지 않은 정보예요. 등록된 자료에서 근거를 찾지 못했어요."),
                steps: (answer.items ?? []).map((item) => ({ title: item.title || "안내", body: item.text || "" })),
                source: source ? { title: source.title || source.name || "출처", url: source.url || "", date: source.updatedAt || "" } : undefined,
                unknown: answer.grounded === false,
                feedback: null,
                messageId: answer.messageId,
              },
            ]);
          })
          .catch(() => setToast("챗봇 답변을 가져오지 못했어요."));
      },
      feedback: (id, vote) => {
        setMessages((prev) => prev.map((message) => (message.id === id ? { ...message, feedback: vote } : message)));
        const message = messages.find((item) => item.id === id);
        if (message?.messageId && chatSessionId) {
          sendFeedback(message.messageId, chatSessionId, vote === "up").catch(() => setToast("피드백을 보내지 못했어요."));
        }
      },
      hydratePolicy: (id) => {
        if (!hasServerSession() || !/^\d+$/.test(id)) return;
        fetchPolicyExtras(id)
          .then((extra) => {
            setRemoteMatches((prev) => prev?.map((item) => item.policy.id === id ? {
              ...item,
              policy: { ...item.policy, ...extra.patch },
              label: extra.label ?? item.label,
              reasons: extra.reasons ?? item.reasons,
              missing: extra.missing ?? item.missing,
            } : item) ?? prev);
            if (extra.checked.length) setCheckedDocs((prev) => ({ ...prev, [id]: extra.checked }));
          })
          .catch(() => undefined);
      },
      hydrateFacility: (id) => {
        if (!hasServerSession() || !/^\d+$/.test(id)) return;
        fetchFacility(id)
          .then((facility) => {
            setRemoteFacilities((prev) => prev?.map((item) => item.id === id ? { ...item, ...facility, policyIds: item.policyIds } : item) ?? prev);
          })
          .catch(() => undefined);
      },
      refreshGap: () => {
        if (!hasServerSession()) {
          setRemoteGap(null);
          return;
        }
        analyzeCareGap(household)
          .then(setRemoteGap)
          .catch(() => setToast("공백 분석을 서버에서 가져오지 못했어요."));
      },
    }),
    [user, connected, household, policies, facilities, districts, results, remoteGap, savedIds, events, checkedDocs, messages, toast, householdId, chatSessionId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const store = useContext(Ctx);
  if (!store) throw new Error("store missing");
  return store;
}

export function newChild(): ChildProfile {
  return { id: `child-${Date.now()}`, nickname: "", grade: "초1", birth: "" };
}

export function gradeFromBirth(birth: string): Grade | null {
  if (!/^\d{4}-\d{2}$/.test(birth)) return null;
  const [year] = birth.split("-").map(Number);
  const grade = new Date().getFullYear() - year - 6;
  if (grade >= 6) return "초6";
  if (grade === 5) return "초5";
  if (grade === 4) return "초4";
  if (grade === 3) return "초3";
  if (grade === 2) return "초2";
  if (grade === 1) return "초1";
  if (grade === 0) return "유치 7세";
  if (grade === -1) return "유치 6세";
  return "유치 5세";
}

export function toggleSituation(list: Situation[], item: Situation) {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}
