import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ count: investmentsCount }, { data: upcomingPayments }] = await Promise.all([
    supabase.from("investments").select("*", { count: "exact", head: true }),
    supabase
      .from("recurring_payments")
      .select("id, name, amount, currency, due_date")
      .order("due_date", { ascending: true })
      .limit(5),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Resumen</h1>
        <p className="text-sm text-neutral-600">
          Tienes {investmentsCount ?? 0} inversiones registradas.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-900">
            Próximos pagos
          </h2>
          <Link href="/pagos" className="text-sm text-neutral-600 underline">
            Ver todos
          </Link>
        </div>

        {!upcomingPayments || upcomingPayments.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No tienes pagos registrados todavía.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {upcomingPayments.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-neutral-900">{p.name}</p>
                  <p className="text-sm text-neutral-500">
                    Vence: {new Date(p.due_date).toLocaleDateString("es-CO")}
                  </p>
                </div>
                <span className="font-medium text-neutral-900">
                  {p.amount.toLocaleString("es-CO")} {p.currency}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
