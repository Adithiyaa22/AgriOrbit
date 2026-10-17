"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sprout,
  UserRound,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Portal = "intern" | "admin" | "super_admin";

const portalOptions: {
  value: Portal;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    value: "intern",
    label: "Intern",
    description: "Field data collection",
    icon: UserRound,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Operations and surveys",
    icon: Users,
  },
  {
    value: "super_admin",
    label: "Super Admin",
    description: "User and system management",
    icon: ShieldCheck,
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [portal, setPortal] = useState<Portal>("intern");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const supabase = createClient();

    try {
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError || !authData.user) {
        setError(
          authError?.message || "Unable to sign in."
        );
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        setError(
          "Your account profile could not be verified. Contact an administrator."
        );

        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();

        setError(
          "Your account is inactive. Contact an administrator."
        );

        return;
      }

      if (profile.role !== portal) {
        await supabase.auth.signOut();

        const selectedPortal = portalOptions.find(
          (item) => item.value === portal
        );

        setError(
          `This account is not assigned to the ${
            selectedPortal?.label || "selected"
          } portal. Please select the correct portal.`
        );

        return;
      }

      if (profile.role === "super_admin") {
        router.replace("/super-admin");
      } else if (profile.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "A connection error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* Left branding panel */}
        <section className="flex min-h-[300px] flex-1 items-center justify-center bg-[var(--primary)] px-6 py-12 text-white lg:min-h-screen lg:px-12">
          <div className="w-full max-w-lg">

            {/* Logo */}
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                <svg
                  viewBox="0 0 64 64"
                  className="h-9 w-9"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="29"
                    stroke="var(--primary)"
                    strokeWidth="4"
                  />

                  <path
                    d="M18 39C25 38 31 32 32 21"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  <path
                    d="M32 21C41 21 47 27 47 36C47 45 40 50 31 50"
                    stroke="var(--primary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />

                  <path
                    d="M32 29C38 29 42 33 42 39"
                    stroke="var(--secondary)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-xl font-bold">
                  AgriOrbit
                </p>

                <p className="text-xs text-green-100">
                  Agricultural Data Platform
                </p>
              </div>
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-100">
              Farmer &amp; Field Data Collection
            </p>

            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Structured agricultural data collection made simple.
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-6 text-green-50 sm:text-base">
              Collect reliable farmer, field, survey, photo,
              and agricultural data through one structured
              platform.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <p className="text-lg font-bold">
                  Farmers
                </p>
                <p className="mt-1 text-xs text-green-100">
                  Farmer records
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <p className="text-lg font-bold">
                  Fields
                </p>
                <p className="mt-1 text-xs text-green-100">
                  Field information
                </p>
              </div>

              <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                <p className="text-lg font-bold">
                  Surveys
                </p>
                <p className="mt-1 text-xs text-green-100">
                  Structured surveys
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Login panel */}
        <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">

            <div className="mb-8">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <LockKeyhole
                  size={23}
                  strokeWidth={2}
                />
              </div>

              <h2 className="text-2xl font-bold text-[var(--text)] sm:text-3xl">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Choose your portal and sign in to AgriOrbit.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >

              {/* Portal */}
              <fieldset>
                <legend className="mb-2.5 text-sm font-semibold text-[var(--text)]">
                  Select your portal
                </legend>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {portalOptions.map((option) => {
                    const Icon = option.icon;
                    const selected =
                      portal === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setPortal(option.value);
                          setError("");
                        }}
                        className={`rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--light-green)] shadow-sm"
                            : "border-[var(--border)] bg-white hover:border-[var(--primary)] hover:bg-[var(--light-green)]/40"
                        }`}
                      >
                        <div
                          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-white text-[var(--primary)]"
                              : "bg-slate-100 text-[var(--muted)]"
                          }`}
                        >
                          <Icon size={18} />
                        </div>

                        <span className="block text-sm font-bold text-[var(--text)]">
                          {option.label}
                        </span>

                        <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[var(--text)]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-4 text-[15px] text-[var(--text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--light-green)]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[var(--text)]"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={19}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    className="h-12 w-full rounded-xl border border-[var(--border)] bg-white pl-11 pr-12 text-[15px] text-[var(--text)] outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--light-green)]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--light-green)] hover:text-[var(--primary)]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
                >
                  {error}
                </div>
              )}

              {/* Login */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-[15px] font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-[var(--muted)]">
                Use the portal assigned to your AgriOrbit
                account.
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}