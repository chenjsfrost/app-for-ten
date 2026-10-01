import { notFound } from "next/navigation";
import { addToCart } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Product } from "@/lib/types";

export default async function ProductPage({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, seller:profiles(display_name)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!data) notFound();
  const product = data as Product & { seller: { display_name: string } | null };

  return (
    <div className="grid gap-6 rounded-lg bg-white p-6 shadow-sm md:grid-cols-2">
      <div className="aspect-square overflow-hidden rounded-md bg-neutral-100">
        {product.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
        <p className="text-3xl font-bold text-orange-600">{formatPrice(product.price)}</p>
        <p className="text-sm text-neutral-500">
          Sold by {product.seller?.display_name ?? "a member"} · {product.stock} in stock
        </p>
        <p className="whitespace-pre-wrap text-neutral-700">{product.description}</p>
        {product.stock > 0 ? (
          <form action={addToCart} className="mt-auto flex items-center gap-3">
            <input type="hidden" name="product_id" value={product.id} />
            <input
              type="number"
              name="quantity"
              defaultValue={1}
              min={1}
              max={product.stock}
              className="input w-20"
            />
            <button className="btn-primary">Add to cart</button>
          </form>
        ) : (
          <p className="mt-auto font-semibold text-neutral-500">Sold out</p>
        )}
      </div>
    </div>
  );
}
