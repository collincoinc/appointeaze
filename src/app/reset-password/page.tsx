"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-zinc-300">Loading password reset...</p>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    prepareResetSession();
  }, []);

  async function prepareResetSession() {
    setError("");

    const code = searchParams.get("code");

    if (code) {
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(
          exchangeError.message ||
            "This reset link is invalid or expired. Please request a new one."
        );
        setReady(false);
        return;
      }
    }

    setReady(true);
  }

  async function updatePassword() {
    setSaving(true);
    setMessage("");
    setError("");

    if (!password.trim()) {
      setError("Please enter a new password.");
      setSaving(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSaving(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message || "Could not update password.");
      setSaving(false);
      return;
    }

    setMessage("Password updated. You can now log in.");
    setPassword("");
    setConfirmPassword("");
    setSaving(false);
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

          <h1 className="text-4xl font-black">Choose a new password.</h1>

          <p className="mt-3 text-zinc-300">
            Enter and confirm your new password below.
          </p>

          {!ready && !error && (
            <p className="mt-6 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
              Preparing password reset...
            </p>
          )}

          <div className="mt-8 grid gap-5">
            <Field
              label="New password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
              type="password"
            />

            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              type="password"
            />

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
              onClick={updatePassword}
              disabled={!ready || saving}
              className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-zinc-300">{label}</label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}