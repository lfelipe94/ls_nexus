import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-neutral-900">
          Crear cuenta
        </h1>

        {params.error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {params.error}
          </p>
        )}

        <form action={signup} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Registrarme
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
