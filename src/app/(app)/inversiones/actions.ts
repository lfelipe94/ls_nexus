"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const text = (f: FormData, k: string) => ((f.get(k) as string) || "").trim() || null;
const num = (f: FormData, k: string) => (text(f, k) === null ? null : Number(f.get(k)));

function parseInvestment(formData: FormData) {
  const category = (formData.get("category") as string) || "otro";
  const vivienda = category === "vivienda";
  return {
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    currency: formData.get("currency") as string,
    notes: text(formData, "notes"),
    category,
    platform: text(formData, "platform"),
    // Los datos de crédito solo aplican a vivienda; al cambiar de tipo se limpian.
    project_name: vivienda ? text(formData, "project_name") : null,
    credit_amount: vivienda ? num(formData, "credit_amount") : null,
    interest_rate: vivienda ? num(formData, "interest_rate") : null,
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

  await supabase.from("investments").insert({ user_id: user.id, ...parseInvestment(formData) });

  revalidatePath("/inversiones");
}

export async function updateInvestment(id: string, formData: FormData) {
  const supabase = await createClient();

  await supabase.from("investments").update(parseInvestment(formData)).eq("id", id);

  revalidatePath("/inversiones");
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  await supabase.from("investments").delete().eq("id", id);
  revalidatePath("/inversiones");
}
