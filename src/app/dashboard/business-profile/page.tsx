"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
  plan_status: string | null;
  trial_days_left: number | null;
  team_login_limit: number | null;
};

function blankProfile(): BusinessProfile {
  return {
    id: "",
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    address: "",
    logo_url: "",
    cover_photo_url: "",
    plan_status: "trial",
    trial_days_left: 14,
    team_login_limit: 5,
  };
}

export default function BusinessProfilePage() {
  const [profile, setProfile] = useState<BusinessProfile>(blankProfile());
  const [originalSlug, setOriginalSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  async function loadBusinessProfile() {
    setLoading(true);

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, phone, email, address, logo_url, cover_photo_url, plan_status, trial_days_left, team_login_limit"
      )
      .eq("slug", "elite-barber-studio")
      .maybeSingle();

    if (error || !data) {
      console.error("Business profile load error:", error);
      setLoading(false);
      return;
    }

    const loadedProfile = {
      id: data.id,
      name: data.name || "",
      slug: data.slug || "",
      description: data.description || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      logo_url: data.logo_url || "",
      cover_photo_url: data.cover_photo_url || "",
      plan_status: data.plan_status || "trial",
      trial_days_left: data.trial_days_left ?? 14,
      team_login_limit: data.team_login_limit ?? 5,
    };

    setProfile(loadedProfile);
    setOriginalSlug(loadedProfile.slug);
    setLoading(false);
  }

  function updateProfile<K extends keyof BusinessProfile>(
    key: K,
    value: BusinessProfile[K]
  ) {
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function makeSlugFromName() {
    const nextSlug = profile.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    updateProfile("slug", nextSlug);
  }

  async function saveBusinessProfile() {
    if (!profile.id) {
      alert("Business profile is not loaded yet.");
      return;
    }

    if (!profile.name.trim()) {
      alert("Business name is required.");
      return;
    }

    if (!profile.slug.trim()) {
      alert("Booking page slug is required.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        name: profile.name,
        slug: profile.slug,
        description: profile.description || null,
        phone: profile.phone || null,
        email: profile.email || null,
        address: profile.address || null,
        logo_url: profile.logo_url || null,
        cover_photo_url: profile.cover_photo_url || null,
        plan_status: profile.plan_status || "trial",
        trial_days_left: profile.trial_days_left ?? 14,
        team_login_limit: profile.team_login_limit ?? 5,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Business profile save error:", error);
      alert("Could not save business profile.");
      setSaving(false);
      return;
    }

    setOriginalSlug(profile.slug);
    setSaving(false);
    alert("Business profile saved.");
  }

  const bookingLink = `http://localhost:3000/${profile.slug || "your-business"}`;
  const customerAccountLink = `http://localhost:3000/${
    profile.slug || "your-business"
  }/account`;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Business Profile" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">
                Dashboard / Business Profile
              </p>
              <h1 className="text-4xl font-black">Business Profile</h1>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Manage the business details shown on the public booking page,
                dashboard, customer account portal, notifications, and booking
                links.
              </p>
            </div>

            <button
              onClick={saveBusinessProfile}
              disabled={saving || loading}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-400">
                Loading business profile from Supabase...
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-2xl font-bold">Public Business Info</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    This information appears on the customer booking page.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Field
                      label="Business name"
                      value={profile.name}
                      placeholder="Elite Barber Studio"
                      onChange={(value) => updateProfile("name", value)}
                    />

                    <div>
                      <Field
                        label="Booking page slug"
                        value={profile.slug}
                        placeholder="elite-barber-studio"
                        onChange={(value) => updateProfile("slug", value)}
                      />

                      <button
                        onClick={makeSlugFromName}
                        className="mt-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10"
                      >
                        Generate from business name
                      </button>
                    </div>

                    <Field
                      label="Phone"
                      value={profile.phone || ""}
                      placeholder="(555) 123-4567"
                      onChange={(value) => updateProfile("phone", value)}
                    />

                    <Field
                      label="Email"
                      value={profile.email || ""}
                      placeholder="hello@business.com"
                      onChange={(value) => updateProfile("email", value)}
                    />

                    <div className="md:col-span-2">
                      <Field
                        label="Address"
                        value={profile.address || ""}
                        placeholder="123 Main Street, Providence, RI"
                        onChange={(value) => updateProfile("address", value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-zinc-300">
                        Business description
                      </label>
                      <textarea
                        value={profile.description || ""}
                        onChange={(event) =>
                          updateProfile("description", event.target.value)
                        }
                        placeholder="Describe your business, services, and what customers should know before booking."
                        className="mt-2 h-32 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-2xl font-bold">Branding</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Photo upload will be connected later. For now, you can save
                    image URLs if needed.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black p-5">
                      <p className="text-sm font-semibold text-zinc-300">
                        Logo
                      </p>

                      <div className="mt-4 flex h-28 w-28 items-center justify-center rounded-2xl border border-white/10 bg-purple-500/10 text-sm text-purple-300">
                        Logo
                      </div>

                      <div className="mt-4">
                        <Field
                          label="Logo URL optional"
                          value={profile.logo_url || ""}
                          placeholder="https://..."
                          onChange={(value) => updateProfile("logo_url", value)}
                        />
                      </div>

                      <button className="mt-4 w-full rounded-xl border border-dashed border-purple-400/40 px-4 py-4 text-sm font-bold text-purple-200 hover:bg-purple-500/10">
                        Upload logo later
                      </button>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black p-5">
                      <p className="text-sm font-semibold text-zinc-300">
                        Cover photo
                      </p>

                      <div className="mt-4 flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_center,#a855f7,transparent_55%),linear-gradient(135deg,#4c1d95,#020617)] text-sm text-purple-100">
                        Cover Photo
                      </div>

                      <div className="mt-4">
                        <Field
                          label="Cover photo URL optional"
                          value={profile.cover_photo_url || ""}
                          placeholder="https://..."
                          onChange={(value) =>
                            updateProfile("cover_photo_url", value)
                          }
                        />
                      </div>

                      <button className="mt-4 w-full rounded-xl border border-dashed border-purple-400/40 px-4 py-4 text-sm font-bold text-purple-200 hover:bg-purple-500/10">
                        Upload cover later
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-2xl font-bold">Booking Links</h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    These links update when you change the booking page slug.
                  </p>

                  <div className="mt-6 space-y-4">
                    <LinkBox
                      label="Public booking page"
                      value={bookingLink}
                      href={`/${profile.slug}`}
                    />

                    <LinkBox
                      label="Customer account portal"
                      value={customerAccountLink}
                      href={`/${profile.slug}/account`}
                    />
                  </div>

                  {originalSlug && originalSlug !== profile.slug && (
                    <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                      <p className="text-sm font-bold text-yellow-300">
                        Slug changed
                      </p>
                      <p className="mt-1 text-sm text-zinc-300">
                        Saving this will change the public booking link from{" "}
                        <span className="font-mono text-yellow-200">
                          /{originalSlug}
                        </span>{" "}
                        to{" "}
                        <span className="font-mono text-yellow-200">
                          /{profile.slug}
                        </span>
                        .
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                  <h2 className="text-2xl font-bold">Live Preview</h2>
                  <p className="mt-2 text-sm text-zinc-300">
                    This is how the business card appears to customers.
                  </p>

                  <div className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-black">
                    <div className="flex h-32 items-center justify-center bg-[radial-gradient(circle_at_center,#a855f7,transparent_55%),linear-gradient(135deg,#4c1d95,#020617)] text-sm text-purple-100">
                      Cover Photo
                    </div>

                    <div className="p-5">
                      <div className="-mt-12 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-zinc-950 text-xs text-purple-200">
                        Logo
                      </div>

                      <h3 className="mt-4 text-2xl font-black">
                        {profile.name || "Business Name"}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-400">
                        {profile.description ||
                          "Business description will appear here."}
                      </p>

                      {profile.address && (
                        <p className="mt-3 text-sm text-purple-300">
                          {profile.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-xl font-bold">Plan Status</h2>

                  <div className="mt-4 space-y-3">
                    <InfoRow
                      label="Current status"
                      value={profile.plan_status || "trial"}
                    />
                    <InfoRow
                      label="Trial days left"
                      value={String(profile.trial_days_left ?? 14)}
                    />
                    <InfoRow
                      label="Team login limit"
                      value={String(profile.team_login_limit ?? 5)}
                    />
                    <InfoRow label="Launch price" value="$9.99/month" />
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-xl font-bold">Profile Checklist</h2>

                  <div className="mt-4 space-y-3">
                    <StatusRow
                      label="Business name"
                      complete={Boolean(profile.name)}
                    />
                    <StatusRow
                      label="Booking slug"
                      complete={Boolean(profile.slug)}
                    />
                    <StatusRow label="Phone" complete={Boolean(profile.phone)} />
                    <StatusRow label="Email" complete={Boolean(profile.email)} />
                    <StatusRow
                      label="Address"
                      complete={Boolean(profile.address)}
                    />
                    <StatusRow
                      label="Description"
                      complete={Boolean(profile.description)}
                    />
                    <StatusRow label="Logo" complete={Boolean(profile.logo_url)} />
                    <StatusRow
                      label="Cover photo"
                      complete={Boolean(profile.cover_photo_url)}
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
                  <h2 className="text-xl font-bold text-red-200">
                    Important
                  </h2>
                  <p className="mt-2 text-sm text-zinc-400">
                    Changing the slug changes the public booking page URL.
                    Existing shared links may stop working unless redirects are
                    added later.
                  </p>
                </div>

                <button
                  onClick={saveBusinessProfile}
                  disabled={saving || loading}
                  className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
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

function LinkBox({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-purple-300">
        {value}
      </p>

      <a
        href={href}
        className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
      >
        Open Link
      </a>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function StatusRow({
  label,
  complete,
}: {
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          complete
            ? "bg-green-500/15 text-green-300"
            : "bg-yellow-500/15 text-yellow-300"
        }`}
      >
        {complete ? "Done" : "Missing"}
      </span>
    </div>
  );
}