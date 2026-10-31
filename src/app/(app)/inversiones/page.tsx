import Link from "next/link";
import { Pencil, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { InvestmentFields } from "@/components/InvestmentFields";
import { FinancialCard, HomeCard } from "@/components/InvestmentCards";
import { withMovements, type Movement, currentValue, myShare } from "@/lib/investments";
import { createInvestment, deleteInvestment } from "./actions";

type Investment = Parameters<typeof FinancialCard>[0]["inv"] & {
  notes: string | null;
  created_at: string;
};

function Actions({ inv }: { inv: Investment }) {
  return (
    <>
      <Link
        href={`/inversiones/${inv.id}/editar`}
        aria-label="Editar inversión"
        className="rounded p-1.5 text-ink-soft/60 transition hover:bg-stamp-soft hover:text-stamp-dark"
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Link>
      <form
        action={async () => {
          "use server";
          await deleteInvestment(inv.id);
        }}
      >
        <ConfirmDeleteButton
          label="Eliminar inversión"
          confirmMessage={`¿Eliminar la inversión "${inv.name}"? Esta acción no se puede deshacer.`}
        />
      </form>
    </>
  );
}

export default async function InversionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: investments } = await query;
  const { data: movements } = await supabase
    .from("investment_movements")
    .select("id, investment_id, kind, movement_date, amount, ea_rate");

  // Arriendo por vivienda: ingresos mensuales de Ingresos con el mismo nombre de apartamento y moneda.
  const { data: flows } = await supabase
    .from("cash_flows")
    .select("amount, currency, property, kind, frequency")
    .not("property", "is", null);
  const rentOf = (inv: Investment) =>
    (flows ?? [])
      .filter(
        (f) =>
          f.kind === "income" &&
          f.frequency === "monthly" &&
          f.currency === inv.currency &&
          f.property.toLowerCase() === inv.name.toLowerCase(),
      )
      .reduce((total, f) => total + Number(f.amount), 0);
  const now = new Date();

  const all = ((investments ?? []) as Investment[]).map((inv) => withMovements(inv, (movements ?? []) as Movement[]));
  const financial = all.filter((inv) => inv.category !== "vivienda");
  const homes = all.filter((inv) => inv.category === "vivienda");

  // Totales por moneda (no se pueden sumar monedas distintas entre sí); la vivienda va aparte.
  const totalsByCurrency = new Map<string, number>();
  const valueByCurrency = new Map<string, number>();
  for (const inv of financial) {
    const mine = myShare(inv);
    totalsByCurrency.set(inv.currency, (totalsByCurrency.get(inv.currency) ?? 0) + mine.amount);
    valueByCurrency.set(inv.currency, (valueByCurrency.get(inv.currency) ?? 0) + currentValue(mine));
  }

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Inversiones</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Lo que tienes invertido, en cada moneda.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga un archivo, no navega a una página */}
        <a
          href="/inversiones/export"
          className="flex shrink-0 items-center gap-1.5 rounded border border-line px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-raised"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar CSV
        </a>
      </div>

      {totalsByCurrency.size > 0 && (
        <div className="flex flex-wrap gap-3">
          {Array.from(totalsByCurrency.entries()).map(([currency, total]) => {
            const gain = (valueByCurrency.get(currency) ?? total) - total;
            return (
              <div key={currency} className="contents">
                <div className="card px-6 py-4">
                  <p className="text-xs font-medium uppercase text-ink-soft">Invertido en {currency}</p>
                  <p className="tabular mt-1 text-3xl font-bold tracking-tight text-ink">
                    {formatMoney(total, currency)}
                  </p>
                </div>
                <div className="card px-6 py-4">
                  <p className="text-xs font-medium uppercase text-ink-soft">Rendimiento en {currency}</p>
                  <p
                    className={`tabular mt-1 text-3xl font-bold tracking-tight ${
                      gain >= 0 ? "text-teal" : "text-mustard"
                    }`}
                  >
                    {gain >= 0 ? "+" : ""}
                    {formatMoney(gain, currency)}
                  </p>
                  <p className="tabular mt-1 text-xs text-ink-soft">
                    {total > 0 && `${gain >= 0 ? "+" : ""}${((gain / total) * 100).toFixed(2)} % · `}
                    Hoy ≈ {formatMoney(valueByCurrency.get(currency) ?? total, currency)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form
        action={createInvestment}
        className="grid grid-cols-1 gap-4 card p-6 sm:grid-cols-2"
      >
        <InvestmentFields />
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
          >
            Agregar inversión
          </button>
        </div>
      </form>

      <form action="/inversiones" className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nombre…"
          autoComplete="off"
          className="w-full max-w-xs rounded border border-line bg-paper-raised px-3.5 py-2 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
        />
        <button
          type="submit"
          className="rounded border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-raised"
        >
          Buscar
        </button>
      </form>

      {all.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
          <p className="text-sm text-ink-soft">
            {q ? `No hay inversiones que coincidan con "${q}".` : "No tienes inversiones registradas."}
          </p>
        </div>
      ) : (
        <>
          {financial.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">Inversiones financieras</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {financial.map((inv) => (
                  <FinancialCard key={inv.id} inv={inv} now={now} actions={<Actions inv={inv} />} />
                ))}
              </div>
            </section>
          )}
          {homes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">Vivienda</h2>
              <div className="grid grid-cols-1 gap-4">
                {homes.map((inv) => (
                  <HomeCard key={inv.id} inv={inv} rent={rentOf(inv)} now={now} actions={<Actions inv={inv} />} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
