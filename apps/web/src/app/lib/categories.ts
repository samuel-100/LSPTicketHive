// Single source of truth for event categories/genres across the app.
// Grouped for the create form; flat list for filters/interests.

export const CATEGORY_GROUPS: { group: string; items: string[] }[] = [
  {
    group: "Music & Genres",
    items: ["Afrobeats", "Amapiano", "Hip-Hop & Rap", "Afro House", "Dancehall & Reggae", "R&B & Soul", "EDM & House", "Rock & Indie", "Pop", "Jazz & Blues", "Gospel", "Latin", "Live Music", "Music Festival"],
  },
  {
    group: "Nightlife",
    items: ["Nightlife", "Club Night", "Day Party", "Rooftop Party", "Bar & Lounge"],
  },
  {
    group: "Culture & Arts",
    items: ["Arts", "Theatre", "Comedy", "Film", "Dance", "Fashion", "Cultural"],
  },
  {
    group: "Food & Social",
    items: ["Food & Drink", "Festival", "Community", "Networking", "Parties & Gatherings"],
  },
  {
    group: "Professional",
    items: ["Tech", "Business", "Conference", "Workshop", "Education"],
  },
  {
    group: "Active",
    items: ["Sports", "Fitness & Wellness", "Outdoor"],
  },
  {
    group: "Other",
    items: ["Charity", "Family & Kids", "Online", "Other"],
  },
];

// Flat list of all categories.
export const ALL_CATEGORIES = CATEGORY_GROUPS.flatMap(g => g.items);

// Compact set for the homepage browse strip + filter sidebar (the popular ones).
export const TOP_CATEGORIES = [
  "Afrobeats", "Amapiano", "Hip-Hop & Rap", "Nightlife", "Live Music",
  "Comedy", "Arts", "Food & Drink", "Tech", "Sports", "Business", "Festival",
];
