// Deterministic themed fallback image for events with no cover, keyed by
// category so each category gets a fitting picture (verified-loading Unsplash).
const BY_CATEGORY: Record<string, string> = {
  Afrobeats: "1533174072545-7a4b6ad7a6c3",
  Amapiano: "1516450360452-9312f5e86fc7",
  "Hip-Hop & Rap": "1493225457124-a3eb161ffa5f",
  Nightlife: "1566737236500-c8ac43014a67",
  "Live Music": "1470229722913-7c0e2dbbafd3",
  Music: "1470229722913-7c0e2dbbafd3",
  Comedy: "1585699324551-f6c309eedeca",
  Arts: "1460661419201-fd4cecdf8a8b",
  "Food & Drink": "1414235077428-338989a2e8c0",
  Tech: "1518770660439-4636190af475",
  Sports: "1461896836934-ffe607ba8211",
  Festival: "1459749411175-04bf5292ceea",
  Business: "1497032205916-ac775f0649ae",
};
const DEFAULT_IMG = "1492684223066-81342ee5ff30";

export function eventImage(coverImageUrl?: string | null, category?: string | null, w = 600): string {
  if (coverImageUrl) return coverImageUrl;
  const id = (category && BY_CATEGORY[category]) || DEFAULT_IMG;
  return `https://images.unsplash.com/photo-${id}?w=${w}&q=70`;
}
