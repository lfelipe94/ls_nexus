import { createClient } from "@/lib/supabase/server";
import { toCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const { data: investments } = await supabase
    .from("investments")
    .select("name, amount, currency, notes, created_at, category, platform, project_name, credit_amount, interest_rate, credit_term_months, payment_day, ownership_pct")
    .order("created_at", { ascending: false });

  const csv = toCsv(
    (investments ?? []).map((inv) => ({
      nombre: inv.name,
      monto: inv.amount,
      moneda: inv.currency,
      porcentaje: inv.ownership_pct,
      tipo: inv.category,
      plataforma: inv.platform,
      proyecto: inv.project_name,
      valor_credito: inv.credit_amount,
      tasa_ea: inv.interest_rate,
      plazo_meses: inv.credit_term_months,
      dia_pago: inv.payment_day,
      notas: inv.notes,
      creado: inv.created_at,
    }))
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inversiones.csv"`,
    },
  });
}
