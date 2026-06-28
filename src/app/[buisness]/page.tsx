"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";

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
  payment_provider_name: string | null;
  default_payment_link: string | null;
  deposit_payment_link: string | null;
  full_payment_link: string | null;
  payment_instructions: string | null;
};

type ServiceAddOn = {
  name: string;
  price: string | null;
};

type Service = {
  id: string;
  name: string;
  category: string | null;
  price: string;
  duration: string;
  description: string | null;
  photo_url: string | null;
  payment_options: string[] | null;
  deposit_amount: string | null;
  full_payment_amount: string | null;
  custom_payment_link?: string | null;
  payment_instructions?: string | null;
  deposit_due?: string | null;
  deposit_refund_status?: string | null;
  cancellation_deadline?: string | null;
  cancellation_policy_text?: string | null;
  reschedule_deadline?: string | null;
  reschedule_policy_text?: string | null;
  allow_reschedule?: boolean | null;
  customer_instructions: string | null;
  service_addons?: ServiceAddOn[];
};

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  bio?: string | null;
  photo_url?: string | null;
  accepting_bookings: boolean | null;
  show_on_booking_page: boolean | null;
};

type DateOption = {
  label: string;
  value: string;
  helper: string;
};

const fallbackTimes = [
  "9:00 AM",
  "10:30 AM",
  "12:00 PM",
  "2:00 PM",
  "3:30 PM",
  "5:00 PM",
];

function getDateOptions(): DateOption[] {
  const today = new Date();

  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    const value = date.toISOString().slice(0, 10);

    const label =
      offset === 0
        ? "Today"
        : offset === 1
        ? "Tomorrow"
        : date.toLocaleDateString("en-US", {
            weekday: "long",
          });

    const helper = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return {
      label,
      value,
      helper,
    };
  });
}

export default function CustomerBookingPage() {
  const params = useParams();

  const rawSlug = params["business"] || params["buisness"];
  const businessSlug = Array.isArray(rawSlug)
    ? rawSlug[0]
    : String(rawSlug || "").trim().toLowerCase();

  const dateOptions = useMemo(() => getDateOptions(), []);

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("any");
  const [selectedDate, setSelectedDate] = useState(dateOptions[0]?.value || "");
  const [selectedTime, setSelectedTime] = useState("2:00 PM");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    loadBookingPage();
  }, [businessSlug]);

  async function loadBookingPage() {
    if (!businessSlug) {
      setLoadError("No business slug found in the booking link.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    const { data: businessData, error: businessError } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", businessSlug)
      .maybeSingle();

    if (businessError || !businessData) {
      console.error("Business load error:", businessError);
      setBusiness(null);
      setServices([]);
      setTeamMembers([]);
      setLoadError("Business not found.");
      setLoading(false);
      return;
    }

    setBusiness(businessData as Business);

    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select(
        `
        *,
        service_addons (
          name,
          price
        )
      `
      )
      .eq("business_id", businessData.id)
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (servicesError) {
      console.error("Services load error:", servicesError);
      setLoadError("Could not load services.");
      setLoading(false);
      return;
    }

    const loadedServices = (servicesData || []) as Service[];
    setServices(loadedServices);

    if (loadedServices.length > 0) {
      setSelectedServiceId(loadedServices[0].id);
    }

    const { data: teamData, error: teamError } = await supabase
      .from("team_members")
      .select("*")
      .eq("business_id", businessData.id)
      .eq("show_on_booking_page", true)
      .eq("accepting_bookings", true)
      .order("created_at", { ascending: true });

    if (teamError) {
      console.error("Team load error:", teamError);
      setTeamMembers([]);
    } else {
      setTeamMembers((teamData || []) as TeamMember[]);
    }

    setLoading(false);
  }

  const selectedService =
    services.find((service) => service.id === selectedServiceId) ||
    services[0] ||
    null;

  const selectedTeamMember =
    selectedTeamMemberId === "any"
      ? null
      : teamMembers.find((person) => person.id === selectedTeamMemberId) ||
        null;

  const selectedDateLabel =
    dateOptions.find((date) => date.value === selectedDate)?.label || "Today";

  const selectedDateHelper =
    dateOptions.find((date) => date.value === selectedDate)?.helper || "";

  const selectedAddOnDetails =
    selectedService?.service_addons?.filter((addon) =>
      selectedAddOns.includes(addon.name)
    ) || [];

  function chooseService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSelectedAddOns([]);
  }

  function toggleAddOn(addOnName: string) {
    setSelectedAddOns((current) =>
      current.includes(addOnName)
        ? current.filter((item) => item !== addOnName)
        : [...current, addOnName]
    );
  }

  async function bookAppointment() {
    setBookingError("");
    setBookingSuccess(false);

    if (!business) {
      setBookingError("Business is not loaded yet.");
      return;
    }

    if (!selectedService) {
      setBookingError("Please choose a service.");
      return;
    }

    if (!selectedDate) {
      setBookingError("Please choose a date.");
      return;
    }

    if (!selectedTime) {
      setBookingError("Please choose a time.");
      return;
    }

    if (!customerName.trim()) {
      setBookingError("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      setBookingError("Please enter your phone number.");
      return;
    }

    setBooking(true);

    const addOnText =
      selectedAddOns.length > 0
        ? `Selected add-ons: ${selectedAddOns.join(", ")}`
        : "";

    const customerText =
      customerNotes.trim().length > 0 ? `Customer notes: ${customerNotes}` : "";

    const combinedNotes = [customerText, addOnText]
      .filter((item) => item.trim())
      .join("\n\n");

    const paymentStatus = getAppointmentPaymentStatus(selectedService);
    const paymentDetail = getPaymentSummary(selectedService);
    const externalPaymentLink = getExternalPaymentLink(
      business,
      selectedService
    );

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        service_id: selectedService.id,
        team_member_id: selectedTeamMember?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        status: "Upcoming",
        payment_status: paymentStatus,
        payment_detail: paymentDetail,
        balance: selectedService.price,
        external_payment_link: externalPaymentLink || null,
        payment_verified_manually: false,
        notes: combinedNotes || null,
      })
      .select("id")
      .single();

    if (appointmentError || !appointmentData) {
      console.error("Appointment create error:", appointmentError);
      setBookingError("Could not book appointment. Please try again.");
      setBooking(false);
      return;
    }

    const teamLabel = selectedTeamMember?.name || "Any Available";

    await supabase.from("notifications").insert({
      business_id: business.id,
      appointment_id: appointmentData.id,
      title: "New Appointment Booked",
      message: `${customerName} booked ${selectedService.name} with ${teamLabel} for ${selectedDateLabel} at ${selectedTime}. Payment: ${paymentDetail}.`,
      type: "booking",
      read: false,
    });

    setBooking(false);
    setBookingSuccess(true);

    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setCustomerNotes("");
    setSelectedAddOns([]);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <p className="text-zinc-300">Loading booking page...</p>
        </div>
      </main>
    );
  }

  if (loadError || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-xl rounded-3xl border border-red-400/30 bg-red-500/10 p-8 text-center">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mx-auto mb-6 h-12 w-auto"
          />

          <h1 className="text-4xl font-black">Business not found</h1>

          <p className="mt-3 text-zinc-300">
            {loadError || "This booking page does not exist yet."}
          </p>

          <p className="mt-3 rounded-xl bg-black p-3 font-mono text-sm text-purple-300">
            {businessSlug || "No slug found"}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
          >
            ← Back to AppointEaze
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/10"
          >
            <span>←</span>
            <span>Back to AppointEaze</span>
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/10"
            >
              Dashboard
            </Link>

            <Link
              href={`/${business.slug}/account`}
              className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-bold hover:bg-white/10"
            >
              Customer Account
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-purple-950/50">
          {business.cover_photo_url ? (
            <div
              className="h-52 bg-cover bg-center"
              style={{
                backgroundImage: `url(${business.cover_photo_url})`,
              }}
            />
          ) : (
            <div className="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_center,#a855f7,transparent_55%),linear-gradient(135deg,#4c1d95,#020617)] text-sm font-semibold text-purple-100">
              Cover Photo
            </div>
          )}

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 text-sm font-semibold text-purple-200 shadow-xl">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src="/Logo.png"
                  alt={business.name}
                  className="h-12 w-auto object-contain"
                />
              )}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="text-4xl font-black">{business.name}</h1>

                <p className="mt-3 max-w-2xl text-zinc-400">
                  {business.description ||
                    "Choose a service, pick a time, and book online."}
                </p>

                {business.address && (
                  <p className="mt-3 text-sm text-purple-300">
                    {business.address}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 px-5 py-4 text-sm text-purple-100">
                Open today • Availability shown below
              </div>
            </div>
          </div>
        </div>

        {bookingSuccess && (
          <div className="mt-6 rounded-3xl border border-green-400/30 bg-green-500/10 p-6">
            <h2 className="text-2xl font-black text-green-200">
              Appointment booked!
            </h2>

            <p className="mt-2 text-sm text-zinc-300">
              Your appointment was saved. The business will see it in
              AppointEaze.
            </p>

            {selectedService && (
              <PaymentActionCard
                business={business}
                service={selectedService}
                context="success"
              />
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/${business.slug}/account`}
                className="rounded-full bg-green-500 px-5 py-3 text-center text-sm font-bold text-black hover:bg-green-400"
              >
                View Customer Account
              </Link>

              <button
                type="button"
                onClick={() => setBookingSuccess(false)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
              >
                Book Another
              </button>
            </div>
          </div>
        )}

        {bookingError && (
          <div className="mt-6 rounded-3xl border border-red-400/30 bg-red-500/10 p-6">
            <h2 className="text-xl font-bold text-red-200">Booking error</h2>
            <p className="mt-2 text-sm text-zinc-300">{bookingError}</p>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="1. Choose a service">
              {services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <ServiceOption
                      key={service.id}
                      service={service}
                      selected={service.id === selectedService?.id}
                      selectedAddOns={selectedAddOns}
                      onChoose={() => chooseService(service.id)}
                      onToggleAddOn={toggleAddOn}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState message="This business has not added public services yet." />
              )}
            </Card>

            <Card title="2. Choose team member">
              <p className="mb-4 text-sm text-zinc-400">
                Choose a specific team member or book with Any Available.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedTeamMemberId("any")}
                  className={`rounded-2xl border p-4 text-left ${
                    selectedTeamMemberId === "any"
                      ? "border-purple-400/40 bg-purple-500/10"
                      : "border-white/10 bg-black hover:bg-white/10"
                  }`}
                >
                  <p className="font-bold">Any Available</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Book with the first available team member
                  </p>
                </button>

                {teamMembers.length > 0 ? (
                  teamMembers.map((person) => (
                    <button
                      type="button"
                      key={person.id}
                      onClick={() => setSelectedTeamMemberId(person.id)}
                      className={`rounded-2xl border p-4 text-left ${
                        selectedTeamMemberId === person.id
                          ? "border-purple-400/40 bg-purple-500/10"
                          : "border-white/10 bg-black hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-purple-500/10 text-xs text-purple-200">
                          {person.photo_url ? (
                            <img
                              src={person.photo_url}
                              alt={person.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            person.name.slice(0, 1)
                          )}
                        </div>

                        <div>
                          <p className="font-bold">{person.name}</p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {person.role || "Available for bookings"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm text-zinc-500">
                    No specific staff listed. Any Available will be used.
                  </div>
                )}
              </div>
            </Card>

            <Card title="3. Choose date">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {dateOptions.map((date) => (
                  <button
                    type="button"
                    key={date.value}
                    onClick={() => setSelectedDate(date.value)}
                    className={`rounded-2xl border p-4 text-left ${
                      selectedDate === date.value
                        ? "border-purple-400/40 bg-purple-500 text-white"
                        : "border-white/10 bg-black text-zinc-300 hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold">{date.label}</p>
                    <p className="mt-1 text-sm opacity-80">{date.helper}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="4. Choose time">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-400">Selected date</p>
                  <p className="mt-2 text-2xl font-black">
                    {selectedDateLabel}
                  </p>
                  <p className="mt-1 text-sm text-purple-300">
                    {selectedDateHelper}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {fallbackTimes.map((time) => (
                    <button
                      type="button"
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`rounded-2xl border px-4 py-4 font-semibold ${
                        selectedTime === time
                          ? "border-purple-400/40 bg-purple-500 text-white"
                          : "border-white/10 bg-black text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="5. Your information">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="Name"
                  value={customerName}
                  placeholder="Your name"
                  onChange={setCustomerName}
                />

                <Field
                  label="Phone"
                  value={customerPhone}
                  placeholder="(555) 123-4567"
                  onChange={setCustomerPhone}
                />

                <Field
                  label="Email optional"
                  value={customerEmail}
                  placeholder="you@example.com"
                  onChange={setCustomerEmail}
                />

                <div>
                  <label className="text-sm font-semibold text-zinc-300">
                    Notes optional
                  </label>

                  <input
                    value={customerNotes}
                    onChange={(event) => setCustomerNotes(event.target.value)}
                    placeholder="Anything we should know?"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>
            </Card>

            <Card title="Optional customer account">
              <div className="rounded-2xl border border-purple-400/30 bg-purple-500/10 p-5">
                <h3 className="text-xl font-bold">
                  Book as a guest or create an account after booking.
                </h3>

                <p className="mt-2 text-sm text-zinc-300">
                  Customer accounts are optional. Customers can create one later
                  to view appointments, reschedule, cancel based on business
                  policy, and see booking history.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
                  >
                    Create account after booking
                  </button>

                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
                  >
                    Continue as guest
                  </button>
                </div>
              </div>
            </Card>

            <Card title="What happens next">
              <div className="grid gap-4 md:grid-cols-3">
                <ProcessStep
                  number="1"
                  title="Book online"
                  description="Choose your service, date, time, and staff preference."
                />

                <ProcessStep
                  number="2"
                  title="Business sees it"
                  description="The booking appears inside the AppointEaze dashboard."
                />

                <ProcessStep
                  number="3"
                  title="Manage later"
                  description="Use the customer portal for booking history and changes."
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6 lg:min-w-0 lg:self-start">
            <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
              <h2 className="text-2xl font-black">Booking Summary</h2>

              <div className="mt-5 space-y-4 text-sm">
                <SummaryRow
                  label="Service"
                  value={selectedService?.name || "Choose a service"}
                />

                <SummaryRow
                  label="Team member"
                  value={selectedTeamMember?.name || "Any Available"}
                />

                <SummaryRow
                  label="Date"
                  value={`${selectedDateLabel} ${selectedDateHelper}`}
                />

                <SummaryRow label="Time" value={selectedTime} />

                <SummaryRow
                  label="Base price"
                  value={selectedService?.price || "$0"}
                />

                <SummaryRow
                  label="Add-ons"
                  value={
                    selectedAddOns.length > 0
                      ? selectedAddOns.join(", ")
                      : "None selected"
                  }
                />
              </div>

              {selectedAddOnDetails.length > 0 && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm font-semibold text-zinc-300">
                    Selected add-ons
                  </p>

                  <div className="mt-3 space-y-2">
                    {selectedAddOnDetails.map((addon) => (
                      <div
                        key={addon.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-zinc-400">{addon.name}</span>
                        <span className="font-bold text-purple-300">
                          {addon.price || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
                <p className="text-sm font-semibold text-zinc-300">
                  Payment rule
                </p>

                <p className="mt-2 text-sm text-yellow-300">
                  {getPaymentSummary(selectedService)}
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Payment and deposit rules are controlled by the business per
                  service.
                </p>
              </div>

              {selectedService && (
                <PaymentActionCard
                  business={business}
                  service={selectedService}
                  context="summary"
                />
              )}

              {selectedService?.deposit_refund_status && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm font-semibold text-zinc-300">
                    Deposit policy
                  </p>

                  <p className="mt-2 text-sm text-zinc-400">
                    {selectedService.deposit_refund_status}
                  </p>

                  {selectedService.deposit_due && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Due: {selectedService.deposit_due}
                    </p>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={bookAppointment}
                disabled={booking}
                className="mt-5 w-full rounded-xl bg-purple-500 py-4 font-black hover:bg-purple-400 disabled:opacity-60"
              >
                {booking ? "Booking..." : "Book Appointment"}
              </button>

              <p className="mt-4 text-center text-xs text-zinc-500">
                By booking, you agree to this business’s cancellation,
                reschedule, deposit, and payment policies.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-bold">Business policies</h3>

              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <p>• Cancellations depend on business policy.</p>
                <p>• Reschedules may require business approval.</p>
                <p>• Deposit rules depend on the service selected.</p>
                <p>• Some deposits may be non-refundable.</p>
                <p>• Outside payments are verified manually by the business.</p>
              </div>
            </div>

            {selectedService && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <h3 className="text-xl font-bold">Selected service policy</h3>

                <div className="mt-4 space-y-4">
                  <PolicyItem
                    label="Cancellation"
                    value={
                      selectedService.cancellation_deadline ||
                      "Business default"
                    }
                    description={selectedService.cancellation_policy_text}
                  />

                  <PolicyItem
                    label="Reschedule"
                    value={
                      selectedService.reschedule_deadline ||
                      "Business default"
                    }
                    description={selectedService.reschedule_policy_text}
                  />

                  <PolicyItem
                    label="Payment"
                    value={getPaymentSummary(selectedService)}
                    description={
                      selectedService.payment_instructions ||
                      business.payment_instructions ||
                      null
                    }
                  />
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-bold">Contact</h3>

              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                {business.phone && <p>Phone: {business.phone}</p>}
                {business.email && <p>Email: {business.email}</p>}
                {business.address && <p>Address: {business.address}</p>}

                {!business.phone && !business.email && !business.address && (
                  <p>No contact details listed yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
              <h3 className="text-xl font-bold">Powered by AppointEaze</h3>

              <p className="mt-2 text-sm text-zinc-300">
                Simple online booking for service businesses.
              </p>

              <Link
                href="/"
                className="mt-5 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ServiceOption({
  service,
  selected,
  selectedAddOns,
  onChoose,
  onToggleAddOn,
}: {
  service: Service;
  selected: boolean;
  selectedAddOns: string[];
  onChoose: () => void;
  onToggleAddOn: (addOnName: string) => void;
}) {
  const addOns = service.service_addons || [];

  return (
    <div
      className={`rounded-3xl border p-5 ${
        selected
          ? "border-purple-400/40 bg-purple-500/10"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold">{service.name}</h3>

            {selected && (
              <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold">
                Selected
              </span>
            )}

            {service.category && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-zinc-300">
                {service.category}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {service.duration} • {getPaymentSummary(service)}
          </p>

          {service.description && (
            <p className="mt-3 text-sm text-zinc-500">{service.description}</p>
          )}

          {service.customer_instructions && (
            <p className="mt-3 rounded-xl border border-purple-400/20 bg-purple-500/10 p-3 text-xs text-purple-100">
              {service.customer_instructions}
            </p>
          )}
        </div>

        <div className="text-left md:text-right">
          <p className="text-3xl font-black text-purple-300">
            {service.price}
          </p>

          <button
            type="button"
            onClick={onChoose}
            className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm font-bold hover:bg-white/10"
          >
            Choose
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black p-4">
        <p className="text-sm font-semibold text-zinc-300">Add-ons</p>

        {addOns.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {addOns.map((addon) => {
              const isSelected = selectedAddOns.includes(addon.name);

              return (
                <button
                  type="button"
                  key={`${service.id}-${addon.name}`}
                  onClick={() => onToggleAddOn(addon.name)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    isSelected
                      ? "border-purple-400/40 bg-purple-500 text-white"
                      : "border-white/10 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {addon.name} {addon.price || ""}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">
            No add-ons listed for this service.
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentActionCard({
  business,
  service,
  context,
}: {
  business: Business;
  service: Service;
  context: "summary" | "success";
}) {
  const link = getExternalPaymentLink(business, service);
  const requiresOutsideAttention = shouldShowPaymentAction(service);
  const label = getPaymentButtonLabel(service);
  const provider = business.payment_provider_name || "outside payment page";

  if (!requiresOutsideAttention && !business.payment_instructions) {
    return null;
  }

  return (
    <div
      className={`mt-5 rounded-2xl border p-4 ${
        context === "success"
          ? "border-green-400/30 bg-black/40"
          : "border-yellow-400/30 bg-yellow-500/10"
      }`}
    >
      <p className="text-sm font-semibold text-zinc-200">
        {context === "success" ? "Payment next step" : "Payment option"}
      </p>

      <p className="mt-2 text-sm leading-6 text-zinc-300">
        {getPaymentActionText(business, service)}
      </p>

      {business.payment_instructions && (
        <p className="mt-3 rounded-xl border border-white/10 bg-black p-3 text-xs leading-5 text-zinc-400">
          {business.payment_instructions}
        </p>
      )}

      {service.payment_instructions && (
        <p className="mt-3 rounded-xl border border-purple-400/20 bg-purple-500/10 p-3 text-xs leading-5 text-purple-100">
          {service.payment_instructions}
        </p>
      )}

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block rounded-xl bg-purple-500 px-5 py-3 text-center text-sm font-black hover:bg-purple-400"
        >
          {label}
        </a>
      ) : requiresOutsideAttention ? (
        <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-3 text-xs leading-5 text-yellow-100">
          This business has not added a payment link for this option yet. Please
          follow the listed instructions or contact the business.
        </div>
      ) : null}

      {link && (
        <p className="mt-3 text-center text-xs text-zinc-500">
          Payment opens on {provider}. The business verifies payment manually.
        </p>
      )}
    </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
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

function ProcessStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-sm font-black">
        {number}
      </div>

      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-2 text-sm text-zinc-500">{description}</p>
    </div>
  );
}

function PolicyItem({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-zinc-200">{value}</p>

      {description && (
        <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
      )}
    </div>
  );
}

function normalizePaymentLink(value?: string | null) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getExternalPaymentLink(business: Business, service?: Service | null) {
  if (!service) {
    return "";
  }

  const options = service.payment_options || [];

  if (options.includes("Custom payment link — manual tracking")) {
    return normalizePaymentLink(
      service.custom_payment_link ||
        business.default_payment_link ||
        business.deposit_payment_link ||
        business.full_payment_link
    );
  }

  if (options.includes("Deposit required")) {
    return normalizePaymentLink(
      service.custom_payment_link ||
        business.deposit_payment_link ||
        business.default_payment_link
    );
  }

  if (options.includes("Pay ahead in full")) {
    return normalizePaymentLink(
      service.custom_payment_link ||
        business.full_payment_link ||
        business.default_payment_link
    );
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return normalizePaymentLink(
      service.custom_payment_link ||
        business.deposit_payment_link ||
        business.default_payment_link
    );
  }

  return normalizePaymentLink(service.custom_payment_link || "");
}

function shouldShowPaymentAction(service?: Service | null) {
  if (!service) {
    return false;
  }

  const options = service.payment_options || [];

  return (
    options.includes("Deposit required") ||
    options.includes("Pay ahead in full") ||
    options.includes("Custom payment link — manual tracking") ||
    options.includes("Cash deposit allowed — manual tracking")
  );
}

function getPaymentButtonLabel(service?: Service | null) {
  if (!service) {
    return "Pay Here";
  }

  const options = service.payment_options || [];

  if (options.includes("Deposit required")) {
    return "Pay Deposit";
  }

  if (options.includes("Pay ahead in full")) {
    return "Pay Now";
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return "Pay / Deposit Here";
  }

  return "Pay Here";
}

function getPaymentActionText(business: Business, service?: Service | null) {
  if (!service) {
    return "Choose a service to see payment instructions.";
  }

  const options = service.payment_options || [];
  const provider = business.payment_provider_name || "the business’s payment page";

  if (options.includes("Deposit required")) {
    return `This service requires a deposit. You can pay through ${provider}, and the business will verify it manually.`;
  }

  if (options.includes("Pay ahead in full")) {
    return `This service allows or requires full payment ahead of time through ${provider}. The business verifies payment manually.`;
  }

  if (options.includes("Custom payment link — manual tracking")) {
    return `This business uses an outside payment link for this service. Payment is verified manually by the business.`;
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return `This service allows a manually tracked deposit. The business may accept cash or an outside payment link.`;
  }

  if (options.includes("Pay in person")) {
    return "This service is set to pay in person.";
  }

  return "Payment details are set by the business.";
}

function getPaymentSummary(service?: Service | null) {
  if (!service) {
    return "Choose a service";
  }

  const options = service.payment_options || [];

  if (options.includes("Deposit required")) {
    return service.deposit_amount
      ? `${service.deposit_amount} deposit required`
      : "Deposit required";
  }

  if (options.includes("Pay ahead in full")) {
    return service.full_payment_amount
      ? `${service.full_payment_amount} full payment available`
      : "Full payment available";
  }

  if (options.includes("Pay in person")) {
    return "Pay in person";
  }

  if (options.includes("Custom payment link — manual tracking")) {
    return "Custom payment link";
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return "Cash deposit allowed";
  }

  return options[0] || "Payment details set by business";
}

function getAppointmentPaymentStatus(service: Service) {
  const options = service.payment_options || [];

  if (options.includes("Deposit required")) {
    return "Deposit due";
  }

  if (options.includes("Pay ahead in full")) {
    return "Payment due";
  }

  if (options.includes("Pay in person")) {
    return "Pay in person";
  }

  if (options.includes("Custom payment link — manual tracking")) {
    return "Payment due";
  }

  if (options.includes("Cash deposit allowed — manual tracking")) {
    return "Deposit due";
  }

  return "Payment details pending";
}