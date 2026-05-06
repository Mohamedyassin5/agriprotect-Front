// Marketplace domain models

export interface Listing {
  id: number;
  title: string;
  description?: string;
  category: string;
  type: string;
  price: number;
  unit?: string;
  quantity?: number;
  imageUrls?: string[];
  status?: string;
  sellerName?: string;
  seller?: { id: number; firstName: string; lastName: string; email?: string };
  createdAt?: string;
}

export interface Order {
  id: number;
  listingId?: number;
  listingTitle?: string;
  listing?: Listing;
  buyerName?: string;
  buyer?: { id: number; firstName: string; lastName: string; email?: string };
  sellerName?: string;
  seller?: { id: number; firstName: string; lastName: string; email?: string };
  quantity: number;
  totalPrice: number;
  status: string;
  paymentSource?: string;
  note?: string;
  location?: string;
  estimatedDelivery?: string;
  createdAt?: string;
}

export interface Review {
  id: number;
  orderId: number;
  rating: number;
  comment?: string;
  reviewerName?: string;
  createdAt?: string;
}

export interface MarketplaceOverview {
  totalListings: number;
  pendingListings: number;
  activeListings: number;
  totalOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
}

export interface PageResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
