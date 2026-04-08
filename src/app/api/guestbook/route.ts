import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const entries = await sql`
    SELECT id, name, message, created_at
    FROM guestbook
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, message } = body;

  if (!name?.trim() || !message?.trim()) {
    return NextResponse.json(
      { error: "Name and message are required." },
      { status: 400 }
    );
  }

  const trimmedName = name.trim().slice(0, 100);
  const trimmedMessage = message.trim().slice(0, 1000);

  const [entry] = await sql`
    INSERT INTO guestbook (name, message)
    VALUES (${trimmedName}, ${trimmedMessage})
    RETURNING id, name, message, created_at
  `;

  return NextResponse.json(entry, { status: 201 });
}
