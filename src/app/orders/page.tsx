import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/types";

type Order = {
  id: number;
  total: number;
  created_at: string;
  items: { id: number; product_name: string; price: number; quantity: number }[];
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("id, total, created_at, items:order_items(id, product_name, price, quantity)")
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as Order[];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">My orders</h1>
      {orders.length === 0 && <p className="text-neutral-600">You have no orders yet.</p>}
      {orders.map((order) => (
        <div key={order.id} className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-2 flex justify-between text-sm text-neutral-500">
            <span>Order #{order.id}</span>
            <span>{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <ul className="text-sm">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-1">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-right font-semibold text-orange-600">
            Total {formatPrice(order.total)}
          </p>
        </div>
      ))}
    </div>
  );
}
