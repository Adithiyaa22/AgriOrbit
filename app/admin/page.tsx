import { requireRole } from "@/lib/auth/require-role";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  ClipboardList,
  FileText,
  Map,
  Users,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(
    "admin",
    "super_admin"
  );

  const supabase = await createClient();

  const [
    farmersResult,
    fieldsResult,
    surveysResult,
    draftSurveysResult,
  ] = await Promise.all([
    supabase
      .from("farmers")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("fields")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("surveys")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),

    supabase
      .from("surveys")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
  ]);

  const stats = [
    {
      title: "Farmers",
      value: farmersResult.count ?? 0,
      description: "Registered farmers",
      icon: Users,
      href: "/admin/farmers",
    },
    {
      title: "Fields",
      value: fieldsResult.count ?? 0,
      description: "Registered fields",
      icon: Map,
      href: "/admin/fields",
    },
    {
      title: "Surveys",
      value: surveysResult.count ?? 0,
      description: "Collected surveys",
      icon: ClipboardList,
      href: "/admin/surveys",
    },
    {
      title: "Draft Surveys",
      value: draftSurveysResult.count ?? 0,
      description: "Surveys awaiting submission",
      icon: FileText,
      href: "/admin/surveys",
    },
  ];

  return (
    <AdminLayout
      role={profile.role as "admin" | "super_admin"}
      profile={{
        full_name: profile.full_name,
        employee_code: profile.employee_code,
        role: profile.role as
          | "admin"
          | "super_admin",
      }}
    >
      <div className="space-y-8">
        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#2E7D32]">
                {profile.role === "super_admin"
                  ? "Super Admin"
                  : "Admin"}
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-[#64748B]">
                Overview of your AgriOrbit data
                collection system.
              </p>
            </div>

            {profile.role === "super_admin" && (
              <Link
                href="/super-admin/users"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256628]"
              >
                <ShieldCheck className="h-4 w-4" />
                Manage Admins
              </Link>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                key={stat.title}
                href={stat.href}
                className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#C8E6C9] hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">
                    <Icon className="h-5 w-5 text-[#2E7D32]" />
                  </div>

                  <ArrowRight className="h-4 w-4 text-[#94A3B8] transition-transform group-hover:translate-x-1 group-hover:text-[#2E7D32]" />
                </div>

                <p className="mt-5 text-sm font-medium text-[#64748B]">
                  {stat.title}
                </p>

                <p className="mt-1 text-3xl font-bold text-[#1E293B]">
                  {stat.value}
                </p>

                <p className="mt-1 text-xs text-[#64748B]">
                  {stat.description}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  Survey Management
                </h2>

                <p className="mt-1 text-sm text-[#64748B]">
                  Manage collected surveys and
                  survey configuration.
                </p>
              </div>

              <ClipboardList className="h-5 w-5 text-[#2E7D32]" />
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/admin/surveys"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4 transition-colors hover:bg-[#F8FAFC]"
              >
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    View Surveys
                  </p>

                  <p className="mt-1 text-xs text-[#64748B]">
                    Review submitted survey data
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-[#64748B]" />
              </Link>

              <Link
                href="/admin/survey-builder"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4 transition-colors hover:bg-[#F8FAFC]"
              >
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Survey Builder
                  </p>

                  <p className="mt-1 text-xs text-[#64748B]">
                    Configure survey questions and
                    sections
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-[#64748B]" />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#1E293B]">
                  System Management
                </h2>

                <p className="mt-1 text-sm text-[#64748B]">
                  Manage users and system activity.
                </p>
              </div>

              <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4 transition-colors hover:bg-[#F8FAFC]"
              >
                <div>
                  <p className="text-sm font-medium text-[#1E293B]">
                    Users & Roles
                  </p>

                  <p className="mt-1 text-xs text-[#64748B]">
                    Manage intern accounts and
                    permissions
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-[#64748B]" />
              </Link>

              {profile.role === "super_admin" && (
                <Link
                  href="/super-admin/users"
                  className="flex items-center justify-between rounded-lg border border-[#E2E8F0] p-4 transition-colors hover:bg-[#F8FAFC]"
                >
                  <div>
                    <p className="text-sm font-medium text-[#1E293B]">
                      Admin Accounts
                    </p>

                    <p className="mt-1 text-xs text-[#64748B]">
                      Create and manage admin
                      accounts
                    </p>
                  </div>

                  <ArrowRight className="h-4 w-4 text-[#64748B]" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}