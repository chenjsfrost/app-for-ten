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
