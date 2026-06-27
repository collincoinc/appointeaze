import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-purple-300 hover:text-purple-200">
          ← Back to AppointEaze
        </Link>

        <div className="mt-8 rounded-[2rem] border border-purple-400/30 bg-purple-500/10 p-8 md:p-12">
          <img
            src="/Logo.png"
            alt="AppointEaze"
            className="mb-8 h-14 w-auto"
          />

          <h1 className="text-4xl font-black">Contact AppointEaze</h1>

          <p className="mt-4 text-zinc-300">
            For support, billing questions, or early access help, contact the
            AppointEaze team.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black p-5">
            <p className="text-sm text-zinc-500">Email</p>
            <p className="mt-2 font-bold text-purple-300">
              appointeazebooking@gmail.com
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}