export const LEAD_FRESHNESS_MS = 30 * 60 * 1000

export function canDeliverRoadmap(lead: { email: string; created_at: string; roadmap_text: string | null }, recipient: string, now = Date.now()) {
  const age = now - new Date(lead.created_at).getTime()
  return Number.isFinite(age) && age >= 0 && age <= LEAD_FRESHNESS_MS &&
    lead.email.trim().toLowerCase() === recipient.trim().toLowerCase() &&
    typeof lead.roadmap_text === 'string' && lead.roadmap_text.trim().length >= 200
}
