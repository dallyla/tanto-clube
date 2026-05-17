"use client";

import { useState } from "react";
import Link from "next/link";
import { UserActions } from "./user-actions";

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  avatarEmoji: string | null;
  lastfmUsername: string | null;
  totalPoints: number;
  currentStreak: number;
  isBanned: boolean;
  banReason: string | null;
  createdAt: Date;
};

type SuspiciousUser = {
  id: string;
  displayName: string;
  lastfmUsername: string | null;
  avatarEmoji: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  isBanned: boolean;
  banReason: string | null;
  flaggedCount: number;
  capReason: string | null;
};

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

function formatShortDate(d: Date) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function exportCSV(rows: UserRow[]) {
  const headers = ["Nome", "Email", "Last.fm", "Pontos", "Streak", "Cadastro", "Status", "Motivo ban"];
  const data = rows.map((u) => [
    u.displayName,
    u.email,
    u.lastfmUsername ?? "",
    u.totalPoints,
    u.currentStreak,
    new Date(u.createdAt).toLocaleDateString("pt-BR"),
    u.isBanned ? "banido" : "ativo",
    u.banReason ?? "",
  ]);
  const csv = [headers, ...data]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fas-tanto-clube-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportXLS(rows: UserRow[]) {
  const headers = ["Nome", "Email", "Last.fm", "Pontos", "Streak", "Cadastro", "Status", "Motivo ban"];
  const tableRows = rows
    .map(
      (u) => `<tr>
        <td>${u.displayName}</td>
        <td>${u.email}</td>
        <td>${u.lastfmUsername ?? ""}</td>
        <td>${u.totalPoints}</td>
        <td>${u.currentStreak}</td>
        <td>${new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
        <td>${u.isBanned ? "banido" : "ativo"}</td>
        <td>${u.banReason ?? ""}</td>
      </tr>`
    )
    .join("");
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8">
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets>
    <x:ExcelWorksheet><x:Name>Fãs</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
    </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    </head><body><table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody>
    </table></body></html>`;
  const blob = new Blob(["﻿" + html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fas-tanto-clube-${new Date().toISOString().split("T")[0]}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportPDF(rows: UserRow[]) {
  const win = window.open("", "_blank");
  if (!win) return;
  const tableRows = rows
    .map(
      (u) => `<tr>
        <td>${u.displayName}</td>
        <td>${u.email}</td>
        <td>${u.lastfmUsername ?? "—"}</td>
        <td style="text-align:right">${u.totalPoints.toLocaleString("pt-BR")}</td>
        <td style="text-align:right">${u.currentStreak}</td>
        <td>${new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
        <td>${u.isBanned ? "Banido" : "Ativo"}</td>
        <td>${u.banReason ?? ""}</td>
      </tr>`
    )
    .join("");
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Fãs — TANTO Clube</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
      h1{font-size:16px;margin:0 0 4px}
      p{color:#666;font-size:10px;margin:0 0 16px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:5px 7px;text-align:left;vertical-align:top}
      th{background:#f0f0f0;font-weight:600;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
    </style>
  </head><body>
    <h1>Fãs — TANTO Clube</h1>
    <p>${rows.length} fãs cadastrados · exportado em ${new Date().toLocaleDateString("pt-BR")}</p>
    <table>
      <thead><tr>
        <th>Nome</th><th>Email</th><th>Last.fm</th>
        <th>Pontos</th><th>Streak</th><th>Cadastro</th><th>Status</th><th>Motivo ban</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body></html>`);
  win.document.close();
  win.print();
}

function suspiciousReason(capReason: string | null, flaggedCount: number): string {
  if (capReason === "hourly_cap") return `${flaggedCount} scrobbles bloqueados em 1h`;
  if (capReason === "daily_focus_cap") return `${flaggedCount} scrobbles bloqueados (foco diário)`;
  if (capReason === "daily_total_cap") return `${flaggedCount} scrobbles bloqueados (total diário)`;
  return `${flaggedCount} scrobbles bloqueados`;
}

export function UsersTable({
  initialUsers,
  initialSuspiciousUsers = [],
}: {
  initialUsers: UserRow[];
  initialSuspiciousUsers?: SuspiciousUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [suspiciousUsers, setSuspiciousUsers] = useState(initialSuspiciousUsers);
  const [search, setSearch] = useState("");

  function handleUpdate(id: string, isBanned: boolean, banReason: string | null) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isBanned, banReason } : u)));
    // Remove from suspicious list once banned
    if (isBanned) setSuspiciousUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.lastfmUsername ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Requer Atenção */}
      {suspiciousUsers.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span
              className="font-display"
              style={{
                color: "var(--color-gold)",
                fontSize: "11px",
                fontStyle: "italic",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Requer Atenção
            </span>
            <div style={{ flex: 1, borderTop: "1px solid var(--color-border)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {suspiciousUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  background: "rgba(196,49,75,0.04)",
                  border: "1px solid rgba(196,49,75,0.25)",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "var(--color-cream)", fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>
                    @{u.displayName}
                  </p>
                  <p style={{ color: "var(--color-muted-foreground)", fontSize: "12px" }}>
                    {u.lastfmUsername && <>Last.fm: {u.lastfmUsername} · </>}
                    cadastro: {formatShortDate(u.createdAt)} ·{" "}
                    <span style={{ color: "var(--color-cherry)" }}>
                      {suspiciousReason(u.capReason, u.flaggedCount)}
                    </span>
                  </p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <Link
                    href={`/admin/users/${u.id}`}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      background: "transparent",
                      border: "1px solid rgba(200,164,92,0.4)",
                      color: "var(--color-gold)",
                      fontSize: "12px",
                      fontWeight: 600,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Investigar
                  </Link>
                  <UserActions
                    user={{ id: u.id, displayName: u.displayName, isBanned: u.isBanned, banReason: u.banReason }}
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search + Export */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Buscar por nome, email ou last.fm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 200px",
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
        <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
          {(["CSV", "XLS", "PDF"] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => fmt === "CSV" ? exportCSV(users) : fmt === "XLS" ? exportXLS(users) : exportPDF(users)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-muted-foreground)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse" }}>
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
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        background: "var(--color-bg-elevated)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                      }}
                    >
                      {u.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        u.avatarEmoji ?? "🎵"
                      )}
                    </div>
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
                <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <Link
                      href={`/admin/users/${u.id}`}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-cream)",
                        fontSize: "12px",
                        fontWeight: 600,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Ver perfil
                    </Link>
                    <UserActions user={u} onUpdate={handleUpdate} />
                  </div>
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
