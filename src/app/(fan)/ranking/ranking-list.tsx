"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { fetchRankingPage } from "./actions";
import type { RankedFan, Tab } from "./types";
import { formatPoints } from "@/lib/utils";

// PAGE_SIZE not needed here — offset is tracked via offsetRef

const MEDAL_EMOJI = ["🥇", "🥈", "🥉"];

interface Props {
  initialFans: RankedFan[];
  initialHasMore: boolean;
  currentUserId: string | null;
  tab: Tab;
}

export default function RankingList({ initialFans, initialHasMore, currentUserId, tab }: Props) {
  const [fans, setFans] = useState(initialFans);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialFans.length);

  // loadMore lives in a ref so the IntersectionObserver callback never goes stale
  const loadMore = useRef(() => {});
  loadMore.current = () => {
    if (!hasMore || isPending) return;
    const offset = offsetRef.current;
    startTransition(async () => {
      const { fans: next, hasMore: more } = await fetchRankingPage(tab, offset);
      offsetRef.current = offset + next.length;
      setFans((prev) => [...prev, ...next]);
      setHasMore(more);
    });
  };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore.current(); },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {fans.map((fan, idx) => (
        <FanRow key={fan.id} fan={fan} rank={idx + 1} currentUserId={currentUserId} />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="py-6 flex justify-center">
          {isPending && (
            <span
              className="text-xs font-display italic"
              style={{ color: "var(--color-muted-foreground)" }}
            >
              carregando...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function FanRow({
  fan,
  rank,
  currentUserId,
}: {
  fan: RankedFan;
  rank: number;
  currentUserId: string | null;
}) {
  const isYou = fan.id === currentUserId;
  const name = fan.anonymousMode ? "Anônimo" : fan.displayName;
  const emoji = fan.anonymousMode ? "🎭" : (fan.avatarEmoji ?? "🎵");
  const imgUrl = fan.anonymousMode ? null : (fan.avatarUrl ?? null);
  const isMedal = rank <= 3;

  return (
    <>
      {rank === 11 && (
        <div
          className="flex items-center gap-3 my-3"
          style={{ color: "var(--color-gold-deep)" }}
        >
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(90deg, transparent, var(--color-gold-deep), transparent)" }}
          />
          <span
            className="font-display italic text-xs uppercase tracking-widest whitespace-nowrap"
            style={{ color: "var(--color-gold-deep)" }}
          >
            linha do top 10
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(90deg, var(--color-gold-deep), transparent)" }}
          />
        </div>
      )}

      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl relative"
        style={{
          background: isYou
            ? "linear-gradient(135deg, rgb(200 164 92 / 0.1), var(--color-bg-card))"
            : "var(--color-bg-card)",
          border: `1px solid ${isYou ? "var(--color-gold)" : "var(--color-border)"}`,
        }}
      >
        {isYou && (
          <span
            className="absolute text-xs"
            style={{ left: "-10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-gold)" }}
          >
            ◆
          </span>
        )}

        <div className="w-7 text-center flex-shrink-0">
          {isMedal ? (
            <span className="text-xl">{MEDAL_EMOJI[rank - 1]}</span>
          ) : (
            <span
              className="font-display italic text-base font-medium"
              style={{ color: isYou ? "var(--color-cream)" : "var(--color-gold)" }}
            >
              {rank}
            </span>
          )}
        </div>

        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-base leading-none flex-shrink-0 overflow-hidden"
          style={{
            background: "var(--color-bg-elevated)",
            border: `1px solid ${isYou ? "var(--color-gold)" : "var(--color-border)"}`,
          }}
        >
          {imgUrl ? (
            <img src={imgUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            emoji
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: isYou ? "var(--color-gold)" : "var(--color-cream)" }}
          >
            {isYou ? "VOCÊ" : name}
          </p>
          {fan.anonymousMode && !isYou && (
            <p className="text-xs italic" style={{ color: "var(--color-muted-foreground)" }}>
              {name}
            </p>
          )}
        </div>

        <span
          className="font-display italic text-sm font-medium flex-shrink-0"
          style={{ color: isYou ? "var(--color-gold-bright)" : "var(--color-gold)" }}
        >
          {formatPoints(fan.points)}
        </span>
      </div>
    </>
  );
}
