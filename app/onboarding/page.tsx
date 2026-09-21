import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitOnboarding } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signup");

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name")
    .order("name");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold">Tell us about your family</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          This helps us match you with the right recommendations.
        </p>
      </div>
      <form action={submitOnboarding} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1 text-sm">
          Neighborhood
          <input
            type="text"
            name="neighborhood"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Kids&apos; ages
          <input
            type="text"
            name="kid_ages"
            placeholder="e.g. 4, 7"
            required
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Categories you care about
          </legend>
          {categories?.map((category) => (
            <label key={category.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="categories" value={category.id} />
              {category.name}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Top priority</legend>
          {["price", "speed", "quality"].map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm capitalize">
              <input type="radio" name="priority" value={option} required />
              {option}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
