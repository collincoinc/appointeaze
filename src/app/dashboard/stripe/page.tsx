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
  stripe_connected_account_id: string | null;
  stripe_connect_onboarding_complete: boolean | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
  stripe_connect_details_submitted: boolean | null;
  stripe_connect_last_checked_at: string | null;
};

type StripeStatus = {
  connected: boolean;
  onboardingComplete: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountId?: string;
};

export default function DashboardStripePage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  const [loading, setLoading] = useState(true);
  const [startingConnect, setStartingConnect] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const [status, setStatus] = useState<StripeStatus | null>(null);
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
      checkStripeStatus(selectedBusinessId);
    }
  }, [selectedBusinessId]);

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
        "id, name, slug, stripe_connected_account_id, stripe_connect_onboarding_complete, stripe_charges_enabled, stripe_payouts_enabled, stripe_connect_details_submitted, stripe_connect_last_checked_at"
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

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function startStripeConnect() {
    setStartingConnect(true);
    setError("");
    setMessage("");

    if (!selectedBusiness) {
      setError("Choose a business first.");
      setStartingConnect(false);
      return;
    }

    const token = await getAccessToken();

    if (!token) {
      setError("Please log in again.");
      setStartingConnect(false);
      return;
    }

    const response = await fetch("/api/stripe/connect/create-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessId: selectedBusiness.id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Could not start Stripe onboarding.");
      setStartingConnect(false);
      return;
    }

    if (!data.url) {
      setError("Stripe did not return an onboarding URL.");
      setStartingConnect(false);
      return;
    }

    window.location.href = data.url;
  }

  async function checkStripeStatus(businessIdOverride?: string) {
    setCheckingStatus(true);
    setError("");
    setMessage("");

    const businessId = businessIdOverride || selectedBusiness?.id;

    if (!businessId) {
      setError("Choose a business first.");
      setCheckingStatus(false);
      return;
    }

    const token = await getAccessToken();

    if (!token) {
      setError("Please log in again.");
      setCheckingStatus(false);
      return;
    }

    const response = await fetch("/api/stripe/connect/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        businessId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Could not check Stripe status.");
      setCheckingStatus(false);
      return;
    }

    setStatus(data as StripeStatus);

    if (data.onboardingComplete) {
      setMessage("Stripe account is connected and ready for online payments.");
    }

    setCheckingStatus(false);
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
                Please log in before connecting Stripe.
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

              <h1 className="text-4xl font-black">Stripe Connect</h1>

              <p className="mt-2 max-w-3xl text-zinc-400">
                Connect the business’s own Stripe account so customer online
                payments can be routed to the business. Stripe handles the
                onboarding and verification process.
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
              <h2 className="text-2xl font-bold text-red-200">Stripe error</h2>
              <p className="mt-2 text-sm text-zinc-300">{error}</p>
            </div>
          )}

          {message && (
            <div className="mt-8 rounded-3xl border border-green-400/30 bg-green-500/10 p-6">
              <h2 className="text-2xl font-bold text-green-200">Status</h2>
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
                Create a business before connecting Stripe.
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

              <div className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                  <h2 className="text-2xl font-black">Connect Stripe</h2>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    The business owner will be redirected to Stripe to complete
                    onboarding. AppointEaze will store only the connected
                    account ID and connection status.
                  </p>

                  <button
                    type="button"
                    onClick={startStripeConnect}
                    disabled={startingConnect || !selectedBusiness}
                    className="mt-6 w-full rounded-xl bg-purple-500 py-4 font-black hover:bg-purple-400 disabled:opacity-60"
                  >
                    {startingConnect
                      ? "Opening Stripe..."
                      : selectedBusiness?.stripe_connected_account_id
                      ? "Continue Stripe Onboarding"
                      : "Connect Stripe Account"}
                  </button>

                  <button
                    type="button"
                    onClick={() => checkStripeStatus()}
                    disabled={checkingStatus || !selectedBusiness}
                    className="mt-3 w-full rounded-xl border border-white/10 py-4 font-black hover:bg-white/10 disabled:opacity-60"
                  >
                    {checkingStatus ? "Checking..." : "Refresh Stripe Status"}
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-2xl font-black">Connection Status</h2>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <StatusBox
                      label="Connected account"
                      value={
                        status?.accountId ||
                        selectedBusiness?.stripe_connected_account_id ||
                        "Not connected"
                      }
                    />

                    <StatusBox
                      label="Onboarding"
                      value={
                        status?.onboardingComplete ||
                        selectedBusiness?.stripe_connect_onboarding_complete
                          ? "Complete"
                          : "Not complete"
                      }
                    />

                    <StatusBox
                      label="Charges enabled"
                      value={
                        status?.chargesEnabled ||
                        selectedBusiness?.stripe_charges_enabled
                          ? "Yes"
                          : "No"
                      }
                    />

                    <StatusBox
                      label="Payouts enabled"
                      value={
                        status?.payoutsEnabled ||
                        selectedBusiness?.stripe_payouts_enabled
                          ? "Yes"
                          : "No"
                      }
                    />

                    <StatusBox
                      label="Details submitted"
                      value={
                        status?.detailsSubmitted ||
                        selectedBusiness?.stripe_connect_details_submitted
                          ? "Yes"
                          : "No"
                      }
                    />

                    <StatusBox
                      label="Last checked"
                      value={
                        selectedBusiness?.stripe_connect_last_checked_at
                          ? new Date(
                              selectedBusiness.stripe_connect_last_checked_at
                            ).toLocaleString()
                          : "Not checked yet"
                      }
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
                    <p className="text-sm font-bold text-yellow-200">
                      Important
                    </p>

                    <p className="mt-2 text-sm leading-6 text-zinc-300">
                      Connecting Stripe does not automatically charge customers
                      yet. The next step is adding customer payment checkout to
                      the public booking flow for services that require deposits
                      or full payment.
                    </p>
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

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-all text-sm font-bold text-zinc-200">{value}</p>
    </div>
  );
}