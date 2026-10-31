"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => ((f.get(k) as string) || "").trim() || null;
const num = (f: FormData, k: string) => (text(f, k) === null ? null : Number(f.get(k)));

function parseInvestment(formData: FormData) {
  const category = (formData.get("category") as string) || "otro";
  const vivienda = category === "vivienda";
  const cdt = category === "cdt";
  return {
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    currency: formData.get("currency") as string,
    notes: text(formData, "notes"),
    category,
    ownership_pct: Math.min(100, Math.max(0.01, num(formData, "ownership_pct") ?? 100)),
    platform: text(formData, "platform"),
    // Los campos que no aplican al tipo elegido se limpian al guardar.
    current_value: cdt ? null : num(formData, "current_value"),
    purchase_price: vivienda ? num(formData, "purchase_price") : null,
    start_date: vivienda || cdt ? text(formData, "start_date") : null,
    purchase_date: vivienda ? text(formData, "purchase_date") : null,
    maturity_date: cdt ? text(formData, "maturity_date") : null,
    project_name: vivienda ? text(formData, "project_name") : null,
    credit_amount: vivienda ? num(formData, "credit_amount") : null,
    interest_rate: vivienda || cdt ? num(formData, "interest_rate") : null,
    credit_term_months: vivienda ? num(formData, "credit_term_months") : null,
    payment_day: vivienda ? num(formData, "payment_day") : null,
  };
}

export async function createInvestment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("investments").insert({ user_id: user.id, ...parseInvestment(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/inversiones");
}

export async function updateInvestment(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("investments").update(parseInvestment(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/inversiones");
  redirect("/inversiones");
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  await supabase.from("investments").delete().eq("id", id);
  revalidatePath("/inversiones");
}
