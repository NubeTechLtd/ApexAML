/**
 * Clock helpers for the fictional demo seed. Shared by the browser seed
 * (src/data-layer/seed/dataset.ts) and the demo-str-narrative function, so the
 * server rebuilds exactly the dates the visitor sees. Pure; no imports.
 */
export const HOUR = 3_600_000;
export const DAY = 24 * HOUR;

/** Anchor rounded to the hour so a page load and its reload share one timeline. */
export const seedNow = (ms: number) => Math.floor(ms / HOUR) * HOUR;

/** ['h', hoursAgo, minute] or ['d', daysAgo, hourWAT, minute]. */
export type DateRecipe = ['h', number, number] | ['d', number, number, number];

export const seedHoursAgo = (now: number, h: number, minute = 0) => new Date(now - h * HOUR + minute * 60_000).toISOString();

/** Day offset at a WAT clock hour (WAT = UTC+1); never in the future. */
export const seedAt = (now: number, daysAgo: number, hourWAT = 10, minute = 0) => {
  const d = new Date(now - daysAgo * DAY);
  d.setUTCHours(hourWAT - 1, minute, 0, 0);
  return d.getTime() > now ? new Date(d.getTime() - DAY).toISOString() : d.toISOString();
};

export const resolveRecipe = (now: number, r: DateRecipe) =>
  r[0] === 'h' ? seedHoursAgo(now, r[1], r[2]) : seedAt(now, r[1], r[2], r[3]);
