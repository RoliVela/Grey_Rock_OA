import type { BusinessMatch } from "@/lib/matches";

export function MatchList({ matches }: { matches: BusinessMatch[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        No matches yet — try selecting more categories.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {matches.map((match, i) => (
        <div
          key={`${match.business_name}-${i}`}
          className="rounded-lg border border-zinc-300 p-3 text-sm dark:border-zinc-700"
        >
          <p className="font-medium">{match.business_name}</p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {match.category}
            {match.neighborhood ? ` · ${match.neighborhood}` : ""}
          </p>
          {match.phone && <p>{match.phone}</p>}
          {match.website_url && (
            <a
              href={match.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {match.website_url}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
