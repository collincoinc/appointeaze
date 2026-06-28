"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type TeamInvite = {
  id: string;
  business_id: string;
  name: string;
  role: string | null;
  email: string | null;
  invite_token: string | null;
  invite_status: string | null;
  auth_user_id: string | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

export default function TeamInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <p className="text-zinc-300">Loading invite...</p>
          </div>
        </main>
      }
    >
      <TeamInviteContent />
    </Suspense>
  );
}

function TeamInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [checkingSession, setCheckingSession] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [creating, setCreating] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadInvite();
    checkCurrentSession();
  }, [token]);

  async function checkCurrentSession() {
    setCheckingSession(true);

    const { data } = await supabase.auth.getUser();

    setCurrentUserEmail(data.user?.email || "");
    setCheckingSession(false);
  }

  async function loadInvite() {
    setLoading(true);
    setError("");
    setMessage("");

    if (!token.trim()) {
      setError("Invite token is missing.");
      setLoading(false);
      return;
    }

    const { data: inviteData, error: inviteError } = await supabase
      .from("team_members")
      .select(
        "id, business_id, name, role, email, invite_token, invite_status, auth_user_id"
      )
      .eq("invite_token", token)
      .maybeSingle();

    if (inviteError || !inviteData) {
      console.error("Invite load error:", inviteError);
      setError("This invite link is invalid or expired.");
      setInvite(null);
      setBusiness(null);
      setLoading(false);
      return;
    }

    const loadedInvite = inviteData as TeamInvite;
    setInvite(loadedInvite);
    setFullName(loadedInvite.name || "");
    setEmail(loadedInvite.email || "");

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("id", loadedInvite.business_id)
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
    } else {
      setBusiness(businessData as Business);
    }

    setLoading(false);
  }

  async function createAccountAndAccept() {
    setCreating(true);
    setError("");
    setMessage("");

    if (!invite) {
      setError("Invite is not loaded.");
      setCreating(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      setCreating(false);
      return;
    }

    if (invite.email && email.trim().toLowerCase() !== invite.email.toLowerCase()) {
      setError(`This invite is for ${invite.email}. Please use that email.`);
      setCreating(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      setCreating(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setCreating(false);
      return;
    }

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          appointeaze_role: "team_member",
        },
      },
    });

    if (signupError) {
      setError(signupError.message || "Could not create account.");
      setCreating(false);
      return;
    }

    if (!data.user) {
      setError("Account was not created. Please try again.");
      setCreating(false);
      return;
    }

    if (!data.session) {
      setMessage(
        "Account created. Check your email to confirm your account, then come back to this invite link and log in."
      );
      setCreating(false);
      return;
    }

    await acceptInviteForCurrentUser();
    setCreating(false);
  }

  async function logInAndAccept() {
    setLoggingIn(true);
    setError("");
    setMessage("");

    if (!invite) {
      setError("Invite is not loaded.");
      setLoggingIn(false);
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      setLoggingIn(false);
      return;
    }

    if (invite.email && email.trim().toLowerCase() !== invite.email.toLowerCase()) {
      setError(`This invite is for ${invite.email}. Please use that email.`);
      setLoggingIn(false);
      return;
    }

    if (!password.trim()) {
      setError("Password is required.");
      setLoggingIn(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (loginError) {
      setError(loginError.message || "Could not log in.");
      setLoggingIn(false);
      return;
    }

    await acceptInviteForCurrentUser();
    setLoggingIn(false);
  }

  async function acceptInviteForCurrentUser() {
    setAccepting(true);
    setError("");
    setMessage("");

    if (!invite) {
      setError("Invite is not loaded.");
      setAccepting(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setError("Please log in before accepting this invite.");
      setAccepting(false);
      return;
    }

    const userEmail = userData.user.email || "";

    if (invite.email && userEmail.toLowerCase() !== invite.email.toLowerCase()) {
      setError(
        `You are logged in as ${userEmail}, but this invite is for ${invite.email}. Please log out and use the invited email.`
      );
      setAccepting(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        auth_user_id: userData.user.id,
        invite_status: "accepted",
        invite_accepted_at: new Date().toISOString(),
        can_login: true,
      })
      .eq("id", invite.id)
      .eq("invite_token", token);

    if (updateError) {
      console.error("Invite accept error:", updateError);
      setError(updateError.message || "Could not accept invite.");
      setAccepting(false);
      return;
    }

    setMessage("Invite accepted. Redirecting to your team dashboard...");
    setAccepting(false);

    setTimeout(() => {
      router.push("/team-dashboard");
      router.refresh();
    }, 800);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setCurrentUserEmail("");
    setMessage("Signed out. You can now log in with the invited email.");
  }

  if (loading || checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-zinc-300">Loading invite...</p>
        </div>
      </main>
    );
  }

  if (error && !invite) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <section className="mx-auto max-w-xl">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8 md:p-10">
            <img
              src="/Logo.png"
              alt="AppointEaze"
              className="mb-8 h-14 w-auto"
            />

            <h1 className="text-4xl font-black">Invite not found.</h1>

            <p className="mt-3 text-zinc-300">{error}</p>

            <Link
              href="/login"
              className="mt-8 inline-flex rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400"
            >
              Go to Log In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-2xl">
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

          <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
            Team Invite
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Join {business?.name || "this business"}.
          </h1>

          <p className="mt-3 text-zinc-300">
            You were invited as{" "}
            <span className="font-bold text-purple-200">
              {invite?.name || "a team member"}
            </span>
            {invite?.role ? ` — ${invite.role}` : ""}.
          </p>

          {invite?.invite_status === "accepted" && (
            <p className="mt-5 rounded-xl border border-green-400/30 bg-green-500/10 p-4 text-sm font-semibold text-green-200">
              This invite has already been accepted. You can log in to access
              your team dashboard.
            </p>
          )}

          {currentUserEmail && (
            <div className="mt-5 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
              <p>
                Currently logged in as:{" "}
                <span className="font-bold text-purple-300">
                  {currentUserEmail}
                </span>
              </p>

              <button
                type="button"
                onClick={signOut}
                className="mt-3 rounded-full border border-white/10 px-4 py-2 text-xs font-bold hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          )}

          <div className="mt-8 grid gap-5">
            <Field
              label="Full name"
              value={fullName}
              onChange={setFullName}
              placeholder="Your name"
            />

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
              placeholder="At least 6 characters"
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

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={createAccountAndAccept}
                disabled={creating || loggingIn || accepting}
                className="rounded-xl bg-purple-500 py-4 font-black hover:bg-purple-400 disabled:opacity-60"
              >
                {creating ? "Creating..." : "Create Account"}
              </button>

              <button
                type="button"
                onClick={logInAndAccept}
                disabled={creating || loggingIn || accepting}
                className="rounded-xl border border-white/10 py-4 font-black hover:bg-white/10 disabled:opacity-60"
              >
                {loggingIn ? "Logging In..." : "Log In & Accept"}
              </button>
            </div>

            {currentUserEmail && (
              <button
                type="button"
                onClick={acceptInviteForCurrentUser}
                disabled={accepting}
                className="rounded-xl border border-green-400/30 py-4 font-black text-green-200 hover:bg-green-500/10 disabled:opacity-60"
              >
                {accepting ? "Accepting..." : "Accept Invite With Current Login"}
              </button>
            )}
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