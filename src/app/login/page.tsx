import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen">
      {/* Panel izquierdo: marca */}
      <aside className="relative hidden w-[42%] flex-col justify-between bg-stamp-dark px-12 py-12 text-paper lg:flex">
        <p className="text-lg font-semibold tracking-tight">LS Nexus</p>
        <div className="max-w-sm">
          <p className="text-3xl font-semibold leading-snug">
            Un registro de lo que tienes, lo que debes y lo que viene.
          </p>
          <p className="mt-4 text-sm text-paper/70">
            Inversiones, pagos y vencimientos, en un solo libro.
          </p>
        </div>
        <p className="text-xs text-paper/50">Cuenta personal · acceso privado</p>
      </aside>

      {/* Panel derecho: formulario */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-lg font-semibold text-ink">LS Nexus</p>
          </div>

          <h1 className="text-2xl font-semibold text-ink">Entrar</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Ingresa con tu correo y contraseña.
          </p>

          <div aria-live="polite">
            {params.message && (
              <p className="mt-6 rounded border border-stamp/20 bg-stamp-soft px-3 py-2 text-sm text-stamp-dark">
                {params.message}
              </p>
            )}
            {params.error && (
              <p className="mt-6 rounded border border-mustard/30 bg-mustard-soft px-3 py-2 text-sm text-mustard">
                {params.error}
              </p>
            )}
          </div>

          <form action={login} className="mt-8 space-y-5">
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
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="mt-1.5 w-full rounded border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded bg-stamp-dark px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-stamp"
            >
              Entrar
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-soft">
            ¿No tienes cuenta?{" "}
            <Link href="/signup" className="font-medium text-stamp-dark underline underline-offset-4">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
