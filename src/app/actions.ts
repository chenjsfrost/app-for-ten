"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function addToCart(formData: FormData) {
  const { supabase, user } = await requireUser();
  const productId = Number(formData.get("product_id"));
  const quantity = Math.max(1, Number(formData.get("quantity") || 1));

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  await supabase.from("cart_items").upsert({
    user_id: user.id,
    product_id: productId,
    quantity: (existing?.quantity ?? 0) + quantity,
  });
  revalidatePath("/", "layout");
  redirect("/cart");
}

export async function updateCartItem(formData: FormData) {
  const { supabase, user } = await requireUser();
  const productId = Number(formData.get("product_id"));
  const quantity = Number(formData.get("quantity"));

  const query =
    quantity > 0
      ? supabase.from("cart_items").update({ quantity })
      : supabase.from("cart_items").delete();
  await query.eq("user_id", user.id).eq("product_id", productId);
  revalidatePath("/", "layout");
}

export async function checkout() {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("checkout");
  if (error) redirect(`/cart?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/orders");
}

export async function buyNow(formData: FormData) {
  const { supabase } = await requireUser();
  const productId = Number(formData.get("product_id"));
  const { error } = await supabase.rpc("buy_now", {
    p_product_id: productId,
    p_quantity: Math.max(1, Number(formData.get("quantity") || 1)),
  });
  if (error) redirect(`/products/${productId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/orders");
}

export async function createProduct(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("products").insert({
    seller_id: user.id,
    name: String(formData.get("name")),
    description: String(formData.get("description") || ""),
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock") || 1),
    image_url: String(formData.get("image_url") || "") || null,
  });
  revalidatePath("/", "layout");
}

export async function deleteProduct(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("products")
    .delete()
    .eq("id", Number(formData.get("product_id")))
    .eq("seller_id", user.id);
  revalidatePath("/", "layout");
}

type DemoProduct = {
  title: string;
  description: string;
  category: string;
  brand?: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  thumbnail: string;
  images: string[];
  shippingInformation: string;
  warrantyInformation: string;
  returnPolicy: string;
  reviews: { rating: number; comment: string; date: string; reviewerName: string }[];
};

// Fills the shop with sample items from DummyJSON (https://dummyjson.com), listed under the current user.
// Items the user already has (matched by name) get their details refreshed instead of duplicated.
export async function importDemoProducts() {
  const { supabase, user } = await requireUser();
  const res = await fetch("https://dummyjson.com/products?limit=30");
  if (!res.ok) redirect("/sell?error=Could not reach the demo products API");
  const { products } = (await res.json()) as { products: DemoProduct[] };

  const { data: existing } = await supabase
    .from("products")
    .select("id, name")
    .eq("seller_id", user.id);
  const existingIds = new Map((existing ?? []).map((p) => [p.name, p.id]));

  const toInsert = [];
  for (const p of products) {
    const details = {
      description: p.description,
      category: p.category,
      brand: p.brand ?? null,
      price: p.price,
      discount_percentage: p.discountPercentage,
      rating: Math.round(p.rating * 10) / 10,
      image_url: p.thumbnail,
      images: p.images,
      shipping_info: p.shippingInformation,
      warranty_info: p.warrantyInformation,
      return_policy: p.returnPolicy,
      reviews: p.reviews.map(({ rating, comment, date, reviewerName }) => ({
        rating,
        comment,
        date,
        reviewerName,
      })),
    };
    const id = existingIds.get(p.title);
    if (id) {
      await supabase.from("products").update(details).eq("id", id);
    } else {
      toInsert.push({ ...details, seller_id: user.id, name: p.title, stock: p.stock });
    }
  }
  if (toInsert.length > 0) {
    const { error } = await supabase.from("products").insert(toInsert);
    if (error) redirect(`/sell?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath("/", "layout");
  redirect("/");
}
