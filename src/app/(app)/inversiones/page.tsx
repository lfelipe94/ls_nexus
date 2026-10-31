import Link from "next/link";
import { Pencil, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { InvestmentFields } from "@/components/InvestmentFields";
import { appreciation, categoryLabel, currentValue, monthlyPayment, myShare, nextPaymentDate } from "@/lib/investments";
import { createInvestment, deleteInvestment } from "./actions";

type Inv = Parameters<typeof monthlyPayment>[0] & {
  currency: string;
  payment_day: number | null;
  interest_rate: number | string | null;
};

function CreditSummary({ inv }: { inv: Inv }) {
  if (!inv.credit_amount) return null;
  const cuota = monthlyPayment(inv);
  const next = nextPaymentDate(inv.payment_day);
  const total = cuota && inv.credit_term_months ? cuota * inv.credit_term_months : null;
  return (
    <p className="tabular mt-1 text-xs text-ink-soft">
      Crédito {formatMoney(Number(inv.credit_amount), inv.currency)}
      {inv.interest_rate != null && ` · ${inv.interest_rate}% E.A.`}
      {cuota && ` · cuota ≈ ${formatMoney(cuota, inv.currency)}`}
      {total && ` · intereses ≈ ${formatMoney(total - Number(inv.credit_amount), inv.currency)}`}
      {next && ` · próx. pago ${next.toLocaleDateString("es-CO")}`}
    </p>
  );
}

type Investment = Inv & {
  id: string;
  name: string;
  amount: number | string;
  category: string | null;
  platform: string | null;
  project_name: string | null;
  notes: string | null;
  ownership_pct: number | string | null;
  current_value: number | string | null;
  purchase_price: number | string | null;
  start_date: string | null;
  purchase_date: string | null;
  maturity_date: string | null;
};

function Row({ inv }: { inv: Investment }) {
  const mine = myShare(inv);
  const today = inv.category === "vivienda" ? null : currentValue(mine);
  const growth = inv.category === "vivienda" ? appreciation(inv) : null;
  return (
  <li className="flex items-center justify-between gap-4 px-5 py-4">
    <div className="min-w-0 flex-1">
      <Link href={`/inversiones/${inv.id}`} className="truncate font-medium text-ink hover:text-stamp-dark hover:underline">
        {inv.name}
      </Link>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-ink-soft">
        <span className="rounded-full bg-stamp-soft px-2 py-0.5 text-xs font-medium text-stamp-dark">
          {categoryLabel(inv.category)}
        </span>
        {inv.platform && <span>{inv.platform}</span>}
        {inv.project_name && <span>· {inv.project_name}</span>}
      </p>
      {inv.category === "vivienda" && <CreditSummary inv={myShare(inv)} />}
      {growth && (
        <p className="tabular mt-1 text-xs text-ink-soft">
          Valorización {growth.total >= 0 ? "+" : ""}
          {formatMoney(currentValue(mine) - Number(mine.purchase_price), inv.currency)} ({(growth.total * 100).toFixed(1)} %
          {growth.yearly != null && ` · ${(growth.yearly * 100).toFixed(1)} % anual`}) · {growth.years} años, {growth.months} meses
        </p>
      )}
      {today !== null && Math.abs(today - mine.amount) >= 1 && (
        <p className="tabular mt-1 text-xs text-ink-soft">
          Hoy ≈ {formatMoney(today, inv.currency)} ({today >= mine.amount ? "+" : ""}
          {formatMoney(today - mine.amount, inv.currency)})
        </p>
      )}
      {inv.notes && <p className="truncate text-sm text-ink-soft">{inv.notes}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-3">
      <span className="tabular text-base font-semibold text-ink">
        {formatMoney(myShare(inv).amount, inv.currency)}
        {Number(inv.ownership_pct) < 100 && (
          <span className="block text-right text-xs font-normal text-ink-soft">
            {Number(inv.ownership_pct)}% de {formatMoney(Number(inv.amount), inv.currency)}
          </span>
        )}
      </span>
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
    </div>
  </li>
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

  const all = (investments ?? []) as Investment[];
  const financial = all.filter((inv) => inv.category !== "vivienda");
  const homes = all.filter((inv) => inv.category === "vivienda");

  // Totales por moneda (no se pueden sumar monedas distintas entre sí); la vivienda va aparte.
  const totalsByCurrency = new Map<string, number>();
  for (const inv of financial) {
    totalsByCurrency.set(
      inv.currency,
      (totalsByCurrency.get(inv.currency) ?? 0) + myShare(inv).amount
    );
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
          {Array.from(totalsByCurrency.entries()).map(([currency, total]) => (
            <div
              key={currency}
              className="card px-6 py-4"
            >
              <p className="text-xs font-medium uppercase text-ink-soft">
                Invertido en {currency}
              </p>
              <p className="tabular mt-1 text-3xl font-bold tracking-tight text-ink">
                {formatMoney(total, currency)}
              </p>
            </div>
          ))}
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
              <ul className="card divide-y divide-line overflow-hidden">
                {financial.map((inv) => (
                  <Row key={inv.id} inv={inv} />
                ))}
              </ul>
            </section>
          )}
          {homes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-ink">Vivienda</h2>
              <ul className="card divide-y divide-line overflow-hidden">
                {homes.map((inv) => (
                  <Row key={inv.id} inv={inv} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
