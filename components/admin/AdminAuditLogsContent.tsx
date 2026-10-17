
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { AuditLogRecord } from "@/app/admin/audit-logs/page";

type Props = {
  logs: AuditLogRecord[];
  role: "admin" | "super_admin";
  loadError: string | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleStyle(role: string | null) {
  switch (role) {
    case "super_admin":
      return "bg-purple-50 text-purple-700";
    case "admin":
      return "bg-blue-50 text-blue-700";
    case "intern":
      return "bg-green-50 text-green-700";
    case "system":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function AdminAuditLogsContent({
  logs,
  role,
  loadError,
}: Props) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const actions = useMemo(
    () =>
      Array.from(new Set(logs.map((log) => log.action)))
        .sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesSearch =
        !term ||
        [
          log.actor_name,
          log.actor_id,
          log.actor_role,
          log.action,
          log.entity_type,
          log.entity_id,
          log.description,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(term)
          );

      const matchesAction =
        actionFilter === "all" ||
        log.action === actionFilter;

      const matchesRole =
        roleFilter === "all" ||
        log.actor_role === roleFilter;

      return (
        matchesSearch &&
        matchesAction &&
        matchesRole
      );
    });
  }, [logs, search, actionFilter, roleFilter]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <p className="text-sm font-medium text-[#2E7D32]">
          System Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1E293B] sm:text-3xl">
          Audit Logs
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748B]">
          Review recorded activity, account changes,
          and administrative operations.
        </p>
      </section>

      {loadError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{loadError}</p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#64748B]">
              Records loaded
            </p>
            <Activity className="h-5 w-5 text-[#2E7D32]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1E293B]">
            {logs.length}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Latest records available to your role
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#64748B]">
              Action types
            </p>
            <ShieldCheck className="h-5 w-5 text-[#2E7D32]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1E293B]">
            {new Set(logs.map((log) => log.action)).size}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Distinct recorded action types
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#64748B]">
              Matching records
            </p>
            <Search className="h-5 w-5 text-[#2E7D32]" />
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1E293B]">
            {filteredLogs.length}
          </p>
          <p className="mt-1 text-xs text-[#64748B]">
            Results after applying filters
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search activity, user, or description..."
              aria-label="Search audit logs"
              className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-9 pr-3 text-sm text-[#1E293B] outline-none focus:border-[#2E7D32] focus:ring-2 focus:ring-[#E8F5E9]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
            aria-label="Filter by action"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none focus:border-[#2E7D32]"
          >
            <option value="all">All actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {formatLabel(action)}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
            aria-label="Filter by user role"
            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2.5 text-sm text-[#1E293B] outline-none focus:border-[#2E7D32]"
          >
            <option value="all">All actor roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="intern">Intern</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>

      {filteredLogs.length === 0 ? (
        <section className="rounded-xl border border-dashed border-[#CBD5E1] bg-white px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F5F9]">
            {loadError ? (
              <AlertCircle className="h-6 w-6 text-[#64748B]" />
            ) : (
              <Clock className="h-6 w-6 text-[#64748B]" />
            )}
          </div>

          <h2 className="mt-4 font-semibold text-[#1E293B]">
            {loadError
              ? "Records unavailable"
              : logs.length === 0
                ? "No audit records yet"
                : "No matching activity"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748B]">
            {loadError
              ? "The audit log query failed. Check server logs and database permissions."
              : logs.length === 0
                ? "Activity will appear here after administrative actions are connected to the audit logging helper."
                : "Try another search term or change the filters."}
          </p>
        </section>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs uppercase tracking-wide text-[#64748B]">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Activity</th>
                    <th className="px-5 py-4 font-semibold">Actor</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                    <th className="px-5 py-4 font-semibold">Entity</th>
                    <th className="px-5 py-4 font-semibold">Date and time</th>
                    <th className="px-5 py-4 font-semibold">Details</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0]">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="align-top hover:bg-[#FAFCFA]">
                      <td className="max-w-sm px-5 py-4">
                        <p className="font-medium text-[#1E293B]">
                          {log.description}
                        </p>
                        <p className="mt-1 break-all text-xs text-[#94A3B8]">
                          {log.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1E293B]">
                          {log.actor_name || "Unknown actor"}
                        </p>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleStyle(log.actor_role)}`}>
                          {formatLabel(log.actor_role || "unknown")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-[#475569]">
                        {formatLabel(log.action)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-[#475569]">
                          {formatLabel(log.entity_type)}
                        </p>
                        {log.entity_id && (
                          <p className="mt-1 max-w-40 break-all text-xs text-[#94A3B8]">
                            {log.entity_id}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-[#64748B]">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="px-5 py-4">
                        <details className="max-w-64">
                          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-[#2E7D32]">
                            View details
                            <ChevronDown className="h-4 w-4" />
                          </summary>
                          <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3 lg:hidden">
            {filteredLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F5E9]">
                    <Activity className="h-5 w-5 text-[#2E7D32]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-5 text-[#1E293B]">
                      {log.description}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {formatLabel(log.action)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[#94A3B8]">Actor</p>
                    <p className="mt-1 break-words font-medium text-[#1E293B]">
                      {log.actor_name || "Unknown actor"}
                    </p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleStyle(log.actor_role)}`}>
                      {formatLabel(log.actor_role || "unknown")}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[#94A3B8]">Entity</p>
                    <p className="mt-1 break-words font-medium text-[#1E293B]">
                      {formatLabel(log.entity_type)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-[#64748B]">
                  {formatDate(log.created_at)}
                </p>

                {log.entity_id && (
                  <p className="mt-2 break-all text-xs text-[#94A3B8]">
                    Entity ID: {log.entity_id}
                  </p>
                )}

                <details className="mt-4 border-t border-[#E2E8F0] pt-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-[#2E7D32]">
                    View metadata
                    <ChevronDown className="h-4 w-4" />
                  </summary>
                  <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#F8FAFC] p-3 text-xs text-[#475569]">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </details>
              </article>
            ))}
          </div>
        </>
      )}

      <p className="flex items-center gap-2 text-xs text-[#64748B]">
        <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />
        {role === "super_admin"
          ? "Showing up to 200 recent system-wide audit records."
          : "Showing up to 200 recent operational audit records."}
      </p>
    </div>
  );
}
