"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInvestment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as string;
  const notes = (formData.get("notes") as string) || null;

  await supabase.from("investments").insert({
    user_id: user.id,
    name,
    amount,
    currency,
    notes,
  });

  revalidatePath("/inversiones");
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  await supabase.from("investments").delete().eq("id", id);
  revalidatePath("/inversiones");
}
