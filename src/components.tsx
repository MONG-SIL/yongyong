import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./icons";
import { useStore } from "./store";

const TABS = [
  { to: "/home", label: "홈", icon: "home" },
  { to: "/policies", label: "정책 찾기", icon: "search" },
  { to: "/map", label: "지도", icon: "map" },
  { to: "/me", label: "마이", icon: "user" },
];

export function Screen({ children, nav = false, className }: { children: ReactNode; nav?: boolean; className?: string }) {
  const { toast } = useStore();
  return (
    <div className="app-bg">
      <div className={`phone${className ? ` ${className}` : ""}`}>
        {children}
        {nav && <BottomNav />}
        {toast && <div className="toast" role="status">{toast}</div>}
      </div>
    </div>
  );
}

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map((tab) => {
        const active = pathname === tab.to || (tab.to !== "/home" && pathname.startsWith(tab.to));
        return (
          <button key={tab.to} className={`nav-item ${active ? "active" : ""}`} onClick={() => navigate(tab.to)}>
            <span className="pill"><Icon name={tab.icon} size={active ? 18 : 20} /></span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

export function Header({
  title,
  back,
  right,
}: {
  title: ReactNode;
  back?: boolean;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="header">
      {back && (
        <button className="icon-btn taupe" aria-label="뒤로" onClick={() => navigate(-1)}>
          <Icon name="back" size={18} />
        </button>
      )}
      {typeof title === "string" ? <h1>{title}</h1> : title}
      {right}
    </header>
  );
}

export function IconButton({ name, label, onClick, tone = "gold" }: { name: string; label: string; onClick?: () => void; tone?: "gold" | "taupe" }) {
  return (
    <button className={`icon-btn ${tone === "taupe" ? "taupe" : ""}`} aria-label={label} onClick={onClick}>
      <Icon name={name} size={18} />
    </button>
  );
}
