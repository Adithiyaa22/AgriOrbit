"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ClipboardList,
  MapPin,
  CalendarDays,
  User,
  Map,
  CheckCircle2,
  Clock3,
  FileEdit,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Survey = {
  id: string;
  survey_code: string;
  farmer_id: string;
  field_id: string;
  enumerator_id: string;
  survey_version: number;
  visit_date: string | null;
  visit_time: string | null;
  gps_captured: boolean | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  internet_available: boolean | null;
  information_provider: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
};

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

type Enumerator = {
  id: string;
  full_name: string | null;
  employee_code: string | null;
};

type SurveyRow = Survey & {
  farmer: Farmer | null;
  field: Field | null;
  enumerator: Enumerator | null;
};

export default function AdminSurveysContent() {
  const [surveys, setSurveys] = useState<SurveyRow[]>(
    []
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSurveys() {
      setLoading(true);
      setError("");

      try {
        const {
          data: surveyData,
          error: surveyError,
        } = await supabase
          .from("surveys")
          .select(
            `
              id,
              survey_code,
              farmer_id,
              field_id,
              enumerator_id,
              survey_version,
              visit_date,
              visit_time,
              gps_captured,
              gps_latitude,
              gps_longitude,
              internet_available,
              information_provider,
              status,
              submitted_at,
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (surveyError) {
          throw surveyError;
        }

        const farmerIds = Array.from(
          new Set(
            (surveyData || []).map(
              (survey) => survey.farmer_id
            )
          )
        );

        const fieldIds = Array.from(
          new Set(
            (surveyData || []).map(
              (survey) => survey.field_id
            )
          )
        );

        const enumeratorIds = Array.from(
          new Set(
            (surveyData || []).map(
              (survey) => survey.enumerator_id
            )
          )
        );

        const [
          farmerResult,
          fieldResult,
          enumeratorResult,
        ] = await Promise.all([
          farmerIds.length > 0
            ? supabase
                .from("farmers")
                .select(
                  "id, farmer_code, full_name, village, district"
                )
                .in("id", farmerIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),

          fieldIds.length > 0
            ? supabase
                .from("fields")
                .select(
                  "id, field_code, field_name"
                )
                .in("id", fieldIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),

          enumeratorIds.length > 0
            ? supabase
                .from("profiles")
                .select(
                  "id, full_name, employee_code"
                )
                .in("id", enumeratorIds)
            : Promise.resolve({
                data: [],
                error: null,
              }),
        ]);

        if (farmerResult.error) {
          throw farmerResult.error;
        }

        if (fieldResult.error) {
          throw fieldResult.error;
        }

        if (enumeratorResult.error) {
          throw enumeratorResult.error;
        }

        const farmerMap: Record<string, Farmer> =
          {};

        (farmerResult.data || []).forEach(
          (farmer) => {
            farmerMap[farmer.id] = farmer;
          }
        );

        const fieldMap: Record<string, Field> = {};

        (fieldResult.data || []).forEach((field) => {
          fieldMap[field.id] = field;
        });

        const enumeratorMap: Record<
          string,
          Enumerator
        > = {};

        (enumeratorResult.data || []).forEach(
          (enumerator) => {
            enumeratorMap[enumerator.id] =
              enumerator;
          }
        );

        const rows: SurveyRow[] = (
          surveyData || []
        ).map((survey) => ({
          ...survey,
          farmer:
            farmerMap[survey.farmer_id] || null,
          field:
            fieldMap[survey.field_id] || null,
          enumerator:
            enumeratorMap[
              survey.enumerator_id
            ] || null,
        }));

        setSurveys(rows);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load surveys."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSurveys();
  }, []);

  const filteredSurveys = useMemo(() => {
    const query = search.trim().toLowerCase();

    return surveys.filter((survey) => {
      const matchesSearch =
        !query ||
        [
          survey.survey_code,
          survey.status,
          survey.farmer?.farmer_code,
          survey.farmer?.full_name,
          survey.farmer?.village,
          survey.farmer?.district,
          survey.field?.field_code,
          survey.field?.field_name,
          survey.enumerator?.full_name,
          survey.enumerator?.employee_code,
        ].some((value) =>
          value
            ?.toString()
            .toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === "all" ||
        survey.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [surveys, search, statusFilter]);

  const submittedCount = surveys.filter(
    (survey) => survey.status === "submitted"
  ).length;

  const draftCount = surveys.filter(
    (survey) => survey.status === "draft"
  ).length;

  const gpsCount = surveys.filter(
    (survey) => survey.gps_captured
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-green-600">
            Survey Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Surveys
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            View survey records submitted by field
            enumerators.
          </p>
        </div>

        <div className="flex w-fit items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <ClipboardList className="h-5 w-5 text-green-700" />
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500">
              Total Surveys
            </p>

            <p className="text-xl font-bold text-slate-900">
              {surveys.length}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Total
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {surveys.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Submitted
          </p>

          <p className="mt-1 text-2xl font-bold text-green-600">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            Drafts
          </p>

          <p className="mt-1 text-2xl font-bold text-amber-600">
            {draftCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">
            GPS Captured
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {gpsCount}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search survey, farmer, field or enumerator..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          >
            <option value="all">
              All Statuses
            </option>
            <option value="submitted">
              Submitted
            </option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {(search || statusFilter !== "all") && (
          <p className="mt-3 text-xs text-slate-500">
            Showing {filteredSurveys.length} of{" "}
            {surveys.length} surveys
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-7 w-7 animate-spin text-green-600" />

            <p className="text-sm">
              Loading surveys...
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load surveys
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading &&
        !error &&
        filteredSurveys.length === 0 && (
          <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-slate-200 bg-white">
            <div className="px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>

              <h2 className="mt-4 text-base font-semibold text-slate-900">
                {surveys.length === 0
                  ? "No surveys found"
                  : "No matching surveys"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {surveys.length === 0
                  ? "Survey records will appear here after surveys are created."
                  : "Try changing your search or status filter."}
              </p>
            </div>
          </div>
        )}

      {/* Desktop Table */}
      {!loading &&
        !error &&
        filteredSurveys.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Survey
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Farmer
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Field
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Enumerator
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Visit
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      GPS
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSurveys.map((survey) => (
                    <tr
                      key={survey.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      {/* Survey */}
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {survey.survey_code}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Version{" "}
                          {survey.survey_version}
                        </p>
                      </td>

                      {/* Farmer */}
                      <td className="px-5 py-4">
                        {survey.farmer ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                survey.farmer
                                  .full_name
                              }
                            </p>

                            <p className="mt-1 text-xs text-green-700">
                              {
                                survey.farmer
                                  .farmer_code
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {[
                                survey.farmer
                                  .village,
                                survey.farmer
                                  .district,
                              ]
                                .filter(Boolean)
                                .join(
                                  ", "
                                ) || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Farmer unavailable
                          </span>
                        )}
                      </td>

                      {/* Field */}
                      <td className="px-5 py-4">
                        {survey.field ? (
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                survey.field
                                  .field_name ||
                                "Unnamed Field"
                              }
                            </p>

                            <p className="mt-1 text-xs text-green-700">
                              {
                                survey.field
                                  .field_code
                              }
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Field unavailable
                          </span>
                        )}
                      </td>

                      {/* Enumerator */}
                      <td className="px-5 py-4">
                        {survey.enumerator ? (
                          <div className="flex items-start gap-2">
                            <User className="mt-0.5 h-4 w-4 text-slate-400" />

                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {survey
                                  .enumerator
                                  .full_name ||
                                  "Unnamed"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {survey
                                  .enumerator
                                  .employee_code ||
                                  "No ID"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            Enumerator unavailable
                          </span>
                        )}
                      </td>

                      {/* Visit */}
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                          <div>
                            <p className="text-sm text-slate-700">
                              {survey.visit_date
                                ? new Date(
                                    `${survey.visit_date}T00:00:00`
                                  ).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )
                                : "—"}
                            </p>

                            {survey.visit_time && (
                              <p className="mt-1 text-xs text-slate-500">
                                {new Date(
                                  survey.visit_time
                                ).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* GPS */}
                      <td className="px-5 py-4 text-center">
                        {survey.gps_captured ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <MapPin className="h-3.5 w-3.5" />
                            Captured
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            Not captured
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        {survey.status ===
                        "submitted" ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold capitalize text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">
                            <FileEdit className="h-3.5 w-3.5" />
                            {survey.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Mobile / Tablet Cards */}
      {!loading &&
        !error &&
        filteredSurveys.length > 0 && (
          <div className="grid gap-4 lg:hidden">
            {filteredSurveys.map((survey) => (
              <div
                key={survey.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {survey.survey_code}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Version{" "}
                      {survey.survey_version}
                    </p>
                  </div>

                  {survey.status ===
                  "submitted" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Submitted
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">
                      <Clock3 className="h-3.5 w-3.5" />
                      {survey.status}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-4">
                  {/* Farmer */}
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Farmer
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {survey.farmer?.full_name ||
                          "Farmer unavailable"}
                      </p>

                      {survey.farmer && (
                        <p className="text-xs text-green-700">
                          {
                            survey.farmer
                              .farmer_code
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Field */}
                  <div className="flex items-start gap-2">
                    <Map className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Field
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {survey.field?.field_name ||
                          "Unnamed Field"}
                      </p>

                      {survey.field && (
                        <p className="text-xs text-green-700">
                          {
                            survey.field
                              .field_code
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Enumerator */}
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Enumerator
                      </p>

                      <p className="text-sm font-medium text-slate-700">
                        {survey.enumerator
                          ?.full_name ||
                          "Unavailable"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {survey.enumerator
                          ?.employee_code ||
                          "No ID"}
                      </p>
                    </div>
                  </div>

                  {/* Visit */}
                  <div className="flex items-start gap-2">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">
                        Visit Date
                      </p>

                      <p className="text-sm text-slate-700">
                        {survey.visit_date
                          ? new Date(
                              `${survey.visit_date}T00:00:00`
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : "Not provided"}
                      </p>
                    </div>
                  </div>

                  {/* GPS */}
                  <div>
                    <p className="text-xs text-slate-500">
                      GPS
                    </p>

                    <p className="mt-1 text-sm text-slate-700">
                      {survey.gps_captured
                        ? `${survey.gps_latitude}, ${survey.gps_longitude}`
                        : "Not captured"}
                    </p>
                  </div>
                </div>

                {survey.submitted_at && (
                  <div className="mt-4 rounded-lg bg-green-50 p-3">
                    <p className="text-xs font-medium text-green-700">
                      Submitted
                    </p>

                    <p className="mt-1 text-xs text-green-800">
                      {new Date(
                        survey.submitted_at
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}