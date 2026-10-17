
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, LoaderCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checking, setChecking] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;
    let recoveryEventReceived = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryEventReceived = true;
        setRecoveryReady(true);
        setChecking(false);
        setError("");
      }
    });

    async function verifyRecovery() {
      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!active) return;

      // A recovery event is the clearest signal that this is a
      // password-recovery flow. Don't accept an ordinary session alone.
      if (recoveryEventReceived && data.session) {
        setRecoveryReady(true);
      } else if (sessionError) {
        setError(sessionError.message);
      } else {
        setError(
          "Please open a fresh password-reset link from your email. The link may have expired or already been used."
        );
      }

      setChecking(false);
    }

    void verifyRecovery();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleResetPassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess("Password updated successfully. Redirecting to login...");
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login");
      }, 1500);
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-700">
          <KeyRound size={23} />
        </div>

        <p className="text-sm font-semibold tracking-wide text-green-700">
          AGRIORBIT
        </p>

        <h1 className="mt-3 text-2xl font-bold text-slate-900">
          Reset your password
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Choose a new password for your AgriOrbit account.
        </p>

        {checking ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <LoaderCircle size={17} className="animate-spin" />
            Verifying your recovery link...
          </div>
        ) : !recoveryReady ? (
          <div className="mt-6 space-y-4">
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>

            <button
              type="button"
              onClick={() => router.replace("/forgot-password")}
              className="w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800"
            >
              Request a new link
            </button>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                placeholder="Re-enter your new password"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <LoaderCircle size={17} className="animate-spin" />}
              {saving ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
