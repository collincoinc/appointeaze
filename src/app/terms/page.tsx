import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-12 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm text-purple-300 hover:text-purple-200">
          ← Back to AppointEaze
        </Link>

        <h1 className="mt-8 text-4xl font-black">Terms of Service</h1>

        <div className="mt-8 space-y-6 text-zinc-300">
          <p>
            AppointEaze provides online booking software for service businesses.
            Businesses are responsible for the accuracy of their services,
            prices, policies, availability, and customer communications.
          </p>

          <p>
            AppointEaze subscriptions begin with a 14-day free trial and continue
            at $9.99/month unless cancelled. Applicable taxes and payment fees
            may apply.
          </p>

          <p>
            Users agree not to misuse the service, attempt unauthorized access,
            submit false information, or use AppointEaze for unlawful activity.
          </p>

          <p>
            AppointEaze may update, change, suspend, or discontinue features as
            the platform develops.
          </p>

          <p>
            AppointEaze is provided as-is during launch and early access. Bugs
            may exist and will be improved over time.
          </p>

          <p className="text-sm text-zinc-500">
            This is a launch version of the terms and may be updated.
          </p>
        </div>
      </section>
    </main>
  );
}