import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessMatches } from "@/lib/matches";
import { MatchList } from "@/components/MatchList";

export default async function OnboardingCompletePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const matches = await getBusinessMatches(user.id);

  return (
    <main className="mx-auto flex flex-1 max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Your matches</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Based on the categories you picked, closest to your neighborhood first.
        </p>
      </div>
      <MatchList matches={matches} />
    </main>
  );
}
