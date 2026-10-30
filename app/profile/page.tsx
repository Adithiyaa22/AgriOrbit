import Link from "next/link";
import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  CalendarDays,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUser();

  const supabaseCreatedAt = user.created_at
    ? new Date(user.created_at)
    : null;

  const createdDate =
    supabaseCreatedAt &&
    !Number.isNaN(supabaseCreatedAt.getTime())
      ? supabaseCreatedAt.toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Not available";

  const initials = (profile.full_name || "Field Intern")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <InternLayout>
      <main className="agri-profile-scene min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <section className="mb-6">
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </Link>

            <div>
              <p className="text-sm font-medium text-[var(--primary)]">
                Account
              </p>

              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                My Profile
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                View your AgriOrbit account information and access settings.
              </p>
            </div>
          </section>

          {/* Profile Summary */}
          <section className="agri-3d-card mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Profile
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--light-green)] text-lg font-bold text-[var(--primary)]">
                  {initials || "FI"}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold">
                    {profile.full_name || "Field Intern"}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {profile.employee_code || "No employee ID"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--light-green)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                      <BadgeCheck size={14} />
                      Active account
                    </span>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">
                      <ShieldCheck size={14} />
                      {profile.role.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section className="agri-3d-card mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Account Information
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Information associated with your AgriOrbit account.
              </p>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              {/* Full Name */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <UserRound size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Full Name
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold">
                  {profile.full_name || "Not provided"}
                </p>
              </div>

              {/* Employee Code */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <BadgeCheck size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Employee Code
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold">
                  {profile.employee_code || "Not provided"}
                </p>
              </div>

              {/* Email */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <AtSign size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Email Address
                  </p>
                </div>

                <p className="mt-3 break-all text-sm font-semibold">
                  {user.email || "Not available"}
                </p>
              </div>

              {/* Role */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <ShieldCheck size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Account Role
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold capitalize">
                  {profile.role.replace("_", " ")}
                </p>
              </div>

              {/* Account Status */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <BadgeCheck size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Account Status
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold text-green-700">
                  {profile.is_active ? "Active" : "Inactive"}
                </p>
              </div>

              {/* Joined Date */}
              <div className="agri-3d-card rounded-lg border border-[var(--border)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <CalendarDays size={17} />

                  <p className="text-xs font-semibold uppercase tracking-wide">
                    Account Created
                  </p>
                </div>

                <p className="mt-3 text-base font-semibold">
                  {createdDate}
                </p>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="agri-3d-card mb-6 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Security
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Manage your account password securely.
              </p>
            </div>

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                  <KeyRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Password
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                    If you need to change your password, use the secure
                    password reset page.
                  </p>
                </div>
              </div>

              <Link
                href="/forgot-password"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-semibold transition hover:bg-slate-50"
              >
                Reset Password
              </Link>
            </div>
          </section>

          {/* Account Notice */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm font-semibold text-blue-900">
              Profile information
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Your account details are managed through the AgriOrbit
              administration system. Contact your administrator if your
              employee information needs to be changed.
            </p>
          </div>
        </div>
      </main>
    </InternLayout>
  );
}