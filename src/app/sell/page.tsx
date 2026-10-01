import Link from "next/link";
import { createProduct, deleteProduct } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Product } from "@/lib/types";

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("seller_id", user!.id)
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form action={createProduct} className="flex flex-col gap-3 rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">List a new item</h1>
        <input name="name" placeholder="Item name" required className="input" />
        <textarea name="description" placeholder="Description" rows={3} className="input" />
        <div className="flex gap-3">
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Price"
            required
            className="input"
          />
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={1}
            placeholder="Stock"
            className="input"
          />
        </div>
        <input name="image_url" type="url" placeholder="Image URL (optional)" className="input" />
        <button className="btn-primary">Add item</button>
      </form>

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">My listings</h2>
        {products.length === 0 && <p className="text-neutral-600">Nothing listed yet.</p>}
        <ul className="divide-y divide-black/10">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-2">
              <Link href={`/products/${p.id}`} className="flex-1 hover:underline">
                {p.name}
              </Link>
              <span className="text-sm text-neutral-600">
                {formatPrice(p.price)} · {p.stock} left
              </span>
              <form action={deleteProduct}>
                <input type="hidden" name="product_id" value={p.id} />
                <button className="text-sm text-red-600 hover:underline">Delete</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
