export interface CreateEventInput {
  title: string;
  description: string;
  shortDesc?: string;
  venue?: string;
  address?: string;
  city?: string;
  country?: string;
  isOnline: boolean;
  onlineUrl?: string;
  startDate: string;
  endDate: string;
  timezone: string;
  category?: string;
  tags?: string[];
  totalCapacity: number;
  ticketTypes: CreateTicketTypeInput[];
}

export interface CreateTicketTypeInput {
  name: string;
  description?: string;
  price: number;
  currency?: string;
  quantity: number;
  maxPerOrder?: number;
  salesStart?: string;
  salesEnd?: string;
}

export interface CheckoutInput {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
}

export interface PricingBreakdown {
  subtotal: number;
  platformFee: number;
  processingFee: number;
  total: number;
  currency: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
