export type Product = {
  id: number;
  seller_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string | null;
  created_at: string;
};

export function formatPrice(price: number) {
  return `$${Number(price).toFixed(2)}`;
}
