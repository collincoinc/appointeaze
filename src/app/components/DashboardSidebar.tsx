import Link from "next/link";

const menuItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Business Profile", href: "/dashboard/business-profile" },
  { label: "Services", href: "/dashboard/services" },
  { label: "Team Members", href: "/dashboard/team" },
  { label: "Appointments", href: "/dashboard/appointments" },
  { label: "Payments", href: "/dashboard/payments" },
  { label: "Booking Page", href: "/dashboard/booking-page" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function DashboardSidebar({ active }: { active: string }) {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-white/10 bg-zinc-950 p-6 lg:block">
      <Link href="/dashboard" className="block text-2xl font-black">
        Appoint<span className="text-purple-400">Eaze</span>
      </Link>

      <nav className="mt-10 space-y-2">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block w-full rounded-xl px-4 py-3 text-left ${
              item.label === active
                ? "bg-purple-500 text-white"
                : "text-zinc-300 hover:bg-purple-500/20 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-10 rounded-2xl border border-purple-400/30 bg-purple-500/10 p-4">
        <p className="text-sm font-bold text-purple-200">Current Plan</p>
        <p className="mt-1 text-xs text-zinc-400">
          $9.99/month • Up to 5 team logins
        </p>
      </div>
    </aside>
  );
}