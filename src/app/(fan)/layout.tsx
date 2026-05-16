import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import AppHeader from "./app-header";
import BottomNav from "./bottom-nav";

export const metadata: Metadata = {
  title: {
    default: "TANTO Clube",
    template: "%s · TANTO Clube",
  },
};

export default async function FanLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  let avatarUrl: string | null = null;
  let avatarEmoji: string | null = null;

  if (session?.user?.id) {
    const [user] = await db
      .select({ avatarUrl: users.avatarUrl, avatarEmoji: users.avatarEmoji })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
    avatarUrl = user?.avatarUrl ?? null;
    avatarEmoji = user?.avatarEmoji ?? null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <AppHeader avatarUrl={avatarUrl} avatarEmoji={avatarEmoji} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
