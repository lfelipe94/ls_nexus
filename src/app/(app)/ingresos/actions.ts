"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { CURRENCIES } from "@/lib/currencies";
import type { CashFlow } from "@/lib/cashflows";

export type CashFlowInput = {
  id?: string;
  kind: string;
  name: string;
  amount: number | string;
  currency: string;
  frequency: string;
  flow_date: string | null;
  category: string | null;
  property: string | null;
};

const clean = (v: string | null | undefined) => (v ?? "").trim() || null;

/** Valida en el servidor: lo que llega del navegador no es de fiar. */
function parse(row: CashFlowInput) {
  const name = clean(row.name);
  const amount = Number(row.amount);
  if (!name) throw new Error("Falta el concepto");
  if (!Number.isFinite(amount) || amount < 0) throw new Error("Importe inválido");
  const frequency = ["monthly", "weekly", "once"].includes(row.frequency) ? row.frequency : "monthly";
  const date = clean(row.flow_date);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fecha inválida");
  if (frequency === "once" && !date) throw new Error("Un gasto único necesita fecha");
  return {
    kind: row.kind === "income" ? "income" : "expense",
    name,
    amount,
    currency: CURRENCIES.includes(row.currency) ? row.currency : "EUR",
    frequency,
    flow_date: frequency === "weekly" ? null : date,
    category: clean(row.category),
    property: clean(row.property),
  };
}

/** Crea (sin id) o actualiza (con id) una fila. Devuelve el id para que la tabla lo recuerde. */
export async function saveCashFlow(row: CashFlowInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión expirada");

  const values = parse(row);
  const { data, error } = row.id
    ? await supabase.from("cash_flows").update(values).eq("id", row.id).eq("user_id", user.id).select("id").single()
    : await supabase.from("cash_flows").insert({ user_id: user.id, ...values }).select("id").single();
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
  return data.id as string;
}

/** Varias filas de una vez (pegar una lista). Devuelve las filas guardadas. */
export async function saveCashFlows(rows: CashFlowInput[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión expirada");
  if (rows.length === 0 || rows.length > 100) throw new Error("Entre 1 y 100 filas");

  const { data, error } = await supabase
    .from("cash_flows")
    .insert(rows.map((r) => ({ user_id: user.id, ...parse(r) })))
    .select("id, kind, name, amount, currency, frequency, flow_date, category, property");
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
  return (data ?? []) as CashFlow[];
}

export async function deleteCashFlow(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sesión expirada");

  const { error } = await supabase.from("cash_flows").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
  revalidatePath("/dashboard");
}
