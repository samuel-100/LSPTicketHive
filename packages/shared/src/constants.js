const PLATFORM_FEE_RATE = 0.02; // 2.0%
const STRIPE_PROCESSING_RATE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 0.30; // $0.30

const SUBSCRIPTION_TIERS = {
  FREE: { name: "Free", price: 0, maxEvents: 5, maxTicketsPerEvent: 100 },
  PRO: { name: "Pro", price: 29, maxEvents: 50, maxTicketsPerEvent: 5000 },
  ENTERPRISE: { name: "Enterprise", price: 99, maxEvents: -1, maxTicketsPerEvent: -1 },
};

const ORDER_LIMITS = {
  MAX_TICKETS_PER_ORDER: 10,
  CHECKOUT_TIMEOUT_MINUTES: 15,
};

const EVENT_CATEGORIES = [
  "Music",
  "Sports",
  "Arts & Theatre",
  "Food & Drink",
  "Business",
  "Technology",
  "Health & Wellness",
  "Community",
  "Film & Media",
  "Nightlife",
  "Other",
];

module.exports = {
  PLATFORM_FEE_RATE,
  STRIPE_PROCESSING_RATE,
  STRIPE_FIXED_FEE,
  SUBSCRIPTION_TIERS,
  ORDER_LIMITS,
  EVENT_CATEGORIES,
};
