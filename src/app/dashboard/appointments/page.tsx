"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardSidebar from "../../components/DashboardSidebar";
import { supabase } from "../../lib/supabaseClient";

type Business = {
  id: string;
  name: string;
  slug: string;
};

type Service = {
  id: string;
  name: string;
  price: string;
  duration: string;
};

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
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

export default function AppointmentsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", "elite-barber-studio")
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setAppointments([]);
      setServices([]);
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    setBusiness(businessData as Business);

    const { data: appointmentsData, error: appointmentsError } = await supabase
      .from("appointments")
      .select("*")
      .eq("business_id", businessData.id)
      .order("created_at", { ascending: false });

    if (appointmentsError) {
      console.error("Appointments load error:", appointmentsError);
      setAppointments([]);
    } else {
      setAppointments((appointmentsData || []) as Appointment[]);
    }

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("id, name, price, duration")
      .eq("business_id", businessData.id);

    if (servicesError) {
      console.error("Services load error:", servicesError);
      setServices([]);
    } else {
      setServices((servicesData || []) as Service[]);
    }

    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select("id, name, role")
      .eq("business_id", businessData.id);

    if (teamError) {
      console.error("Team load error:", teamError);
      setTeamMembers([]);
    } else {
      setTeamMembers((teamData || []) as TeamMember[]);
    }

    setLoading(false);
  }

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  );

  const teamMap = useMemo(
    () => new Map(teamMembers.map((person) => [person.id, person])),
    [teamMembers]
  );

  const filteredAppointments = appointments.filter((appointment) => {
    if (filter === "All") return true;
    if (filter === "Upcoming") return appointment.status === "Upcoming";
    if (filter === "Completed") return appointment.status === "Completed";
    if (filter === "Cancelled") return appointment.status === "Cancelled";
    if (filter === "Payment Due") {
      const paymentStatus = appointment.payment_status || "";
      return (
        paymentStatus.toLowerCase().includes("due") ||
        paymentStatus.toLowerCase().includes("deposit") ||
        paymentStatus.toLowerCase().includes("payment")
      );
    }

    return true;
  });

  const upcomingCount = appointments.filter(
    (appointment) => appointment.status === "Upcoming"
  ).length;

  const completedCount = appointments.filter(
    (appointment) => appointment.status === "Completed"
  ).length;

  const cancelledCount = appointments.filter(
    (appointment) => appointment.status === "Cancelled"
  ).length;

  const paymentDueCount = appointments.filter((appointment) => {
    const status = appointment.payment_status || "";
    return (
      status.toLowerCase().includes("due") ||
      status.toLowerCase().includes("deposit") ||
      status.toLowerCase().includes("payment")
    );
  }).length;

  async function updateAppointment(
    appointment: Appointment,
    updates: Partial<Appointment>,
    notificationTitle: string,
    notificationMessage: string
  ) {
    setUpdatingId(appointment.id);

    const { error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", appointment.id);

    if (error) {
      console.error("Appointment update error:", error);
      alert("Could not update appointment.");
      setUpdatingId(null);
      return;
    }

    if (business) {
      await supabase.from("notifications").insert({
        business_id: business.id,
        appointment_id: appointment.id,
        title: notificationTitle,
        message: notificationMessage,
        type: "appointment",
        read: false,
      });
    }

    await loadAppointments();
    setUpdatingId(null);
  }

  function completeAppointment(appointment: Appointment) {
    updateAppointment(
      appointment,
      {
        status: "Completed",
      },
      "Appointment Completed",
      `${appointment.customer_name}'s appointment was marked completed.`
    );
  }

  function cancelAppointment(appointment: Appointment) {
    const confirmed = window.confirm(
      `Cancel ${appointment.customer_name}'s appointment?`
    );

    if (!confirmed) return;

    updateAppointment(
      appointment,
      {
        status: "Cancelled",
      },
      "Appointment Cancelled",
      `${appointment.customer_name}'s appointment was cancelled.`
    );
  }

  function markPaid(appointment: Appointment) {
    updateAppointment(
      appointment,
      {
        payment_status: "Paid",
        payment_detail: "Marked paid by business.",
        balance: "$0",
      },
      "Payment Marked Paid",
      `${appointment.customer_name}'s appointment was marked paid.`
    );
  }

  function markDepositReceived(appointment: Appointment) {
    updateAppointment(
      appointment,
      {
        payment_status: "Deposit received",
        payment_detail: "Deposit was marked received by business.",
      },
      "Deposit Received",
      `${appointment.customer_name}'s deposit was marked received.`
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Appointments" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">
                Dashboard / Appointments
              </p>
              <h1 className="text-4xl font-black">Appointments</h1>
              <p className="mt-2 max-w-3xl text-zinc-400">
                View customer bookings from Supabase, track payment status,
                mark appointments complete, cancel appointments, and manage
                deposits.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadAppointments}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold hover:bg-white/10"
              >
                Refresh
              </button>

              <a
                href="/elite-barber-studio"
                className="rounded-full bg-purple-500 px-6 py-3 text-center text-sm font-bold hover:bg-purple-400"
              >
                Book Test Appointment
              </a>
            </div>
          </div>

          {!business && !loading && (
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
            <StatCard label="Upcoming" value={String(upcomingCount)} />
            <StatCard label="Completed" value={String(completedCount)} />
            <StatCard label="Cancelled" value={String(cancelledCount)} />
            <StatCard label="Payment due" value={String(paymentDueCount)} />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold">
                      Appointment List
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Customer bookings created from the public booking page
                      appear here.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "Upcoming",
                      "Payment Due",
                      "Completed",
                      "Cancelled",
                    ].map((item) => (
                      <button
                        key={item}
                        onClick={() => setFilter(item)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold ${
                          filter === item
                            ? "border-purple-400/40 bg-purple-500 text-white"
                            : "border-white/10 bg-black text-zinc-300 hover:bg-white/10"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-zinc-400">
                    Loading appointments from Supabase...
                  </p>
                </div>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const service = appointment.service_id
                    ? serviceMap.get(appointment.service_id)
                    : null;

                  const teamMember = appointment.team_member_id
                    ? teamMap.get(appointment.team_member_id)
                    : null;

                  const isUpdating = updatingId === appointment.id;

                  return (
                    <div
                      key={appointment.id}
                      className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
                    >
                      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-2xl font-bold">
                              {service?.name || "Appointment"}
                            </h3>
                            <span className={statusClass(appointment.status)}>
                              {appointment.status || "Upcoming"}
                            </span>
                            <span
                              className={paymentStatusClass(
                                appointment.payment_status
                              )}
                            >
                              {appointment.payment_status || "Pay in person"}
                            </span>
                          </div>

                          <p className="mt-3 text-zinc-300">
                            {appointment.customer_name}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {appointment.appointment_date || "No date"} •{" "}
                            {appointment.appointment_time || "No time"}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            Team: {teamMember?.name || "Any Available"}
                          </p>

                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <InfoBox
                              label="Phone"
                              value={appointment.customer_phone || "Not added"}
                            />
                            <InfoBox
                              label="Email"
                              value={appointment.customer_email || "Not added"}
                            />
                            <InfoBox
                              label="Payment detail"
                              value={
                                appointment.payment_detail ||
                                "No payment detail"
                              }
                            />
                            <InfoBox
                              label="Balance"
                              value={appointment.balance || "Not set"}
                            />
                          </div>

                          {appointment.notes && (
                            <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4">
                              <p className="text-xs text-zinc-500">Notes</p>
                              <p className="mt-2 whitespace-pre-line text-sm text-zinc-300">
                                {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="grid min-w-56 gap-2">
                          <button
                            disabled={isUpdating}
                            onClick={() => markPaid(appointment)}
                            className="rounded-xl border border-green-400/30 px-4 py-3 text-sm font-bold text-green-300 hover:bg-green-500/10 disabled:opacity-50"
                          >
                            Mark Paid
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => markDepositReceived(appointment)}
                            className="rounded-xl border border-yellow-400/30 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                          >
                            Deposit Received
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => completeAppointment(appointment)}
                            className="rounded-xl border border-purple-400/30 px-4 py-3 text-sm font-bold text-purple-200 hover:bg-purple-500/10 disabled:opacity-50"
                          >
                            Complete
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => cancelAppointment(appointment)}
                            className="rounded-xl border border-red-400/30 px-4 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-2xl font-bold">No appointments found</h3>
                  <p className="mt-2 text-zinc-400">
                    Book a test appointment from the public booking page and it
                    should show here.
                  </p>

                  <a
                    href="/elite-barber-studio"
                    className="mt-5 inline-flex rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
                  >
                    Book Test Appointment
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
                <h2 className="text-xl font-bold">Appointments Connected</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  This page now reads appointments from Supabase.
                </p>

                <div className="mt-5 rounded-2xl bg-black p-5">
                  <p className="text-sm text-zinc-500">Total appointments</p>
                  <p className="mt-2 text-4xl font-black text-purple-300">
                    {appointments.length}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Workflow</h2>

                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <p>✓ Customer books online</p>
                  <p>✓ Appointment saves to Supabase</p>
                  <p>✓ Dashboard shows appointment</p>
                  <p>✓ Business can mark paid</p>
                  <p>✓ Business can mark complete</p>
                  <p>✓ Business can cancel</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Later Improvements</h2>

                <div className="mt-4 space-y-3 text-sm text-zinc-400">
                  <p>• Calendar date picker</p>
                  <p>• Real availability rules</p>
                  <p>• Reschedule request workflow</p>
                  <p>• Email notifications</p>
                  <p>• Payment processing status</p>
                  <p>• Customer account sync</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Filter</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Current filter:
                </p>
                <p className="mt-3 rounded-2xl bg-black p-4 text-lg font-black text-purple-300">
                  {filter}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{value}</p>
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

function paymentStatusClass(status: string | null) {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus.includes("paid")) {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  if (
    normalizedStatus.includes("due") ||
    normalizedStatus.includes("deposit") ||
    normalizedStatus.includes("payment")
  ) {
    return "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  return "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300";
}