"use client";

import { useState } from "react";
import { UserActions } from "./user-actions";

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  avatarEmoji: string | null;
  lastfmUsername: string | null;
  totalPoints: number;
  currentStreak: number;
  isBanned: boolean;
  banReason: string | null;
  createdAt: Date;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export function UsersTable({ initialUsers }: { initialUsers: UserRow[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  function handleUpdate(id: string, isBanned: boolean, banReason: string | null) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, isBanned, banReason } : u))
    );
  }

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.lastfmUsername ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Buscar por nome, email ou last.fm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "var(--color-cream)",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Fã", "E-mail", "Last.fm", "Pontos", "Streak", "Cadastro", "Status", "Ação"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    color: "var(--color-muted-foreground)",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--color-border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => (
              <tr
                key={u.id}
                style={{
                  background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <td style={{ padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{u.avatarEmoji ?? "🎵"}</span>
                    <span style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 500 }}>
                      {u.displayName}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                    {u.email}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                    {u.lastfmUsername ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span className="font-display" style={{ color: "var(--color-gold)", fontSize: "14px", fontStyle: "italic" }}>
                    {u.totalPoints.toLocaleString("pt-BR")}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: "var(--color-cream)", fontSize: "13px" }}>
                    {u.currentStreak}🔥
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  <span style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                    {formatDate(u.createdAt)}
                  </span>
                </td>
                <td style={{ padding: "12px" }}>
                  {u.isBanned ? (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(196,49,75,0.15)",
                        border: "1px solid rgba(196,49,75,0.3)",
                        color: "var(--color-cherry)",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                      title={u.banReason ?? undefined}
                    >
                      banido
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(34,197,94,0.08)",
                        border: "1px solid rgba(34,197,94,0.2)",
                        color: "#4ade80",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      ativo
                    </span>
                  )}
                </td>
                <td style={{ padding: "12px" }}>
                  <UserActions user={u} onUpdate={handleUpdate} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center" }}>
            <p style={{ color: "var(--color-muted-foreground)", fontSize: "14px" }}>
              Nenhum usuário encontrado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
