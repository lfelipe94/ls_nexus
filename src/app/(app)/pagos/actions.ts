"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createPayment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as string;
  const due_date = formData.get("due_date") as string;
  const category = (formData.get("category") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  await supabase.from("recurring_payments").insert({
    user_id: user.id,
    name,
    amount,
    currency,
    due_date,
    category,
    notes,
  });

  revalidatePath("/pagos");
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  await supabase.from("recurring_payments").delete().eq("id", id);
  revalidatePath("/pagos");
}
