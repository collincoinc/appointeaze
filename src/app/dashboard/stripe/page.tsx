"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type CurrentUser = {
  id: string;
  email: string | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  payment_provider_name: string | null;
  default_payment_link: string | null;
  deposit_payment_link: string | null;
  full_payment_link: string | null;
  payment_instructions: string | null;
};

function cleanUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export default function DashboardPaymentLinksPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const [providerName, setProviderName] = useState("");
  const [defaultPaymentLink, setDefaultPaymentLink] = useState("");
  const [depositPaymentLink, setDepositPaymentLink] = useState("");
  const [fullPaymentLink, setFullPaymentLink] = useState("");
  const [paymentInstructions, setPaymentInstructions] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedBusiness = useMemo(() => {
    return (
      businesses.find((business) => business.id === selectedBusinessId) || null
    );
  }, [businesses, selectedBusinessId]);

  useEffect(() => {
    loadCurrentUserAndBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      localStorage.setItem(
        "appointeaze_selected_business_id",
        selectedBusinessId
      );
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    if (selectedBusiness) {
      setProviderName(selectedBusiness.payment_provider_name || "");
      setDefaultPaymentLink(selectedBusiness.default_payment_link || "");
      setDepositPaymentLink(selectedBusiness.deposit_payment_link || "");
      setFullPaymentLink(selectedBusiness.full_payment_link || "");
      setPaymentInstructions(selectedBusiness.payment_instructions || "");
    }
  }, [selectedBusiness]);

  async function loadCurrentUserAndBusinesses() {
    setCheckingUser(true);
    setLoading(true);
    setError("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setCurrentUser(null);
      setCheckingUser(false);
      setLoading(false);
      return;
    }

    const user = {
      id: userData.user.id,
      email: userData.user.email || null,
    };

    setCurrentUser(user);
    setCheckingUser(false);

    const { data, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, payment_provider_name, default_payment_link, deposit_payment_link, full_payment_link, payment_instructions"
      )
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (businessError) {
      setError(businessError.message || "Could not load businesses.");
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const loadedBusinesses = (data || []) as Business[];
    setBusinesses(loadedBusinesses);

    const savedBusinessId = localStorage.getItem(
      "appointeaze_selected_business_id"
    );

    const savedStillExists = loadedBusinesses.some(
      (business) => business.id === savedBusinessId
    );

    if (savedBusinessId && savedStillExists) {
      setSelectedBusinessId(savedBusinessId);
    } else if (loadedBusinesses.length > 0) {
      setSelectedBusinessId(loadedBusinesses[0].id);
    }

    setLoading(false);
  }

  async function savePaymentLinks() {
    setSaving(true);
    setError("");
    setMessage("");

    if (!selectedBusiness) {
      setError("Choose a business first.");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        payment_provider_name: providerName.trim() || null,
        default_payment_link: defaultPaymentLink.trim()
          ? cleanUrl(defaultPaymentLink)
          : null,
        deposit_payment_link: depositPaymentLink.trim()
          ? cleanUrl(depositPaymentLink)
          : null,
        full_payment_link: fullPaymentLink.trim()
          ? cleanUrl(fullPaymentLink)
          : null,
        payment_instructions: paymentInstructions.trim() || null,
      })
      .eq("id", selectedBusiness.id);

    if (updateError) {
      setError(updateError.message || "Could not save payment links.");
      setSaving(false);
      return;
    }

    setMessage("Payment links saved.");
    setSaving(false);
    await loadCurrentUserAndBusinesses();
  }

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Payments" />

          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-300">Checking account...</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex">
          <DashboardSidebar active="Payments" />

          <section className="flex-1 p-6 lg:p-10">
            <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h1 className="text-3xl font-black text-yellow-200">
                Log in required
              </h1>

              <p className="mt-2 text-zinc-300">
                Please log in before managing payment links.
              </p>

              <Link
                href="/login?next=/dashboard/stripe"
                className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
              >
                Log In
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Payments" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Payments</p>

              <h1 className="text-4xl font-black">Payment Links</h1>

              <p className="mt-2 max-w-3xl text-zinc-400">
                Add outside payment links for this business. Customers can click
                the link to pay through Stripe, Square, PayPal, Venmo, Cash App,
                or any outside payment page. AppointEaze does not process the
                payment automatically.
              </p>

              <p className="mt-3 text-sm text-zinc-500">
                Logged in as: {currentUser.email || "Account"}
              </p>
            </div>

            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 px-6 py-3 text-center font-bold hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>

          {error && (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h2 className="text-2xl font-bold text-red-200">Payment error</h2>
              <p className="mt-2 text-sm text-zinc-300">{error}</p>
            </div>
          )}

          {message && (
            <div className="mt-8 rounded-3xl border border-green-400/30 bg-green-500/10 p-6">
              <h2 className="text-2xl font-bold text-green-200">Saved</h2>
              <p className="mt-2 text-sm text-zinc-300">{message}</p>
            </div>
          )}

          {loading ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-300">Loading businesses...</p>
            </div>
          ) : businesses.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
              <h2 className="text-2xl font-bold text-yellow-200">
                No business found
              </h2>

              <p className="mt-2 text-sm text-zinc-300">
                Create a business before adding payment links.
              </p>

              <Link
                href="/signup/business"
                className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
              >
                Create Business
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <label className="text-sm font-semibold text-zinc-300">
                  Business
                </label>

                <select
                  value={selectedBusinessId}
                  onChange={(event) => setSelectedBusinessId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
                >
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name} — /{business.slug}
                    </option>
                  ))}
                </select>

                {selectedBusiness && (
                  <p className="mt-3 text-sm text-purple-300">
                    Public page: appointeazebooking.com/{selectedBusiness.slug}
                  </p>
                )}
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                  <h2 className="text-2xl font-black">Business Payment Setup</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    These links are shown to customers when payment is required.
                    The business is responsible for checking the outside
                    payment system and marking the appointment paid manually.
                  </p>

                  <div className="mt-6 grid gap-5">
                    <Field
                      label="Payment provider name"
                      value={providerName}
                      onChange={setProviderName}
                      placeholder="Stripe, Square, Venmo, PayPal, Cash App, etc."
                    />

                    <Field
                      label="Default payment link"
                      value={defaultPaymentLink}
                      onChange={setDefaultPaymentLink}
                      placeholder="https://buy.stripe.com/..."
                    />

                    <Field
                      label="Deposit payment link"
                      value={depositPaymentLink}
                      onChange={setDepositPaymentLink}
                      placeholder="Link used when deposits are required"
                    />

                    <Field
                      label="Full payment link"
                      value={fullPaymentLink}
                      onChange={setFullPaymentLink}
                      placeholder="Link used when full payment is required"
                    />

                    <div>
                      <label className="text-sm font-semibold text-zinc-300">
                        Payment instructions
                      </label>

                      <textarea
                        value={paymentInstructions}
                        onChange={(event) =>
                          setPaymentInstructions(event.target.value)
                        }
                        placeholder="Example: Please include your name and appointment date when paying. Payment is verified manually by the business."
                        className="mt-2 h-32 w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={savePaymentLinks}
                      disabled={saving}
                      className="rounded-xl bg-purple-500 py-4 text-lg font-black hover:bg-purple-400 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Payment Links"}
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-2xl font-black">How this works</h2>

                    <div className="mt-4 space-y-3 text-sm text-zinc-300">
                      <p>1. Business adds its own payment link.</p>
                      <p>2. Customer books appointment.</p>
                      <p>3. Customer clicks Pay Here if payment is required.</p>
                      <p>4. Payment happens outside AppointEaze.</p>
                      <p>5. Business checks payment manually.</p>
                      <p>6. Business marks appointment paid manually.</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-yellow-400/30 bg-yellow-500/10 p-6">
                    <h2 className="text-xl font-bold text-yellow-200">
                      Manual payment tracking
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-zinc-300">
                      AppointEaze will not know automatically if the customer
                      paid through an outside link. The business must verify the
                      payment and update the appointment status.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Current saved links</h2>

                    <div className="mt-4 space-y-3 text-sm">
                      <InfoBox
                        label="Provider"
                        value={providerName || "Not set"}
                      />

                      <InfoBox
                        label="Default link"
                        value={defaultPaymentLink || "Not set"}
                      />

                      <InfoBox
                        label="Deposit link"
                        value={depositPaymentLink || "Not set"}
                      />

                      <InfoBox
                        label="Full payment link"
                        value={fullPaymentLink || "Not set"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-sm font-bold text-zinc-200">{value}</p>
    </div>
  );
}