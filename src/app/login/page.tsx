"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-zinc-300">Loading login...</p>
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawNext = searchParams.get("next") || "";
  const next = rawNext.startsWith("/") ? rawNext : "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function logIn() {
    setLoading(true);
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message || "Could not log in.");
      setLoading(false);
      return;
    }

    if (next) {
      router.push(next);
      router.refresh();
      return;
    }

    await routeAfterLogin();
  }

  async function routeAfterLogin() {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("Logged in, but could not load your account.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    const { data: ownedBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (ownedBusiness) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { data: teamRecord } = await supabase
      .from("team_members")
      .select("id")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (teamRecord) {
      router.push("/team-dashboard");
      router.refresh();
      return;
    }

    router.push("/signup/business");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
        >
          ← Back to AppointEaze
        </Link>

        <div className="rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-8 md:p-10">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mb-8 h-14 w-auto"
          />

          <h1 className="text-4xl font-black">Log in.</h1>

          <p className="mt-3 text-zinc-300">
            Business owners and invited team members can log in here.
          </p>

          <div className="mt-8 grid gap-5">
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              type="email"
            />

            <Field
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Your password"
              type="password"
            />

            <div className="-mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-purple-300 hover:text-purple-200"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={logIn}
              disabled={loading}
              className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
            >
              {loading ? "Logging In..." : "Log In"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-zinc-400">
            Starting a business account?{" "}
            <Link href="/signup" className="font-bold text-purple-300">
              Create one
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-zinc-500">
            Invited team members should use the invite link first, then log in
            here after accepting.
          </p>
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