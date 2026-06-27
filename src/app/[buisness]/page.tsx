"use client";

import { useEffect, useState } from "react";
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
  customer_instructions: string | null;
  service_addons?: ServiceAddOn[];
};

type TeamMember = {
  id: string;
  name: string;
  role: string | null;
  accepting_bookings: boolean | null;
  show_on_booking_page: boolean | null;
};

const fallbackTimes = [
  "9:00 AM",
  "10:30 AM",
  "12:00 PM",
  "2:00 PM",
  "3:30 PM",
  "5:00 PM",
];

export default function CustomerBookingPage() {
  const params = useParams();

  const rawSlug = params["business"] || params["buisness"];
  const businessSlug = Array.isArray(rawSlug)
    ? rawSlug[0]
    : String(rawSlug || "").trim().toLowerCase();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("any");
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
      : teamMembers.find((person) => person.id === selectedTeamMemberId) || null;

  const addOns = selectedService?.service_addons || [];

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

    if (!customerName.trim()) {
      setBookingError("Please enter your name.");
      return;
    }

    if (!customerPhone.trim()) {
      setBookingError("Please enter your phone number.");
      return;
    }

    setBooking(true);

    const appointmentDate = new Date().toISOString().slice(0, 10);

    const addOnText =
      selectedAddOns.length > 0
        ? `Selected add-ons: ${selectedAddOns.join(", ")}`
        : "";

    const combinedNotes = [customerNotes, addOnText]
      .filter((item) => item.trim())
      .join("\n\n");

    const paymentStatus = getAppointmentPaymentStatus(selectedService);
    const paymentDetail = getPaymentSummary(selectedService);

    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        service_id: selectedService.id,
        team_member_id: selectedTeamMember?.id || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null,
        appointment_date: appointmentDate,
        appointment_time: selectedTime,
        status: "Upcoming",
        payment_status: paymentStatus,
        payment_detail: paymentDetail,
        balance: selectedService.price,
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
      message: `${customerName} booked ${selectedService.name} with ${teamLabel} for ${selectedTime}. Payment: ${paymentDetail}.`,
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
          <h1 className="text-4xl font-black">Business not found</h1>
          <p className="mt-3 text-zinc-300">
            {loadError || "This booking page does not exist yet."}
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
        <div className="mb-6 flex justify-end">
          <Link
            href={`/${business.slug}/account`}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
          >
            Customer Account
          </Link>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-purple-950/50">
          <div className="flex h-52 items-center justify-center bg-[radial-gradient(circle_at_center,#a855f7,transparent_55%),linear-gradient(135deg,#4c1d95,#020617)] text-sm font-semibold text-purple-100">
            Cover Photo
          </div>

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border border-white/10 bg-zinc-950 text-sm font-semibold text-purple-200 shadow-xl">
              Logo
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
              Your appointment was saved. The business will see it in AppointEaze.
            </p>
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

                {teamMembers.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setSelectedTeamMemberId(person.id)}
                    className={`rounded-2xl border p-4 text-left ${
                      selectedTeamMemberId === person.id
                        ? "border-purple-400/40 bg-purple-500/10"
                        : "border-white/10 bg-black hover:bg-white/10"
                    }`}
                  >
                    <p className="font-bold">{person.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {person.role || "Available for bookings"}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="3. Choose date and time">
              <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                <div className="rounded-2xl border border-white/10 bg-black p-4">
                  <p className="text-sm text-zinc-400">Selected date</p>
                  <p className="mt-2 text-2xl font-black">Today</p>
                  <p className="mt-1 text-sm text-purple-300">
                    Available times
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {fallbackTimes.map((time) => (
                    <button
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

            <Card title="4. Your information">
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
                  <button className="rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400">
                    Create account after booking
                  </button>

                  <button className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10">
                    Continue as guest
                  </button>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="sticky top-6 rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6">
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
                <SummaryRow label="Date" value="Today" />
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

              <button
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
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="text-xl font-bold">Contact</h3>

              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                {business.phone && <p>Phone: {business.phone}</p>}
                {business.email && <p>Email: {business.email}</p>}
                {business.address && <p>Address: {business.address}</p>}
              </div>
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
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {service.duration} • {getPaymentSummary(service)}
          </p>

          {service.category && (
            <p className="mt-1 text-sm text-purple-300">{service.category}</p>
          )}

          {service.description && (
            <p className="mt-3 text-sm text-zinc-500">
              {service.description}
            </p>
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
    <div className="flex items-center justify-between border-b border-white/10 pb-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold">{value}</span>
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

  return "Payment details pending";
}