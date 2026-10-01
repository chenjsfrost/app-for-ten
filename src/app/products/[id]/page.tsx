import Link from "next/link";
import { notFound } from "next/navigation";
import { addToCart, buyNow } from "@/app/actions";
import { Stars } from "@/components/Stars";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, originalPrice, type Product } from "@/lib/types";

export default async function ProductPage({ params, searchParams }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const { img, error } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, seller:profiles(display_name)")
    .eq("id", Number(id))
    .maybeSingle();
  if (!data) notFound();
  const product = data as Product & { seller: { display_name: string } | null };

  const gallery = product.images?.length
    ? product.images
    : product.image_url
      ? [product.image_url]
      : [];
  const selected = Math.min(Math.max(Number(img) || 0, 0), Math.max(gallery.length - 1, 0));
  const reviews = product.reviews ?? [];
  const discount = Number(product.discount_percentage) || 0;

  const details = [
    ["Category", product.category],
    ["Brand", product.brand],
    ["Shipping", product.shipping_info],
    ["Warranty", product.warranty_info],
    ["Returns", product.return_policy],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 rounded-lg bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="aspect-square overflow-hidden rounded-md bg-neutral-100">
            {gallery[selected] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gallery[selected]}
                alt={product.name}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((src, i) => (
                <Link
                  key={src}
                  href={`/products/${product.id}?img=${i}`}
                  scroll={false}
                  replace
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded border-2 bg-neutral-100 ${
                    i === selected ? "border-orange-500" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            {product.rating != null && (
              <span className="flex items-center gap-1">
                <span className="font-semibold text-orange-600 underline">
                  {Number(product.rating).toFixed(1)}
                </span>
                <Stars rating={Number(product.rating)} />
              </span>
            )}
            {reviews.length > 0 && (
              <a href="#reviews" className="hover:underline">
                {reviews.length} {reviews.length === 1 ? "rating" : "ratings"}
              </a>
            )}
            <span>Sold by {product.seller?.display_name ?? "a member"}</span>
          </div>

          <div className="flex items-baseline gap-3 rounded-md bg-neutral-50 p-4">
            {discount > 0 && (
              <span className="text-neutral-400 line-through">
                {formatPrice(originalPrice(product.price, discount))}
              </span>
            )}
            <span className="text-3xl font-bold text-orange-600">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <span className="rounded bg-orange-600 px-1.5 py-0.5 text-xs font-semibold text-white">
                {Math.round(discount)}% OFF
              </span>
            )}
          </div>

          {details.length > 0 && (
            <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-2 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="text-neutral-800">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {product.stock > 0 ? (
            <form action={addToCart} className="mt-auto flex flex-col gap-4">
              <input type="hidden" name="product_id" value={product.id} />
              <div className="flex items-center gap-3 text-sm">
                <label htmlFor="quantity" className="w-24 text-neutral-500">
                  Quantity
                </label>
                <input
                  id="quantity"
                  type="number"
                  name="quantity"
                  defaultValue={1}
                  min={1}
                  max={product.stock}
                  className="input w-24"
                />
                <span className="text-neutral-500">{product.stock} available</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-md border border-orange-600 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                  Add to cart
                </button>
                <button formAction={buyNow} className="btn-primary px-8 py-2.5">
                  Buy now
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-auto font-semibold text-neutral-500">Sold out</p>
          )}
        </div>
      </div>

      {product.description && (
        <section className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Product description</h2>
          <p className="whitespace-pre-wrap text-neutral-700">{product.description}</p>
        </section>
      )}

      {reviews.length > 0 && (
        <section id="reviews" className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Product ratings</h2>
          <ul className="divide-y divide-black/10">
            {reviews.map((review, i) => (
              <li key={i} className="flex flex-col gap-1 py-3">
                <span className="text-sm font-medium text-neutral-800">{review.reviewerName}</span>
                <Stars rating={review.rating} size="text-sm" />
                <span className="text-xs text-neutral-400">
                  {new Date(review.date).toLocaleDateString()}
                </span>
                <p className="text-neutral-700">{review.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
