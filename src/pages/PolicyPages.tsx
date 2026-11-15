import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header, IconButton, Screen } from "../components";
import {
  dday,
  googleCalendarUrl,
  icsFor,
  labelText,
  periodText,
  policyEnd,
  policyStart,
  statusText,
} from "../data";
import type { Category, DocumentItem, PolicyStatus } from "../data";
import { fetchMatchedPolicies } from "../api";
import { Icon } from "../icons";
import { useStore } from "../store";
import type { RemoteMatch } from "../api";

const LIST_TAGS = ["전체", "돌봄", "교육비", "가족", "생활"] as const;

export function PolicyListPage() {
  const { household, savedIds, toggleSaved, results, policies } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<(typeof LIST_TAGS)[number]>("전체");
  const [sort, setSort] = useState<"추천순" | "마감 임박순" | "혜택순">("추천순");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"all" | PolicyStatus>("all");
  const counts = useMemo(() => {
    const next: Record<string, number> = { 전체: policies.length };
    for (const policy of policies) next[policy.category] = (next[policy.category] ?? 0) + 1;
    return next;
  }, [policies]);
  const matched = results;

  const items = useMemo(() => {
    const rows = matched.filter(({ policy }) => {
      const text = `${policy.title} ${policy.benefit} ${policy.category}`.includes(query.trim());
      const tagOk = tag === "전체" || policy.category === tag || policy.tags.includes(tag as Category);
      const statusOk = status === "all" || policy.status === status;
      return text && tagOk && statusOk;
    });
    const rank = { eligible: 0, check: 1, none: 2 };
    rows.sort((a, b) => {
      if (sort === "혜택순") return b.policy.benefitAmount - a.policy.benefitAmount;
      if (sort === "마감 임박순") return (dday(a.policy) ?? 999) - (dday(b.policy) ?? 999);
      return rank[a.label] - rank[b.label];
    });
    return rows;
  }, [matched, query, tag, sort, status]);

  const shown = items.filter((item) => item.label !== "none" || item.policy.status === "upcoming");

  return (
    <Screen nav>
      <Header title="맞춤 정책 찾기" right={<IconButton name="bookmark" label="저장한 정책" onClick={() => navigate("/me/saved")} />} />
      <div className="scroll with-nav stack">
        <div className="searchbar">
          <Icon name="search" size={18} />
          <input placeholder="지원 정책을 검색해 보세요" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="click" aria-label="필터" onClick={() => setOpen(true)}><Icon name="filter" size={18} /></button>
        </div>
        <div className="chip-row fit">
          {LIST_TAGS.map((item) => (
            <button key={item} className={`chip ${tag === item ? "solid" : "plain"}`} onClick={() => setTag(item)}>
              {item} {counts[item] ?? 0}
            </button>
          ))}
        </div>
        <div className="section-title">
          <p><b>{household.dong} 맞춤 정책</b> <span className="small faint">총 {shown.length}건</span></p>
          <button className="click small muted sort-toggle" onClick={() => setSort(sort === "추천순" ? "마감 임박순" : sort === "마감 임박순" ? "혜택순" : "추천순")}>
            {sort} <Icon name="chevron" size={12} />
          </button>
        </div>
        {shown.map(({ policy, label }) => {
          const left = dday(policy);
          const saved = savedIds.includes(policy.id);
          const badge = policy.status === "upcoming" ? "관심 정책" : label === "eligible" ? "해당 가능" : label === "check" ? "조건 확인" : "해당 없음";
          return (
            <article key={policy.id} className="card policy-card">
              <div className="row">
                <span className="chip deep">{badge}</span>
                <button className={`save ${saved ? "on" : ""}`} aria-label="저장" onClick={() => toggleSaved(policy.id)}>
                  <Icon name="bookmark" size={14} />
                </button>
              </div>
              <button className="click" onClick={() => navigate(`/policies/${policy.id}`)}>
                <p className="tiny bold" style={{ color: "var(--taupe)" }}>{policy.category}</p>
                <h3>{policy.title}</h3>
                <p className="inline-meta" style={{ color: "rgba(232,78,78,.76)", marginTop: 4 }}>
                  <Icon name="calendar" size={14} /> {periodText(policy)}
                </p>
              </button>
              {policy.status === "open" && left != null && left >= 0 && left <= 10 && (
                <button className="deadline" onClick={() => navigate(`/policies/${policy.id}/period`)}>
                  <b>D-{left}</b>
                  <span>마감 전에 신청 일정을 등록해 보세요</span>
                </button>
              )}
            </article>
          );
        })}
        {items.length === 0 && <p className="empty">조건에 맞는 정책이 없어요. 필터를 넓혀 보세요.</p>}
      </div>
      {open && (
        <div className="sheet" onClick={() => setOpen(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <b>신청 상태</b>
            <div className="chip-row">
              {([["all", "전체"], ["open", "신청 중"], ["upcoming", "예정"], ["always", "상시"], ["closed", "마감"]] as const).map(([id, name]) => (
                <button key={id} className={`filter-pill ${status === id ? "on" : ""}`} onClick={() => setStatus(id)}>{name}</button>
              ))}
            </div>
            <button className="btn primary" onClick={() => setOpen(false)}>적용</button>
          </div>
        </div>
      )}
    </Screen>
  );
}

const MATCH_TAGS = ["전체", "돌봄", "방과후", "예체능"] as const;

function matchBadge(label: "eligible" | "check" | "none", status: PolicyStatus) {
  if (status === "upcoming") return { text: "신청 예정", kind: "soon" };
  if (label === "eligible") return { text: "해당 가능", kind: "eligible" };
  if (label === "check") return { text: "조건 확인 필요", kind: "check" };
  return { text: "해당 없음", kind: "none" };
}

function matchReason(label: "eligible" | "check" | "none", reasons: string[], missing: string[]) {
  if (label === "none") return missing.join(" · ");
  if (label === "check") return [reasons.map((reason) => `✓ ${reason}`).join(" · "), missing.length ? `? ${missing.join(" · ")}` : ""].filter(Boolean).join(" · ");
  return reasons.map((reason) => `✓ ${reason}`).join(" · ");
}

export function MatchPage() {
  const { household, results, connected, notify } = useStore();
  const navigate = useNavigate();
  const [tag, setTag] = useState<(typeof MATCH_TAGS)[number]>("전체");
  const [openOnly, setOpenOnly] = useState(false);
  const [sort, setSort] = useState<"마감 임박순" | "혜택순">("마감 임박순");
  const [remote, setRemote] = useState<RemoteMatch[] | null>(null);

  useEffect(() => {
    if (!connected || tag === "전체") return;
    let cancel = false;
    fetchMatchedPolicies(tag)
      .then((rows) => { if (!cancel) setRemote(rows); })
      .catch(() => { if (!cancel) { setRemote(null); notify("맞춤 정책을 다시 불러오지 못했어요."); } });
    return () => { cancel = true; };
  }, [connected, notify, tag]);

  const source = tag === "전체" || !remote
    ? results.filter((item) => tag === "전체" || item.policy.category === tag || item.policy.tags.includes(tag))
    : remote;
  const rows = source
    .filter((item) => !openOnly || item.policy.status === "open" || item.policy.status === "always")
    .sort((a, b) => sort === "혜택순" ? b.policy.benefitAmount - a.policy.benefitAmount : (dday(a.policy) ?? 999) - (dday(b.policy) ?? 999));
  const ok = rows.filter((item) => item.label === "eligible").length;
  const check = rows.filter((item) => item.label === "check").length;
  const child = household.children.map((item) => item.grade).join("·") || "자녀 없음";

  return (
    <Screen nav>
      <div className="match-head">
        <div className="match-title">
          <div>
            <p>[{household.dong}] · {household.situations.join(" · ") || "가정 상황 없음"} · {child}</p>
            <h1>우리 가족 맞춤 정책</h1>
          </div>
          <button type="button" onClick={() => navigate("/me/household")}>조건 수정</button>
        </div>
        <div className="match-filters">
          {MATCH_TAGS.map((item) => (
            <button key={item} type="button" className={tag === item ? "on" : ""} onClick={() => { setRemote(null); setTag(item); }}>{item}</button>
          ))}
          <button type="button" className={openOnly ? "on" : ""} onClick={() => setOpenOnly((value) => !value)}>신청 중 ▾</button>
        </div>
      </div>
      <div className="scroll with-nav stack match-page">
        <div className="match-tools">
          <span>해당 가능 {ok}건 · 확인 필요 {check}건</span>
          <button type="button" onClick={() => setSort(sort === "마감 임박순" ? "혜택순" : "마감 임박순")}>{sort} ▾</button>
        </div>
        {rows.length === 0 && <p className="empty">조건에 맞는 정책이 없어요.</p>}
        {rows.map(({ policy, label, reasons, missing }) => {
          const badge = matchBadge(label, policy.status);
          const reason = matchReason(label, reasons, missing);
          return (
            <button key={policy.id} className={`match-card${label === "none" ? " dim" : ""}`} onClick={() => navigate(`/policies/${policy.id}`)}>
              <div className="row">
                <span className={`match-badge ${badge.kind}`}>{badge.text}</span>
                <span className="match-cat">{policy.category}</span>
              </div>
              <h3>{policy.title}</h3>
              {policy.benefit && <p className="benefit">{policy.benefit}</p>}
              {reason && <p className="why">{reason}</p>}
            </button>
          );
        })}
        <p className="match-foot">실시간 이용 현황은 시설에 문의해 주세요.</p>
      </div>
    </Screen>
  );
}

export function PolicyDetailPage() {
  const { id = "" } = useParams();
  const { policies, results, toggleDoc, checkedDocs, notify, addEvent, hydratePolicy, connected } = useStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState<"자격" | "혜택" | "">("");
  const policy = policies.find((item) => item.id === id);
  useEffect(() => { if (id) hydratePolicy(id); }, [hydratePolicy, id]);
  if (!policy) return <Screen><Header title="정책 상세" back /><p className="empty">정책을 찾지 못했어요.</p></Screen>;
  const result = results.find((item) => item.policy.id === policy.id) ?? { policy, label: "check" as const, reasons: [], missing: [] };
  const checked = checkedDocs[policy.id] ?? [];
  const end = policyEnd(policy);
  const left = dday(policy);

  function saveCalendar() {
    const date = end ?? new Date();
    addEvent({
      date: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`,
      title: `${policy!.title} 신청`,
      time: "종일",
      kind: "정책",
      detail: periodText(policy!),
      policyId: policy!.id,
    });
    const blob = new Blob([icsFor(policy!.title, date, policy!.benefit)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${policy!.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    window.open(googleCalendarUrl(policy!.title, date, policy!.applyUrl), "_blank", "noopener");
    notify("캘린더 파일을 받고 구글 캘린더 등록 화면을 열었어요.");
    navigate("/calendar");
  }

  return (
    <Screen>
      <Header title="정책 상세" back />
      <div className="scroll stack">
        <div className="chip-row">
          <span className="chip deep">{labelText(result.label)}</span>
          <span className="chip pink">{statusText(policy)}{left != null && policy.status === "open" ? ` · D-${Math.max(left, 0)}` : ""}</span>
        </div>
        <h2 style={{ margin: 0, fontSize: 22 }}>{policy.title}</h2>
        <p className="small muted">{policy.org}</p>
        <div className="card" style={{ padding: 14 }}>
          <b className="small">AI 요약 · 우리 가족 맞춤 팁</b>
          <p className="small" style={{ marginTop: 8, lineHeight: 1.55 }}>{policy.tip}</p>
          {!connected && <p className="tiny faint" style={{ marginTop: 6 }}>로그인 전에는 예시 자료로 만든 요약이에요.</p>}
        </div>
        <div style={{ background: "rgba(233,162,59,.77)", color: "#fff", borderRadius: 12, padding: "12px 14px" }}>
          <b className="small">매칭 이유</b>
          <p className="small" style={{ marginTop: 6 }}>
            {result.reasons.map((reason) => `✓ ${reason}`).join(" · ") || "맞는 조건이 없어요."}
            {result.missing.length > 0 ? ` · ? ${result.missing.join(" · ")}` : ""}
          </p>
        </div>
        <div className="accordion">
          <button className="acc-btn" onClick={() => setOpen(open === "자격" ? "" : "자격")}>
            신청 자격 <span className="source">{open === "자격" ? "접기" : "펼치기"} ▾</span>
          </button>
          {open === "자격" && <p className="small" style={{ padding: "8px 4px 12px" }}>{policy.eligibility}</p>}
          <button className="acc-btn" onClick={() => setOpen(open === "혜택" ? "" : "혜택")}>
            지원 혜택 <span className="source">{open === "혜택" ? "접기" : "펼치기"} ▾</span>
          </button>
          {open === "혜택" && (
            <p className="small" style={{ padding: "8px 4px 12px" }}>
              {[policy.benefit, policy.benefitAmount ? `최대 ${policy.benefitAmount.toLocaleString("ko-KR")}원` : ""].filter(Boolean).join(" · ") || "등록된 지원 내용이 없어요."}
            </p>
          )}
          <div style={{ padding: "12px 4px", borderBottom: "1px solid var(--taupe)" }}>
            <div className="row">
              <b>필요 서류</b>
              <button className="click small" style={{ marginLeft: "auto" }} onClick={() => navigate(`/policies/${policy.id}/docs`)}>전체 보기</button>
            </div>
            {policy.documents.slice(0, 3).map((doc) => (
              <label key={doc.id} className="checkline" style={{ marginTop: 8 }}>
                <input type="checkbox" checked={checked.includes(doc.id)} onChange={() => toggleDoc(policy.id, doc.id)} />
                {doc.name}
              </label>
            ))}
          </div>
          <button className="acc-btn" onClick={() => navigate(`/policies/${policy.id}/period`)}>
            신청 기간 <span className="source">{periodText(policy)}</span>
          </button>
        </div>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <p className="source grow">출처: {policy.source} · 기준일 {new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, "0")}.{String(new Date().getDate()).padStart(2, "0")}</p>
          {policy.facilityIds.length > 0 && (
            <button className="click small bold" style={{ textDecoration: "underline" }} onClick={() => navigate(`/facilities/${policy.facilityIds[0]}`)}>관련 시설 보기 ›</button>
          )}
        </div>
      </div>
      <div className="footer-actions">
        <button className="btn ghost" onClick={saveCalendar}>캘린더 등록</button>
        <a className="btn primary" href={policy.applyUrl} target="_blank" rel="noreferrer">신청하러 가기 ↗</a>
      </div>
    </Screen>
  );
}

const ISSUE_BY_NAME: Record<string, string> = {
  재직증명서: "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=00000000008",
  재학증명서: "https://www.gov.kr/mw/AA020InfoCappView.do?CappBizCD=13410000017",
};

function issueHref(doc: DocumentItem) {
  if (doc.issueUrl) return doc.issueUrl;
  const name = doc.name.replace(/\s/g, "");
  return ISSUE_BY_NAME[name] ?? "";
}

function issuerLabel(doc: DocumentItem) {
  if (doc.issuer) return doc.issuer;
  if (!doc.issueUrl) return "";
  try {
    const host = new URL(doc.issueUrl).hostname;
    return host === "www.gov.kr" || host === "gov.kr" ? "정부24" : "신청 페이지";
  } catch {
    return "신청 페이지";
  }
}

function DocRing({ ratio }: { ratio: number }) {
  const radius = 22;
  const length = 2 * Math.PI * radius;
  return (
    <div className="doc-ring" aria-label={`${ratio}%`}>
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={radius} fill="#ededed" />
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(232,78,78,0.76)"
          strokeWidth="4"
          strokeDasharray={`${length * ratio / 100} ${length}`}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <b>{ratio}%</b>
    </div>
  );
}

export function DocumentsPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { policies, checkedDocs, toggleDoc, notify, hydratePolicy } = useStore();
  const policy = policies.find((item) => item.id === id);
  const hydrateRef = useRef(hydratePolicy);
  hydrateRef.current = hydratePolicy;
  useEffect(() => { if (id) hydrateRef.current(id); }, [id]);
  if (!policy) return <Screen><Header title="필요 서류" back /><p className="empty">정책을 찾지 못했어요.</p></Screen>;
  const checked = checkedDocs[policy.id] ?? [];
  const ratio = policy.documents.length ? Math.round((checked.length / policy.documents.length) * 100) : 0;
  return (
    <Screen>
      <Header
        title={<h1 className="docs-title">필요 서류</h1>}
        back
        right={<button className="icon-btn cream" aria-label="공유" onClick={() => navigate("/share")}><Icon name="share" size={18} /></button>}
      />
      <div className="scroll stack docs-page">
        <div className="doc-summary">
          <span className="doc-file"><Icon name="file" size={28} /></span>
          <div className="grow">
            <p className="doc-policy">{policy.title}</p>
            <p className="doc-ask"><span>서류</span> <span>{policy.documents.length}개</span>를 준비해 주세요</p>
            <p className="doc-ready">현재 {checked.length}개 준비 완료</p>
          </div>
          <DocRing ratio={ratio} />
        </div>
        <p className="doc-guide"><Icon name="info" size={16} />모든 서류는 신청일 기준 3개월 이내 발급본이 필요해요.</p>
        <div className="section-title"><h2>서류 체크리스트</h2><span>발급처 안내</span></div>
        {policy.documents.map((doc) => {
          const done = checked.includes(doc.id);
          const issuer = issuerLabel(doc);
          const href = issueHref(doc);
          return (
            <div key={doc.id} className={`doc-card${done ? " on" : ""}`}>
              <button type="button" className={`doc-box${done ? " on" : ""}`} aria-pressed={done} aria-label={`${doc.name} ${done ? "완료 해제" : "완료"}`} onClick={() => toggleDoc(policy.id, doc.id)}>
                {done && <Icon name="check" size={12} />}
              </button>
              <div className="grow">
                <b>{doc.name}</b>
                {doc.note && <p>{doc.note}</p>}
                {issuer && <p className="doc-src"><Icon name="pin" size={12} />{issuer}</p>}
              </div>
              {done ? (
                <span className="doc-state done"><Icon name="check" size={12} />완료</span>
              ) : href ? (
                <a className="doc-state" href={href} target="_blank" rel="noreferrer">발급하기</a>
              ) : (
                <button type="button" className="doc-state" onClick={() => notify(`${doc.name} 발급 페이지가 아직 없어요.`)}>발급하기</button>
              )}
            </div>
          );
        })}
        <button type="button" className="doc-keep" onClick={() => notify("서류 사진 보관은 준비 중이에요.")}>
          <Icon name="camera" size={20} />
          <span>
            <b>서류를 미리 보관할 수 있어요</b>
            <small>사진을 등록하면 신청할 때 편리해요</small>
          </span>
          <Icon name="chevron" size={16} />
        </button>
        <button className="btn primary" onClick={() => notify(checked.length === policy.documents.length ? "서류 준비를 완료로 표시했어요." : "아직 남은 서류가 있어요.")}>서류 준비 완료</button>
      </div>
    </Screen>
  );
}

export function PeriodPage() {
  const { id = "" } = useParams();
  const { policies } = useStore();
  const policy = policies.find((item) => item.id === id);
  const navigate = useNavigate();
  if (!policy) return <Screen><Header title="상세 보기" back /><p className="empty">정책을 찾지 못했어요.</p></Screen>;
  const start = policyStart(policy);
  const end = policyEnd(policy);
  const ranged = Boolean(start && end);
  const focus = end ?? new Date();
  const year = focus.getFullYear();
  const month = focus.getMonth();
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first).fill(0), ...Array.from({ length: days }, (_, i) => i + 1)];
  const span = ranged ? Math.round((end!.getTime() - start!.getTime()) / 86400000) + 1 : null;
  const period = periodText(policy);
  const always = span == null && (policy.status === "always" || period.includes("상시"));
  const sameMonth = ranged && start!.getFullYear() === end!.getFullYear() && start!.getMonth() === end!.getMonth();
  const note = sameMonth
    ? `색이 칠해진 ${start!.getDate()}일부터 ${end!.getDate()}일까지가 신청 기간이에요!`
    : ranged
      ? `색이 칠해진 ${period}이 신청 기간이에요!`
      : always
        ? "상시 신청할 수 있는 정책이에요."
        : period;
  return (
    <Screen>
      <Header title={<h1 className="period-title">상세 보기</h1>} back />
      <div className="scroll stack period-page">
        <span className="chip alert">{policy.category}</span>
        <h2 className="period-name">{policy.title}</h2>
        <div className="apply-range">
          <div>
            <p>신청 가능 기간</p>
            <b className={span == null && period.length > 18 ? "sentence" : ""}>{period}</b>
          </div>
          {(span != null || always) && <b className="period-count">{span != null ? `${span}일` : "상시"}</b>}
        </div>
        <div className="period-cal">
          <b>{year}년 {month + 1}월</b>
          <div className="cal-grid weekdays">
            {"일월화수목금토".split("").map((label, index) => <span key={label} className={index === 0 ? "sun" : ""}>{label}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((day, index) => {
              const date = day ? new Date(year, month, day) : null;
              const edge = Boolean(date && start && end && (sameDay(date, start) || sameDay(date, end)));
              const inRange = Boolean(date && start && end && date >= start && date <= end && !edge);
              return <span key={index} className={`day${inRange ? " range" : ""}${edge ? " on" : ""}`}>{day || ""}</span>;
            })}
          </div>
        </div>
        <p className="period-note">{note}<br />내 캘린더에도 같은 구간이 표시됩니다.</p>
        <button className="btn primary" onClick={() => navigate(`/calendar/new?policy=${policy.id}`)}>내 캘린더에 추가</button>
      </div>
    </Screen>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
