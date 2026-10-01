"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? login : signup,
    {},
  );

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-lg border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-3xl font-bold text-orange-600">Tenbao</p>
      <p className="mb-6 text-sm text-neutral-500">A little marketplace for ten friends</p>
      <h1 className="mb-4 text-xl font-semibold text-neutral-900">
        {mode === "login" ? "Log in" : "Create account"}
      </h1>
      <form action={action} className="flex flex-col gap-3">
        {mode === "signup" && (
          <input name="display_name" placeholder="Your name" required className="input" />
        )}
        <input name="email" type="email" placeholder="Email" required className="input" />
        <input
          name="password"
          type="password"
          placeholder="Password (min 6 characters)"
          minLength={6}
          required
          className="input"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-green-700">{state.message}</p>}
        <button disabled={pending} className="btn-primary">
          {pending ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 text-sm text-orange-600 hover:underline"
      >
        {mode === "login" ? "New here? Create an account" : "Have an account? Log in"}
      </button>
    </div>
  );
}
