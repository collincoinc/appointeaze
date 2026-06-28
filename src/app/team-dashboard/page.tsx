"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

type CurrentUser = {
  id: string;
  email: string | null;
};

type TeamMember = {
  id: string;
  business_id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photo_url: string | null;
  can_login: boolean | null;
  can_manage_schedule: boolean | null;
  can_view_assigned_appointments: boolean | null;
  show_on_booking_page: boolean | null;
  accepting_bookings: boolean | null;
};

type Business = {
  id: string;
  name: string;
  slug: string;
};

type Appointment = {
  id: string;
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
  service_id: string | null;
  created_at: string;
};

type Service = {
  id: string;
  name: string;
  price: string;
};

export default function TeamDashboardPage() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const serviceMap = useMemo(() => {
    return new Map(services.map((service) => [service.id, service]));
  }, [services]);

  useEffect(() => {
    loadTeamDashboard();
  }, []);

  async function loadTeamDashboard() {
    setLoading(true);
    setError("");

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      setCurrentUser(null);
      setTeamMember(null);
      setBusiness(null);
      setAppointments([]);
      setServices([]);
      setLoading(false);
      return;
    }

    const user = {
      id: userData.user.id,
      email: userData.user.email || null,
    };

    setCurrentUser(user);

    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (teamError || !teamData) {
      console.error("Team member load error:", teamError);
      setTeamMember(null);
      setBusiness(null);
      setAppointments([]);
      setServices([]);
      setError(
        "No team member record is connected to this login yet. Ask the business owner for an invite link."
      );
      setLoading(false);
      return;
    }

    const loadedTeamMember = teamData as TeamMember;
    setTeamMember(loadedTeamMember);

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("id", loadedTeamMember.business_id)
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
    } else {
      setBusiness(businessData as Business);
    }

    const { data: servicesData } = await supabase
      .from("services")
      .select("id, name, price")
      .eq("business_id", loadedTeamMember.business_id);

    setServices((servicesData || []) as Service[]);

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", loadedTeamMember.business_id)
      .eq("team_member_id", loadedTeamMember.id)
      .order("created_at", { ascending: false });

    if (appointmentError) {
      console.error("Appointments load error:", appointmentError);
      setAppointments([]);
    } else {
      setAppointments((appointmentData || []) as Appointment[]);
    }

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-zinc-300">Loading team dashboard...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <section className="mx-auto max-w-xl">
          <div className="rounded-[2rem] border border-yellow-400/30 bg-yellow-500/10 p-8">
            <h1 className="text-3xl font-black text-yellow-200">
              Log in required
            </h1>

            <p className="mt-3 text-zinc-300">
              Please log in to view your team dashboard.
            </p>

            <Link
              href="/login?next=/team-dashboard"
              className="mt-6 inline-flex rounded-full bg-purple-500 px-5 py-3 font-bold hover:bg-purple-400"
            >
              Log In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (error || !teamMember) {
    return (
      <main className="min-h-screen bg-black px-6 py-12 text-white">
        <section className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8">
            <img
              src="/Logo.png"
              alt="AppointEaze"
              className="mb-8 h-14 w-auto"
            />

            <h1 className="text-3xl font-black text-red-200">
              Team access not connected
            </h1>

            <p className="mt-3 text-zinc-300">{error}</p>

            <p className="mt-4 rounded-xl border border-white/10 bg-black p-4 text-sm text-zinc-400">
              Logged in as: {currentUser.email || "Account"}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/team-invite"
                className="rounded-full border border-white/10 px-5 py-3 text-center font-bold hover:bg-white/10"
              >
                Use Invite Link
              </Link>

              <button
                type="button"
                onClick={signOut}
                className="rounded-full bg-purple-500 px-5 py-3 font-bold hover:bg-purple-400"
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <nav className="flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center">
          <Link href="/" className="flex items-center gap-3">
            <img src="/Logo.png" alt="AppointEaze" className="h-10 w-auto" />
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            {business && (
              <Link
                href={`/${business.slug}`}
                className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/10"
              >
                View Booking Page
              </Link>
            )}

            <button
              type="button"
              onClick={signOut}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
            >
              Sign Out
            </button>
          </div>
        </nav>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-8">
              <div className="flex items-center gap-5">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-black text-purple-300">
                  {teamMember.photo_url ? (
                    <img
                      src={teamMember.photo_url}
                      alt={teamMember.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    teamMember.name.slice(0, 1)
                  )}
                </div>

                <div>
                  <p className="text-sm uppercase tracking-widest text-purple-300">
                    Team Dashboard
                  </p>

                  <h1 className="mt-2 text-4xl font-black">
                    {teamMember.name}
                  </h1>

                  <p className="mt-1 text-zinc-400">
                    {teamMember.role || "Team Member"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-300">
                <p>Business: {business?.name || "Business"}</p>
                <p className="mt-1">Logged in as: {currentUser.email}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Permissions</h2>

              <div className="mt-4 space-y-3 text-sm">
                <PermissionRow
                  label="Can log in"
                  value={teamMember.can_login}
                />
                <PermissionRow
                  label="Can manage schedule"
                  value={teamMember.can_manage_schedule}
                />
                <PermissionRow
                  label="Can view assigned appointments"
                  value={teamMember.can_view_assigned_appointments}
                />
                <PermissionRow
                  label="Shown on booking page"
                  value={teamMember.show_on_booking_page}
                />
                <PermissionRow
                  label="Accepting bookings"
                  value={teamMember.accepting_bookings}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-2xl font-black">Assigned Appointments</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Appointments assigned directly to this team member.
                </p>
              </div>

              <button
                type="button"
                onClick={loadTeamDashboard}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {appointments.length > 0 ? (
                appointments.map((appointment) => {
                  const service = appointment.service_id
                    ? serviceMap.get(appointment.service_id)
                    : null;

                  return (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-white/10 bg-black p-5"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
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

                          {appointment.customer_phone && (
                            <p className="mt-1 text-sm text-zinc-500">
                              Phone: {appointment.customer_phone}
                            </p>
                          )}

                          {appointment.customer_email && (
                            <p className="mt-1 text-sm text-zinc-500">
                              Email: {appointment.customer_email}
                            </p>
                          )}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:min-w-56">
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
                    No assigned appointments yet
                  </h3>

                  <p className="mt-2 text-sm text-zinc-400">
                    When customers choose this team member, appointments will
                    show here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PermissionRow({
  label,
  value,
}: {
  label: string;
  value: boolean | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3">
      <span className="text-zinc-300">{label}</span>

      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          value
            ? "bg-green-500/15 text-green-300"
            : "bg-red-500/15 text-red-300"
        }`}
      >
        {value ? "Yes" : "No"}
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
    return "inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300";
  }

  if (status.toLowerCase().includes("due")) {
    return "inline-flex rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  if (status.toLowerCase().includes("paid")) {
    return "inline-flex rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  return "inline-flex rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
}