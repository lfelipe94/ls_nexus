import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("recurring_payments")
    .select("name, amount, currency, due_date, category, notes")
    .order("due_date", { ascending: true });

  const csv = toCsv(
    (payments ?? []).map((p) => ({
      nombre: p.name,
      monto: p.amount,
      moneda: p.currency,
      vencimiento: p.due_date,
      categoria: p.category,
      notas: p.notes,
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pagos.csv"`,
    },
  });
}
