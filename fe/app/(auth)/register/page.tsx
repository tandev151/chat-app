"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/users";
import type { CreateUserPayload } from "@/types/user";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password || !displayName.trim()) {
      setError("Email, password and display name are required.");
      return;
    }
    if (displayName.trim().length < 2) {
      setError("Display name must be at least 2 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: CreateUserPayload = {
        email: email.trim(),
        password,
        displayName: displayName.trim(),
      };
      await createUser(payload);
      router.replace("/login");
    } catch (err: unknown) {
      const res = err as { response?: { data?: { message?: string | string[] } } };
      const message = res.response?.data?.message;
      const text = Array.isArray(message) ? message[0] : message;
      setError(
        typeof text === "string" ? text : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      role="main"
      aria-label="Register"
    >
      <h1 className="text-xl font-semibold text-zinc-900">Create account</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Register to join the chat platform.
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
        <label htmlFor="register-displayName" className="sr-only">
          Display name
        </label>
        <input
          id="register-displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          autoComplete="name"
          minLength={2}
          maxLength={50}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Display name"
          disabled={isSubmitting}
        />
        <label htmlFor="register-email" className="sr-only">
          Email
        </label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Email"
          disabled={isSubmitting}
        />
        <label htmlFor="register-password" className="sr-only">
          Password
        </label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (8+ chars, upper, lower, number, special)"
          autoComplete="new-password"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-label="Password"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          aria-label="Register"
        >
          {isSubmitting ? "Creating account…" : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
          aria-label="Go to login page"
        >
          Log in
        </Link>
      </p>
    </main>
  );
}
