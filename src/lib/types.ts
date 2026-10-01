export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
};

export type Product = {
  id: number;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
  category: string | null;
  brand: string | null;
  rating: number | null;
  discount_percentage: number;
  images: string[];
  shipping_info: string | null;
  warranty_info: string | null;
  return_policy: string | null;
  reviews: Review[];
};

export function formatPrice(price: number) {
  return `$${Number(price).toFixed(2)}`;
}

// The price before the discount, e.g. 9.00 at 10% off -> 10.00.
export function originalPrice(price: number, discountPercentage: number) {
  return Number(price) / (1 - Number(discountPercentage) / 100);
}
