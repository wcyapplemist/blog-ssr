import { getDb, type GuestbookEntry } from "@/lib/db";
import GuestbookForm from "@/components/GuestbookForm";

export const dynamic = "force-dynamic";

export default async function GuestbookPage() {
  const sql = getDb();
  const entries = (await sql`
    SELECT id, name, message, created_at
    FROM guestbook
    ORDER BY created_at DESC
    LIMIT 100
  `) as GuestbookEntry[];

  return (
    <div className="flex flex-col flex-1">
      <main className="flex w-full max-w-2xl flex-col px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Guestbook
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Leave a message — I would love to hear from you.
        </p>

        <div className="mt-8">
          <GuestbookForm serverEntries={entries} />
        </div>
      </main>
    </div>
  );
}
