import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  created_at: string;
}
