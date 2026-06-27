"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type Business = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
};

type BusinessSettings = {
  id?: string;
  business_id: string;
  default_booking_flow: string;
  allow_staff_choice: boolean;
  allow_any_available: boolean;
  allow_guest_booking: boolean;
  offer_customer_account: boolean;
  allow_customer_cancel: boolean;
  cancellation_deadline: string;
  allow_customer_reschedule: boolean;
  require_reschedule_approval: boolean;
  reschedule_deadline: string;
  email_confirmations: boolean;
  email_reminders: boolean;
  dashboard_alerts: boolean;
  email_alerts: boolean;
  notification_email: string;
};

type Service = {
  id: string;
  name: string;
  active: boolean | null;
};

type TeamMember = {
  id: string;
  name: string;
  show_on_booking_page: boolean | null;
  accepting_bookings: boolean | null;
};

function blankSettings(businessId: string): BusinessSettings {
  return {
    business_id: businessId,
    default_booking_flow: "simple",
    allow_staff_choice: true,
    allow_any_available: true,
    allow_guest_booking: true,
    offer_customer_account: true,
    allow_customer_cancel: true,
    cancellation_deadline: "24 hours before",
    allow_customer_reschedule: true,
    require_reschedule_approval: false,
    reschedule_deadline: "24 hours before",
    email_confirmations: true,
    email_reminders: true,
    dashboard_alerts: true,
    email_alerts: true,
    notification_email: "",
  };
}

export default function BookingPageSettingsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBookingPageSettings();
  }, []);

  async function loadBookingPageSettings() {
    setLoading(true);

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, description, phone, email, address, logo_url, cover_photo_url"
      )
      .eq("slug", "elite-barber-studio")
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setSettings(null);
      setServices([]);
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    setBusiness(businessData as Business);

    const { data: settingsData, error: settingsError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("business_id", businessData.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Business settings load error:", settingsError);
    }

    if (settingsData) {
      setSettings({
        id: settingsData.id,
        business_id: settingsData.business_id,
        default_booking_flow:
          settingsData.default_booking_flow || "simple",
        allow_staff_choice: settingsData.allow_staff_choice ?? true,
        allow_any_available: settingsData.allow_any_available ?? true,
        allow_guest_booking: settingsData.allow_guest_booking ?? true,
        offer_customer_account: settingsData.offer_customer_account ?? true,
        allow_customer_cancel: settingsData.allow_customer_cancel ?? true,
        cancellation_deadline:
          settingsData.cancellation_deadline || "24 hours before",
        allow_customer_reschedule:
          settingsData.allow_customer_reschedule ?? true,
        require_reschedule_approval:
          settingsData.require_reschedule_approval ?? false,
        reschedule_deadline:
          settingsData.reschedule_deadline || "24 hours before",
        email_confirmations: settingsData.email_confirmations ?? true,
        email_reminders: settingsData.email_reminders ?? true,
        dashboard_alerts: settingsData.dashboard_alerts ?? true,
        email_alerts: settingsData.email_alerts ?? true,
        notification_email: settingsData.notification_email || "",
      });
    } else {
      setSettings(blankSettings(businessData.id));
    }

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("id, name, active")
      .eq("business_id", businessData.id)
      .order("created_at", { ascending: true });

    if (servicesError) {
      console.error("Services load error:", servicesError);
      setServices([]);
    } else {
      setServices((servicesData || []) as Service[]);
    }

    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select("id, name, show_on_booking_page, accepting_bookings")
      .eq("business_id", businessData.id)
      .order("created_at", { ascending: true });

    if (teamError) {
      console.error("Team load error:", teamError);
      setTeamMembers([]);
    } else {
      setTeamMembers((teamData || []) as TeamMember[]);
    }

    setLoading(false);
  }

  function updateSetting<K extends keyof BusinessSettings>(
    key: K,
    value: BusinessSettings[K]
  ) {
    setSettings((current) => {
      if (!current) return current;

      return {
        ...current,
        [key]: value,
      };
    });
  }

  async function saveBookingPageSettings() {
    if (!business || !settings) {
      alert("Booking page settings are not loaded yet.");
      return;
    }

    setSaving(true);

    const payload = {
      business_id: business.id,
      default_booking_flow: settings.default_booking_flow,
      allow_staff_choice: settings.allow_staff_choice,
      allow_any_available: settings.allow_any_available,
      allow_guest_booking: settings.allow_guest_booking,
      offer_customer_account: settings.offer_customer_account,
      allow_customer_cancel: settings.allow_customer_cancel,
      cancellation_deadline: settings.cancellation_deadline,
      allow_customer_reschedule: settings.allow_customer_reschedule,
      require_reschedule_approval: settings.require_reschedule_approval,
      reschedule_deadline: settings.reschedule_deadline,
      email_confirmations: settings.email_confirmations,
      email_reminders: settings.email_reminders,
      dashboard_alerts: settings.dashboard_alerts,
      email_alerts: settings.email_alerts,
      notification_email: settings.notification_email || null,
    };

    if (settings.id) {
      const { error } = await supabase
        .from("business_settings")
        .update(payload)
        .eq("id", settings.id);

      if (error) {
        console.error("Settings update error:", error);
        alert("Could not save booking page settings.");
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("business_settings")
        .insert(payload)
        .select("*")
        .single();

      if (error || !data) {
        console.error("Settings create error:", error);
        alert("Could not create booking page settings.");
        setSaving(false);
        return;
      }

      setSettings({
        ...settings,
        id: data.id,
      });
    }

    setSaving(false);
    alert("Booking page settings saved.");
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copied.");
    } catch {
      alert("Could not copy. You can manually highlight and copy the link.");
    }
  }

  const activeServices = services.filter((service) => service.active !== false);
  const publicTeamMembers = teamMembers.filter(
    (person) => person.show_on_booking_page
  );
  const acceptingTeamMembers = teamMembers.filter(
    (person) => person.accepting_bookings
  );

  const bookingPath = business ? `/${business.slug}` : "/elite-barber-studio";
  const customerAccountPath = business
    ? `/${business.slug}/account`
    : "/elite-barber-studio/account";

  const bookingLink = business
    ? `http://localhost:3000/${business.slug}`
    : "http://localhost:3000/elite-barber-studio";

  const customerAccountLink = business
    ? `http://localhost:3000/${business.slug}/account`
    : "http://localhost:3000/elite-barber-studio/account";

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Booking Page" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">
                Dashboard / Booking Page
              </p>
              <h1 className="text-4xl font-black">Booking Page</h1>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Manage the public customer booking link, customer account link,
                booking flow, guest booking, team selection, reminders, and
                customer self-service rules.
              </p>
            </div>

            <button
              onClick={saveBookingPageSettings}
              disabled={saving || loading || !settings}
              className="rounded-full bg-purple-500 px-6 py-3 font-bold hover:bg-purple-400 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Booking Page"}
            </button>
          </div>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-zinc-400">
                Loading booking page settings from Supabase...
              </p>
            </div>
          ) : !business || !settings ? (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h2 className="text-2xl font-bold text-red-200">
                Booking page not loaded
              </h2>
              <p className="mt-2 text-sm text-zinc-300">
                The dashboard could not find Elite Barber Studio or its booking
                settings in Supabase.
              </p>
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Active services"
                  value={String(activeServices.length)}
                />
                <StatCard
                  label="Public team members"
                  value={String(publicTeamMembers.length)}
                />
                <StatCard
                  label="Accepting bookings"
                  value={String(acceptingTeamMembers.length)}
                />
                <StatCard
                  label="Customer accounts"
                  value={settings.offer_customer_account ? "On" : "Off"}
                />
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                  <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                    <h2 className="text-2xl font-bold">Public Links</h2>
                    <p className="mt-2 text-sm text-zinc-300">
                      Share these with customers. These links come from the
                      business slug saved in Supabase.
                    </p>

                    <div className="mt-6 space-y-4">
                      <LinkBox
                        label="Customer booking page"
                        value={bookingLink}
                        href={bookingPath}
                        onCopy={() => copyText(bookingLink)}
                      />

                      <LinkBox
                        label="Customer account portal"
                        value={customerAccountLink}
                        href={customerAccountPath}
                        onCopy={() => copyText(customerAccountLink)}
                      />
                    </div>
                  </div>

                  <Card title="Booking Flow">
                    <p className="mb-4 text-sm text-zinc-400">
                      Choose how customers move through the booking page.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <RadioCard
                        name="booking-flow"
                        title="Simple booking"
                        description="Customer chooses service, then date and time."
                        checked={settings.default_booking_flow === "simple"}
                        onChange={() =>
                          updateSetting("default_booking_flow", "simple")
                        }
                      />

                      <RadioCard
                        name="booking-flow"
                        title="Team booking"
                        description="Customer chooses service, team member, then date and time."
                        checked={settings.default_booking_flow === "team"}
                        onChange={() =>
                          updateSetting("default_booking_flow", "team")
                        }
                      />
                    </div>
                  </Card>

                  <Card title="Team Selection Rules">
                    <p className="mb-4 text-sm text-zinc-400">
                      Control whether customers can choose a specific person or
                      use Any Available.
                    </p>

                    <div className="space-y-3">
                      <Checkbox
                        label="Show Choose Team Member section"
                        checked={settings.allow_staff_choice}
                        onChange={(checked) =>
                          updateSetting("allow_staff_choice", checked)
                        }
                      />

                      <Checkbox
                        label="Allow customers to choose Any Available"
                        checked={settings.allow_any_available}
                        onChange={(checked) =>
                          updateSetting("allow_any_available", checked)
                        }
                      />

                      <Checkbox
                        label="Allow guest booking without customer account"
                        checked={settings.allow_guest_booking}
                        onChange={(checked) =>
                          updateSetting("allow_guest_booking", checked)
                        }
                      />

                      <Checkbox
                        label="Offer customer account after booking"
                        checked={settings.offer_customer_account}
                        onChange={(checked) =>
                          updateSetting("offer_customer_account", checked)
                        }
                      />
                    </div>
                  </Card>

                  <Card title="Customer Self-Service Rules">
                    <p className="mb-4 text-sm text-zinc-400">
                      These are the default customer account rules. Services can
                      override stricter cancellation or reschedule policies.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black p-5">
                        <h3 className="font-bold">Cancellation</h3>

                        <div className="mt-4 space-y-3">
                          <Checkbox
                            label="Allow customers to cancel"
                            checked={settings.allow_customer_cancel}
                            onChange={(checked) =>
                              updateSetting("allow_customer_cancel", checked)
                            }
                          />

                          <Select
                            label="Cancellation deadline"
                            value={settings.cancellation_deadline}
                            options={[
                              "2 hours before",
                              "24 hours before",
                              "48 hours before",
                              "7 days before",
                              "No customer cancellations",
                              "Custom",
                            ]}
                            onChange={(value) =>
                              updateSetting("cancellation_deadline", value)
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black p-5">
                        <h3 className="font-bold">Reschedule</h3>

                        <div className="mt-4 space-y-3">
                          <Checkbox
                            label="Allow customers to reschedule"
                            checked={settings.allow_customer_reschedule}
                            onChange={(checked) =>
                              updateSetting(
                                "allow_customer_reschedule",
                                checked
                              )
                            }
                          />

                          <Checkbox
                            label="Require business approval"
                            checked={settings.require_reschedule_approval}
                            onChange={(checked) =>
                              updateSetting(
                                "require_reschedule_approval",
                                checked
                              )
                            }
                          />

                          <Select
                            label="Reschedule deadline"
                            value={settings.reschedule_deadline}
                            options={[
                              "2 hours before",
                              "24 hours before",
                              "48 hours before",
                              "7 days before",
                              "No customer reschedules",
                              "Custom",
                            ]}
                            onChange={(value) =>
                              updateSetting("reschedule_deadline", value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Notifications & Reminders">
                    <p className="mb-4 text-sm text-zinc-400">
                      Control confirmation, reminder, and business alert
                      settings.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black p-5">
                        <h3 className="font-bold">Customer notifications</h3>

                        <div className="mt-4 space-y-3">
                          <Checkbox
                            label="Email confirmation after booking"
                            checked={settings.email_confirmations}
                            onChange={(checked) =>
                              updateSetting("email_confirmations", checked)
                            }
                          />

                          <Checkbox
                            label="Email appointment reminders"
                            checked={settings.email_reminders}
                            onChange={(checked) =>
                              updateSetting("email_reminders", checked)
                            }
                          />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black p-5">
                        <h3 className="font-bold">Business alerts</h3>

                        <div className="mt-4 space-y-3">
                          <Checkbox
                            label="Dashboard alerts"
                            checked={settings.dashboard_alerts}
                            onChange={(checked) =>
                              updateSetting("dashboard_alerts", checked)
                            }
                          />

                          <Checkbox
                            label="Email alerts"
                            checked={settings.email_alerts}
                            onChange={(checked) =>
                              updateSetting("email_alerts", checked)
                            }
                          />

                          <Field
                            label="Notification email"
                            value={settings.notification_email}
                            placeholder="owner@business.com"
                            onChange={(value) =>
                              updateSetting("notification_email", value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card title="Public Booking Page Preview">
                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black">
                      <div className="flex h-40 items-center justify-center bg-[radial-gradient(circle_at_center,#a855f7,transparent_55%),linear-gradient(135deg,#4c1d95,#020617)] text-sm text-purple-100">
                        Cover Photo
                      </div>

                      <div className="p-6">
                        <div className="-mt-16 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950 text-sm text-purple-200">
                          Logo
                        </div>

                        <h3 className="mt-5 text-3xl font-black">
                          {business.name}
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                          {business.description ||
                            "Business description appears here."}
                        </p>

                        {business.address && (
                          <p className="mt-3 text-sm text-purple-300">
                            {business.address}
                          </p>
                        )}

                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          <PreviewItem
                            label="Services"
                            value={String(activeServices.length)}
                          />
                          <PreviewItem
                            label="Team shown"
                            value={
                              settings.allow_staff_choice
                                ? String(publicTeamMembers.length)
                                : "Hidden"
                            }
                          />
                          <PreviewItem
                            label="Guest booking"
                            value={
                              settings.allow_guest_booking ? "Allowed" : "Off"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                    <h2 className="text-2xl font-bold">Booking Page Status</h2>
                    <p className="mt-2 text-sm text-zinc-300">
                      Supabase-powered booking page settings.
                    </p>

                    <div className="mt-5 space-y-3">
                      <StatusRow label="Business profile" complete />
                      <StatusRow
                        label="Active services"
                        complete={activeServices.length > 0}
                      />
                      <StatusRow
                        label="Team members"
                        complete={teamMembers.length > 0}
                      />
                      <StatusRow label="Booking settings" complete />
                      <StatusRow
                        label="Customer account portal"
                        complete={settings.offer_customer_account}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Live Rules</h2>

                    <div className="mt-4 space-y-3">
                      <InfoRow
                        label="Booking flow"
                        value={
                          settings.default_booking_flow === "team"
                            ? "Team booking"
                            : "Simple booking"
                        }
                      />
                      <InfoRow
                        label="Staff choice"
                        value={settings.allow_staff_choice ? "Shown" : "Hidden"}
                      />
                      <InfoRow
                        label="Any Available"
                        value={settings.allow_any_available ? "On" : "Off"}
                      />
                      <InfoRow
                        label="Guest booking"
                        value={settings.allow_guest_booking ? "On" : "Off"}
                      />
                      <InfoRow
                        label="Customer account"
                        value={settings.offer_customer_account ? "On" : "Off"}
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Public Team</h2>

                    <div className="mt-4 space-y-3">
                      {publicTeamMembers.length > 0 ? (
                        publicTeamMembers.map((person) => (
                          <div
                            key={person.id}
                            className="rounded-xl border border-white/10 bg-black p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold">{person.name}</p>
                              <span
                                className={
                                  person.accepting_bookings
                                    ? "rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300"
                                    : "rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-300"
                                }
                              >
                                {person.accepting_bookings
                                  ? "Accepting"
                                  : "Paused"}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400">
                          No team members are public right now.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-xl font-bold">Active Services</h2>

                    <div className="mt-4 space-y-3">
                      {activeServices.length > 0 ? (
                        activeServices.map((service) => (
                          <div
                            key={service.id}
                            className="rounded-xl border border-white/10 bg-black p-4"
                          >
                            <p className="font-semibold">{service.name}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-zinc-400">
                          No active services yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
                    <h2 className="text-xl font-bold text-red-200">
                      Later Improvements
                    </h2>

                    <div className="mt-4 space-y-3 text-sm text-zinc-400">
                      <p>• Custom booking page theme colors</p>
                      <p>• Real logo and cover image uploads</p>
                      <p>• Custom domain support</p>
                      <p>• Booking page analytics</p>
                      <p>• Real availability calendar</p>
                    </div>
                  </div>

                  <button
                    onClick={saveBookingPageSettings}
                    disabled={saving || loading || !settings}
                    className="w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Booking Page"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
    </div>
  );
}

function LinkBox({
  label,
  value,
  href,
  onCopy,
}: {
  label: string;
  value: string;
  href: string;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 break-all font-mono text-sm text-purple-300">
        {value}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={href}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
        >
          Open
        </a>

        <button
          onClick={onCopy}
          className="rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
        >
          Copy
        </button>
      </div>
    </div>
  );
}

function RadioCard({
  name,
  title,
  description,
  checked,
  onChange,
}: {
  name: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-2xl border p-5 ${
        checked
          ? "border-purple-400/40 bg-purple-500/10"
          : "border-white/10 bg-black hover:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          name={name}
          checked={checked}
          onChange={onChange}
          className="mt-1"
        />

        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>
      </div>
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
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
      <label className="text-xs font-semibold text-zinc-400">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
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