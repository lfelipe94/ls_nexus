"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCashFlow(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("cash_flows").insert({
    user_id: user.id,
    kind: formData.get("kind") === "income" ? "income" : "expense",
    name: formData.get("name") as string,
    amount: Number(formData.get("amount")),
    currency: formData.get("currency") as string,
    notes: ((formData.get("notes") as string) || "").trim() || null,
  });

  revalidatePath("/ingresos");
}

export async function deleteCashFlow(id: string) {
  const supabase = await createClient();
  await supabase.from("cash_flows").delete().eq("id", id);
  revalidatePath("/ingresos");
}
