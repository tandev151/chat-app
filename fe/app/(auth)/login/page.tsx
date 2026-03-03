"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import type { LoginPayload } from "@/types/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: LoginPayload = { email: email.trim(), password };
      await login(payload);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string | string[] } } })
              .response?.data?.message
          : null;
      const text = Array.isArray(message) ? message[0] : message;
      setError(
        typeof text === "string" ? text : "Email or password is incorrect."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      role="main"
      aria-label="Login"
    >
      <h1 className="text-xl font-semibold text-zinc-900">Log in</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sign in to continue to the chat.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && (
          <div
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        <label htmlFor="login-email" className="sr-only">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Email"
          disabled={isSubmitting}
        />
        <label htmlFor="login-password" className="sr-only">
          Password
        </label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Password"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Log in"
        >
          {isSubmitting ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-zinc-900 underline focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          aria-label="Go to register page"
        >
          Register
        </Link>
      </p>
    </main>
  );
}
