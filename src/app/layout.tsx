import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./login/actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "App for Ten",
  description: "A tiny marketplace for a group of up to ten people",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  if (user) {
    const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
    cartCount = (data ?? []).reduce((sum, item) => sum + item.quantity, 0);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="bg-orange-600 text-white">
          <nav className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="mr-auto text-xl font-bold">
              App for Ten
            </Link>
            {user && (
              <>
                <Link href="/sell" className="hover:underline">
                  Sell
                </Link>
                <Link href="/orders" className="hover:underline">
                  Orders
                </Link>
                <Link href="/cart" className="hover:underline">
                  Cart ({cartCount})
                </Link>
                <form action={logout}>
                  <button className="rounded bg-white/15 px-3 py-1 text-sm hover:bg-white/25">
                    Log out
                  </button>
                </form>
              </>
            )}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
