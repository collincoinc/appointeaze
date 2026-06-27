import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-purple-300 hover:text-purple-200">
          ← Back to AppointEaze
        </Link>

        <h1 className="mt-8 text-4xl font-black">Privacy Policy</h1>

        <div className="mt-8 space-y-6 text-zinc-300">
          <p>
            AppointEaze collects information needed to provide online booking
            services, including business profile details, appointment details,
            customer contact information, and subscription billing information.
          </p>

          <p>
            Payment information is processed by Stripe. AppointEaze does not
            store full credit card numbers.
          </p>

          <p>
            Information may be used to provide booking tools, manage accounts,
            process subscriptions, improve the service, and communicate with
            users about their account or appointments.
          </p>

          <p>
            AppointEaze may use third-party services such as Stripe, Vercel, and
            Supabase to operate the website and application.
          </p>

          <p>
            Contact us with privacy questions at the business contact email
            listed on AppointEaze.
          </p>

          <p className="text-sm text-zinc-500">
            This is a launch version of the privacy policy and may be updated.
          </p>
        </div>
      </section>
    </main>
  );
}