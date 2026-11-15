import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header, IconButton, Screen } from "../components";
import { formatDot, gradeBand } from "../data";
import { Icon } from "../icons";
import { useStore } from "../store";

const HOME_ART = [
  { src: "/home-policy.jpg", alt: "아동 돌봄 정책을 보여주는 구름 캐릭터" },
  { src: "/home-map.jpg", alt: "지도 위 돌봄 장소를 가리키는 구름 캐릭터" },
];

export function SplashPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const timer = window.setTimeout(() => navigate("/home", { replace: true }), 1600);
    return () => window.clearTimeout(timer);
  }, [navigate]);
  return (
    <Screen>
      <button className="scroll" style={{ border: 0, background: "#fff" }} onClick={() => navigate("/home", { replace: true })}>
        <div style={{ minHeight: "70dvh", display: "grid", placeItems: "center", textAlign: "center" }}>
          <div>
            <img src="/logo.png" alt="" width={102} height={102} style={{ borderRadius: 28 }} />
            <p className="display" style={{ fontSize: 32, margin: "12px 0" }}>AI케어용인</p>
            <div style={{ border: "1px solid #e9a23b", borderRadius: 18, padding: "14px 18px", color: "#7f4a1d", fontSize: 15, lineHeight: 1.6 }}>
              우리 가족에게 맞는 돌봄 정책과<br />동네 시설을 한 번에 찾아요
            </div>
          </div>
        </div>
      </button>
    </Screen>
  );
}

export function HomePage() {
  const { household, results, user, acceptTerms, events } = useStore();
  const navigate = useNavigate();
  const matches = results.filter((item) => item.label !== "none");
  const child = household.children[0];
  const band = child ? gradeBand(child.grade) : "자녀 정보 없음";
  const [art] = useState(() => HOME_ART[Math.floor(Math.random() * HOME_ART.length)]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const todayEvents = events
    .filter((event) => event.date === formatDot(new Date()))
    .sort((a, b) => timeRank(a.time) - timeRank(b.time));
  const soonEvents = events
    .filter((event) => {
      const left = daysFromToday(event.date);
      return left >= 1 && left <= 7;
    })
    .sort((a, b) => daysFromToday(a.date) - daysFromToday(b.date) || timeRank(a.time) - timeRank(b.time));
  const noticeEvents = todayEvents.length > 0 ? todayEvents : soonEvents;
  useEffect(() => {
    if (!noticeOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNoticeOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [noticeOpen]);
  return (
    <Screen nav>
      <Header
        title={
          <div className="brand-row">
            <img className="logo" src="/logo.png" alt="" />
            <strong>아이케어 용인</strong>
          </div>
        }
        right={<IconButton name="bell" label="알림" onClick={() => setNoticeOpen(true)} />}
      />
      <div className="scroll with-nav stack home-scroll">
        {user?.termsRequired && (
          <button className="btn primary" onClick={acceptTerms}>서비스 약관과 개인정보 수집에 동의하고 계속하기</button>
        )}
        <div>
          <div className="hero">
            <p className="eyebrow">용인시 맞춤 돌봄 플랫폼</p>
            <h2>우리 아이에게 꼭 맞는<br />돌봄을 찾아드려요</h2>
            <p className="tiny" style={{ color: "rgba(127,74,29,.83)" }}>흩어진 돌봄·배움 정보를 한 곳에서</p>
          </div>
          <button className="quick-card" onClick={() => navigate("/me/household")}>
            <div className="row">
              <span className="loc-icon" style={{ background: "rgba(127,74,29,.8)" }}><Icon name="pin" size={14} /></span>
              <div className="grow">
                <p className="tiny muted">우리 동네</p>
                <p className="display" style={{ fontSize: 15 }}>{household.gu} {household.dong}</p>
              </div>
              <Icon name="chevron" size={18} />
            </div>
            <div className="chip-row nowrap" style={{ marginTop: 12 }}>
              <span className="chip">{band}</span>
              <span className="chip">{household.careStart}–{household.careEnd}</span>
              <span className="small bold" style={{ marginLeft: "auto", color: "rgba(127,74,29,.8)" }}>수정</span>
            </div>
          </button>
        </div>
        <button className="match-banner" onClick={() => navigate("/match")}>
          <span className="round" style={{ width: 38, height: 38, background: "#e2a957" }}><Icon name="sparkle" size={18} /></span>
          <span className="grow">
            <b className="display" style={{ fontSize: 13 }}><span className="coral">맞춤 혜택</span>을 찾아보세요!</b>
            <p className="tiny faint"><span className="coral">총 {matches.length}건</span>의 지원 정책이 있어요</p>
          </span>
          <Icon name="chevron" size={18} />
        </button>
        <div className="section-title">
          <h2>주요 서비스</h2>
          <button className="click linkish" onClick={() => navigate("/services")}>전체보기</button>
        </div>
        <div className="quick-grid">
          {[
            ["filter", "정책 필터", "/policies"],
            ["bot", "AI 챗봇", "/chat"],
            ["chart", "공백 분석", "/gap"],
          ].map(([icon, label, to]) => (
            <button key={label} className="quick" onClick={() => navigate(to)}>
              <i><Icon name={icon} size={22} /></i>
              {label}
            </button>
          ))}
        </div>
        <div className="home-panel">
          <img src={art.src} alt={art.alt} />
        </div>
      </div>
      {noticeOpen && (
        <div className="notice-backdrop" onClick={() => setNoticeOpen(false)}>
          <section
            className="notice-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="today-notice-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="notice-head">
              <h2 id="today-notice-title">{todayEvents.length > 0 ? "오늘 일정" : "7일 이내 일정"}</h2>
              <button className="icon-btn cream" aria-label="닫기" onClick={() => setNoticeOpen(false)}>
                <Icon name="close" size={16} />
              </button>
            </div>
            {noticeEvents.length === 0 ? (
              <p className="notice-empty">7일 이내 예정된 일정이 없어요.</p>
            ) : (
              <div className="notice-list">
                {noticeEvents.map((event) => (
                  <article key={event.id} className="notice-item">
                    <span className="chip deep">{event.kind}</span>
                    <h3>{event.title}</h3>
                    <p>{noticeWhen(event.date, event.time, todayEvents.length > 0)}</p>
                    {event.detail && <p className="detail">{event.detail}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </Screen>
  );
}

function timeRank(time: string) {
  if (!time || time === "종일") return -1;
  const [hour, minute] = time.split(":").map(Number);
  if (Number.isNaN(hour)) return 0;
  return hour * 60 + (minute || 0);
}

function daysFromToday(dot: string) {
  const [year, month, day] = dot.split(".").map(Number);
  if (!year || !month || !day) return Number.NaN;
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function noticeWhen(date: string, time: string, today: boolean) {
  if (today) return time;
  const left = daysFromToday(date);
  return `${date.slice(5)} · D-${left} · ${time}`;
}

export function ServicesPage() {
  const navigate = useNavigate();
  const items = [
    ["정책 찾기", "학년·태그·신청 상태로 둘러보기", "/policies"],
    ["우리 가족 맞춤", "해당 가능 / 확인 필요 / 해당 없음", "/match"],
    ["돌봄 지도", "동네 시설 위치와 운영 정보", "/map"],
    ["시설 목록", "가까운 순으로 센터 비교", "/facilities"],
    ["공백 분석", "하교부터 퇴근까지 시간 채우기", "/gap"],
    ["AI 돌봄 챗봇", "등록된 자료 안에서만 답변", "/chat"],
    ["내 돌봄 캘린더", "신청 마감과 상담 일정", "/calendar"],
    ["가족 정보", "동네, 학년, 필요 시간", "/me/household"],
  ];
  return (
    <Screen nav>
      <Header title="전체 서비스" back />
      <div className="scroll with-nav stack">
        {items.map(([title, desc, to]) => (
          <button key={title} className="card policy-card" onClick={() => navigate(to)}>
            <b>{title}</b>
            <p className="small faint">{desc}</p>
          </button>
        ))}
      </div>
    </Screen>
  );
}

export function NotificationsPage() {
  const { events, user } = useStore();
  return (
    <Screen>
      <Header title="알림" back />
      <div className="scroll stack">
        <p className="small faint">푸시 대신 이 목록과 캘린더 등록으로 일정을 확인해요. {user?.notify === false ? "알림 수신이 꺼져 있어요." : "알림 수신이 켜져 있어요."}</p>
        {events.map((event) => (
          <article key={event.id} className="card policy-card">
            <span className="chip deep">{event.kind}</span>
            <h3>{event.title}</h3>
            <p className="small gold">{event.date} · {event.time}</p>
            <p className="small faint">{event.detail}</p>
          </article>
        ))}
        <article className="card policy-card">
          <span className="chip">안내</span>
          <h3>소득 구간은 입력하지 않아요</h3>
          <p className="small faint">소득 조건이 있는 정책은 ‘조건 확인 필요’로만 보여 드려요.</p>
        </article>
      </div>
    </Screen>
  );
}

export function AuthPage() {
  const [tab, setTab] = useState<"login" | "join">("login");
  const [show, setShow] = useState(false);
  const [keep, setKeep] = useState(true);
  const [agree, setAgree] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const { notify, startKakao } = useStore();
  const set = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  function submit() {
    setError("");
    if (!form.email.includes("@") || form.password.length < 8) {
      setError("이메일 형식과 8자 이상 비밀번호를 확인해 주세요.");
      return;
    }
    if (tab === "join") {
      if (!form.name.trim()) return setError("이름을 입력해 주세요.");
      if (form.password !== form.confirm) return setError("비밀번호가 서로 달라요.");
      if (!agree) return setError("이용약관 동의가 필요해요.");
    }
    notify("이메일 로그인은 서버에 없어요. 카카오 로그인을 사용해 주세요.");
  }

  function kakao() {
    startKakao();
  }

  return (
    <Screen>
      <div className="auth-bg">
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="" width={52} height={52} style={{ borderRadius: 16 }} />
          <p className="display" style={{ fontSize: 24, margin: "6px 0 0" }}>아이케어 용인</p>
          <p className="small muted">우리 가족에게 맞는 돌봄을 더 가깝게</p>
        </div>
        <div className="auth-card">
          <div className="tabs">
            <button className={tab === "login" ? "on" : ""} onClick={() => setTab("login")}>로그인</button>
            <button className={tab === "join" ? "on" : ""} onClick={() => setTab("join")}>회원가입</button>
          </div>
          {tab === "join" && (
            <label className="field">이름
              <input className="input" placeholder="이름을 입력해 주세요" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
          )}
          <label className="field">이메일
            <input className="input" placeholder="이메일 주소를 입력해 주세요" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
          <label className="field">비밀번호
            <span style={{ position: "relative" }}>
              <input className="input" type={show ? "text" : "password"} placeholder="8자 이상 입력해 주세요" value={form.password} onChange={(e) => set("password", e.target.value)} />
              <button className="eye" type="button" aria-label="비밀번호 표시" onClick={() => setShow((v) => !v)}><Icon name="eye" /></button>
            </span>
          </label>
          {tab === "join" && (
            <>
              <label className="field">비밀번호 확인
                <input className="input" type="password" placeholder="비밀번호를 한 번 더 입력해 주세요" value={form.confirm} onChange={(e) => set("confirm", e.target.value)} />
              </label>
              <label className="checkline">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                이용약관 및 개인정보 처리방침에 동의합니다
              </label>
            </>
          )}
          {tab === "login" && (
            <div className="row" style={{ justifyContent: "space-between" }}>
              <label className="checkline"><input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />로그인 유지</label>
              <Link to="/find-password" className="tiny" style={{ color: "rgba(120,120,120,.8)" }}>비밀번호 찾기</Link>
            </div>
          )}
          {error && <p className="tiny coral">{error}</p>}
          <button className="btn primary" onClick={submit}>{tab === "login" ? "로그인" : "가입하기"}</button>
          <div className="divider"><i /><span>또는</span><i /></div>
          <button className="btn kakao" onClick={kakao}><i style={{ width: 8, height: 8, borderRadius: 4, background: "#fee500" }} />카카오로 {tab === "login" ? "3초 만에 시작하기" : "시작하기"}</button>
          <p className="tiny" style={{ color: "#9e9e9e", textAlign: "center" }}>계속하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.</p>
        </div>
        <p className="help"><span className="help-check"><Icon name="check" size={11} /></span>용인시민의 개인정보를 안전하게 보호해요</p>
      </div>
    </Screen>
  );
}

export function FindPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [left, setLeft] = useState(0);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const { notify } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sent || left <= 0) return;
    const timer = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [sent, left]);

  function send() {
    if (!email.includes("@")) return setError("이메일 주소를 확인해 주세요.");
    setError("");
    setSent(true);
    setLeft(180);
    notify("인증번호를 보냈어요. 데모에서는 아무 6자리나 입력하면 통과해요.");
  }

  function change() {
    if (!sent || code.length < 6) return setError("인증번호 6자리를 입력해 주세요.");
    if (next.length < 8 || next !== confirm) return setError("새 비밀번호가 8자 이상이고 서로 같아야 해요.");
    notify("비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.");
    navigate("/login");
  }

  const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <Screen>
      <Header title="비밀번호 찾기" back />
      <div className="scroll stack">
        <label className="field">이메일
          <input className="input" value={email} placeholder="이메일 주소를 입력해 주세요" onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button className="btn soft" onClick={send} disabled={sent && left > 0}>{sent ? `전송 완료 ${left > 0 ? clock : ""}` : "인증번호 전송"}</button>
        <label className="field">인증번호 입력
          <input className="input" value={code} placeholder="인증번호 6자리" onChange={(e) => setCode(e.target.value)} />
        </label>
        <label className="field">새 비밀번호
          <input className="input" type="password" value={next} placeholder="8자 이상" onChange={(e) => setNext(e.target.value)} />
        </label>
        <label className="field">새 비밀번호 확인
          <input className="input" type="password" value={confirm} placeholder="한 번 더 입력" onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="tiny coral">{error}</p>}
        <button className="btn primary" onClick={change}>비밀번호 변경</button>
        <button className="click small" onClick={() => navigate("/login")}>로그인 페이지로 이동</button>
      </div>
    </Screen>
  );
}
