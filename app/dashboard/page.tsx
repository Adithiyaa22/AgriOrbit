import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import {
  ClipboardList,
  FileText,
  MapPin,
  Plus,
  Sprout,
  Users,
  Loader2,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";

type Farmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  village: string | null;
  district: string | null;
};

type Field = {
  id: string;
  field_code: string;
  field_name: string | null;
};

type Survey = {
  id: string;
  survey_code: string;
  farmer_id: string;
  field_id: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
};

type RecentSurvey = Survey & {
  farmer: Farmer | null;
  field: Field | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const { user, profile } = await requireRole("intern");
  const supabase = await createClient();

  // ---------------------------------
  // Load dashboard data
  // ---------------------------------

  const [
    farmersResult,
    fieldsResult,
    submittedSurveysResult,
    draftSurveysResult,
    recentSurveysResult,
  ] = await Promise.all([
    // Total farmers
    supabase
      .from("farmers")
      .select("id", { count: "exact", head: true }),

    // Total fields
    supabase
      .from("fields")
      .select("id", { count: "exact", head: true }),

    // Submitted surveys created by this intern
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("enumerator_id", user.id)
      .eq("status", "submitted"),

    // Draft surveys created by this intern
    supabase
      .from("surveys")
      .select("id", { count: "exact", head: true })
      .eq("enumerator_id", user.id)
      .eq("status", "draft"),

    // Recent surveys
    supabase
      .from("surveys")
      .select(
        "id, survey_code, farmer_id, field_id, status, submitted_at, created_at"
      )
      .eq("enumerator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const dashboardError =
    farmersResult.error ||
    fieldsResult.error ||
    submittedSurveysResult.error ||
    draftSurveysResult.error ||
    recentSurveysResult.error;

  // ---------------------------------
  // Get related farmer + field records
  // ---------------------------------

  let recentSurveys: RecentSurvey[] = [];

  if (!dashboardError && recentSurveysResult.data) {
    const farmerIds = Array.from(
      new Set(
        recentSurveysResult.data
          .map((survey) => survey.farmer_id)
          .filter(Boolean)
      )
    );

    const fieldIds = Array.from(
      new Set(
        recentSurveysResult.data
          .map((survey) => survey.field_id)
          .filter(Boolean)
      )
    );

    const [farmerResult, fieldResult] = await Promise.all([
      farmerIds.length
        ? supabase
            .from("farmers")
            .select(
              "id, farmer_code, full_name, village, district"
            )
            .in("id", farmerIds)
        : Promise.resolve({
            data: [] as Farmer[],
            error: null,
          }),

      fieldIds.length
        ? supabase
            .from("fields")
            .select(
              "id, field_code, field_name"
            )
            .in("id", fieldIds)
        : Promise.resolve({
            data: [] as Field[],
            error: null,
          }),
    ]);

    const farmerMap: Record<string, Farmer> = {};

    (farmerResult.data ?? []).forEach((farmer) => {
      farmerMap[farmer.id] = farmer;
    });

    const fieldMap: Record<string, Field> = {};

    (fieldResult.data ?? []).forEach((field) => {
      fieldMap[field.id] = field;
    });

    recentSurveys = recentSurveysResult.data.map(
      (survey) => ({
        ...survey,
        farmer: farmerMap[survey.farmer_id] ?? null,
        field: fieldMap[survey.field_id] ?? null,
      })
    );
  }

  // ---------------------------------
  // Dashboard statistics
  // ---------------------------------

  const stats = [
    {
      label: "Farmers",
      value: farmersResult.count ?? 0,
      icon: Users,
      href: "/farmers",
    },
    {
      label: "Fields",
      value: fieldsResult.count ?? 0,
      icon: Sprout,
      href: "/fields",
    },
    {
      label: "Submitted Surveys",
      value: submittedSurveysResult.count ?? 0,
      icon: ClipboardList,
      href: "/surveys",
    },
    {
      label: "Draft Surveys",
      value: draftSurveysResult.count ?? 0,
      icon: FileText,
      href: "/drafts",
    },
  ];

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* ---------------------------------
              Welcome
          --------------------------------- */}

          <section className="mb-6">
            <p className="text-sm font-medium text-[var(--primary)]">
              Intern Dashboard
            </p>

            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome back
              {profile.full_name
                ? `, ${profile.full_name}`
                : ""}
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Manage farmers, fields, surveys, and field
              data collection from one place.
            </p>
          </section>

          {/* ---------------------------------
              New Survey CTA
          --------------------------------- */}

          <section className="mb-6 rounded-2xl bg-[var(--primary)] p-5 text-white sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Start a new field survey
                </h2>

                <p className="mt-1 max-w-xl text-sm text-green-50">
                  Select an existing farmer and field,
                  then begin collecting field information.
                </p>
              </div>

              <Link
                href="/surveys/new"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[var(--primary)] transition hover:bg-green-50 sm:w-auto"
              >
                <Plus size={18} />
                New Survey
              </Link>
            </div>
          </section>

          {/* ---------------------------------
              Statistics
          --------------------------------- */}

          <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm transition hover:border-[var(--primary)] hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[var(--muted)] sm:text-sm">
                        {stat.label}
                      </p>

                      <p className="mt-2 text-2xl font-bold sm:text-3xl">
                        {stat.value}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                      <Icon size={19} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </section>

          {/* ---------------------------------
              Main Content
          --------------------------------- */}

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

            {/* ---------------------------------
                Recent Surveys
            --------------------------------- */}

            <div className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                <div>
                  <h2 className="font-semibold">
                    Recent surveys
                  </h2>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Your latest survey activity
                  </p>
                </div>

                <Link
                  href="/surveys"
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  View all
                </Link>
              </div>

              {dashboardError ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-medium text-red-600">
                    Unable to load dashboard data.
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Please refresh the page and try again.
                  </p>
                </div>
              ) : recentSurveys.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)] text-[var(--primary)]">
                    <ClipboardList size={20} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold">
                    No surveys yet
                  </h3>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Start your first survey to see activity
                    here.
                  </p>

                  <Link
                    href="/surveys/new"
                    className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--primary)] px-4 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    <Plus size={16} />
                    Start Survey
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {recentSurveys.map((survey) => {
                    const isSubmitted =
                      survey.status === "submitted";

                    return (
                      <Link
                        key={survey.id}
                        href={`/surveys/${survey.id}/a`}
                        className="block transition hover:bg-[var(--light-green)]"
                      >
                        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              {survey.farmer?.full_name ??
                                "Unknown farmer"}
                            </p>

                            <p className="mt-1 truncate text-xs text-[var(--muted)]">
                              {survey.field?.field_name ??
                                survey.field?.field_code ??
                                "Unknown field"}{" "}
                              · {survey.survey_code}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4 sm:justify-end">

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                isSubmitted
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isSubmitted
                                ? "Submitted"
                                : "Draft"}
                            </span>

                            <span className="text-xs text-[var(--muted)]">
                              {formatDate(
                                isSubmitted
                                  ? survey.submitted_at
                                  : survey.created_at
                              )}
                            </span>

                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ---------------------------------
                Quick Actions
            --------------------------------- */}

            <div className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">

              <h2 className="font-semibold">
                Quick actions
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Common field collection tasks
              </p>

              <div className="mt-5 space-y-3">

                {/* Add Farmer */}

                <Link
                  href="/farmers/new"
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-left transition hover:bg-[var(--light-green)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <Plus size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Add Farmer
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      Register a new farmer
                    </p>
                  </div>
                </Link>

                {/* Add Field */}

                <Link
                  href="/fields/new"
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-left transition hover:bg-[var(--light-green)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <MapPin size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Add Field
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      Register a farmer&apos;s field
                    </p>
                  </div>
                </Link>

                {/* New Survey */}

                <Link
                  href="/surveys/new"
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-left transition hover:bg-[var(--light-green)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <ClipboardList size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      New Survey
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      Start a new field survey
                    </p>
                  </div>
                </Link>

                {/* Draft Surveys */}

                <Link
                  href="/drafts"
                  className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] p-3 text-left transition hover:bg-[var(--light-green)]"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--light-green)] text-[var(--primary)]">
                    <FileText size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Draft Surveys
                    </p>

                    <p className="text-xs text-[var(--muted)]">
                      Continue incomplete surveys
                    </p>
                  </div>
                </Link>

              </div>
            </div>

          </section>

        </div>
      </main>
    </InternLayout>
  );
}