import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth/config";
import { fetchRankingPage } from "./actions";
import type { Tab } from "./types";
import RankingTabs from "./ranking-tabs";
import RankingList from "./ranking-list";

export const metadata: Metadata = { title: "Ranking" };

const VALID_TABS: Tab[] = ["era", "mes", "geral", "album"];

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "era";

  const [session, { fans, hasMore }] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    fetchRankingPage(tab, 0),
  ]);

  const currentUserId = session?.user?.id ?? null;

  return (
    <div className="flex flex-col gap-2">
      <Suspense>
        <RankingTabs />
      </Suspense>

      {fans.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
            Ninguém no ranking ainda.
          </p>
        </div>
      ) : (
        <RankingList
          key={tab}
          initialFans={fans}
          initialHasMore={hasMore}
          currentUserId={currentUserId}
          tab={tab}
        />
      )}
    </div>
  );
}
