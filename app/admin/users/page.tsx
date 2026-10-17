import { requireRole } from "@/lib/auth/require-role";
import AdminLayout from "@/components/layout/AdminLayout";
import CreateInternButton from "@/components/admin/CreateInternButton";
import InternAccountActions from "@/components/admin/InternAccountActions";
import {
  UserRound,
  Mail,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { getInternAccounts } from "./actions";

export default async function AdminUsersPage() {
  const { profile } = await requireRole(
    "admin",
    "super_admin"
  );

  const result = await getInternAccounts();

  const interns = result.success
    ? result.interns
    : [];

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#2E7D32]">
                System Management
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
                Users & Roles
              </h1>

              <p className="mt-1 text-sm text-[#64748B]">
                Manage Intern accounts and their
                access status.
              </p>
            </div>

            <CreateInternButton />
          </div>
        </section>

        {!result.success && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <p className="text-sm font-medium text-red-700">
              Unable to load Intern accounts.
            </p>

            <p className="mt-1 text-sm text-red-600">
              {result.message}
            </p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <UserRound className="h-5 w-5 text-[#2E7D32]" />
              </div>

              <div>
                <p className="text-sm text-[#64748B]">
                  Total Interns
                </p>

                <p className="text-2xl font-bold text-[#1E293B]">
                  {interns.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-[#64748B]">
                  Active Interns
                </p>

                <p className="text-2xl font-bold text-[#1E293B]">
                  {
                    interns.filter(
                      (intern) => intern.is_active
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <UserX className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <p className="text-sm text-[#64748B]">
                  Inactive Interns
                </p>

                <p className="text-2xl font-bold text-[#1E293B]">
                  {
                    interns.filter(
                      (intern) => !intern.is_active
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#1E293B]">
                Intern Accounts
              </h2>

              <p className="mt-1 text-sm text-[#64748B]">
                Field enumerator accounts created by
                Admins.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E8F5E9] px-3 py-1.5 text-xs font-medium text-[#2E7D32]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Intern role
            </div>
          </div>

          {interns.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9]">
                <UserRound className="h-7 w-7 text-[#2E7D32]" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-[#1E293B]">
                No Intern accounts yet
              </h3>

              <p className="mt-1 max-w-sm text-sm text-[#64748B]">
                Create an Intern account to allow a
                field enumerator to sign in and
                collect survey data.
              </p>

              <div className="mt-5">
                <CreateInternButton />
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Intern
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Employee Code
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Email
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Created
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E2E8F0]">
                    {interns.map((intern) => (
                      <tr
                        key={intern.id}
                        className="transition-colors hover:bg-[#F8FAFC]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
                              <UserRound className="h-5 w-5 text-[#2E7D32]" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[#1E293B]">
                                {intern.full_name ||
                                  "Unnamed Intern"}
                              </p>

                              <p className="text-xs text-[#64748B]">
                                Intern
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-[#334155]">
                          {intern.employee_code ||
                            "—"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-[#475569]">
                            <Mail className="h-4 w-4 text-[#94A3B8]" />
                            {intern.email || "—"}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          {intern.is_active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                              Inactive
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-[#64748B]">
                          {new Date(
                            intern.created_at
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <InternAccountActions
                            internId={intern.id}
                            isActive={
                              intern.is_active
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-[#E2E8F0] md:hidden">
                {interns.map((intern) => (
                  <div
                    key={intern.id}
                    className="space-y-4 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9]">
                          <UserRound className="h-5 w-5 text-[#2E7D32]" />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-[#1E293B]">
                            {intern.full_name ||
                              "Unnamed Intern"}
                          </p>

                          <p className="text-xs text-[#64748B]">
                            {intern.employee_code ||
                              "No employee code"}
                          </p>
                        </div>
                      </div>

                      {intern.is_active ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 rounded-lg bg-[#F8FAFC] p-4">
                      <div className="flex items-center gap-2 text-sm text-[#475569]">
                        <Mail className="h-4 w-4 shrink-0 text-[#94A3B8]" />

                        <span className="break-all">
                          {intern.email || "No email"}
                        </span>
                      </div>

                      <div className="text-xs text-[#64748B]">
                        Created{" "}
                        {new Date(
                          intern.created_at
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </div>

                      <div className="border-t border-[#E2E8F0] pt-3">
                        <InternAccountActions
                          internId={intern.id}
                          isActive={
                            intern.is_active
                          }
                        />
                      </div>
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