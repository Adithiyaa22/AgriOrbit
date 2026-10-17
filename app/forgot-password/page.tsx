
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, KeyRound, Mail, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMessage(
        "If an account exists for this email, password-reset instructions will be sent. Check your inbox and spam folder."
      );
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
              <KeyRound size={23} />
            </div>

            <h1 className="text-2xl font-bold text-[var(--text)]">
              Forgot your password?
            </h1>

            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Enter the email address associated with your AgriOrbit account
              and we&apos;ll send you instructions to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[var(--text)]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Enter your email"
                    className="h-11 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--light-green)]"
                  />
                </div>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {message && (
                <p
                  role="status"
                  className="rounded-lg bg-green-50 p-3 text-sm text-green-800"
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[#256b29] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                {loading ? "Sending..." : "Send reset instructions"}
              </button>
            </form>

            <Link
              href="/login"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--muted)]">
            AgriOrbit • Farmer &amp; Field Data Collection Platform
          </p>
        </div>
      </div>
    </main>
  );
}
