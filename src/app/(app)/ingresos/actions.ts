"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const text = (formData: FormData, key: string) => ((formData.get(key) as string) || "").trim() || null;

function parseCashFlow(formData: FormData) {
  const frequency = formData.get("frequency") === "once" ? "once" : "monthly";
  // Mensual: solo importa el día (se guarda en enero de 2000, que tiene 31 días); único: fecha completa.
  const day = Math.min(31, Math.max(1, Number(formData.get("day")) || 0));
  return {
    kind: formData.get("kind") === "income" ? "income" : "expense",
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    currency: formData.get("currency") as string,
    notes: text(formData, "notes"),
    frequency,
    flow_date:
      frequency === "once"
        ? text(formData, "flow_date")
        : formData.get("day")
          ? `2000-01-${String(day).padStart(2, "0")}`
          : null,
    category: text(formData, "category"),
    property: text(formData, "property"),
  };
}

export async function createCashFlow(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("cash_flows").insert({ user_id: user.id, ...parseCashFlow(formData) });
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
}

export async function updateCashFlow(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("cash_flows").update(parseCashFlow(formData)).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
  redirect("/ingresos");
}

export async function deleteCashFlow(id: string) {
  const supabase = await createClient();
  await supabase.from("cash_flows").delete().eq("id", id);
  revalidatePath("/ingresos");
}
