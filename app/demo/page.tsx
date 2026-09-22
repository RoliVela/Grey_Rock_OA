import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DemoPage() {
  const supabase = await createClient();
  const { data: personas } = await supabase
    .from("profiles")
    .select("id, display_name, neighborhood, questionnaire_responses(kid_ages, priority)")
    .eq("is_demo", true);

  return (
    <main className="mx-auto flex flex-1 max-w-2xl flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Try the matching, no signup needed</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick a persona to see the recommendations they&apos;d get.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {personas?.map((persona) => {
          const response = Array.isArray(persona.questionnaire_responses)
            ? persona.questionnaire_responses[0]
            : persona.questionnaire_responses;
          return (
            <Link
              key={persona.id}
              href={`/demo/${persona.id}`}
              className="rounded-lg border border-zinc-300 p-4 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              <p className="font-medium">{persona.display_name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {persona.neighborhood} · kids {response?.kid_ages}
              </p>
              <p className="mt-1 text-sm capitalize text-zinc-600 dark:text-zinc-400">
                Priority: {response?.priority}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
