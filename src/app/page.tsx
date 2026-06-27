import Link from "next/link";

const features = [
  "Public booking page",
  "Unlimited services",
  "Unlimited appointments",
  "Up to 5 team members",
  "Optional customer accounts",
  "Add-ons / sub-services",
  "Deposits and payment rules",
  "Pay in person or pay ahead",
  "Cancellation and reschedule policies",
  "Dashboard alerts",
  "Email notifications",
  "Booking history",
];

const steps = [
  {
    title: "Set up your business",
    description:
      "Add your business profile, services, team members, payment rules, and booking policies.",
  },
  {
    title: "Share your booking link",
    description:
      "Customers book from your public AppointEaze page without needing an account.",
  },
  {
    title: "Manage appointments",
    description:
      "Track bookings, deposits, payments, cancellations, reschedules, and customer history.",
  },
];

const businessTypes = [
  "Barbers",
  "Tattoo artists",
  "Salons",
  "Nail techs",
  "Massage therapists",
  "Consultants",
  "Mobile services",
  "Small service businesses",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            Appoint<span className="text-purple-400">Eaze</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#pricing" className="hover:text-white">
              Pricing
            </a>
            <a href="#how-it-works" className="hover:text-white">
              How it works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10 sm:inline-flex"
            >
              View Dashboard
            </Link>

            <Link
              href="/elite-barber-studio"
              className="rounded-full bg-purple-500 px-5 py-3 text-sm font-bold hover:bg-purple-400"
            >
              View Demo
            </Link>
          </div>
        </nav>

        <div className="grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-200">
              14-day free trial • Then $9.99/month
            </div>

            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              Simple online booking for service businesses.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
              AppointEaze helps businesses manage services, appointments, team
              members, deposits, payments, cancellations, reschedules, and
              customer accounts from one clean dashboard.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="rounded-full bg-purple-500 px-8 py-4 text-center font-black hover:bg-purple-400"
              >
                Start Free Trial
              </Link>

              <Link
                href="/elite-barber-studio"
                className="rounded-full border border-white/10 px-8 py-4 text-center font-black hover:bg-white/10"
              >
                See Booking Page
              </Link>
            </div>

            <p className="mt-5 text-sm text-zinc-500">
              No complicated plans. No setup fee. Start free for 14 days.
            </p>
          </div>

          <div className="rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-5 shadow-2xl shadow-purple-950/40">
            <div className="rounded-[1.5rem] border border-white/10 bg-black p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-sm text-purple-300">Today</p>
                  <h2 className="mt-1 text-2xl font-black">Appointments</h2>
                </div>

                <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">
                  Live
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <DemoCard
                  title="Haircut + Beard Trim"
                  detail="Sarah Johnson • 2:00 PM"
                  status="Pay in person"
                />
                <DemoCard
                  title="Tattoo Session"
                  detail="Amanda Lee • Tomorrow 10:00 AM"
                  status="$100 deposit due"
                />
                <DemoCard
                  title="Full Service"
                  detail="Jordan Smith • Friday 11:15 AM"
                  status="Paid in full"
                />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <MiniStat label="Today" value="8" />
                <MiniStat label="Pending" value="$300" />
                <MiniStat label="Alerts" value="4" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-y border-white/10 py-8 md:grid-cols-4">
          {businessTypes.map((type) => (
            <div
              key={type}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center text-sm font-semibold text-zinc-300"
            >
              {type}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
            Features
          </p>
          <h2 className="mt-3 text-4xl font-black md:text-5xl">
            Everything needed to start taking bookings.
          </h2>
          <p className="mt-4 text-zinc-400">
            AppointEaze is built around business-controlled rules, so every
            service can have its own payment, deposit, team, cancellation, and
            reschedule settings.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-purple-200">
                ✓
              </div>
              <p className="font-bold">{feature}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              From setup to booked in minutes.
            </h2>
            <p className="mt-4 text-zinc-400">
              Businesses set the rules. Customers book without friction.
            </p>
          </div>

          <div className="grid gap-4">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-500 text-lg font-black">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold">{step.title}</h3>
                    <p className="mt-2 text-zinc-400">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-6 md:p-10">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
              Simple pricing
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-6xl">
              14 days free. Then $9.99/month.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-zinc-300">
              One flat price for launch. No confusing tiers. No setup fee.
            </p>
          </div>

          <div className="mt-10 rounded-3xl border border-white/10 bg-black p-6 md:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <h3 className="text-3xl font-black">AppointEaze</h3>
                <p className="mt-2 text-zinc-400">
                  Full booking system for small service businesses.
                </p>
              </div>

              <div className="text-left md:text-right">
                <p className="text-sm text-purple-300">After free trial</p>
                <p className="text-5xl font-black">$9.99</p>
                <p className="text-sm text-zinc-500">per month</p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-zinc-300"
                >
                  ✓ {feature}
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="mt-8 block rounded-xl bg-purple-500 py-4 text-center text-lg font-black hover:bg-purple-400"
            >
              Start 14-Day Free Trial
            </Link>

            <p className="mt-4 text-center text-xs text-zinc-500">
              Later, AppointEaze may add higher plans for SMS alerts, multiple
              locations, advanced reporting, and larger teams.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center md:p-12">
          <h2 className="text-4xl font-black md:text-5xl">
            Ready to make booking easier?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Start free, set up your booking page, and let customers book
            appointments online.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="rounded-full bg-purple-500 px-8 py-4 font-black hover:bg-purple-400"
            >
              Start Free Trial
            </Link>

            <Link
              href="/elite-barber-studio"
              className="rounded-full border border-white/10 px-8 py-4 font-black hover:bg-white/10"
            >
              View Demo Booking Page
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>
            Appoint<span className="text-purple-400">Eaze</span>
          </p>
          <p>14-day free trial • $9.99/month after trial</p>
        </div>
      </footer>
    </main>
  );
}

function DemoCard({
  title,
  detail,
  status,
}: {
  title: string;
  detail: string;
  status: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm text-zinc-500">{detail}</p>
        </div>

        <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-200">
          {status}
        </span>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}