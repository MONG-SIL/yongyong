import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Header, Screen } from "../components";
import { formatDot, policyEnd, policyStart, weekdayLabel } from "../data";
import { Icon } from "../icons";
import { useStore } from "../store";
import type { AppEvent } from "../store";

function monthMatrix(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function parseDot(value: string) {
  const [year, month, day] = value.split(".").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function daysUntil(dot: string) {
  const target = parseDot(dot);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function chipLabel(event: AppEvent) {
  if (event.kind === "정책") {
    const left = daysUntil(event.date);
    return left >= 0 ? `D-${left}` : "마감";
  }
  if (event.kind === "메모") return "메모";
  if (event.kind === "상담") return "상담";
  return "돌봄";
}

export function CareCalendar() {
  const { events, policies, savedIds, addEvent, notify } = useStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const from = pathname.startsWith("/me") ? "me" : "calendar";
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => formatDot(new Date()));
  const cells = monthMatrix(cursor);
  const monthKey = `${cursor.getFullYear()}.${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const deadlines = events.filter((event) => event.kind === "정책" && event.date.startsWith(monthKey)).length;
  const dayEvents = events.filter((event) => event.date === selected);
  const selectedDate = parseDot(selected);

  function registerSaved() {
    const saved = policies.filter((policy) => savedIds.includes(policy.id));
    const next: Omit<AppEvent, "id">[] = [];
    for (const policy of saved) {
      const end = policyEnd(policy);
      const start = policyStart(policy);
      if (end) {
        const date = formatDot(end);
        const title = `${policy.title} 신청 마감`;
        if (!events.some((event) => event.policyId === policy.id && event.date === date && event.title === title)) {
          next.push({
            date,
            title,
            time: "종일",
            kind: "정책",
            detail: `${end.getMonth() + 1}월 ${end.getDate()}일까지 · 온라인 신청`,
            policyId: policy.id,
          });
        }
      }
      if (start) {
        const date = formatDot(start);
        const title = `${policy.title} 신청 시작`;
        if (!events.some((event) => event.policyId === policy.id && event.date === date && event.title === title)) {
          next.push({
            date,
            title,
            time: "09:00",
            kind: "정책",
            detail: "신청 시작",
            policyId: policy.id,
          });
        }
      }
    }
    next.forEach((event) => addEvent(event));
    notify(next.length ? `저장한 정책에서 일정 ${next.length}건을 등록했어요.` : "등록할 신청 시작일이나 마감일이 없어요.");
  }

  return (
    <Screen nav>
      <Header
        title={<h1 className="care-title">내 돌봄 캘린더</h1>}
        back
        right={<button className="icon-btn cream" aria-label="일정 추가" onClick={() => navigate(`/calendar/new?from=${from}&date=${selected.replaceAll(".", "-")}&tab=memo`)}><Icon name="plus" size={18} /></button>}
      />
      <div className="scroll stack with-nav care-page">
        <div className="care-sum">
          <div>
            <p>{cursor.getMonth() + 1}월 일정</p>
            <b>신청 마감 {deadlines}건</b>
          </div>
          <div className="care-legend">
            <span><i className="gold" />정책</span>
            <span><i className="care" />돌봄</span>
          </div>
        </div>
        <section className="care-cal">
          <div className="cal-head">
            <button className="care-arrow" aria-label="이전 달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><Icon name="back" size={18} /></button>
            <b>{cursor.getFullYear()}년 {cursor.getMonth() + 1}월</b>
            <button className="care-arrow" aria-label="다음 달" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><Icon name="chevron" size={18} /></button>
          </div>
          <div className="cal-grid care-week">
            {"일월화수목금토".split("").map((day) => <span key={day} className={day === "일" ? "sun" : ""}>{day}</span>)}
          </div>
          <div className="cal-grid care-days">
            {cells.map((date) => {
              const key = formatDot(date);
              const outside = date.getMonth() !== cursor.getMonth();
              const marks = events.filter((event) => event.date === key);
              const dot = marks.some((event) => event.kind === "정책") ? "gold" : marks.length ? "care" : "";
              return (
                <button key={key} className={`day ${outside ? "out" : ""} ${selected === key ? "on" : ""}`} onClick={() => setSelected(key)}>
                  {date.getDate()}
                  {dot && <i className={`dot ${dot}`} />}
                </button>
              );
            })}
          </div>
        </section>
        <div className="care-picked">
          <b>{selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 {weekdayLabel(selectedDate)}요일</b>
          <span>일정 {dayEvents.length}개</span>
        </div>
        {dayEvents.map((event) => (
          <button key={event.id} className="care-item" onClick={() => event.policyId && navigate(`/policies/${event.policyId}`)}>
            <span className="when">{event.time}</span>
            <span className="bar" />
            <span className="grow">
              <span className="care-chip">{chipLabel(event)}</span>
              <b>{event.title}</b>
              <small>{event.detail}</small>
            </span>
            <Icon name="chevron" size={14} />
          </button>
        ))}
        {dayEvents.length === 0 && <p className="empty">이 날의 일정이 없어요.</p>}
        <button className="care-alert" onClick={registerSaved}>
          <Icon name="sparkle" size={18} />
          <span>
            <b>놓치기 쉬운 일정을 알려드려요</b>
            저장한 정책의 신청 시작일과 마감일을 자동으로 등록해 드려요!
          </span>
        </button>
        <p className="care-foot">실시간 이용 현황은 시설에 문의해 주세요</p>
      </div>
    </Screen>
  );
}

export function CalendarPage() {
  return <CareCalendar />;
}

export function MySchedulePage() {
  return <CareCalendar />;
}

export function ScheduleFormPage() {
  const [params] = useSearchParams();
  const policyId = params.get("policy") ?? "";
  const requested = params.get("date") ?? "";
  const { addEvent, notify, policies } = useStore();
  const policyFromQuery = policies.find((item) => item.id === policyId);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"일정" | "메모">(params.get("tab") === "schedule" || policyFromQuery ? "일정" : "메모");
  const [date, setDate] = useState(() => /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(policyFromQuery ? `${policyFromQuery.title} 신청 마감` : "");
  const [linkedId, setLinkedId] = useState(policyFromQuery?.id ?? "");
  const [memoTitle, setMemoTitle] = useState("");
  const [memoTime, setMemoTime] = useState("시간 없음");
  const [time, setTime] = useState("종일");
  const [scheduleKind, setScheduleKind] = useState<"신청 시작" | "마감" | "상담">("마감");
  const [alarm, setAlarm] = useState("하루 전 · 오전 9시");
  const [body, setBody] = useState("하원 후 준비물을 챙기고, 돌봄센터에 간식 알레르기를 전달하기");
  const chosen = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const linked = policies.find((item) => item.id === linkedId);
  const backTo = params.get("from") === "calendar" ? "/calendar" : "/me/schedule";

  function pickKind(next: "신청 시작" | "마감" | "상담") {
    setScheduleKind(next);
    setTime(next === "마감" ? "종일" : next === "상담" ? "15:00" : "09:00");
  }

  function save() {
    if (tab === "메모") {
      addEvent({
        date: formatDot(chosen),
        title: memoTitle.trim() || "개인 메모",
        time: memoTime,
        kind: "메모",
        detail: body.trim() || "개인 메모",
      });
      notify("메모를 저장했어요.");
    } else {
      addEvent({
        date: formatDot(chosen),
        title: title.trim() || "신청 일정",
        time,
        kind: scheduleKind === "상담" ? "상담" : "정책",
        detail: alarm,
        policyId: linked?.id,
      });
      notify("신청 일정을 등록했어요.");
    }
    navigate(backTo);
  }

  const label = `${chosen.getFullYear()}년 ${chosen.getMonth() + 1}월 ${chosen.getDate()}일 ${weekdayLabel(chosen)}요일`;

  return (
    <Screen>
      <Header title={<h1 className="plan-title">일정 추가</h1>} back />
      <div className="scroll stack plan-page">
        <div className="plan-tabs">
          <button className={tab === "메모" ? "on" : ""} onClick={() => setTab("메모")}>개인 메모</button>
          <button className={tab === "일정" ? "on" : ""} onClick={() => setTab("일정")}>신청 일정</button>
        </div>
        <label className="plan-date">
          <Icon name="calendar" size={16} />
          <span>
            <small>{tab === "메모" ? "선택한 날짜" : "등록할 날짜"}</small>
            <b>{label}</b>
          </span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        </label>
        {tab === "메모" ? (
          <>
            <label className="plan-block">제목
              <input value={memoTitle} placeholder="메모 제목을 입력하세요" onChange={(e) => setMemoTitle(e.target.value)} />
            </label>
            <label className="plan-block">시간
              <span className="plan-select">
                <Icon name="clock" size={16} />
                <select value={memoTime} onChange={(e) => setMemoTime(e.target.value)}>
                  <option value="시간 없음">시간 없음 · 선택</option>
                  <option>09:00</option>
                  <option>15:00</option>
                  <option>종일</option>
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
            <label className="plan-block">내용
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            </label>
            <p className="plan-hint">개인 메모는 나만 볼 수 있고, 신청 마감 알림과는 따로 저장돼요!</p>
          </>
        ) : (
          <>
            <label className="plan-block">일정 이름
              <input value={title} placeholder="방과후 이용권 신청 마감" onChange={(e) => setTitle(e.target.value)} />
            </label>
            <label className="plan-block">연결 정책
              <span className="plan-select">
                <Icon name="file" size={16} />
                <select value={linkedId} onChange={(e) => {
                  const id = e.target.value;
                  setLinkedId(id);
                  const picked = policies.find((item) => item.id === id);
                  if (picked && !title.trim()) setTitle(`${picked.title} 신청 마감`);
                }}>
                  <option value="">정책을 골라 주세요</option>
                  {policies.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
            <div className="plan-block">일정 종류
              <div className="plan-kinds">
                {(["신청 시작", "마감", "상담"] as const).map((item) => (
                  <button key={item} className={scheduleKind === item ? "on" : ""} type="button" onClick={() => pickKind(item)}>{item}</button>
                ))}
              </div>
            </div>
            <label className="plan-block">시간
              <span className="plan-select">
                <Icon name="clock" size={16} />
                <select value={time} onChange={(e) => setTime(e.target.value)}>
                  <option>종일</option>
                  <option>09:00</option>
                  <option>15:00</option>
                  <option>18:00</option>
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
            <label className="plan-block">알림
              <span className="plan-select">
                <Icon name="bell" size={16} />
                <select value={alarm} onChange={(e) => setAlarm(e.target.value)}>
                  <option>하루 전 · 오전 9시</option>
                  <option>3일 전 · 오후 6시</option>
                  <option>당일 아침</option>
                </select>
                <Icon name="chevron" size={16} />
              </span>
            </label>
          </>
        )}
        <button className="btn primary" onClick={save}>{tab === "메모" ? "메모 저장" : "신청 일정 등록"}</button>
      </div>
    </Screen>
  );
}
