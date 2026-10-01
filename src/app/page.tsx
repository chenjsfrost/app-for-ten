import Link from "next/link";
import { Stars } from "@/components/Stars";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, type Product } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  const products = (data ?? []) as Product[];

  if (products.length === 0) {
    return (
      <div className="mt-16 text-center text-neutral-600">
        <p className="mb-4">No products yet.</p>
        <Link href="/sell" className="btn-primary">
          List the first item
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {products.map((p) => (
        <Link
          key={p.id}
          href={`/products/${p.id}`}
          className="overflow-hidden rounded-lg bg-white shadow-sm transition hover:shadow-md"
        >
          <div className="relative aspect-square bg-neutral-100">
            {Number(p.discount_percentage) > 0 && (
              <span className="absolute right-0 top-0 z-10 bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700">
                -{Math.round(Number(p.discount_percentage))}%
              </span>
            )}
            {p.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-sm text-neutral-900">{p.name}</p>
            <p className="mt-1 font-semibold text-orange-600">{formatPrice(p.price)}</p>
            <div className="mt-1 flex items-center justify-between text-xs text-neutral-500">
              {p.rating != null ? (
                <span className="flex items-center gap-1">
                  <Stars rating={Number(p.rating)} size="text-xs" />
                  {Number(p.rating).toFixed(1)}
                </span>
              ) : (
                <span />
              )}
              <span>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
