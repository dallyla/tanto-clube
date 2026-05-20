"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type NotifType = "prize_awarded" | "mission_approved" | "era_started" | "era_ended" | "mission_created" | "shipment_updated" | "mission_ended" | "streak_reminder";

type Notif = {
  id: string;
  type: NotifType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

const TYPE_ICON: Record<NotifType, string> = {
  prize_awarded: "🎁",
  mission_approved: "✅",
  era_started: "🎯",
  era_ended: "⏳",
  mission_created: "📋",
  shipment_updated: "📦",
  mission_ended: "🔒",
  streak_reminder: "🔥",
};

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/user/notifications");
      if (!res.ok) return;
      const data = await res.json() as { notifications: Notif[]; unread: number };
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 10_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Fetch immediately when tab becomes visible again
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") fetchNotifs();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchNotifs]);

  // Close when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  async function markAllRead() {
    await fetch("/api/user/notifications/read-all", { method: "POST" });
    setNotifs((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setUnread(0);
  }

  async function handleClick(notif: Notif) {
    if (!notif.readAt) {
      await fetch(`/api/user/notifications/${notif.id}/read`, { method: "POST" });
      setNotifs((prev) =>
        prev.map((n) => n.id === notif.id ? { ...n, readAt: new Date().toISOString() } : n)
      );
      setUnread((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (notif.link) router.push(notif.link);
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        style={{
          position: "relative",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          background: open ? "var(--color-bg-elevated)" : "transparent",
          border: "1px solid " + (open ? "var(--color-border)" : "transparent"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "background 0.15s, border-color 0.15s",
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-cream)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.85 }}
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              minWidth: "16px",
              height: "16px",
              borderRadius: "99px",
              background: "var(--color-cherry)",
              color: "#fff",
              fontSize: "9px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
              boxShadow: "0 0 0 2px var(--color-bg-nav)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: "320px",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: "14px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            zIndex: 200,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <span style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600 }}>
              Notificações
            </span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-gold)",
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List */}
          <div
            className="notif-scroll"
            style={{ maxHeight: "360px", overflowY: "auto" }}
          >
            <style>{`
              .notif-scroll::-webkit-scrollbar { width: 4px; }
              .notif-scroll::-webkit-scrollbar-track { background: transparent; }
              .notif-scroll::-webkit-scrollbar-thumb { background: rgba(200,164,92,0.3); border-radius: 99px; }
              .notif-scroll { scrollbar-width: thin; scrollbar-color: rgba(200,164,92,0.3) transparent; }
            `}</style>

            {notifs.length === 0 ? (
              <div
                style={{
                  padding: "32px 16px",
                  textAlign: "center",
                  color: "var(--color-muted-foreground)",
                  fontSize: "13px",
                }}
              >
                Nenhuma notificação ainda.
              </div>
            ) : (
              notifs.map((n, idx) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "12px 16px",
                    background: n.readAt ? "transparent" : "rgba(200,164,92,0.06)",
                    border: "none",
                    borderBottom:
                      idx < notifs.length - 1 ? "1px solid var(--color-border)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background =
                      "var(--color-bg-elevated)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.background = n.readAt
                      ? "transparent"
                      : "rgba(200,164,92,0.06)")
                  }
                >
                  <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.3 }}>
                    {TYPE_ICON[n.type]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        color: "var(--color-cream)",
                        fontSize: "13px",
                        fontWeight: n.readAt ? 400 : 600,
                        marginBottom: "2px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                    </p>
                    {n.body && (
                      <p
                        style={{
                          color: "var(--color-muted-foreground)",
                          fontSize: "12px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {n.body}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                    <span style={{ color: "var(--color-muted-foreground)", fontSize: "10px" }}>
                      {timeAgo(n.createdAt)}
                    </span>
                    {!n.readAt && (
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: "var(--color-gold)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
