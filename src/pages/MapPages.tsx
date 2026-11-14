import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Header, IconButton, Screen } from "../components";
import type { Facility, FacilityType } from "../data";
import { Icon } from "../icons";
import { useStore } from "../store";

const TYPES: Array<FacilityType | "전체"> = ["전체", "다함께돌봄", "지역아동센터", "야간연장", "초등돌봄", "예체능"];

function pinIcon(type: FacilityType) {
  if (type === "초등돌봄" || type === "예체능") return "school";
  if (type === "야간연장") return "child";
  return "building";
}

function pinMarkup(type: FacilityType) {
  const body = type === "초등돌봄" || type === "예체능"
    ? `<path d="m3.5 10 8.5-5 8.5 5-8.5 5z"/><path d="M7 12.2V17c1.6 1.3 3.2 2 5 2s3.4-.7 5-2v-4.8"/>`
    : type === "야간연장"
      ? `<circle cx="12" cy="8" r="2.4"/><path d="M8 20v-2.2a4 4 0 0 1 8 0V20"/>`
      : `<path d="M5 20V6l7-2.5L19 6v14"/><path d="M9 20v-4h6v4"/>`;
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

const YONGIN: L.LatLngTuple = [37.28, 127.11];

function placedPoints(list: Facility[]) {
  return list.flatMap((facility) => (
    facility.lat != null && facility.lng != null ? [[facility.lat, facility.lng] as L.LatLngTuple] : []
  ));
}

function readType(value: string | null): FacilityType | "전체" {
  return TYPES.includes(value as FacilityType | "전체") ? (value as FacilityType | "전체") : "다함께돌봄";
}

export function MapPage() {
  const { household, facilities: allFacilities } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const type = readType(params.get("type"));
  const slot = params.get("slot") === "1";
  const night = params.get("night") === "1";
  const holiday = params.get("holiday") === "1";
  const near = params.get("near") !== "0";
  const selected = params.get("pin") ?? "";
  const mapBox = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace: true });
  }

  const facilities = useMemo(() => {
    return allFacilities.filter((facility) => {
      const text = `${facility.name} ${facility.dong} ${facility.type}`.includes(query.trim());
      if (!text) return false;
      if (type !== "전체" && facility.type !== type) return false;
      if (night && !facility.night) return false;
      if (holiday && !facility.holidayCare) return false;
      if (near && facility.gu !== household.gu && facility.dong !== household.dong) return false;
      if (slot) {
        const open = facility.open <= household.careEnd && facility.close >= household.careStart;
        if (!open) return false;
      }
      return true;
    }).sort((a, b) => a.km - b.km);
  }, [query, type, night, holiday, near, slot, household, allFacilities]);

  const current = facilities.find((item) => item.id === selected) ?? facilities[0];
  const placedKey = facilities.map((facility) => `${facility.id}:${facility.lat ?? ""}:${facility.lng ?? ""}`).join("|");
  const updateRef = useRef(update);
  const facilitiesRef = useRef(facilities);
  updateRef.current = update;
  facilitiesRef.current = facilities;

  useEffect(() => {
    if (!mapBox.current || mapRef.current) return;
    const map = L.map(mapBox.current, { zoomControl: false }).setView(YONGIN, 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setMapReady(true);
    const timer = window.setTimeout(() => map.invalidateSize(), 0);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const group = markersRef.current;
    if (!mapReady || !group) return;
    group.clearLayers();
    for (const facility of facilities) {
      if (facility.lat == null || facility.lng == null) continue;
      const on = current?.id === facility.id;
      const marker = L.marker([facility.lat, facility.lng], {
        icon: L.divIcon({
          className: "map-pin-wrap",
          html: `<div class="map-pin${on ? " on" : ""}" style="background:${facility.type === "야간연장" ? "#e84e4e" : "#5a391d"}">${pinMarkup(facility.type)}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
        zIndexOffset: on ? 500 : 0,
      });
      marker.on("click", () => updateRef.current({ pin: facility.id }));
      if (on) {
        const count = facility.current < 0 ? `정원 ${facility.capacity}명` : `정원 ${facility.capacity} · 현원 ${facility.current}`;
        marker.bindTooltip(
          `<p class="display">${escapeHtml(facility.name)}</p><p class="tiny muted">${count}</p>`,
          { permanent: true, direction: "top", offset: [0, -8], className: "map-tip" },
        );
      }
      marker.addTo(group);
    }
  }, [facilities, current, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    map.invalidateSize();
    const points = placedPoints(facilitiesRef.current);
    if (points.length === 0) map.setView(YONGIN, 12);
    else if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [placedKey, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const place = facilitiesRef.current.find((item) => item.id === selected);
    if (!mapReady || !map || !place || place.lat == null || place.lng == null) return;
    map.panTo([place.lat, place.lng]);
  }, [selected, mapReady]);

  return (
    <Screen>
      <Header title="내 동네 돌봄 지도" back />
      <div style={{ padding: "8px 16px 12px", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 4px 12px rgba(40,40,40,.06)" }}>
        <form className="search-line" onSubmit={(event) => { event.preventDefault(); navigate(`/facilities/search?q=${encodeURIComponent(query.trim())}`); }}>
          <Icon name="search" size={16} />
          <input placeholder="시설명, 센터명 검색" value={query} onChange={(e) => update({ q: e.target.value.trim() ? e.target.value : null })} />
        </form>
        <button className="btn ghost" onClick={() => navigate("/facilities")}>내 주변 돌봄시설 목록</button>
        <div className="chip-row map-filters">
          {TYPES.map((item) => (
            <button key={item} className={`chip ${type === item ? "solid" : "line"}`} onClick={() => update({ type: item === "다함께돌봄" ? null : item })}>{item}</button>
          ))}
        </div>
        <div className="chip-row map-filters">
          <button className={`chip ${slot ? "solid" : "line"}`} onClick={() => update({ slot: slot ? null : "1" })}>{household.careStart}–{household.careEnd}</button>
          <button className={`chip ${near ? "solid" : "line"}`} onClick={() => update({ near: near ? "0" : null })}>현재 동네 중심</button>
          <button className={`chip ${night ? "solid" : "line"}`} onClick={() => update({ night: night ? null : "1" })}>야간연장</button>
          <button className={`chip ${holiday ? "solid" : "line"}`} onClick={() => update({ holiday: holiday ? null : "1" })}>휴일보육</button>
        </div>
      </div>
      <div className="map-wrap">
        <div ref={mapBox} className="map-canvas" />
        <div className="zoom">
          <button aria-label="확대" onClick={() => mapRef.current?.zoomIn()}><Icon name="plus" size={16} /></button>
          <button aria-label="축소" onClick={() => mapRef.current?.zoomOut()}><Icon name="minus" size={16} /></button>
        </div>
        <button className="loc-btn" aria-label="우리 동네로" onClick={() => update({ near: null, pin: null })}><Icon name="target" size={16} /></button>
      </div>
      {current && <FacilitySheet facility={current} />}
      {!current && <p className="empty">이 조건의 시설이 지도 안에 없어요.</p>}
    </Screen>
  );
}

function FacilitySheet({ facility }: { facility: Facility }) {
  const navigate = useNavigate();
  const { savedIds, toggleSaved } = useStore();
  const saved = savedIds.includes(facility.id);
  return (
    <section className="map-sheet">
      <div className="handle" />
      <div className="row">
        <div className="grow">
          <div className="chip-row">
            <span className="chip" style={{ background: "var(--taupe)", color: "#fff" }}>{facility.type}</span>
            <span className="chip" style={{ background: "var(--taupe)", color: "#fff" }}>운영중</span>
          </div>
          <p className="display" style={{ fontSize: 16, marginTop: 6 }}>{facility.name}</p>
        </div>
        <button className={`save ${saved ? "on" : ""}`} aria-label="저장" onClick={() => toggleSaved(facility.id)}><Icon name="bookmark" size={16} /></button>
      </div>
      <p className="inline-meta muted"><Icon name="pin" size={14} />{facility.address}</p>
      <p className="inline-meta muted"><Icon name="clock" size={14} />평일 {facility.open}–{facility.close} · {facility.current < 0 ? `정원 ${facility.capacity}명` : `잔여 ${Math.max(facility.capacity - facility.current, 0)}명`}</p>
      <div className="row">
        <a className="btn soft" href={`tel:${facility.phone}`}><Icon name="phone" size={16} />전화 문의</a>
        <button className="btn primary" onClick={() => navigate(`/facilities/${facility.id}`)}>상세보기</button>
      </div>
    </section>
  );
}

function distanceText(facility: Facility) {
  const meters = Math.round(facility.km * 1000);
  const dist = meters < 1000 ? `${meters}m` : `${facility.km}km`;
  const place = facility.dong || facility.gu;
  return `${place} · 도보 ${facility.minutes}분 · ${dist}`;
}

export function FacilitySearchPage() {
  const { facilities } = useStore();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const list = facilities
    .filter((facility) => `${facility.name} ${facility.dong} ${facility.type} ${facility.address}`.includes(query.trim()))
    .sort((a, b) => a.km - b.km);

  return (
    <Screen>
      <Header title="시설 검색" back />
      <div className="scroll stack">
        <label className="search-line">
          <Icon name="search" size={18} />
          <input
            placeholder="시설명, 센터명 검색"
            value={query}
            onChange={(event) => setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })}
          />
        </label>
        <div className="section-title">
          <b>검색 결과 {list.length}곳</b>
          <span>가까운 순</span>
        </div>
        {list.map((facility) => (
          <button key={facility.id} className="card facility" onClick={() => navigate(`/facilities/${facility.id}`)}>
            <span className="thumb"><Icon name={pinIcon(facility.type)} /></span>
            <span className="grow">
              <span className="chip solid">{facility.type}</span>
              <b style={{ display: "block", marginTop: 4 }}>{facility.name}</b>
              <span className="tiny faint inline-meta"><Icon name="pin" size={12} />{distanceText(facility)}</span>
              <span className="tiny gold inline-meta"><Icon name="clock" size={12} />{facility.open}–{facility.close}</span>
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="empty">검색된 시설이 없어요.</p>}
      </div>
    </Screen>
  );
}

export function FacilityListPage() {
  const { household, facilities: allFacilities } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<FacilityType | "전체">("전체");
  const [more, setMore] = useState(false);
  const list = allFacilities.filter((facility) => {
    const text = `${facility.name} ${facility.address} ${facility.dong}`.includes(query.trim());
    return text && (type === "전체" || facility.type === type);
  }).sort((a, b) => a.km - b.km);
  const visible = more ? list : list.slice(0, 4);

  return (
    <Screen nav>
      <Header title="내 주변 돌봄시설" back right={<button className="map-link" onClick={() => navigate("/map")}><Icon name="map" size={16} />지도</button>} />
      <div className="scroll with-nav stack">
        <label className="searchbar">
          <Icon name="search" size={18} />
          <input placeholder="시설명, 동네로 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="chip-row fit">
          {(["전체", "다함께돌봄", "지역아동센터", "야간연장"] as const).map((item) => (
            <button key={item} className={`chip ${type === item ? "solid" : "line"}`} onClick={() => setType(item)}>{item}</button>
          ))}
        </div>
        <div className="section-title">
          <span className="tiny">{household.dong} 중심 · {list[0] ? `${list[0].km}km` : ""}</span>
          <span>가까운 순</span>
        </div>
        {visible.map((facility) => (
          <button key={facility.id} className="card facility" onClick={() => navigate(`/facilities/${facility.id}`)}>
            <span className="thumb"><Icon name={pinIcon(facility.type)} /></span>
            <span className="grow">
              <span className="chip-row">
                <span className="chip plain">{facility.type}</span>
                <span className="chip solid">운영중</span>
              </span>
              <b style={{ display: "block", marginTop: 4 }}>{facility.name}</b>
              <span className="tiny faint inline-meta"><Icon name="pin" size={12} />{distanceText(facility)}</span>
              <span className="tiny gold inline-meta"><Icon name="clock" size={12} />{facility.open}–{facility.close} · {facility.current < 0 ? "잔여 정원" : `잔여 ${Math.max(facility.capacity - facility.current, 0)}`}</span>
            </span>
          </button>
        ))}
        {list.length > 4 && !more && <button className="more-link" onClick={() => setMore(true)}>+ 더 많은 시설 보기</button>}
        {list.length === 0 && <p className="empty">조건에 맞는 시설이 없어요.</p>}
        <p className="banner-cream">실시간 이용 현황은 시설에 문의해 주세요.</p>
      </div>
    </Screen>
  );
}

export function FacilityDetailPage() {
  const { id = "" } = useParams();
  const { household, facilities, toggleSaved, results, hydrateFacility } = useStore();
  const facility = facilities.find((item) => item.id === id);
  useEffect(() => { if (id) hydrateFacility(id); }, [hydrateFacility, id]);
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(0);
  if (!facility) return <Screen><Header title="시설" back /><p className="empty">시설을 찾지 못했어요.</p></Screen>;
  const policies = results.filter((item) => facility.policyIds.includes(item.policy.id) || item.policy.facilityIds.includes(facility.id));
  const photos = ["외관", "돌봄실", "프로그램", "오시는 길"];
  return (
    <Screen>
      <Header title="" back right={<IconButton name="bookmark" label="저장" onClick={() => toggleSaved(facility.id)} />} />
      <div className="scroll stack">
        <button className="hero-photo" onClick={() => setPhoto((v) => (v + 1) % photos.length)} aria-label="사진 넘기기">
          <span>{photo + 1} / {photos.length}</span>
        </button>
        <div className="chip-row">
          <span className="chip taupe">{facility.type}</span>
          <span className="chip taupe">운영중</span>
        </div>
        <h2 style={{ margin: 0 }}>{facility.name}</h2>
        <p className="inline-meta muted"><Icon name="pin" size={14} />{facility.address}</p>
        <p className="small"><b>정원 {facility.capacity}명</b></p>
        <h3 className="display" style={{ fontSize: 15 }}>시설 정보</h3>
        <p className="info-row"><Icon name="clock" size={16} />평일 {facility.open}–{facility.close}<br />{facility.weekend}</p>
        <p className="info-row"><Icon name="phone" size={16} /><a href={`tel:${facility.phone}`}>{facility.phone}</a></p>
        <p className="info-row"><Icon name="child" size={16} />{facility.ages}</p>
        <p className="banner-pink">우리 아이와 잘 맞아요. {household.schoolEnd} 하교부터 {household.workEnd} 퇴근 시간과 겹쳐 이용을 검토해 보세요.</p>
        <div className="row">
          <a className="btn soft" href={`tel:${facility.phone}`}><Icon name="phone" size={16} />전화 문의</a>
          <button className="btn primary" onClick={() => navigate(policies[0] ? `/policies/${policies[0].policy.id}` : "/policies")}>연계 정책 보기</button>
        </div>
      </div>
    </Screen>
  );
}

