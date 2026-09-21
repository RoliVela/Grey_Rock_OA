import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, kid_ages, priority")
    .eq("profile_id", id)
    .single();

  const { data: responseCategories } = response
    ? await supabase
        .from("response_categories")
        .select("category_id")
        .eq("response_id", response.id)
    : { data: [] };
  const categoryIds = (responseCategories ?? []).map((rc) => rc.category_id);

  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] };

  const { data: businesses } = categoryIds.length
    ? await supabase
        .from("businesses")
        .select("id, name, category_id, phone, address, website_url")
        .in("category_id", categoryIds)
        .order("category_id")
    : { data: [] };

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
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Interested in: {categories?.map((c) => c.name).join(", ") || "—"}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {categories?.map((category) => {
          const matches = businesses?.filter((b) => b.category_id === category.id) ?? [];
          return (
            <div key={category.id}>
              <h2 className="mb-2 text-lg font-medium">{category.name}</h2>
              {matches.length === 0 ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No businesses in this category yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {matches.map((business) => (
                    <div
                      key={business.id}
                      className="rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700"
                    >
                      <p className="font-medium">{business.name}</p>
                      {business.phone && <p>{business.phone}</p>}
                      {business.address && (
                        <p className="text-zinc-600 dark:text-zinc-400">{business.address}</p>
                      )}
                      {business.website_url && (
                        <a
                          href={business.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {business.website_url}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
