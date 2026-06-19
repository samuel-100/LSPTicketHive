// Seeds ~25 realistic demo events across genres with cover images.
// Run on EC2: node scripts/seed-events.js  (needs DATABASE_URL in env)
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const IMG = (id, w = 800) => `https://images.unsplash.com/photo-${id}?w=${w}&q=70`;

// Verified-loading Unsplash photo ids per vibe.
const events = [
  { title: "Lagos Nights: Afrobeats Live", category: "Afrobeats", city: "Lagos", country: "Nigeria", venue: "Eko Hotel Arena", img: "1533174072545-7a4b6ad7a6c3", price: 25 },
  { title: "Amapiano Sundays", category: "Amapiano", city: "Johannesburg", country: "South Africa", venue: "Konka", img: "1516450360452-9312f5e86fc7", price: 20 },
  { title: "Afro Nation Afterparty", category: "Afrobeats", city: "London", country: "UK", venue: "Drumsheds", img: "1493225457124-a3eb161ffa5f", price: 30 },
  { title: "Hip-Hop Cypher Night", category: "Hip-Hop & Rap", city: "New York", country: "USA", venue: "SOBs", img: "1493225457124-a3eb161ffa5f", price: 18 },
  { title: "Rooftop Day Party", category: "Nightlife", city: "Dublin", country: "Ireland", venue: "The Marker Rooftop", img: "1566737236500-c8ac43014a67", price: 15 },
  { title: "Live Band Sessions", category: "Live Music", city: "Dublin", country: "Ireland", venue: "Whelan's", img: "1470229722913-7c0e2dbbafd3", price: 12 },
  { title: "Stand-Up Comedy Showcase", category: "Comedy", city: "London", country: "UK", venue: "Comedy Store", img: "1585699324551-f6c309eedeca", price: 16 },
  { title: "Contemporary Art Opening", category: "Arts", city: "Berlin", country: "Germany", venue: "Kunsthalle", img: "1460661419201-fd4cecdf8a8b", price: 0 },
  { title: "Street Food Festival", category: "Food & Drink", city: "Dublin", country: "Ireland", venue: "Herbert Park", img: "1414235077428-338989a2e8c0", price: 5 },
  { title: "AI Builders Meetup", category: "Tech", city: "Dublin", country: "Ireland", venue: "Dogpatch Labs", img: "1518770660439-4636190af475", price: 0 },
  { title: "Startup Pitch Night", category: "Tech", city: "London", country: "UK", venue: "Google Campus", img: "1518770660439-4636190af475", price: 0 },
  { title: "5-a-side Tournament", category: "Sports", city: "Manchester", country: "UK", venue: "Powerleague", img: "1461896836934-ffe607ba8211", price: 10 },
  { title: "Summer Music Festival", category: "Festival", city: "Accra", country: "Ghana", venue: "Independence Square", img: "1459749411175-04bf5292ceea", price: 40 },
  { title: "Founders Networking Brunch", category: "Business", city: "Dublin", country: "Ireland", venue: "The Dean", img: "1497032205916-ac775f0649ae", price: 8 },
  { title: "Detty December Kickoff", category: "Afrobeats", city: "Accra", country: "Ghana", venue: "Bloombar", img: "1533174072545-7a4b6ad7a6c3", price: 22 },
  { title: "Piano & Soul Lounge", category: "Amapiano", city: "London", country: "UK", venue: "Ministry of Sound", img: "1516450360452-9312f5e86fc7", price: 25 },
  { title: "Open Mic Comedy", category: "Comedy", city: "Dublin", country: "Ireland", venue: "The International Bar", img: "1585699324551-f6c309eedeca", price: 0 },
  { title: "Late Night Warehouse", category: "Nightlife", city: "Berlin", country: "Germany", venue: "Berghain", img: "1566737236500-c8ac43014a67", price: 28 },
  { title: "Acoustic Evening", category: "Live Music", city: "Cork", country: "Ireland", venue: "Cyprus Avenue", img: "1470229722913-7c0e2dbbafd3", price: 14 },
  { title: "Taste of Africa", category: "Food & Drink", city: "London", country: "UK", venue: "Borough Market", img: "1414235077428-338989a2e8c0", price: 6 },
];

async function main() {
  // Attach to the first organization so events have an owner.
  const org = await prisma.organization.findFirst();
  if (!org) { console.error("No organization found — create a business account first."); process.exit(1); }

  let created = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const start = new Date(Date.now() + (7 + i * 2) * 24 * 60 * 60 * 1000); // spread over coming weeks
    start.setHours(20, 0, 0, 0);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    const slug = e.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + i;

    // Skip if a same-title event already exists (idempotent-ish).
    const existing = await prisma.event.findFirst({ where: { title: e.title, organizationId: org.id } });
    if (existing) continue;

    await prisma.event.create({
      data: {
        title: e.title,
        slug,
        description: `${e.title} — an unmissable ${e.category} event in ${e.city}. Grab your tickets now!`,
        shortDesc: `${e.category} • ${e.venue}, ${e.city}`,
        coverImageUrl: IMG(e.img),
        venue: e.venue,
        city: e.city,
        country: e.country,
        startDate: start,
        endDate: end,
        category: e.category,
        totalCapacity: 200,
        status: "PUBLISHED",
        promotable: true,
        commissionRate: 12,
        organizationId: org.id,
        ticketTypes: {
          create: e.price === 0
            ? [{ name: "Free Entry", price: 0, quantity: 200, currency: "EUR" }]
            : [
                { name: "Early Bird", price: e.price, quantity: 80, currency: "EUR" },
                { name: "General", price: e.price + 8, quantity: 120, currency: "EUR" },
              ],
        },
      },
    });
    created++;
  }
  console.log(`Seeded ${created} new events (attached to org ${org.name}).`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
