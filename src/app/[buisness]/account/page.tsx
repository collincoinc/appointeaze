"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "../../lib/supabaseClient";

type Business = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type Service = {
  id: string;
  name: string;
  price: string;
  duration: string | null;
  cancellation_deadline: string | null;
  reschedule_deadline: string | null;
  cancellation_policy_text: string | null;
  reschedule_policy_text: string | null;
  allow_reschedule: boolean | null;
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

export default function CustomerAccountPage() {
  const params = useParams();

  const rawSlug = params["business"] || params["buisness"];
  const businessSlug = Array.isArray(rawSlug)
    ? rawSlug[0]
    : String(rawSlug || "").trim().toLowerCase();

  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  useEffect(() => {
    loadCustomerAccount();
  }, [businessSlug]);

  async function loadCustomerAccount() {
    if (!businessSlug) {
      setLoadError("No business slug found.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("id, name, slug, phone, email, address")
      .eq("slug", businessSlug)
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setAppointments([]);
      setServices([]);
      setTeamMembers([]);
      setLoadError("Business not found.");
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
      .select(
        "id, name, price, duration, cancellation_deadline, reschedule_deadline, cancellation_policy_text, reschedule_policy_text, allow_reschedule"
      )
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
    const search = customerSearch.trim().toLowerCase();

    if (!search) return true;

    const name = appointment.customer_name.toLowerCase();
    const phone = (appointment.customer_phone || "").toLowerCase();
    const email = (appointment.customer_email || "").toLowerCase();

    return (
      name.includes(search) ||
      phone.includes(search) ||
      email.includes(search)
    );
  });

  const upcomingAppointments = filteredAppointments.filter((appointment) => {
    const status = appointment.status || "Upcoming";
    return status !== "Completed" && status !== "Cancelled";
  });

  const pastAppointments = filteredAppointments.filter((appointment) => {
    const status = appointment.status || "";
    return status === "Completed" || status === "Cancelled";
  });

  const paymentDueAppointments = filteredAppointments.filter((appointment) => {
    const status = appointment.payment_status || "";
    return (
      status.toLowerCase().includes("due") ||
      status.toLowerCase().includes("deposit") ||
      status.toLowerCase().includes("payment")
    );
  });

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
      console.error("Customer appointment update error:", error);
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
        type: "customer",
        read: false,
      });
    }

    await loadCustomerAccount();
    setUpdatingId(null);
  }

  function cancelAppointment(appointment: Appointment) {
    const confirmed = window.confirm(
      `Cancel ${appointment.customer_name}'s appointment?`
    );

    if (!confirmed) return;

    updateAppointment(
      appointment,
      { status: "Cancelled" },
      "Customer Cancelled Appointment",
      `${appointment.customer_name} cancelled their appointment from the customer account portal.`
    );
  }

  function requestReschedule(appointment: Appointment) {
    updateAppointment(
      appointment,
      { status: "Reschedule Requested" },
      "Customer Requested Reschedule",
      `${appointment.customer_name} requested to reschedule their appointment from the customer account portal.`
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-zinc-300">Loading customer account...</p>
        </div>
      </main>
    );
  }

  if (loadError || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center">
          <h1 className="text-4xl font-black">Account page not found</h1>
          <p className="mt-3 text-zinc-300">
            {loadError || "This customer account page does not exist yet."}
          </p>
          <p className="mt-3 rounded-xl bg-black p-3 font-mono text-sm text-purple-300">
            {businessSlug || "No slug found"}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm text-purple-300">Customer Account</p>
            <h1 className="mt-2 text-4xl font-black">
              {business.name} Account Portal
            </h1>
            <p className="mt-2 max-w-2xl text-zinc-400">
              View appointments, payment status, booking history, and request
              changes based on business rules.
            </p>
          </div>

          <Link
            href={`/${business.slug}`}
            className="rounded-full bg-purple-500 px-6 py-3 text-center font-bold hover:bg-purple-400"
          >
            Book Another Appointment
          </Link>
        </div>

        <div className="mt-6 rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold">Find your appointments</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Search by customer name, phone, or email. Real customer login can
                be added later.
              </p>
            </div>

            <input
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search name, phone, or email"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600 md:max-w-md"
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Upcoming" value={String(upcomingAppointments.length)} />
          <Stat label="Past Visits" value={String(pastAppointments.length)} />
          <Stat
            label="Payments Due"
            value={String(paymentDueAppointments.length)}
          />
          <Stat
            label="Total Bookings"
            value={String(filteredAppointments.length)}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Upcoming Appointments">
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((appointment) => {
                    const service = appointment.service_id
                      ? serviceMap.get(appointment.service_id)
                      : null;

                    const teamMember = appointment.team_member_id
                      ? teamMap.get(appointment.team_member_id)
                      : null;

                    const isUpdating = updatingId === appointment.id;
                    const canCancel = appointment.status !== "Cancelled";
                    const canReschedule =
                      appointment.status !== "Cancelled" &&
                      appointment.status !== "Completed" &&
                      service?.allow_reschedule !== false;

                    return (
                      <div
                        key={appointment.id}
                        className="rounded-3xl border border-white/10 bg-black p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-bold">
                                {service?.name || "Appointment"}
                              </h3>
                              <span className={statusClass(appointment.status)}>
                                {appointment.status || "Upcoming"}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-zinc-400">
                              {business.name}
                            </p>

                            <p className="mt-3 text-zinc-300">
                              {appointment.appointment_date || "No date"} •{" "}
                              {appointment.appointment_time || "No time"}
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                              Staff: {teamMember?.name || "Any Available"}
                            </p>
                          </div>

                          <div className="min-w-64 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <span
                              className={paymentClass(
                                appointment.payment_status
                              )}
                            >
                              {appointment.payment_status || "Pay in person"}
                            </span>

                            <p className="mt-3 text-sm text-zinc-300">
                              {appointment.payment_detail ||
                                "Payment details are set by the business."}
                            </p>

                            {appointment.balance && (
                              <p className="mt-2 text-sm font-bold text-purple-300">
                                Balance: {appointment.balance}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <p className="text-sm font-semibold text-zinc-300">
                            Business policy
                          </p>

                          <div className="mt-2 space-y-2 text-sm text-zinc-500">
                            <p>
                              Cancellation deadline:{" "}
                              {service?.cancellation_deadline ||
                                "Business default"}
                            </p>
                            <p>
                              Reschedule deadline:{" "}
                              {service?.reschedule_deadline ||
                                "Business default"}
                            </p>
                            {service?.cancellation_policy_text && (
                              <p>{service.cancellation_policy_text}</p>
                            )}
                            {service?.reschedule_policy_text && (
                              <p>{service.reschedule_policy_text}</p>
                            )}
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-sm font-semibold text-zinc-300">
                              Notes
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm text-zinc-500">
                              {appointment.notes}
                            </p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap gap-2">
                          {canReschedule ? (
                            <button
                              disabled={isUpdating}
                              onClick={() => requestReschedule(appointment)}
                              className="rounded-full border border-purple-400/30 px-4 py-2 text-sm text-purple-200 hover:bg-purple-500/10 disabled:opacity-50"
                            >
                              Request Reschedule
                            </button>
                          ) : (
                            <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-500">
                              Reschedule Not Available
                            </button>
                          )}

                          {canCancel ? (
                            <button
                              disabled={isUpdating}
                              onClick={() => cancelAppointment(appointment)}
                              className="rounded-full border border-red-400/30 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                            >
                              Cancel Appointment
                            </button>
                          ) : (
                            <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-500">
                              Cancel Not Available
                            </button>
                          )}

                          <button className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
                            Add to Calendar
                          </button>

                          <button className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10">
                            Contact Business
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No upcoming appointments found for this search." />
                )}
              </div>
            </Card>

            <Card title="Booking History">
              <div className="space-y-3">
                {pastAppointments.length > 0 ? (
                  pastAppointments.map((appointment) => {
                    const service = appointment.service_id
                      ? serviceMap.get(appointment.service_id)
                      : null;

                    const teamMember = appointment.team_member_id
                      ? teamMap.get(appointment.team_member_id)
                      : null;

                    return (
                      <div
                        key={appointment.id}
                        className="grid gap-3 rounded-2xl border border-white/10 bg-black p-5 md:grid-cols-4 md:items-center"
                      >
                        <div>
                          <p className="font-bold">
                            {service?.name || "Appointment"}
                          </p>
                          <p className="text-xs text-zinc-500">Service</p>
                        </div>

                        <div>
                          <p className="text-sm text-zinc-300">
                            {appointment.appointment_date || "No date"} •{" "}
                            {appointment.appointment_time || "No time"}
                          </p>
                          <p className="text-xs text-zinc-500">Date & time</p>
                        </div>

                        <div>
                          <p className="text-sm text-zinc-300">
                            {teamMember?.name || "Any Available"}
                          </p>
                          <p className="text-xs text-zinc-500">Staff</p>
                        </div>

                        <div className="flex justify-start md:justify-end">
                          <span className={statusClass(appointment.status)}>
                            {appointment.status || "Completed"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState message="No past appointments found for this search." />
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
              <h2 className="text-xl font-bold">Account Benefits</h2>
              <div className="mt-4 space-y-3 text-sm text-zinc-300">
                <p>✓ View upcoming appointments</p>
                <p>✓ Cancel based on business policy</p>
                <p>✓ Request reschedules</p>
                <p>✓ View payment and deposit status</p>
                <p>✓ Book faster next time</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Customer Info</h2>

              <p className="mt-2 text-sm text-zinc-400">
                Real customer accounts and login will be connected later. For
                now, this portal shows appointments by search.
              </p>

              <div className="mt-4 space-y-4">
                <InfoRow
                  label="Search"
                  value={customerSearch || "Showing all demo bookings"}
                />
                <InfoRow label="Business" value={business.name} />
                <InfoRow
                  label="Booking records"
                  value={String(appointments.length)}
                />
              </div>

              <button className="mt-5 w-full rounded-xl border border-white/10 py-3 font-bold hover:bg-white/10">
                Edit Info Later
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Notifications</h2>

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
                  <span>Email confirmations</span>
                  <input type="checkbox" defaultChecked />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
                  <span>Email reminders</span>
                  <input type="checkbox" defaultChecked />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3 text-sm">
                  <span>Payment reminders</span>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Business Policy Summary</h2>

              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>• Some appointments can be cancelled online.</p>
                <p>• Some reschedules may require business approval.</p>
                <p>• Deposit rules depend on the service selected.</p>
                <p>• Some deposits may be non-refundable.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-xl font-bold">Contact Business</h2>

              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                {business.phone && <p>Phone: {business.phone}</p>}
                {business.email && <p>Email: {business.email}</p>}
                {business.address && <p>Address: {business.address}</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
              <h2 className="text-xl font-bold text-red-200">Account</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Account deletion, password reset, and saved customer details
                will be connected later.
              </p>

              <button className="mt-5 w-full rounded-xl border border-red-400/30 py-3 text-sm font-bold text-red-300 hover:bg-red-500/10">
                Delete Customer Account Later
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-6 text-sm text-zinc-400">
      {message}
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

  if (status === "Reschedule Requested") {
    return "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  return "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
}

function paymentClass(status: string | null) {
  const normalizedStatus = (status || "").toLowerCase();

  if (normalizedStatus.includes("paid")) {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  if (normalizedStatus.includes("received")) {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  if (
    normalizedStatus.includes("due") ||
    normalizedStatus.includes("deposit") ||
    normalizedStatus.includes("payment")
  ) {
    return "rounded-full bg-yellow-500/15 px-3 py-1 text-xs font-semibold text-yellow-300";
  }

  if (normalizedStatus.includes("pay in person")) {
    return "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
  }

  return "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300";
}