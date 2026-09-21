import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessMatches } from "@/lib/matches";
import { MatchList } from "@/components/MatchList";

export default async function DemoResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, neighborhood")
    .eq("id", id)
    .eq("is_demo", true)
    .single();
  if (!profile) notFound();

  const { data: response } = await supabase
    .from("questionnaire_responses")
    .select("kid_ages, priority")
    .eq("profile_id", id)
    .single();

  const matches = await getBusinessMatches(id);

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
      <Link href="/demo" className="text-sm underline">
        ← All personas
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{profile.display_name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {profile.neighborhood} · kids {response?.kid_ages} · top priority{" "}
          <span className="capitalize">{response?.priority}</span>
        </p>
      </div>

      <MatchList matches={matches} />
    </main>
  );
}
