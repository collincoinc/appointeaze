import Link from "next/link";

export default function SignupSuccessPage({
  searchParams,
}: {
  searchParams?: {
    session_id?: string;
  };
}) {
  const sessionId = searchParams?.session_id || "";

  const businessSetupLink = sessionId
    ? `/signup/business?session_id=${encodeURIComponent(sessionId)}`
    : "/signup/business";

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto flex max-w-3xl flex-col items-center justify-center text-center">
        <div className="rounded-[2rem] border border-green-400/30 bg-green-500/10 p-8 md:p-12">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mx-auto mb-8 h-14 w-auto"
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-3xl font-black text-black">
            ✓
          </div>

          <h1 className="mt-8 text-4xl font-black md:text-6xl">
            Your free trial is started.
          </h1>

          <p className="mt-5 text-lg leading-8 text-zinc-300">
            Welcome to AppointEaze. Your 14-day free trial is active. After the
            trial, your subscription continues at $9.99/month plus applicable
            taxes and fees unless cancelled.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black p-5 text-left">
            <h2 className="text-xl font-bold">Next step</h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Create your business profile. This gives you a public booking page
              like appointeazebooking.com/your-business-name.
            </p>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={businessSetupLink}
              className="rounded-full bg-purple-500 px-8 py-4 text-center font-black hover:bg-purple-400"
            >
              Create My Booking Page
            </Link>

            <Link
              href="/dashboard"
              className="rounded-full border border-white/10 px-8 py-4 text-center font-black hover:bg-white/10"
            >
              Go to Dashboard
            </Link>
          </div>

          <p className="mt-8 text-xs text-zinc-500">
            AppointEaze launch plan: 14-day free trial, then $9.99/month.
          </p>
        </div>
      </section>
    </main>
  );
}