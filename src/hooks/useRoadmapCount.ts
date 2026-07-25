import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type RoadmapCountChannel = ReturnType<typeof supabase.channel>;

const roadmapInsertListeners = new Set<() => void>();
let roadmapCountChannel: RoadmapCountChannel | null = null;
let roadmapCountSubscribers = 0;

function subscribeToRoadmapLeadInserts(onInsert: () => void) {
  roadmapInsertListeners.add(onInsert);
  roadmapCountSubscribers += 1;

  if (!roadmapCountChannel) {
    const channelName = `roadmap-leads-count-v2-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);

    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "roadmap_leads" },
      () => {
        roadmapInsertListeners.forEach((listener) => listener());
      },
    );

    channel.subscribe();
    roadmapCountChannel = channel;
  }

  return () => {
    roadmapInsertListeners.delete(onInsert);
    roadmapCountSubscribers = Math.max(0, roadmapCountSubscribers - 1);

    if (roadmapCountSubscribers === 0 && roadmapCountChannel) {
      const channelToRemove = roadmapCountChannel;
      roadmapCountChannel = null;
      void supabase.removeChannel(channelToRemove);
    }
  };
}

/**
 * Returns a live, animated count of roadmap_leads rows.
 * - null while loading or on error (caller should render nothing).
 * - Animates from 0 up to the fetched count over ~1.5s.
 * - Subscribes to realtime INSERTs so the number ticks up live.
 */
export function useRoadmapCount(): number | null {
  const [target, setTarget] = useState<number | null>(null);
  const [display, setDisplay] = useState<number | null>(null);
  const hasAnimated = useRef(false);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("roadmap_lead_counter")
        .select("count")
        .eq("id", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) return; // stay null on failure
      const n = typeof data.count === "number" ? data.count : Number(data.count);
      if (!Number.isFinite(n)) return;
      setTarget(n);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Shared realtime subscription. The landing page renders this hook twice, so
  // callbacks are multiplexed through one channel to avoid reusing a subscribed
  // channel and triggering Supabase's "cannot add callbacks after subscribe" error.
  useEffect(() => {
    return subscribeToRoadmapLeadInserts(() => {
      setTarget((prev) => (prev === null ? prev : prev + 1));
      setDisplay((prev) => (prev === null ? prev : prev + 1));
    });
  }, []);

  // Count-up animation on first load
  useEffect(() => {
    if (target === null || hasAnimated.current) return;
    hasAnimated.current = true;

    if (target <= 0) {
      setDisplay(target);
      return;
    }

    const duration = 1500;
    const stepMs = Math.max(10, Math.floor(duration / target));
    let current = 0;
    setDisplay(0);
    const id = setInterval(() => {
      current += 1;
      if (current >= target) {
        setDisplay(target);
        clearInterval(id);
      } else {
        setDisplay(current);
      }
    }, stepMs);

    return () => clearInterval(id);
  }, [target]);

  return display;
}
