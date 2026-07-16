import { supabase } from './supabase';

/**
 * Creates a fresh realtime channel for `topic`, first removing any existing
 * channel(s) already registered under the same topic.
 *
 * Why this is needed: effects that open a channel (e.g. `useEffect(() => {...},
 * [userId])`) can run more than once in quick succession -- React 18 Strict
 * Mode double-invokes effects in dev, and auth listeners can fire multiple
 * events (INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED) in a burst on page
 * load/reload. `supabase.removeChannel()` in a cleanup function is
 * asynchronous, so a second effect run can call `.channel(sameTopic)` and
 * start binding `.on(...)` callbacks before the first channel has actually
 * left. Supabase then throws "cannot add `postgres_changes` callbacks ...
 * after `subscribe()`" because the old channel (still technically live) is
 * the one still registered.
 *
 * Proactively removing any channel already using this topic before creating
 * a new one makes channel setup idempotent regardless of how many times the
 * surrounding effect re-runs.
 */
export function getOrCreateChannel(topic: string) {
  const existing = supabase.getChannels().filter((c) => c.topic === `realtime:${topic}`);
  existing.forEach((c) => supabase.removeChannel(c));
  return supabase.channel(topic);
}
