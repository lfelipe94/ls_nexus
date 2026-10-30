import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[42%] flex-col justify-between bg-stamp-dark px-12 py-12 text-paper lg:flex">
        <p className="text-lg font-semibold tracking-tight">LS Nexus</p>
        <div className="max-w-sm">
          <p className="text-3xl font-semibold leading-snug">
            Abre tu libro de cuentas.
          </p>
          <p className="mt-4 text-sm text-paper/70">
            Tus registros quedan separados de los de cualquier otra cuenta.
          </p>
        </div>
        <p className="text-xs text-paper/50">Cuenta personal · acceso privado</p>
      </aside>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-ink">LS Nexus</p>
          </div>

          <h1 className="text-2xl font-semibold text-ink">Crear cuenta</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Un correo y una contraseña es todo lo que necesitas.
          </p>

          <div aria-live="polite">
            {params.error && (
              <p className="mt-6 rounded border border-mustard/30 bg-mustard-soft px-3 py-2 text-sm text-mustard">
                {params.error}
              </p>
            )}
          </div>

          <form action={signup} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink">
                Correo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                placeholder="tucorreo@ejemplo.com"
                className="mt-1.5 w-full rounded border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="mt-1.5 w-full rounded border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-stamp-dark px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-stamp"
            >
              Registrarme
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-soft">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-stamp-dark underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
