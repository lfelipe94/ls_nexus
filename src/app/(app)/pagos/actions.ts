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

export async function updatePayment(id: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const amount = Number(formData.get("amount"));
  const currency = formData.get("currency") as string;
  const due_date = formData.get("due_date") as string;
  const category = (formData.get("category") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  await supabase
    .from("recurring_payments")
    .update({ name, amount, currency, due_date, category, notes })
    .eq("id", id);

  revalidatePath("/pagos");
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  await supabase.from("recurring_payments").delete().eq("id", id);
  revalidatePath("/pagos");
}

/**
 * Marca el pago como realizado y adelanta su vencimiento un mes,
 * asumiendo que es un pago mensual recurrente (arriendo, servicios, etc.).
 */
export async function markPaymentAsPaid(id: string, currentDueDate: string) {
  const supabase = await createClient();

  const next = new Date(currentDueDate);
  next.setMonth(next.getMonth() + 1);
  const nextDueDate = next.toISOString().slice(0, 10);

  await supabase
    .from("recurring_payments")
    .update({ due_date: nextDueDate })
    .eq("id", id);

  revalidatePath("/pagos");
  revalidatePath("/dashboard");
}
