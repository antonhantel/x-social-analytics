import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Log connection status for debugging
const hasCredentials = !!(supabaseUrl && supabaseAnonKey);
console.log(
  `[Supabase] URL configured: ${!!supabaseUrl}, Key configured: ${!!supabaseAnonKey}`
);

if (!hasCredentials) {
  console.warn(
    "[Supabase] Credentials not found. Using localStorage fallback.\n" +
      "To enable cloud persistence, set these environment variables:\n" +
      "- VITE_SUPABASE_URL\n" +
      "- VITE_SUPABASE_ANON_KEY\n" +
      "(In Vercel: Project Settings > Environment Variables)"
  );
}

export const supabase = hasCredentials
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

export const isSupabaseConfigured = hasCredentials;

// Test connection and return status
export const testConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  if (!supabase) {
    return { connected: false, error: "Supabase not configured" };
  }

  try {
    const { error } = await supabase.from("metadata").select("key").limit(1);
    if (error) {
      console.error("[Supabase] Connection test failed:", error.message);
      return { connected: false, error: error.message };
    }
    console.log("[Supabase] Connection test successful");
    return { connected: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[Supabase] Connection test exception:", msg);
    return { connected: false, error: msg };
  }
};
