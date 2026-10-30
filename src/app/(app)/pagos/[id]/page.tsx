import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updatePayment } from "../actions";

export default async function EditPaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from("recurring_payments")
    .select("id, name, amount, currency, due_date, category, notes")
    .eq("id", id)
    .single();

  if (!payment) notFound();

  const updateWithId = updatePayment.bind(null, payment.id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/pagos" className="text-sm text-stamp-dark underline underline-offset-4">
          ← Volver a pagos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Editar pago</h1>
      </div>

      <form
        action={updateWithId}
        className="grid grid-cols-1 gap-4 rounded border border-line bg-paper-raised p-6 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-ink">Nombre</label>
          <input
            name="name"
            required
            defaultValue={payment.name}
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Monto</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            defaultValue={payment.amount}
            className="tabular mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Moneda</label>
          <select
            name="currency"
            defaultValue={payment.currency}
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
            defaultValue={payment.due_date}
            className="tabular mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Categoría</label>
          <input
            name="category"
            defaultValue={payment.category ?? ""}
            placeholder="Ej. Servicios, Arriendo, Crédito"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">Notas</label>
          <input
            name="notes"
            defaultValue={payment.notes ?? ""}
            placeholder="Opcional"
            className="mt-1.5 w-full rounded border border-line bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/50 outline-none transition focus-visible:border-stamp focus-visible:ring-2 focus-visible:ring-stamp/15"
          />
        </div>
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded bg-stamp-dark px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-stamp"
          >
            Guardar cambios
          </button>
          <Link
            href="/pagos"
            className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
