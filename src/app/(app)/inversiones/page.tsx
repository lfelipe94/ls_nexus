import { createClient } from "@/lib/supabase/server";
import { createInvestment, deleteInvestment } from "./actions";

export default async function InversionesPage() {
  const supabase = await createClient();
  const { data: investments } = await supabase
    .from("investments")
    .select("id, name, amount, currency, notes, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Inversiones</h1>

      <form
        action={createInvestment}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input
            name="name"
            required
            placeholder="Ej. Fondo S&P 500"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Monto</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Moneda</label>
          <select
            name="currency"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="COP">COP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Notas</label>
          <input
            name="notes"
            placeholder="Opcional"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Agregar inversión
          </button>
        </div>
      </form>

      {!investments || investments.length === 0 ? (
        <p className="text-sm text-neutral-500">No tienes inversiones registradas.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {investments.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-neutral-900">{inv.name}</p>
                {inv.notes && <p className="text-sm text-neutral-500">{inv.notes}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-neutral-900">
                  {Number(inv.amount).toLocaleString("es-CO")} {inv.currency}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await deleteInvestment(inv.id);
                  }}
                >
                  <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                    Eliminar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
