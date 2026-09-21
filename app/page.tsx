import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-semibold">Grey Rock Dallas</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Tell us about your family and we&apos;ll match you with recommended
        local businesses.
      </p>
      <Link
        href="/signup"
        className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Get started
      </Link>
    </main>
  );
}
