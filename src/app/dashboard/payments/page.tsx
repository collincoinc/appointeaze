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
  duration: string | null;
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

export default function PaymentsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
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

    setLoading(false);
  }

  const serviceMap = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  );

  const filteredAppointments = appointments.filter((appointment) => {
    const status = appointment.payment_status || "";

    if (filter === "All") return true;
    if (filter === "Paid") return status.toLowerCase().includes("paid");
    if (filter === "Deposit Due") {
      return (
        status.toLowerCase().includes("deposit") &&
        status.toLowerCase().includes("due")
      );
    }
    if (filter === "Payment Due") {
      return (
        status.toLowerCase().includes("payment") ||
        status.toLowerCase().includes("due")
      );
    }
    if (filter === "Pay In Person") {
      return status.toLowerCase().includes("pay in person");
    }
    if (filter === "Needs Follow-up") {
      return (
        status.toLowerCase().includes("due") ||
        status.toLowerCase().includes("deposit") ||
        status.toLowerCase().includes("payment")
      );
    }

    return true;
  });

  const paidAppointments = appointments.filter((appointment) =>
    (appointment.payment_status || "").toLowerCase().includes("paid")
  );

  const depositDueAppointments = appointments.filter((appointment) => {
    const status = appointment.payment_status || "";
    return (
      status.toLowerCase().includes("deposit") &&
      status.toLowerCase().includes("due")
    );
  });

  const paymentDueAppointments = appointments.filter((appointment) => {
    const status = appointment.payment_status || "";
    return (
      status.toLowerCase().includes("due") ||
      status.toLowerCase().includes("payment")
    );
  });

  const payInPersonAppointments = appointments.filter((appointment) =>
    (appointment.payment_status || "").toLowerCase().includes("pay in person")
  );

  const potentialRevenue = appointments.reduce((total, appointment) => {
    const service = appointment.service_id
      ? serviceMap.get(appointment.service_id)
      : null;

    return total + getMoneyValue(service?.price || appointment.balance || "");
  }, 0);

  const collectedRevenue = paidAppointments.reduce((total, appointment) => {
    const service = appointment.service_id
      ? serviceMap.get(appointment.service_id)
      : null;

    return total + getMoneyValue(service?.price || appointment.balance || "");
  }, 0);

  async function updatePayment(
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
      console.error("Payment update error:", error);
      alert("Could not update payment.");
      setUpdatingId(null);
      return;
    }

    if (business) {
      await supabase.from("notifications").insert({
        business_id: business.id,
        appointment_id: appointment.id,
        title: notificationTitle,
        message: notificationMessage,
        type: "payment",
        read: false,
      });
    }

    await loadPayments();
    setUpdatingId(null);
  }

  function markPaid(appointment: Appointment) {
    updatePayment(
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
    updatePayment(
      appointment,
      {
        payment_status: "Deposit received",
        payment_detail: "Deposit was marked received by business.",
      },
      "Deposit Received",
      `${appointment.customer_name}'s deposit was marked received.`
    );
  }

  function markPaymentDue(appointment: Appointment) {
    const service = appointment.service_id
      ? serviceMap.get(appointment.service_id)
      : null;

    updatePayment(
      appointment,
      {
        payment_status: "Payment due",
        payment_detail: "Payment is due from the customer.",
        balance: service?.price || appointment.balance || null,
      },
      "Payment Due",
      `${appointment.customer_name}'s appointment was marked payment due.`
    );
  }

  function markPayInPerson(appointment: Appointment) {
    updatePayment(
      appointment,
      {
        payment_status: "Pay in person",
        payment_detail: "Customer will pay in person at appointment.",
      },
      "Pay In Person",
      `${appointment.customer_name}'s appointment was marked pay in person.`
    );
  }

  function markDepositDue(appointment: Appointment) {
    updatePayment(
      appointment,
      {
        payment_status: "Deposit due",
        payment_detail: "Deposit is due to hold this appointment.",
      },
      "Deposit Due",
      `${appointment.customer_name}'s appointment was marked deposit due.`
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex">
        <DashboardSidebar active="Payments" />

        <section className="flex-1 p-6 lg:p-10">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-purple-300">Dashboard / Payments</p>
              <h1 className="text-4xl font-black">Payments</h1>
              <p className="mt-2 max-w-3xl text-zinc-400">
                Track appointment payments, deposits, pay-in-person bookings,
                manual payment links, and payment follow-ups from Supabase.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadPayments}
                className="rounded-full border border-white/10 px-6 py-3 text-sm font-bold hover:bg-white/10"
              >
                Refresh
              </button>

              <a
                href="/dashboard/appointments"
                className="rounded-full bg-purple-500 px-6 py-3 text-center text-sm font-bold hover:bg-purple-400"
              >
                View Appointments
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
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Potential revenue"
              value={`$${potentialRevenue.toFixed(0)}`}
              note="Based on booked services"
            />
            <StatCard
              label="Collected"
              value={`$${collectedRevenue.toFixed(0)}`}
              note="Marked paid"
            />
            <StatCard
              label="Payment due"
              value={String(paymentDueAppointments.length)}
              note="Needs follow-up"
            />
            <StatCard
              label="Deposit due"
              value={String(depositDueAppointments.length)}
              note="Deposits pending"
            />
            <StatCard
              label="Pay in person"
              value={String(payInPersonAppointments.length)}
              note="Manual collection"
            />
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Payment Tracker</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Payments are tied to appointment records for now.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "Paid",
                      "Deposit Due",
                      "Payment Due",
                      "Pay In Person",
                      "Needs Follow-up",
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
                    Loading payments from Supabase...
                  </p>
                </div>
              ) : filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const service = appointment.service_id
                    ? serviceMap.get(appointment.service_id)
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
                              {service?.name || "Appointment Payment"}
                            </h3>

                            <span
                              className={paymentStatusClass(
                                appointment.payment_status
                              )}
                            >
                              {appointment.payment_status || "Pay in person"}
                            </span>

                            <span className={appointmentStatusClass(appointment.status)}>
                              {appointment.status || "Upcoming"}
                            </span>
                          </div>

                          <p className="mt-3 text-zinc-300">
                            {appointment.customer_name}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {appointment.appointment_date || "No date"} •{" "}
                            {appointment.appointment_time || "No time"}
                          </p>

                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <InfoBox
                              label="Service price"
                              value={service?.price || "Unknown"}
                            />
                            <InfoBox
                              label="Current balance"
                              value={appointment.balance || "Not set"}
                            />
                            <InfoBox
                              label="Payment detail"
                              value={
                                appointment.payment_detail ||
                                "No payment detail"
                              }
                            />
                            <InfoBox
                              label="Customer contact"
                              value={
                                appointment.customer_phone ||
                                appointment.customer_email ||
                                "Not added"
                              }
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

                        <div className="grid min-w-60 gap-2">
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
                            onClick={() => markDepositDue(appointment)}
                            className="rounded-xl border border-yellow-400/30 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-500/10 disabled:opacity-50"
                          >
                            Deposit Due
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => markPaymentDue(appointment)}
                            className="rounded-xl border border-purple-400/30 px-4 py-3 text-sm font-bold text-purple-200 hover:bg-purple-500/10 disabled:opacity-50"
                          >
                            Payment Due
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => markPayInPerson(appointment)}
                            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 hover:bg-white/10 disabled:opacity-50"
                          >
                            Pay In Person
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-2xl font-bold">No payment records found</h3>
                  <p className="mt-2 text-zinc-400">
                    Book a test appointment from the public booking page and its
                    payment status will appear here.
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
                <h2 className="text-xl font-bold">Payments Connected</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  This page now reads payment status from appointment records in
                  Supabase.
                </p>

                <div className="mt-5 rounded-2xl bg-black p-5">
                  <p className="text-sm text-zinc-500">Payment records</p>
                  <p className="mt-2 text-4xl font-black text-purple-300">
                    {appointments.length}
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Payment Methods</h2>

                <div className="mt-4 space-y-3 text-sm text-zinc-300">
                  <p>✓ Pay in person</p>
                  <p>✓ Deposit due</p>
                  <p>✓ Deposit received</p>
                  <p>✓ Payment due</p>
                  <p>✓ Mark paid manually</p>
                  <p>✓ Custom payment links later</p>
                  <p>✓ AppointEaze Payments later</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Launch Payment Rules</h2>

                <div className="mt-4 space-y-3 text-sm text-zinc-400">
                  <p>
                    • AppointEaze can launch with manual payment tracking first.
                  </p>
                  <p>
                    • Businesses can choose pay in person, deposit, or pay ahead.
                  </p>
                  <p>
                    • Stripe/AppointEaze Payments can be connected later.
                  </p>
                  <p>
                    • Processing fees can be handled by the payment provider.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-xl font-bold">Current Filter</h2>
                <p className="mt-3 rounded-2xl bg-black p-4 text-lg font-black text-purple-300">
                  {filter}
                </p>
              </div>

              <div className="rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
                <h2 className="text-xl font-bold text-red-200">
                  Later: Real Processing
                </h2>

                <p className="mt-2 text-sm text-zinc-400">
                  Later, AppointEaze Payments can use Stripe or another payment
                  provider for real card payments, automatic deposits, refunds,
                  and receipts.
                </p>
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

function paymentStatusClass(status: string | null) {
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

function appointmentStatusClass(status: string | null) {
  if (status === "Cancelled") {
    return "rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300";
  }

  if (status === "Completed") {
    return "rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300";
  }

  return "rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200";
}

function getMoneyValue(value: string) {
  const number = Number(value.replace(/[^0-9.]/g, ""));

  if (Number.isNaN(number)) {
    return 0;
  }

  return number;
}