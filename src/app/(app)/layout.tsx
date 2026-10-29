import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./dashboard/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold text-neutral-900">
              LS Nexus
            </Link>
            <Link href="/inversiones" className="text-sm text-neutral-600 hover:text-neutral-900">
              Inversiones
            </Link>
            <Link href="/pagos" className="text-sm text-neutral-600 hover:text-neutral-900">
              Pagos
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-500">{user?.email}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  );
}
