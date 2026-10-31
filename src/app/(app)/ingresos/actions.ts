"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCashFlow(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("cash_flows").insert({
    user_id: user.id,
    kind: formData.get("kind") === "income" ? "income" : "expense",
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    currency: formData.get("currency") as string,
    notes: ((formData.get("notes") as string) || "").trim() || null,
    frequency: formData.get("frequency") === "once" ? "once" : "monthly",
    flow_date: (formData.get("flow_date") as string) || null,
    category: (formData.get("category") as string) || null,
    property: ((formData.get("property") as string) || "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/ingresos");
}

export async function deleteCashFlow(id: string) {
  const supabase = await createClient();
  await supabase.from("cash_flows").delete().eq("id", id);
  revalidatePath("/ingresos");
}
