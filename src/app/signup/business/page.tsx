"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BusinessSignupPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";

  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [customSlug, setCustomSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdSlug, setCreatedSlug] = useState("");

  const suggestedSlug = useMemo(() => {
    return customSlug ? makeSlug(customSlug) : makeSlug(businessName);
  }, [businessName, customSlug]);

  async function createBusiness() {
    setError("");
    setCreatedSlug("");

    if (!businessName.trim()) {
      setError("Please enter your business name.");
      return;
    }

    if (!suggestedSlug) {
      setError("Please enter a valid booking page URL.");
      return;
    }

    setSaving(true);

    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", suggestedSlug)
      .maybeSingle();

    if (existingBusiness) {
      setSaving(false);
      setError("That booking page URL is already taken. Try another one.");
      return;
    }

    const { error: insertError } = await supabase.from("businesses").insert({
      name: businessName.trim(),
      slug: suggestedSlug,
      description: description.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      logo_url: null,
      cover_photo_url: null,
      stripe_checkout_session_id: sessionId || null,
      plan_status: "trialing",
    });

    if (insertError) {
      console.error("Business create error:", insertError);
      setSaving(false);
      setError(insertError.message || "Could not create business.");
      return;
    }

    setSaving(false);
    setCreatedSlug(suggestedSlug);
  }

  if (createdSlug) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <section className="mx-auto max-w-3xl text-center">
          <div className="rounded-[2rem] border border-green-400/30 bg-green-500/10 p-8 md:p-12">
            <img
              src="/Logo.png"
              alt="AppointEaze"
              className="mx-auto mb-8 h-14 w-auto"
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl font-black text-black">
              ✓
            </div>

            <h1 className="mt-8 text-4xl font-black md:text-6xl">
              Your booking page is ready.
            </h1>

            <p className="mt-5 text-lg text-zinc-300">
              Your public booking page is:
            </p>

            <p className="mt-4 rounded-2xl border border-white/10 bg-black p-4 font-mono text-sm text-purple-300">
              appointeazebooking.com/{createdSlug}
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={`/${createdSlug}`}
                className="rounded-full bg-purple-500 px-8 py-4 text-center font-black hover:bg-purple-400"
              >
                View Booking Page
              </Link>

              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-8 py-4 text-center font-black hover:bg-white/10"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
        >
          ← Back to AppointEaze
        </Link>

        <div className="rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-8 md:p-12">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mb-8 h-14 w-auto"
          />

          <h1 className="text-4xl font-black md:text-6xl">
            Create your booking page.
          </h1>

          <p className="mt-4 text-zinc-300">
            Add your business details. You can change these later in the
            dashboard.
          </p>

          <div className="mt-8 grid gap-5">
            <Field
              label="Business name"
              value={businessName}
              onChange={setBusinessName}
              placeholder="Elite Barber Studio"
            />

            <Field
              label="Business description"
              value={description}
              onChange={setDescription}
              placeholder="Barber shop offering cuts, trims, and grooming services."
            />

            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              placeholder="(555) 123-4567"
            />

            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="business@example.com"
            />

            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="123 Main Street, City, State"
            />

            <Field
              label="Booking page URL"
              value={customSlug}
              onChange={setCustomSlug}
              placeholder={businessName ? makeSlug(businessName) : "your-business-name"}
            />

            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-sm text-zinc-400">Your booking page will be:</p>
              <p className="mt-2 font-mono text-sm text-purple-300">
                appointeazebooking.com/{suggestedSlug || "your-business-name"}
              </p>
            </div>

            {error && (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                {error}
              </p>
            )}

            <button
              onClick={createBusiness}
              disabled={saving}
              className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
            >
              {saving ? "Creating..." : "Create Booking Page"}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-zinc-300">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}