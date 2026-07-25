import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  // Initial fetch + realtime subscription
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.rpc("get_roadmap_lead_count");
      if (cancelled) return;
      if (error || data === null || data === undefined) return; // stay null on failure
      const n = typeof data === "number" ? data : Number(data);
      if (!Number.isFinite(n)) return;
      setTarget(n);
    })();

    const channel = supabase.channel(`roadmap-leads-count-${Math.random().toString(36).slice(2)}`);
    channel
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "roadmap_leads" },
        () => {
          setTarget((prev) => (prev === null ? prev : prev + 1));
          setDisplay((prev) => (prev === null ? prev : prev + 1));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
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
