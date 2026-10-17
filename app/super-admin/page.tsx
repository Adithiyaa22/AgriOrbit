import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

export default async function SuperAdminDashboardPage() {
  const { profile } = await requireRole("super_admin");

  let totalAdmins = 0;
  let activeAdmins = 0;
  let inactiveAdmins = 0;
  let countLoadFailed = false;

  try {
    const adminClient = createAdminClient();

    const { data: admins, error } = await adminClient
      .from("profiles")
      .select("is_active")
      .eq("role", "admin");

    if (error) {
      console.error("Unable to load Admin account counts:", error);
      countLoadFailed = true;
    } else {
      totalAdmins = admins.length;
      activeAdmins = admins.filter((admin) => admin.is_active).length;
      inactiveAdmins = totalAdmins - activeAdmins;
    }
  } catch (error) {
    console.error("Unable to load Admin account counts:", error);
    countLoadFailed = true;
  }

  return (
    <AdminLayout
      role="super_admin"
      profile={{
        full_name: profile.full_name,
        employee_code: profile.employee_code,
        role: "super_admin",
      }}
    >
      <div className="space-y-8">
        <section>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
              <ShieldCheck className="h-6 w-6 text-[#2E7D32]" />
            </div>

            <div>
              <p className="text-sm font-medium text-[#2E7D32]">
                Super Admin
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
                System Administration
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Manage administrator accounts and system-level access.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">
              <Users className="h-5 w-5 text-[#2E7D32]" />
            </div>

            <p className="mt-5 text-sm font-medium text-[#64748B]">
              Admin Accounts
            </p>
            <p className="mt-1 text-3xl font-bold text-[#1E293B]">
              {countLoadFailed ? "—" : totalAdmins}
            </p>
            <p className="mt-1 text-xs text-[#64748B]">
              {countLoadFailed
                ? "Unable to load account count"
                : `${activeAdmins} active · ${inactiveAdmins} inactive`}
            </p>
          </div>

          <Link
            href="/super-admin/users"
            className="group rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C8E6C9] hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <UserPlus className="h-5 w-5 text-[#2E7D32]" />
              </div>
              <ArrowRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-1 group-hover:text-[#2E7D32]" />
            </div>

            <h2 className="mt-5 text-base font-semibold text-[#1E293B]">
              Admin Accounts
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Create and manage administrator accounts.
            </p>
          </Link>
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[#1E293B]">
            Access hierarchy
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">
            AgriOrbit uses a three-level account hierarchy.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#E2E8F0] p-4">
              <p className="text-sm font-semibold text-[#1E293B]">
                Super Admin
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                Creates and manages Admin accounts and has system-level access.
              </p>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] p-4">
              <p className="text-sm font-semibold text-[#1E293B]">
                Admin
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                Manages interns, surveys, farmers, fields and operational data.
              </p>
            </div>

            <div className="rounded-lg border border-[#E2E8F0] p-4">
              <p className="text-sm font-semibold text-[#1E293B]">
                Intern
              </p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">
                Collects and submits farmer and field survey information.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}