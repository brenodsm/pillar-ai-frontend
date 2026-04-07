import { C } from "../constants/colors";
import { Icon } from "./Icon";
import { RottasLogo } from "./RottasLogo";
import type { StoredMeeting, SessionUser } from "../types";
import type { SidebarView } from "../pillarUiStateStorage";

interface SidebarProps {
  sidebarView: SidebarView;
  setSidebarView: (view: SidebarView) => void;
  pastMeetings: StoredMeeting[];
  onViewMeeting: (meeting: StoredMeeting) => void;
  onReset: () => void;
  onClearMeetingContext?: () => void;
  onLogout: () => void;
  user?: SessionUser | null;
}

const sidebarItems: Array<{ id: SidebarView; label: string; icon: string }> = [
  { id: "home", label: "Início", icon: "home" },
  { id: "calendario", label: "Calendário", icon: "calendar" },
  { id: "meetings", label: "Reuniões", icon: "meetings" },
  { id: "acoes", label: "Ações", icon: "check" },
];

export function Sidebar({ sidebarView, setSidebarView, pastMeetings, onViewMeeting, onReset, onClearMeetingContext, onLogout, user }: SidebarProps) {
  const userEmail = user?.email?.trim() || "";
  const userDisplayName = user?.display_name?.trim() || "Usuário";
  const userInitials = userDisplayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <aside style={{
      width: 260, minWidth: 260, height: "100%", background: C.white,
      borderRight: `1px solid ${C.creamDark}`, display: "flex", flexDirection: "column",
      padding: "0", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", display: "flex", alignItems: "center", gap: 10 }}>
        <RottasLogo size={34} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.dark, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            Pillar<span style={{ color: C.orange }}>AI</span>
          </div>
          <div style={{ fontSize: 10.5, color: C.grayLight, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 1 }}>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 14px",
          background: C.bg, borderRadius: 10, border: `1px solid ${C.creamDark}`,
        }}>
          <Icon name="search" size={16} color={C.grayLighter} />
          <input placeholder="Buscar reuniões..." style={{
            border: "none", outline: "none", background: "transparent", flex: 1,
            fontFamily: "inherit", fontSize: 13, color: C.dark,
          }} />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "0 12px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: C.grayLighter, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 16px 8px", marginTop: 4 }}>
          Menu
        </div>
        {sidebarItems.map((item) => (
          <div
            key={item.id}
            className={`sidebar-item ${sidebarView === item.id ? "active" : ""}`}
            onClick={() => {
              if (item.id !== "home") {
                onClearMeetingContext?.();
              }
              setSidebarView(item.id);
              if (item.id === "home") onReset();
            }}
          >
            <Icon name={item.icon} size={18} color={sidebarView === item.id ? C.orange : C.grayLight} />
            {item.label}
          </div>
        ))}

        {pastMeetings.length > 0 && (
          <>
            <div style={{ height: 1, background: C.creamDark, margin: "16px 16px" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: C.grayLighter, textTransform: "uppercase", letterSpacing: "0.1em", padding: "8px 16px 8px" }}>
              Reuniões Recentes
            </div>
            {pastMeetings.slice(0, 3).map((m) => (
              <div key={m.id} className="sidebar-item" onClick={() => onViewMeeting(m)}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: m.hasAta ? C.green : C.grayLighter, flexShrink: 0 }} />
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: 13, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: C.grayLighter, marginTop: 1 }}>{m.date}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px", borderTop: `1px solid ${C.creamDark}` }}>
        <div className="sidebar-item" onClick={() => { onClearMeetingContext?.(); setSidebarView("settings"); }} style={{ margin: 0 }}>
          <Icon name="settings" size={18} color={C.grayLight} />
          Configurações
        </div>
        <div className="sidebar-item" onClick={onLogout} style={{ margin: 0 }}>
          <Icon name="logout" size={18} color={C.redStop} />
          <span style={{ color: C.redStop }}>Sair</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.orange}, ${C.orangeLight})`,
            display: "flex", alignItems: "center", justifyContent: "center", color: C.white, fontSize: 13, fontWeight: 700,
          }}>
            {userInitials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              title={userEmail}
              style={{ fontSize: 11, color: C.grayLight, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            >
              {userEmail}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
