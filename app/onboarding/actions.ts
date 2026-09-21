"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function submitOnboarding(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const neighborhood = String(formData.get("neighborhood") ?? "").trim();
  const kidAges = String(formData.get("kid_ages") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  const categoryIds = formData.getAll("categories").map((value) => Number(value));

  await supabase.from("profiles").upsert({ id: user.id, neighborhood });

  const { data: response } = await supabase
    .from("questionnaire_responses")
    .upsert(
      { profile_id: user.id, kid_ages: kidAges, priority },
      { onConflict: "profile_id" },
    )
    .select("id")
    .single();

  if (response) {
    await supabase.from("response_categories").delete().eq("response_id", response.id);
    if (categoryIds.length > 0) {
      await supabase.from("response_categories").insert(
        categoryIds.map((category_id) => ({ response_id: response.id, category_id })),
      );
    }
  }

  redirect("/onboarding/complete");
}
