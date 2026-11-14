import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, IconButton, Screen } from "../components";
import {
  GRADES,
  SITUATIONS,
  dday,
  gradeBand,
  labelText,
  periodText,
} from "../data";
import type { Grade, Situation } from "../data";
import { Icon } from "../icons";
import { gradeFromBirth, newChild, toggleSituation, useStore } from "../store";

const HOUR_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

export function MyPage() {
  const { user, household, savedIds, events, setNotifyEnabled, logout, results, policies } = useStore();
  const navigate = useNavigate();
  const matches = results.filter((item) => item.label !== "none");
  const savedCount = policies.filter((policy) => savedIds.includes(policy.id)).length;
  const child = household.children[0];
  const name = user?.name ?? "게스트";

  return (
    <Screen nav>
      <Header title="마이페이지" right={<IconButton name="sun" label="설정" onClick={() => navigate("/me/privacy")} />} />
      <div className="scroll with-nav stack">
        <button className="profile" onClick={() => navigate(user ? "/me/edit" : "/login")}>
          <span className="avatar">
            <Icon name="user" size={26} />
            <span className="cam"><Icon name="camera" size={11} /></span>
          </span>
          <span className="grow">
            <span className="row">
              <b className="display" style={{ fontSize: 16 }}>{name} 님</b>
              <span className="chip profile-chip">{user ? "보호자" : "둘러보기"}</span>
            </span>
            <p className="tiny muted">{household.gu} {household.dong} · {child ? child.grade : "자녀 미등록"}</p>
          </span>
          <Icon name="chevron" />
        </button>
        <div className="stats">
          <button onClick={() => navigate("/me/saved")}><strong>{savedCount}</strong><span>저장 정책</span></button>
          <button onClick={() => navigate("/me/schedule")}><strong>{events.length}</strong><span>신청 일정</span></button>
          <button onClick={() => navigate("/match")}><strong>{matches.length}</strong><span>맞춤 혜택</span></button>
        </div>
        <h2 className="display" style={{ fontSize: 15 }}>내 정보 및 설정</h2>
        <div className="menu">
          <button className="menu-row" onClick={() => navigate("/me/saved")}><i className="menu-ico"><Icon name="heart" size={16} /></i>저장한 정책 <Icon name="chevron" /></button>
          <button className="menu-row" onClick={() => navigate("/me/schedule")}><i className="menu-ico"><Icon name="calendar" size={16} /></i>내 신청 일정 <Icon name="chevron" /></button>
          <button className="menu-row" onClick={() => navigate("/me/household")}>
            <i className="menu-ico"><Icon name="file" size={16} /></i>가구 정보 관리
            <em>{household.situations.join(" · ") || "미입력"} · 자녀 {household.children.length}명</em>
            <Icon name="chevron" />
          </button>
          <div className="menu-row">
            <i className="menu-ico"><Icon name="bell" size={16} /></i>알림 설정
            <button className={`toggle ${user?.notify !== false ? "on" : ""}`} aria-pressed={user?.notify !== false} onClick={() => user ? setNotifyEnabled(!(user.notify)) : navigate("/login")}>
              <i />
            </button>
          </div>
          <button className="menu-row" onClick={() => navigate("/me/privacy")}><i className="menu-ico"><Icon name="shield" size={16} /></i>개인정보 및 보안 <Icon name="chevron" /></button>
        </div>
        <button className="logout-btn" onClick={() => { if (user) { logout(); navigate("/home"); } else navigate("/login"); }}>
          <Icon name="logout" size={16} /> 로그아웃
        </button>
      </div>
    </Screen>
  );
}

export function ProfileEditPage() {
  const { user, household, districts, saveHousehold, login, notify } = useStore();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "김용인");
  const [dongText, setDongText] = useState(`${household.gu} ${household.dong}`);
  const [grade, setGrade] = useState(household.children[0]?.grade ?? "초1");
  const [type, setType] = useState(household.situations[0] ?? "맞벌이");
  const [time, setTime] = useState(`${household.careStart}–${household.careEnd}`);

  async function save() {
    const [gu, dong] = dongText.split(" ");
    const [start, end] = time.split("–");
    const ok = await saveHousehold({
      ...household,
      gu: districts[gu] ? gu : household.gu,
      dong: dong || household.dong,
      situations: SITUATIONS.includes(type as Situation) ? [type as Situation] : household.situations,
      careStart: start || household.careStart,
      careEnd: end || household.careEnd,
      schoolEnd: start || household.schoolEnd,
      workEnd: end || household.workEnd,
      children: household.children.length
        ? household.children.map((child, index) => index === 0 ? { ...child, grade: grade as Grade } : child)
        : [{ id: "child-1", nickname: "첫째", grade: grade as Grade, birth: "" }],
    });
    if (!ok) return;
    if (user) login(name, user.email);
    notify("내 정보를 저장했어요.");
    navigate("/me/saved-done");
  }

  return (
    <Screen nav>
      <Header title="내 정보 수정" back />
      <div className="scroll with-nav stack">
        <div className="profile">
          <span className="avatar"><Icon name="user" size={26} /></span>
          <span>
            <b className="display">{name} 님</b>
            <p className="tiny muted">보호자 · {household.gu} {household.dong}</p>
          </span>
        </div>
        <label className="field">이름<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field">거주 지역<input className="input" value={dongText} onChange={(e) => setDongText(e.target.value)} /></label>
        <label className="field">자녀 학년
          <select className="select" value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
            {GRADES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">가구 유형
          <select className="select" value={type} onChange={(e) => setType(e.target.value as Situation)}>
            {SITUATIONS.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="field">필요 돌봄 시간<input className="input" value={time} onChange={(e) => setTime(e.target.value)} placeholder="13:00–18:00" /></label>
        <p className="note">입력한 정보로 맞춤 정책과 돌봄 시간을 다시 계산해요.</p>
        <button className="btn primary" onClick={save}>저장하기</button>
      </div>
    </Screen>
  );
}

function gradeLabel(grade?: string) {
  const match = grade?.match(/^초(\d)$/);
  return match ? `초등 ${match[1]}학년` : grade || "-";
}

export function SavedDonePage() {
  const { user, household } = useStore();
  const navigate = useNavigate();
  const child = household.children[0];
  const rows = [
    ["이름", user?.name ?? "게스트"],
    ["거주 지역", `${household.gu} ${household.dong}`],
    ["자녀 학년", gradeLabel(child?.grade)],
    ["가구 유형", household.situations.join(" · ") || "-"],
    ["필요 돌봄 시간", `${household.careStart}–${household.careEnd}`],
  ];
  return (
    <Screen nav>
      <Header title={<h1 className="saved-title">내 정보 저장 완료</h1>} back />
      <div className="scroll saved-done">
        <div className="saved-hero">
          <div className="done-badge"><span className="done-check"><Icon name="check" size={22} /></span></div>
          <h2>내 정보가 저장되었어요</h2>
          <p>{user?.name ?? "회원"} 님의 정보에 맞춰<br />맞춤 정책과 돌봄 시간을 새롭게 반영했어요.</p>
        </div>
        <div className="saved-block">
          <b>저장한 내 정보</b>
          <div className="saved-card">
            {rows.map(([key, value]) => <div key={key} className="kv"><span>{key}</span><b>{value}</b></div>)}
          </div>
          <p className="saved-hint">우리 가족에게 맞는 정책을 바로 확인해 보세요.</p>
        </div>
      </div>
      <div className="saved-actions">
        <button className="btn primary" onClick={() => navigate("/match")}>맞춤 정책 보기</button>
        <button className="btn ghost" onClick={() => navigate("/me")}>마이페이지로 돌아가기</button>
      </div>
    </Screen>
  );
}

export function SavedPoliciesPage() {
  const { savedIds, toggleSaved, policies, results } = useStore();
  const navigate = useNavigate();
  const items = policies.filter((policy) => savedIds.includes(policy.id));
  return (
    <Screen nav>
      <Header title="저장한 정책" back />
      <div className="scroll with-nav stack">
        <div className="section-title"><b>내가 저장한 정책</b><span>{items.length}개</span></div>
        {items.map((policy) => {
          const result = results.find((item) => item.policy.id === policy.id);
          return (
            <article key={policy.id} className="card policy-card">
              <div className="row">
                <span className="chip deep">{result ? (policy.status === "upcoming" ? "관심 정책" : labelText(result.label)) : "저장"}</span>
                <button className="save on" aria-label="저장 해제" onClick={() => toggleSaved(policy.id)}><Icon name="bookmark" size={14} /></button>
              </div>
              <button className="click" onClick={() => navigate(`/policies/${policy.id}`)}>
                <p className="tiny" style={{ color: "var(--taupe)" }}>{policy.category}</p>
                <h3>{policy.title}</h3>
                <p className="inline-meta coral"><Icon name="calendar" size={14} />{periodText(policy)}{dday(policy) != null ? ` · D-${Math.max(dday(policy) ?? 0, 0)}` : ""}</p>
              </button>
            </article>
          );
        })}
        {items.length === 0 && <p className="empty">저장한 정책이 없어요. 정책 카드의 책갈피를 눌러 보세요.</p>}
        <p className="banner-cream">실시간 이용 현황은 시설에 문의해 주세요.</p>
      </div>
    </Screen>
  );
}

export function HouseholdPage() {
  const { household, districts, saveHousehold, notify } = useStore();
  const [draft, setDraft] = useState(household);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (saving) return;
    if (!draft.gu || !draft.dong) return notify("거주 동네를 선택해 주세요.");
    if (draft.children.length === 0) return notify("자녀를 한 명 이상 등록해 주세요.");
    if (draft.children.some((child) => !child.nickname.trim())) return notify("자녀 닉네임을 입력해 주세요.");
    setSaving(true);
    const ok = await saveHousehold(draft);
    setSaving(false);
    if (!ok) return;
    notify("가족 정보를 저장했어요.");
  }

  return (
    <Screen>
      <Header
        title="우리 가족 정보"
        back
        right={<span className="tiny" style={{ color: "var(--taupe)" }}>1 / 2</span>}
      />
      <div className="scroll stack">
        <label className="field">거주 동네
          <div className="row">
            <select className="select" value={draft.gu} onChange={(e) => setDraft({ ...draft, gu: e.target.value, dong: districts[e.target.value]?.[0] ?? "" })}>
              {Object.keys(districts).map((gu) => <option key={gu}>{gu}</option>)}
            </select>
            <select className="select" value={draft.dong} onChange={(e) => setDraft({ ...draft, dong: e.target.value })}>
              {(districts[draft.gu] ?? []).map((dong) => <option key={dong}>{dong}</option>)}
            </select>
          </div>
        </label>
        <div>
          <p className="label">가정 상황 <span className="faint">(중복 선택)</span></p>
          <div className="chip-row" style={{ marginTop: 8 }}>
            {SITUATIONS.map((item) => (
              <button key={item} className={`choice ${draft.situations.includes(item) ? "on" : ""}`} onClick={() => setDraft({ ...draft, situations: toggleSituation(draft.situations, item) })}>{item}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="label">하교 후 돌봄이 필요한 시간</p>
          <div className="row" style={{ marginTop: 8 }}>
            <select className="select" value={draft.careStart} onChange={(e) => setDraft({ ...draft, careStart: e.target.value, schoolEnd: e.target.value })}>
              {HOUR_OPTIONS.map((time) => <option key={time}>{time}</option>)}
            </select>
            <span>~</span>
            <select className="select" value={draft.careEnd} onChange={(e) => setDraft({ ...draft, careEnd: e.target.value, workEnd: e.target.value })}>
              {HOUR_OPTIONS.map((time) => <option key={`end-${time}`}>{time}</option>)}
            </select>
          </div>
        </div>
        <div className="stack">
          <p className="label">자녀 정보</p>
          <button className="add-dash" onClick={() => setDraft({ ...draft, children: [...draft.children, newChild()] })}>+ 자녀 추가</button>
          {draft.children.map((child, index) => (
            <div key={child.id} className="child-card">
              <div className="row">
                <b>{["첫째", "둘째", "셋째", "넷째"][index] ?? `${index + 1}째`}</b>
                <button className="click coral small" style={{ marginLeft: "auto" }} onClick={() => setDraft({ ...draft, children: draft.children.filter((item) => item.id !== child.id) })}>삭제</button>
              </div>
              <div className="row">
                <input className="input" placeholder="닉네임" value={child.nickname} onChange={(e) => setDraft({ ...draft, children: draft.children.map((item) => item.id === child.id ? { ...item, nickname: e.target.value } : item) })} />
                <select className="select" value={child.grade} onChange={(e) => setDraft({ ...draft, children: draft.children.map((item) => item.id === child.id ? { ...item, grade: e.target.value as Grade } : item) })}>
                  {GRADES.map((grade) => <option key={grade}>{grade}</option>)}
                </select>
              </div>
              <label className="field">생년월
                <input className="input" placeholder="2019-03" value={child.birth} onChange={(e) => {
                  const birth = e.target.value;
                  const auto = gradeFromBirth(birth);
                  setDraft({ ...draft, children: draft.children.map((item) => item.id === child.id ? { ...item, birth, grade: auto ?? item.grade } : item) });
                }} />
              </label>
              {child.birth && <p className="tiny faint">생년월 기준 학년: {gradeBand(child.grade)} · {child.grade}</p>}
            </div>
          ))}
        </div>
        <p className="note">소득 구간은 입력받지 않아요. 소득 조건이 있는 정책은 ‘조건 확인 필요’로 안내돼요.</p>
        <button className="btn primary" onClick={save} disabled={saving}>{saving ? "저장 중" : "저장하기"}</button>
      </div>
    </Screen>
  );
}

export function PrivacyPage() {
  return (
    <Screen>
      <Header title="개인정보 및 보안" back />
      <div className="scroll stack">
        <article className="card policy-card">
          <b>이 브라우저에만 저장</b>
          <p className="small faint">카카오 로그인 이후 가족 정보, 정책 매칭, 서류 체크, 챗봇은 서버와 주고받아요. 저장 정책과 캘린더 일정은 이 브라우저에만 남아요.</p>
        </article>
        <article className="card policy-card">
          <b>소득 정보는 받지 않아요</b>
          <p className="small faint">소득 기준이 있는 정책은 적합하다고 단정하지 않고 조건 확인 필요로 표시합니다.</p>
        </article>
        <article className="card policy-card">
          <b>예시 데이터</b>
          <p className="small faint">정책·시설 숫자와 정원은 화면 확인용 예시예요. 신청 전에는 출처 링크의 공식 페이지를 확인해 주세요. 잔여석은 실시간 값이 아닙니다.</p>
        </article>
        <article className="card policy-card">
          <b>카카오 로그인</b>
          <p className="small faint">버튼은 화면 흐름만 재현해요. 실제 카카오 인증은 붙이지 않았습니다.</p>
        </article>
      </div>
    </Screen>
  );
}
