"use server";

import { createClient } from "@/lib/supabase/server";

export async function completeMandatoryPasswordChangeAction(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No encontramos una sesión activa." };
  const { error } = await supabase
    .from("profiles")
    .update({ must_change_password: false, updated_at: new Date().toISOString() } as never)
    .eq("user_id", user.id);
  return error ? { error: error.message } : {};
}
