import Link from "next/link";
import { checkout, updateCartItem } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Product } from "@/lib/types";

type CartRow = { quantity: number; product: Product };

export default async function CartPage({ searchParams }: PageProps<"/cart">) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("cart_items")
    .select("quantity, product:products(*)")
    .eq("user_id", user!.id);
  const items = (data ?? []) as unknown as CartRow[];
  const total = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="mt-16 text-center text-neutral-600">
        <p className="mb-4">Your cart is empty.</p>
        <Link href="/" className="btn-primary">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Your cart</h1>
      {error && <p className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <ul className="divide-y divide-black/10">
        {items.map(({ product, quantity }) => (
          <li key={product.id} className="flex flex-wrap items-center gap-4 py-3">
            <Link href={`/products/${product.id}`} className="flex-1 hover:underline">
              {product.name}
            </Link>
            <span className="text-neutral-600">{formatPrice(product.price)}</span>
            <form action={updateCartItem} className="flex items-center gap-2">
              <input type="hidden" name="product_id" value={product.id} />
              <input
                type="number"
                name="quantity"
                defaultValue={quantity}
                min={0}
                max={product.stock}
                className="input w-20"
              />
              <button className="btn-secondary">Update</button>
            </form>
            <form action={updateCartItem}>
              <input type="hidden" name="product_id" value={product.id} />
              <input type="hidden" name="quantity" value={0} />
              <button className="text-sm text-red-600 hover:underline">Remove</button>
            </form>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-end gap-4">
        <span className="text-lg">
          Total: <strong className="text-orange-600">{formatPrice(total)}</strong>
        </span>
        <form action={checkout}>
          <button className="btn-primary">Place order</button>
        </form>
      </div>
    </div>
  );
}
