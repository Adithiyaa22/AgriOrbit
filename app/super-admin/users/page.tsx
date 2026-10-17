import { requireRole } from "@/lib/auth/require-role";
import AdminLayout from "@/components/layout/AdminLayout";
import CreateAdminButton from "@/components/admin/CreateAdminButton";
import AdminAccountActions from "@/components/admin/AdminAccountActions";
import {
  ArrowLeft,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { getAdminAccounts } from "./actions";

export default async function SuperAdminUsersPage() {
  const { profile } =
    await requireRole("super_admin");

  const result = await getAdminAccounts();

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
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/super-admin"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#2E7D32]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Super Admin
            </Link>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <Users className="h-6 w-6 text-[#2E7D32]" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
                  Admin Accounts
                </h1>

                <p className="mt-1 text-sm text-[#64748B]">
                  Create and manage AgriOrbit administrator
                  accounts.
                </p>
              </div>
            </div>
          </div>

          <CreateAdminButton />
        </section>

        <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 rounded-lg bg-[#F8FAFC] p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#2E7D32]" />

            <div>
              <p className="text-sm font-semibold text-[#1E293B]">
                Administrator access
              </p>

              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Only Super Admins can create or manage
                administrator accounts. Administrators can
                create Intern accounts but cannot create other
                Administrator accounts.
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
            <div>
              <h2 className="text-base font-semibold text-[#1E293B]">
                Administrators
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                {result.success
                  ? `${result.admins.length} administrator${
                      result.admins.length === 1
                        ? ""
                        : "s"
                    }`
                  : "Unable to load administrator accounts"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5E9]">
              <Users className="h-5 w-5 text-[#2E7D32]" />
            </div>
          </div>

          {!result.success ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-red-600">
                {result.message}
              </p>

              <p className="mt-1 text-xs text-[#64748B]">
                Please refresh the page and try again.
              </p>
            </div>
          ) : result.admins.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
                <Users className="h-6 w-6 text-[#94A3B8]" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-[#1E293B]">
                No administrator accounts
              </h3>

              <p className="mt-1 max-w-md text-sm text-[#64748B]">
                Create the first Admin account using the
                button above.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-left">
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Administrator
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Employee Code
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Email
                      </th>

                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Status
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b border-[#E2E8F0] last:border-b-0"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-[#1E293B]">
                            {admin.full_name ||
                              "Unnamed Admin"}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm text-[#64748B]">
                          {admin.employee_code ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm text-[#64748B]">
                          {admin.email || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              admin.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {admin.is_active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-end">
                            <AdminAccountActions
                              adminId={admin.id}
                              isActive={
                                admin.is_active
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#E2E8F0] md:hidden">
                {result.admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B]">
                          {admin.full_name ||
                            "Unnamed Admin"}
                        </p>

                        <p className="mt-1 text-xs text-[#64748B]">
                          {admin.employee_code ||
                            "No employee code"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          admin.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {admin.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-[#64748B]">
                        Email
                      </p>

                      <p className="mt-1 break-all text-sm text-[#1E293B]">
                        {admin.email || "—"}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <AdminAccountActions
                        adminId={admin.id}
                        isActive={admin.is_active}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}