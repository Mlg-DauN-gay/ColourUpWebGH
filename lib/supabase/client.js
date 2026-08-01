"use client";
import { createBrowserClient } from "@supabase/ssr";

let client;

// Singleton browser client — safe to import from any client component.
export function getSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  return client;
}
