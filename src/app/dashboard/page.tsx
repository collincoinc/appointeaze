import Link from "next/link";
import DashboardSidebar from "../components/DashboardSidebar";
import { supabase } from "../lib/supabaseClient";

type Business = {
  id: string;
  name: string;
  slug: string;
  trial_days_left: number | null;
  plan_status: string | null;
  team_login_limit: number | null;
};

type Service = {
  id: string;
  name: string;
  price: string;
};

type TeamMember = {
  id: string;
  name: string;
};

type Appointment = {
  id: string;
  business_id: string;
  service_id: string | null;
  team_member_id: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  payment_status: string | null;
  payment_detail: string | null;
  balance: string | null;
  notes: string | null;
  created_at: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  read: boolean | null;
  created_at: string;
};

export default async function DashboardPage() {
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, trial_days_left, plan_status, team_login_limit")
    .eq("slug", "elite-barber-studio")
    .maybeSingle<Business>();

  const businessId = business?.id;

  const { data: appointmentsData } = businessId
    ? await supabase
        .from("appointments")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const { data: servicesData } = businessId
    ? await supabase
        .from("services")
        .select("id, name, price")
        .eq("business_id", businessId)
    : { data: [] };

  const { data: teamData } = businessId
    ? await supabase
        .from("team_members")
        .select("id, name")
        .eq("business_id", businessId)
    : { data: [] };

  const { data: notificationsData } = businessId
    ? await supabase
        .from("notifications")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(6)
    : { data: [] };

  const appointments = (appointmentsData || []) as Appointment[];
  const services = (servicesData || []) as Service[];
  const teamMembers = (teamData || []) as TeamMember[];
  const notifications = (notificationsData || []) as Notification[];

  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const teamMap = new Map(teamMembers.map((person) => [person.id, person]));

  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status !== "Cancelled"
  );

  const unpaidAppointments = appointments.filter((appointment) => {
    const status = appointment.payment_status || "";
    return (
      status.includes("due") ||
      status.includes("Deposit") ||
      status.includes("Payment")
    );
  });

  const unreadNotifications = notifications.filter(
    (notification) => !notification.read
  );

  const totalPotentialBalance = appointments.reduce((total, appointment) => {
    const balance = appointment.balance || "";
    const numericValue = Number(balance.replace(/[^0-9.]/g, ""));

    if (Number.isNaN(numericValue)) {
      return total;
    }

    return total + numericValue;
  }, 0);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Dashboard" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">Dashboard</p>
              <h1 className="text-4xl font-black">
                {business?.name || "AppointEaze Dashboard"}
              </h1>
              <p className="mt-2 max-w-3xl text-zinc-400">
                View bookings, payments, alerts, trial status, and business
                activity from one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/elite-barber-studio"
                className="rounded-full border border-white/10 px-6 py-3 text-center font-bold hover:bg-white/10"
              >
                View Booking Page
              </Link>

              <Link
                href="/dashboard/services"
                className="rounded-full bg-purple-500 px-6 py-3 text-center font-bold hover:bg-purple-400"
              >
                Manage Services
              </Link>
            </div>
          </div>

          {!business && (
            <div className="mt-8 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
              <h2 className="text-2xl font-bold text-red-200">
                Business not found
              </h2>
              <p className="mt-2 text-sm text-zinc-300">
                The dashboard could not find Elite Barber Studio in Supabase.
                Check your businesses table and make sure the slug is
                elite-barber-studio.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Upcoming appointments"
              value={String(upcomingAppointments.length)}
              note="Active bookings"
            />
            <StatCard
              label="Payment follow-ups"
              value={String(unpaidAppointments.length)}
              note="Deposits or payments due"
            />
            <StatCard
              label="Unread alerts"
              value={String(unreadNotifications.length)}
              note="New activity"
            />
            <StatCard
              label="Potential revenue"
              value={`$${totalPotentialBalance.toFixed(0)}`}
              note="Based on booked services"
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
                      Launch plan
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                      14-day free trial, then $9.99/month
                    </h2>
                    <p className="mt-2 text-sm text-zinc-300">
                      Flat launch pricing. No complicated tiers for now.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black p-5 text-left md:text-right">
                    <p className="text-sm text-zinc-500">Trial status</p>
                    <p className="mt-2 text-3xl font-black text-purple-300">
                      {business?.trial_days_left ?? 14} days
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      remaining in trial
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <PlanItem title="Flat price" value="$9.99/month" />
                  <PlanItem title="Team access" value="Up to 5 team members" />
                  <PlanItem title="Included" value="Bookings + payments" />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Recent Appointment Activity
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      New customer bookings will appear here after they book from
                      the public booking page.
                    </p>
                  </div>

                  <Link
                    href="/dashboard/appointments"
                    className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/10"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-5 space-y-4">
                  {appointments.length > 0 ? (
                    appointments.map((appointment) => {
                      const service = appointment.service_id
                        ? serviceMap.get(appointment.service_id)
                        : null;

                      const teamMember = appointment.team_member_id
                        ? teamMap.get(appointment.team_member_id)
                        : null;

                      return (
                        <div
                          key={appointment.id}
                          className="rounded-2xl border border-white/10 bg-black p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-bold">
                                  {service?.name || "Appointment"}
                                </h3>
                                <span className={statusClass(appointment.status)}>
                                  {appointment.status || "Upcoming"}
                                </span>
                              </div>

                              <p className="mt-2 text-sm text-zinc-400">
                                Customer: {appointment.customer_name}
                              </p>

                              <p className="mt-1 text-sm text-zinc-500">
                                {appointment.appointment_date || "No date"} •{" "}
                                {appointment.appointment_time || "No time"}
                              </p>

                              <p className="mt-1 text-sm text-zinc-500">
                                Team: {teamMember?.name || "Any Available"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:min-w-56">
                              <p className={paymentClass(appointment.payment_status)}>
                                {appointment.payment_status || "Pay in person"}
                              </p>

                              <p className="mt-2 text-sm text-zinc-400">
                                {appointment.payment_detail ||
                                  "Payment details set by service rules."}
                              </p>

                              {appointment.balance && (
                                <p className="mt-2 text-sm font-bold text-purple-300">
                                  Balance: {appointment.balance}
                                </p>
                              )}
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                              <p className="text-xs text-zinc-500">Notes</p>
                              <p className="mt-1 whitespace-pre-line text-sm text-zinc-300">
                                {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black p-6">
                      <h3 className="text-xl font-bold">
                        No appointments yet
                      </h3>
                      <p className="mt-2 text-sm text-zinc-400">
                        Book a test appointment from the public booking page and
                        it should appear here.
                      </p>

                      <Link
                        href="/elite-barber-studio"
                        className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
                      >
                        Book Test Appointment
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  New bookings, deposits, cancellations, and reschedules will
                  show here.
                </p>

                <div className="mt-5 space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="rounded-2xl border border-white/10 bg-black p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold">{notification.title}</p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {notification.message}
                            </p>
                          </div>

                          {!notification.read && (
                            <span className="rounded-full bg-purple-500 px-2 py-1 text-xs font-bold">
                              New
                            </span>
                          )}
                        </div>

                        <p className="mt-3 text-xs text-zinc-600">
                          {formatDateTime(notification.created_at)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm text-zinc-400">
                        No notifications yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Quick Actions</h2>

                <div className="mt-5 space-y-3">
                  <QuickLink
                    href="/dashboard/services"
                    label="Manage Services"
                  />
                  <QuickLink
                    href="/dashboard/team"
                    label="Manage Team Members"
                  />
                  <QuickLink
                    href="/dashboard/appointments"
                    label="View Appointments"
                  />
                  <QuickLink href="/dashboard/payments" label="Payments" />
                  <QuickLink
                    href="/dashboard/settings"
                    label="Settings & Alerts"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Setup Checklist</h2>

                <div className="mt-5 space-y-3 text-sm text-zinc-300">
                  <ChecklistItem checked label="Business profile ready" />
                  <ChecklistItem checked label="Services added" />
                  <ChecklistItem checked label="Team members added" />
                  <ChecklistItem checked label="Booking page live" />
                  <ChecklistItem checked label="Alerts configured" />
                  <ChecklistItem label="Fix service add/edit polish" />
                </div>
              </div>

              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <h2 className="text-xl font-bold">Launch Pricing</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  AppointEaze launch pricing is simple: 14 days free, then
                  $9.99/month.
                </p>

                <Link
                  href="/dashboard/settings"
                  className="mt-5 block rounded-xl bg-purple-500 py-3 text-center text-sm font-bold hover:bg-purple-400"
                >
                  Manage Plan
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-4xl font-black">{value}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function PlanItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-1 text-sm font-bold text-zinc-200">{value}</p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-bold hover:bg-white/10"
    >
      {label}
    </Link>
  );
}

function ChecklistItem({
  label,
  checked = false,
}: {
  label: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3">
      <span>{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          checked
            ? "bg-green-500/15 text-green-300"
            : "bg-yellow-500/15 text-yellow-300"
        }`}
      >
        {checked ? "Done" : "Next"}
      </span>
    </div>
  );
}

function statusClass(status: string | null) {
  if (status === "Cancelled") {
    return "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300";
  }

  if (status === "Completed") {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  return "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
}

function paymentClass(status: string | null) {
  if (!status) {
    return "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300";
  }

  if (status.toLowerCase().includes("due")) {
    return "inline-flex rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  if (status.toLowerCase().includes("paid")) {
    return "inline-flex rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  return "inline-flex rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}