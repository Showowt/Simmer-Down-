import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS.
 *
 * Use ONLY in server-side payment routes and webhook handlers where we need to:
 *  - Insert into payment_attempts (service_role_all policy)
 *  - Lock orders FOR UPDATE during callback processing
 *  - Write third-party delivery webhook orders with trusted source_provider
 *
 * NEVER import this from a client component or from any code path reachable
 * by unauthenticated users. It carries full DB privileges.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Required for payment_attempts and webhook writes.",
    );
  }

  // Intentionally untyped: the generated Database types are stale until
  // `supabase gen types` is run against the live DB post-migration.
  // Route handlers that use this client reference new columns
  // (payment_attempts, spi_token, etc.) that aren't yet in database.types.ts.
  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
