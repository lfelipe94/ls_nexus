import Link from "next/link";
import { LayoutGrid, Wallet, Receipt, Banknote, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./dashboard/actions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutGrid },
  { href: "/inversiones", label: "Inversiones", icon: Wallet },
  { href: "/pagos", label: "Pagos", icon: Receipt },
  { href: "/ingresos", label: "Ingresos y gastos", icon: Banknote },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="flex min-h-screen gap-2 p-3">
      <aside className="card sticky top-3 flex h-[calc(100vh-1.5rem)] w-60 shrink-0 flex-col justify-between px-4 py-6">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2.5 px-2 text-base font-bold text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm text-white">
              N
            </span>
            LS Nexus
          </Link>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-stamp-soft hover:text-stamp-dark"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2.5 rounded border border-line px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-xs font-semibold text-white">
              {initial}
            </span>
            <span className="truncate text-sm text-ink-soft">{user?.email}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-mustard-soft hover:text-mustard"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
