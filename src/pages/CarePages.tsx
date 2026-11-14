import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Screen } from "../components";
import { SUGGESTED_QUESTIONS, analyzeGap, fromMinutes, labelText } from "../data";

const TIME_OPTIONS = Array.from({ length: 28 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});
import { Icon } from "../icons";
import { useStore } from "../store";

export function GapPage() {
  const { household, updateHousehold, remoteGap, refreshGap, results, connected } = useStore();
  const navigate = useNavigate();
  const gapKey = `${connected}|${household.schoolEnd}|${household.workEnd}|${household.careStart}|${household.careEnd}`;
  useEffect(() => { refreshGap(); }, [gapKey]);
  const gap = remoteGap ?? analyzeGap(household);
  const policies = results.filter((item) => item.label !== "none" && (item.policy.category === "돌봄" || item.policy.tags.includes("돌봄"))).slice(0, 3);
  const hours = Math.floor(gap.gap / 60);
  const clock = `${hours}:${String(gap.gap % 60).padStart(2, "0")}`;
  const coveredNote = gap.ratio === 100
    ? `${household.schoolEnd}부터 ${household.workEnd}까지 공백 없이 연결돼요`
    : `${household.schoolEnd}부터 ${household.workEnd}까지 ${Math.max(gap.gap - gap.covered, 0)}분이 남아요`;

  return (
    <Screen>
      <Header
        title={<h1 className="gap-title">하교 후 돌봄 공백 분석</h1>}
        back
        right={<button className="icon-btn cream" aria-label="공유" onClick={() => navigate("/share")}><Icon name="share" size={18} /></button>}
      />
      <div className="scroll stack gap-page">
        <section className="gap-card">
          <div className="gap-card-top">
            <div>
              <p>오늘 예상 공백</p>
              <p className="gap-clock">{clock}<small>시간</small></p>
              <p className="gap-need">총 {gap.gap}분간의 돌봄이 필요해요</p>
            </div>
            {gap.gap > 0 && <button className="warn-pill" onClick={() => navigate("/me/household")}>주의 필요</button>}
          </div>
          <div className="gap-ends">
            <label>
              <select aria-label="하교 시간" value={household.schoolEnd} onChange={(e) => updateHousehold({ ...household, schoolEnd: e.target.value, careStart: e.target.value })}>
                {TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}
              </select>
              하교
            </label>
            <label>
              <select aria-label="퇴근 시간" value={household.workEnd} onChange={(e) => updateHousehold({ ...household, workEnd: e.target.value, careEnd: e.target.value })}>
                {TIME_OPTIONS.map((time) => <option key={time}>{time}</option>)}
              </select>
              퇴근
            </label>
          </div>
          <div className="gap-bar" />
          <div className="gap-legend">
            <span><Icon name="school" size={14} />학교</span>
            <b>돌봄 공백 {hours}시간</b>
            <span><Icon name="home" size={14} />귀가</span>
          </div>
        </section>
        <p className="gap-note">
          <Icon name="bot" size={20} />
          <span>
            <b>AI가 빈틈없는 돌봄 조합을 찾았어요</b>
            이동시간을 포함해 연속 이용이 가능한 조합이에요!
          </span>
        </p>
        <div className="section-title">
          <h2>추천 돌봄 조합</h2>
          <button className="click gap-again" onClick={() => refreshGap()}>다시 분석</button>
        </div>
        <div className="gap-combo">
          <div className="gap-clocks">
            {gap.blocks.map((block) => (
              <div key={block.facility.id}>
                <b>{fromMinutes(block.start)}</b>
                <span>{Math.max(1, Math.round((block.end - block.start) / 60))}시간</span>
              </div>
            ))}
            <b>{fromMinutes(gap.end)}</b>
          </div>
          <div className="gap-list">
            {gap.blocks.map((block) => {
              const match = results.find((item) => item.policy.facilityIds.includes(block.facility.id));
              const eligible = match?.label === "eligible";
              const school = block.facility.type === "초등돌봄";
              const where = school
                ? `학교 내 이동 · ${fromMinutes(block.start)}–${fromMinutes(block.end)}`
                : `${block.facility.minutes ? `도보 ${block.facility.minutes}분 · ` : ""}${fromMinutes(block.start)}–${fromMinutes(block.end)}`;
              return (
                <button key={block.facility.id} className="gap-item" onClick={() => navigate(`/facilities/${block.facility.id}`)}>
                  <span className="gap-ico"><Icon name={school ? "school" : "building"} size={16} /></span>
                  <span>
                    <span className={`gap-chip ${eligible ? "ok" : "wait"}`}>{labelText(match?.label ?? "check")}</span>
                    <b>{block.facility.name}</b>
                    <small>{where}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {gap.blocks.length === 0 && <p className="empty">이 시간대를 덮는 시설 후보가 없어요. 시간을 조정하거나 지도에서 야간연장을 봐 주세요.</p>}
        <section className="gap-cover">
          <div><span>돌봄 공백 해소율</span><b>{gap.ratio}%</b></div>
          <div className="gap-meter"><i style={{ width: `${gap.ratio}%` }} /></div>
          <p><Icon name="check" size={14} />{coveredNote}</p>
        </section>
        <h2 className="display gap-policies">함께 보면 좋은 정책</h2>
        {policies.map(({ policy, label }) => (
          <button key={policy.id} className="gap-policy" onClick={() => navigate(`/policies/${policy.id}`)}>
            <span className={`gap-chip ${label === "eligible" ? "ok" : "wait"}`}>{labelText(label)}</span>
            <span className="grow">
              <b>{policy.title}</b>
              <small>{policy.benefitAmount ? <>월 최대 <em>{Math.round(policy.benefitAmount / 10000)}만원</em> 지원</> : policy.benefit}</small>
            </span>
            <Icon name="chevron" size={16} />
          </button>
        ))}
      </div>
    </Screen>
  );
}

export function ChatPage() {
  const { messages, ask, feedback, household, notify } = useStore();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const child = household.children[0];
  const profile = `${child?.grade ?? "자녀 없음"} · ${household.gu} ${household.dong} · ${household.situations.join(" · ") || "상황 없음"}`;
  return (
    <Screen className="chat-skin">
      <Header
        title={<h1 className="chat-title">AI 돌봄·배움 챗봇</h1>}
        back
        right={<button className="icon-btn cream" aria-label="안내" onClick={() => notify("가구 조건과 등록된 정책·시설 자료만 근거로 답해요.")}><Icon name="info" size={18} /></button>}
      />
      <div className="chat-context">
        <img src="/logo.png" alt="" width={32} height={32} />
        <div className="grow">
          <b>가구 프로필 적용 중</b>
          <p>{profile}</p>
        </div>
        <button className="click" onClick={() => navigate("/me/household")}>변경</button>
      </div>
      <div className="scroll stack chat-thread">
        {messages.length > 0 && <div className="chat-date"><span>오늘</span></div>}
        {messages.map((message) => message.role === "user" ? (
          <div key={message.id} className="bubble-user">{message.text}</div>
        ) : (
          <div key={message.id} className="chat-bot">
            <span className={`chat-face${message.unknown ? " dim" : ""}`}><img src="/logo.png" alt="" /></span>
            <div className="chat-col">
              {!message.unknown && <p className="chat-name">아이케어 AI</p>}
              <article className={`bubble-bot${message.unknown ? " unverified" : ""}`}>
                {message.unknown && <p className="chat-name">아이케어 AI</p>}
                {message.unknown && <span className="chat-flag">근거 없음</span>}
                <p>{message.text}</p>
                {message.steps?.map((step, index) => (
                  <div key={step.title} className="step">
                    <b>{index + 1}</b>
                    <div><strong>{step.title}</strong><p>{step.body}</p></div>
                  </div>
                ))}
                {message.source && !message.unknown && (
                  <div className="chat-source">
                    <Icon name="bookmark" size={14} />
                    <span>
                      <small>근거 출처</small>
                      <strong>{message.source.title}</strong>
                      <a href={message.source.url} target="_blank" rel="noreferrer">관련 정책 바로가기 <Icon name="chevron" size={12} /></a>
                    </span>
                  </div>
                )}
              </article>
              {!message.unknown && (
                <div className="chat-fb">
                  <span>이 답변이 도움이 되었나요?</span>
                  <button className={message.feedback === "up" ? "on" : ""} onClick={() => feedback(message.id, "up")}>
                    {message.feedback === "up" && <Icon name="check" size={12} />}도움됨
                  </button>
                  <button className={message.feedback === "down" ? "on" : ""} onClick={() => feedback(message.id, "down")}>아님</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="chat-suggest">
        <p>추천 질문</p>
        <div>
          {SUGGESTED_QUESTIONS.map((question) => (
            <button key={question} className="chip taupe" onClick={() => ask(question)}>{question}</button>
          ))}
        </div>
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; ask(text); setText(""); }}>
        <input className="chat-field" placeholder="질문을 입력하세요..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="chat-send" aria-label="보내기" type="submit"><Icon name="send" size={18} /></button>
      </form>
    </Screen>
  );
}

export function SharePage() {
  const { household, notify, remoteGap } = useStore();
  const navigate = useNavigate();
  const gap = remoteGap ?? analyzeGap(household);
  const [who, setWho] = useState("나에게");
  const [message, setMessage] = useState("");
  const hours = Math.floor(gap.gap / 60);
  const clock = `${hours}:${String(gap.gap % 60).padStart(2, "0")}`;
  const summary = `하교 후 돌봄 공백 ${clock}시간\n${gap.blocks.map((block) => `${block.facility.name} ${fromMinutes(block.start)}–${fromMinutes(block.end)}`).join("\n")}\n공백 없이 ${household.workEnd}까지 연결돼요`;
  const people = [
    ["나에게", "나와의 채팅"],
    ["김용인 가족", "가족 단톡방"],
    ["돌봄 정보방", "모임 채팅"],
  ];

  async function send() {
    const text = `${summary}\n\n${message}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "아이케어 용인", text });
      } catch {
        /* 사용자가 공유 시트를 닫은 경우 */
      }
    }
    await navigator.clipboard.writeText(text).catch(() => undefined);
    notify(`${who}에게 보낼 내용을 복사했어요.`);
    navigate(-1);
  }

  const covered = gap.ratio === 100
    ? `공백 없이 ${household.workEnd}까지 연결돼요`
    : `${household.workEnd}까지 ${Math.max(gap.gap - gap.covered, 0)}분이 남아요`;

  return (
    <Screen>
      <header className="header share-head">
        <button className="icon-btn taupe" aria-label="닫기" onClick={() => navigate(-1)}><Icon name="close" size={18} /></button>
        <h1 className="share-title">카카오톡으로 공유</h1>
      </header>
      <div className="scroll stack share-page">
        <p className="share-lead">돌봄 공백 분석 결과를 대화로 보내요</p>
        <article className="share-preview">
          <p className="brand">아이케어 용인</p>
          <p className="headline">하교 후 돌봄 공백 {clock}시간</p>
          <div className="lines">
            {gap.blocks.map((block) => <p key={block.facility.id}>{block.facility.name} {fromMinutes(block.start)}–{fromMinutes(block.end)}</p>)}
          </div>
          <p className="linkup">{covered}</p>
        </article>
        <p className="share-who">받는 사람</p>
        {people.map(([name, desc]) => (
          <button key={name} className={`person ${who === name ? "on" : ""}`} onClick={() => setWho(name)}>
            <span className="share-av"><Icon name="user" size={16} /></span>
            <span className="grow"><b>{name}</b><p>{desc}</p></span>
            {who === name && <span className="share-tick"><Icon name="check" size={12} /></span>}
          </button>
        ))}
        <input className="share-msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="메시지를 입력하세요" />
        <button className="btn primary" onClick={send}>카카오톡으로 전송</button>
      </div>
    </Screen>
  );
}
