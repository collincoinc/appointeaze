"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function sendResetEmail() {
    setSending(true);
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      setSending(false);
      return;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://www.appointeazebooking.com";

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${appUrl}/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message || "Could not send reset email.");
      setSending(false);
      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox and follow the link."
    );
    setSending(false);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/login"
          className="mb-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
        >
          ← Back to Log In
        </Link>

        <div className="rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-8 md:p-10">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mb-8 h-14 w-auto"
          />

          <h1 className="text-4xl font-black">Reset your password.</h1>

          <p className="mt-3 text-zinc-300">
            Enter your email and we’ll send you a password reset link.
          </p>

          <div className="mt-8 grid gap-5">
            <div>
              <label className="text-sm font-semibold text-zinc-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
                {message}
              </p>
            )}

            <button
              type="button"
              onClick={sendResetEmail}
              disabled={sending}
              className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send Reset Link"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}