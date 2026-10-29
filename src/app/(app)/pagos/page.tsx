import { createClient } from "@/lib/supabase/server";
import { createPayment, deletePayment } from "./actions";

function diasRestantes(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha);
  const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default async function PagosPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("recurring_payments")
    .select("id, name, amount, currency, due_date, category, notes")
    .order("due_date", { ascending: true });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Pagos y facturas</h1>

      <form
        action={createPayment}
        className="grid grid-cols-1 gap-4 rounded-lg border border-neutral-200 bg-white p-6 sm:grid-cols-2"
      >
        <div>
          <label className="block text-sm font-medium text-neutral-700">Nombre</label>
          <input
            name="name"
            required
            placeholder="Ej. Arriendo, Internet, Cuota tarjeta"
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
          <label className="block text-sm font-medium text-neutral-700">Fecha de vencimiento</label>
          <input
            name="due_date"
            type="date"
            required
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700">Categoría</label>
          <input
            name="category"
            placeholder="Ej. Servicios, Arriendo, Crédito"
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
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
            Agregar pago
          </button>
        </div>
      </form>

      {!payments || payments.length === 0 ? (
        <p className="text-sm text-neutral-500">No tienes pagos registrados.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
          {payments.map((p) => {
            const dias = diasRestantes(p.due_date);
            const urgente = dias <= 5;
            return (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium text-neutral-900">
                    {p.name}
                    {p.category && (
                      <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                        {p.category}
                      </span>
                    )}
                  </p>
                  <p className={`text-sm ${urgente ? "text-red-600" : "text-neutral-500"}`}>
                    Vence: {new Date(p.due_date).toLocaleDateString("es-CO")}
                    {dias >= 0 ? ` (en ${dias} días)` : ` (vencido hace ${Math.abs(dias)} días)`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-neutral-900">
                    {Number(p.amount).toLocaleString("es-CO")} {p.currency}
                  </span>
                  <form
                    action={async () => {
                      "use server";
                      await deletePayment(p.id);
                    }}
                  >
                    <button type="submit" className="text-sm text-red-600 hover:text-red-800">
                      Eliminar
                    </button>
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
