import Link from "next/link";
import { Pencil, Download, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { createPayment, deletePayment, markPaymentAsPaid } from "./actions";

function diasRestantes(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha);
  const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default async function PagosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("recurring_payments")
    .select("id, name, amount, currency, due_date, category, notes")
    .order("due_date", { ascending: true });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: payments } = await query;

  const totalsByCurrency = new Map<string, number>();
  for (const p of payments ?? []) {
    totalsByCurrency.set(
      p.currency,
      (totalsByCurrency.get(p.currency) ?? 0) + Number(p.amount)
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Pagos y facturas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Arriendo, servicios, cuotas y créditos, con su fecha de vencimiento.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga un archivo, no navega a una página */}
        <a
          href="/pagos/export"
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
                Pendiente en {currency}
              </p>
              <p className="tabular mt-1 text-3xl font-bold tracking-tight text-ink">
                {formatMoney(total, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <form
        action={createPayment}
        className="grid grid-cols-1 gap-4 card p-6 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-ink">Nombre</label>
          <input
            name="name"
            required
            placeholder="Ej. Arriendo, Internet, Cuota tarjeta"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Monto</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            className="tabular mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Moneda</label>
          <select
            name="currency"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Fecha de vencimiento</label>
          <input
            name="due_date"
            type="date"
            required
            className="tabular mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Categoría</label>
          <input
            name="category"
            placeholder="Ej. Servicios, Arriendo, Crédito"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Notas</label>
          <input
            name="notes"
            placeholder="Opcional"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
          >
            Agregar pago
          </button>
        </div>
      </form>

      <form action="/pagos" className="flex gap-2">
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

      {!payments || payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-line px-5 py-10 text-center">
          <p className="text-sm text-ink-soft">
            {q ? `No hay pagos que coincidan con "${q}".` : "No tienes pagos registrados."}
          </p>
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {payments.map((p) => {
            const dias = diasRestantes(p.due_date);
            const urgente = dias <= 5;
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between gap-4 border-l-2 py-4 pl-4 pr-5 ${
                  urgente ? "border-l-mustard" : "border-l-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {p.name}
                    {p.category && (
                      <span className="ml-2 text-xs text-ink-soft">({p.category})</span>
                    )}
                  </p>
                  <p className={`tabular mt-0.5 text-sm ${urgente ? "font-medium text-mustard" : "text-ink-soft"}`}>
                    {new Date(p.due_date).toLocaleDateString("es-CO")}
                    {dias >= 0 ? ` (en ${dias} días)` : ` (vencido hace ${Math.abs(dias)} días)`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tabular text-base font-semibold text-ink">
                    {formatMoney(Number(p.amount), p.currency)}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await markPaymentAsPaid(p.id, p.due_date);
                    }}
                  >
                    <button
                      type="submit"
                      aria-label="Marcar como pagado y adelantar un mes"
                      title="Marcar como pagado y adelantar un mes"
                      className="rounded p-1.5 text-ink-soft/60 transition hover:bg-stamp-soft hover:text-stamp-dark"
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </form>
                  <Link
                    href={`/pagos/${p.id}`}
                    aria-label="Editar pago"
                    className="rounded p-1.5 text-ink-soft/60 transition hover:bg-stamp-soft hover:text-stamp-dark"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deletePayment(p.id);
                    }}
                  >
                    <ConfirmDeleteButton
                      label="Eliminar pago"
                      confirmMessage={`¿Eliminar el pago "${p.name}"? Esta acción no se puede deshacer.`}
                    />
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
