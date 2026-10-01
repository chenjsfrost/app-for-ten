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
  price: number;
  stock: number;
  thumbnail: string;
};

// Fills the shop with sample items from DummyJSON (https://dummyjson.com), listed under the current user.
export async function importDemoProducts() {
  const { supabase, user } = await requireUser();
  const res = await fetch(
    "https://dummyjson.com/products?limit=30&select=title,description,price,stock,thumbnail",
  );
  if (!res.ok) redirect("/sell?error=Could not reach the demo products API");
  const { products } = (await res.json()) as { products: DemoProduct[] };

  const { data: existing } = await supabase
    .from("products")
    .select("name")
    .eq("seller_id", user.id);
  const existingNames = new Set((existing ?? []).map((p) => p.name));

  const rows = products
    .filter((p) => !existingNames.has(p.title))
    .map((p) => ({
      seller_id: user.id,
      name: p.title,
      description: p.description,
      price: p.price,
      stock: p.stock,
      image_url: p.thumbnail,
    }));
  if (rows.length > 0) await supabase.from("products").insert(rows);
  revalidatePath("/", "layout");
  redirect("/");
}
