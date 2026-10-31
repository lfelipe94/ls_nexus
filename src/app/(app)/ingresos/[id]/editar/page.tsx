import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CashFlowFields } from "@/components/CashFlowFields";
import { updateCashFlow } from "../../actions";

export default async function EditCashFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: flow } = await supabase.from("cash_flows").select("*").eq("id", id).single();
  if (!flow) notFound();

  const { data: all } = await supabase.from("cash_flows").select("property").not("property", "is", null);
  const properties = [...new Set((all ?? []).map((f) => f.property))] as string[];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/ingresos" className="text-sm text-stamp-dark underline underline-offset-4">
          ← Volver a ingresos y gastos
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Editar {flow.kind === "income" ? "ingreso" : "gasto"}</h1>
      </div>

      <form action={updateCashFlow.bind(null, flow.id)} className="grid grid-cols-1 gap-4 card p-6 sm:grid-cols-2">
        <CashFlowFields v={flow} properties={properties} />
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
          >
            Guardar cambios
          </button>
          <Link
            href="/ingresos"
            className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
