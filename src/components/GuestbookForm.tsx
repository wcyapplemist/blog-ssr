"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

export default function GuestbookForm({
  serverEntries,
}: {
  serverEntries: GuestbookEntry[];
}) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<GuestbookEntry[]>(serverEntries);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !message.trim()) {
      setError("Name and message are required.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      const newEntry: GuestbookEntry = await res.json();

      setEntries((prev) => [newEntry, ...prev]);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-foreground"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Your name"
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-foreground"
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Say something..."
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </form>

      <div className="space-y-4">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet. Be the first to write one!</p>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-border p-4 space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {entry.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {entry.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
