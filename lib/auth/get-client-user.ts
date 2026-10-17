import { createClient } from "@/lib/supabase/client";

/**
 * Gets the authenticated browser user without forcing a network request
 * while the device is offline. Supabase getSession() reads the local
 * session; getUser() is preferred when online because it validates the user.
 */
export async function getClientUser() {
  const supabase = createClient();

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
