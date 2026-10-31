import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { InvestmentFields } from "@/components/InvestmentFields";
import { updateInvestment } from "../../actions";

export default async function EditInvestmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: investment } = await supabase
    .from("investments")
    .select("*")
    .eq("id", id)
    .single();

  if (!investment) notFound();

  const updateWithId = updateInvestment.bind(null, investment.id);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/inversiones" className="text-sm text-stamp-dark underline underline-offset-4">
          ← Volver a inversiones
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">Editar inversión</h1>
      </div>

      <form
        action={updateWithId}
        className="grid grid-cols-1 gap-4 card p-6 sm:grid-cols-2"
      >
        <InvestmentFields v={investment} />
        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110"
          >
            Guardar cambios
          </button>
          <Link
            href="/inversiones"
            className="rounded border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-paper"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
