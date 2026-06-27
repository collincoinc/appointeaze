export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur">
        <h1 className="text-4xl font-black">
          Start your 7-day free trial
        </h1>

        <p className="mt-3 text-zinc-400">
          Create your AppointEaze account and start accepting bookings today.
        </p>

        <div className="mt-8 space-y-4">
          <input
            type="text"
            placeholder="Business Name"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
          />

          <input
            type="text"
            placeholder="Your Name"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 outline-none"
          />
        </div>

        <button className="mt-6 w-full rounded-xl bg-purple-500 py-4 font-bold hover:bg-purple-400">
          Create Account
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          7 days free • Then $9.99/month or $99/year
        </p>
      </div>
    </main>
  );
}