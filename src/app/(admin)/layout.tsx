import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminSidebar } from "./admin-sidebar";

export const metadata = { title: { template: "%s | Admin TANTO", default: "Admin TANTO" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
      }}
    >
      <AdminSidebar displayName={session.user.name ?? session.user.email} />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "32px",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
