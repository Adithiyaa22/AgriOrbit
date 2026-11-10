"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ClipboardList,
  MapPin,
  CalendarDays,
  User,
  Map as MapIcon,
  CheckCircle2,
  Clock3,
  FileEdit,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";
import { offlineDB } from "@/lib/offline/db";

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
  localOnly?: boolean;
  localUpdatedAt?: string;
};

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSurveys = useCallback(async () => {
    setLoading(true);
    setError("");

    let remoteRows: SurveyRow[] = [];
    let remoteError = "";
    let localVisibleCount = 0;

    try {
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select(`
          id, survey_code, farmer_id, field_id, enumerator_id,
          survey_version, visit_date, visit_time, gps_captured,
          gps_latitude, gps_longitude, internet_available,
          information_provider, status, submitted_at, created_at
        `)
        .order("created_at", { ascending: false });

      if (surveyError) throw surveyError;

      const rows = surveyData ?? [];
      if (rows.length > 0) {
        const farmerIds = Array.from(new Set(rows.map((item) => item.farmer_id).filter(Boolean)));
        const fieldIds = Array.from(new Set(rows.map((item) => item.field_id).filter(Boolean)));
        const enumeratorIds = Array.from(new Set(rows.map((item) => item.enumerator_id).filter(Boolean)));

        const [farmerResult, fieldResult, enumeratorResult] = await Promise.all([
          farmerIds.length ? supabase.from("farmers").select("id, farmer_code, full_name, village, district").in("id", farmerIds) : Promise.resolve({ data: [], error: null }),
          fieldIds.length ? supabase.from("fields").select("id, field_code, field_name").in("id", fieldIds) : Promise.resolve({ data: [], error: null }),
          enumeratorIds.length ? supabase.from("profiles").select("id, full_name, employee_code").in("id", enumeratorIds) : Promise.resolve({ data: [], error: null }),
        ]);

        // Related labels are helpful but must not hide the survey records
        // themselves if a related-table policy temporarily denies access.
        if (farmerResult.error) console.warn("Farmer details unavailable:", farmerResult.error.message);
        if (fieldResult.error) console.warn("Field details unavailable:", fieldResult.error.message);
        if (enumeratorResult.error) console.warn("Enumerator details unavailable:", enumeratorResult.error.message);

        const farmerMap = new Map<string, Farmer>((farmerResult.data ?? []).map((item) => [item.id, item as Farmer]));
        const fieldMap = new Map<string, Field>((fieldResult.data ?? []).map((item) => [item.id, item as Field]));
        const enumeratorMap = new Map<string, Enumerator>((enumeratorResult.data ?? []).map((item) => [item.id, item as Enumerator]));

        remoteRows = rows.map((survey) => ({
          ...survey,
          farmer: farmerMap.get(survey.farmer_id) ?? null,
          field: fieldMap.get(survey.field_id) ?? null,
          enumerator: enumeratorMap.get(survey.enumerator_id) ?? null,
        }));
      }
    } catch (err) {
      console.error("Supabase surveys fetch error:", err);
      remoteError = err instanceof Error ? err.message : "Unable to load online surveys.";
    }

    // Include offline/local drafts so surveys created without a successful
    // Supabase insert remain visible and can be reopened on this device.
    try {
      const [localSections, cachedFarmers, cachedFields] = await Promise.all([
        offlineDB.surveyDrafts.toArray(),
        offlineDB.farmerCache.toArray(),
        offlineDB.fieldCache.toArray(),
      ]);

      const remoteById = new Map<string, SurveyRow>(remoteRows.map((row) => [row.id, row]));
      const farmerMap = new Map<string, Farmer>(cachedFarmers.map((item) => [item.id, item as Farmer]));
      const fieldMap = new Map<string, Field>(cachedFields.map((item) => [item.id, item as Field]));
      const localBySurvey = new Map<string, typeof localSections>();

      for (const section of localSections) {
        const existing = localBySurvey.get(section.surveyId) ?? [];
        existing.push(section);
        localBySurvey.set(section.surveyId, existing);
      }

      for (const [surveyId, sections] of localBySurvey) {
        const sectionA = sections.find((item) => item.section === "A");
        const sectionP = sections.find((item) => item.section === "P");
        const localSubmitted = sectionP?.data.submit === true;
        const data = sectionA?.data ?? {};
        const getString = (value: unknown) => typeof value === "string" ? value : "";
        const farmerId = getString(data.farmerId);
        const fieldId = getString(data.fieldId);
        const enumeratorId = getString(data.enumeratorId);
        const gpsValue = data.gpsCaptured;
        const gpsCaptured = typeof gpsValue === "boolean" ? gpsValue : gpsValue === "Yes" ? true : gpsValue === "No" ? false : null;
        const gpsLatitude = typeof data.gpsLatitude === "number" ? data.gpsLatitude : null;
        const gpsLongitude = typeof data.gpsLongitude === "number" ? data.gpsLongitude : null;
        const latest = sections.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b);
        const existing = remoteById.get(surveyId);

        if (existing) {
          // Reflect locally saved, not-yet-synced Section A values in the list.
          if (sectionA && sectionA.status !== "synced") {
            existing.gps_captured = gpsCaptured ?? existing.gps_captured;
            existing.gps_latitude = gpsLatitude ?? existing.gps_latitude;
            existing.gps_longitude = gpsLongitude ?? existing.gps_longitude;
            existing.internet_available = typeof data.internetAvailable === "boolean"
              ? data.internetAvailable
              : data.internetAvailable === "Yes" ? true
              : data.internetAvailable === "No" ? false
              : existing.internet_available;
          }
          if (localSubmitted && sectionP?.status !== "synced") {
            existing.status = "submitted";
            existing.submitted_at = existing.submitted_at || sectionP?.updatedAt || latest.updatedAt;
          }
          existing.localUpdatedAt = latest.updatedAt;
          continue;
        }

        const localSurvey: SurveyRow = {
          id: surveyId,
          survey_code: sections[0].surveyCode || `LOCAL-${surveyId.slice(0, 8).toUpperCase()}`,
          farmer_id: farmerId,
          field_id: fieldId,
          enumerator_id: enumeratorId,
          survey_version: typeof data.survey_version === "number" ? data.survey_version : 1,
          visit_date: getString(data.visitDate) || null,
          visit_time: null,
          gps_captured: gpsCaptured,
          gps_latitude: gpsLatitude,
          gps_longitude: gpsLongitude,
          internet_available: typeof data.internetAvailable === "boolean" ? data.internetAvailable : data.internetAvailable === "Yes" ? true : data.internetAvailable === "No" ? false : null,
          information_provider: getString(data.informationProvider) || null,
          status: localSubmitted ? "submitted" : "draft",
          submitted_at: localSubmitted ? (sectionP?.updatedAt || latest.updatedAt) : null,
          created_at: latest.updatedAt,
          farmer: farmerMap.get(farmerId) ?? null,
          field: fieldMap.get(fieldId) ?? null,
          enumerator: null,
          localOnly: true,
          localUpdatedAt: latest.updatedAt,
        };
        remoteById.set(surveyId, localSurvey);
      }

      const merged: SurveyRow[] = Array.from(remoteById.values()).sort((a: SurveyRow, b: SurveyRow) =>
        (b.localUpdatedAt || b.created_at || "").localeCompare(a.localUpdatedAt || a.created_at || "")
      );
      localVisibleCount = merged.filter((row) => row.localOnly).length;
      setSurveys(merged);
    } catch (offlineErr) {
      console.error("Unable to read local survey drafts:", offlineErr);
      setSurveys(remoteRows);
    }

    if (remoteError && remoteRows.length === 0 && localVisibleCount === 0) {
      setError(`Online surveys could not be loaded: ${remoteError}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadSurveys();
    const refresh = () => { if (document.visibilityState === "visible") void loadSurveys(); };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadSurveys]);

  // ---------------------------------
  // Search + status filter
  // ---------------------------------

  const filteredSurveys = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

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

      return (
        matchesSearch && matchesStatus
      );
    });
  }, [
    surveys,
    search,
    statusFilter,
  ]);

  // ---------------------------------
  // Summary counts
  // ---------------------------------

  const submittedCount = surveys.filter(
    (survey) =>
      survey.status === "submitted"
  ).length;

  const draftCount = surveys.filter(
    (survey) =>
      survey.status === "draft"
  ).length;

  const gpsCount = surveys.filter(
    (survey) =>
      survey.gps_captured === true
  ).length;

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Header */}

          <section className="mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Field Data Collection
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Surveys
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  View survey records collected during field visits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadSurveys()}
                  disabled={loading}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  Refresh
                </button>
                <div className="flex w-fit items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--light-green)]">
                  <ClipboardList
                    size={20}
                    className="text-[var(--primary)]"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium text-[var(--muted)]">
                    Total Surveys
                  </p>

                  <p className="text-xl font-bold">
                    {surveys.length}
                  </p>
                </div>
                </div>
              </div>
            </div>
          </section>

          {/* Summary */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[var(--muted)]">
                Total
              </p>

              <p className="mt-1 text-2xl font-bold">
                {surveys.length}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[var(--muted)]">
                Submitted
              </p>

              <p className="mt-1 text-2xl font-bold text-green-600">
                {submittedCount}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[var(--muted)]">
                Drafts
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-600">
                {draftCount}
              </p>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-[var(--muted)]">
                GPS Captured
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-600">
                {gpsCount}
              </p>
            </div>

          </section>

          {/* Search */}

          <section className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">

            <div className="grid gap-3 lg:grid-cols-[1fr_180px]">

              <div className="relative">

                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search survey, farmer, field or enumerator..."
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                />

              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
                className="h-11 rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="submitted">
                  Submitted
                </option>

                <option value="draft">
                  Draft
                </option>
              </select>

            </div>

            {(search ||
              statusFilter !== "all") && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                Showing{" "}
                {filteredSurveys.length} of{" "}
                {surveys.length} surveys
              </p>
            )}

          </section>

          {/* Error */}

          {!loading && error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5">

              <div className="flex items-start gap-3">

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

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

          {/* Loading */}

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-white shadow-sm">

              <div className="flex flex-col items-center gap-3 text-[var(--muted)]">

                <Loader2
                  size={28}
                  className="animate-spin text-[var(--primary)]"
                />

                <p className="text-sm">
                  Loading surveys...
                </p>

              </div>
            </div>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            filteredSurveys.length === 0 && (
              <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-[var(--border)] bg-white shadow-sm">

                <div className="px-6 text-center">

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--light-green)]">
                    <ClipboardList
                      size={22}
                      className="text-[var(--primary)]"
                    />
                  </div>

                  <h2 className="mt-4 text-base font-semibold">
                    {surveys.length === 0
                      ? "No surveys found"
                      : "No matching surveys"}
                  </h2>

                  <p className="mt-1 text-sm text-[var(--muted)]">
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
              <div className="hidden overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-sm lg:block">

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[1150px]">

                    <thead>
                      <tr className="border-b border-[var(--border)] bg-slate-50">

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Survey
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Farmer
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Field
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Enumerator
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Visit
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          GPS
                        </th>

                        <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                          Open
                        </th>

                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[var(--border)]">

                      {filteredSurveys.map(
                        (survey) => (
                          <tr
                            key={survey.id}
                            className="transition-colors hover:bg-[var(--light-green)]"
                          >

                            {/* Survey */}

                            <td className="px-5 py-4">

                              <Link
                                href={`/surveys/${survey.id}/a`}
                                className="font-semibold text-sm text-[var(--primary)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] rounded"
                              >
                                {survey.survey_code}
                              </Link>

                              <p className="mt-1 text-xs text-[var(--muted)]">
                                Version {survey.survey_version}
                                {survey.localOnly ? " · Saved on this device" : ""}
                              </p>

                            </td>

                            {/* Farmer */}

                            <td className="px-5 py-4">

                              {survey.farmer ? (
                                <div>

                                  <p className="text-sm font-semibold">
                                    {
                                      survey
                                        .farmer
                                        .full_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-[var(--primary)]">
                                    {
                                      survey
                                        .farmer
                                        .farmer_code
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-[var(--muted)]">
                                    {[
                                      survey
                                        .farmer
                                        .village,
                                      survey
                                        .farmer
                                        .district,
                                    ]
                                      .filter(
                                        Boolean
                                      )
                                      .join(
                                        ", "
                                      ) ||
                                      "—"}
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

                                  <p className="text-sm font-semibold">
                                    {
                                      survey
                                        .field
                                        .field_name
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-[var(--primary)]">
                                    {
                                      survey
                                        .field
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

                                  <User
                                    size={16}
                                    className="mt-0.5 text-[var(--muted)]"
                                  />

                                  <div>

                                    <p className="text-sm font-medium">
                                      {
                                        survey
                                          .enumerator
                                          .full_name ||
                                        "Unnamed"
                                      }
                                    </p>

                                    <p className="mt-1 text-xs text-[var(--muted)]">
                                      {
                                        survey
                                          .enumerator
                                          .employee_code ||
                                        "No ID"
                                      }
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

                                <CalendarDays
                                  size={16}
                                  className="mt-0.5 text-[var(--muted)]"
                                />

                                <div>

                                  <p className="text-sm">
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
                                    <p className="mt-1 text-xs text-[var(--muted)]">
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

                                  <MapPin
                                    size={14}
                                  />

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
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">

                                  <CheckCircle2
                                    size={14}
                                  />

                                  Submitted

                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">

                                  <FileEdit
                                    size={14}
                                  />

                                  {survey.status}

                                </span>
                              )}

                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/surveys/${survey.id}/a`}
                                className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                              >
                                Open survey
                              </Link>
                            </td>

                          </tr>
                        )
                      )}

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

                {filteredSurveys.map(
                  (survey) => (
                    <div
                      key={survey.id}
                      className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm"
                    >

                      {/* Card Header */}

                      <div className="flex items-start justify-between gap-3">

                        <div>

                          <Link
                            href={`/surveys/${survey.id}/a`}
                            className="font-semibold text-[var(--primary)] hover:underline"
                          >
                            {survey.survey_code}
                          </Link>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Version {survey.survey_version}
                            {survey.localOnly ? " · Saved on this device" : ""}
                          </p>

                        </div>

                        {survey.status ===
                        "submitted" ? (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">

                            <CheckCircle2
                              size={14}
                            />

                            Submitted

                          </span>
                        ) : (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-700">

                            <Clock3
                              size={14}
                            />

                            {survey.status}

                          </span>
                        )}

                      </div>

                      <div className="mt-4 space-y-4">

                        {/* Farmer */}

                        <div className="flex items-start gap-2">

                          <User
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                          />

                          <div>

                            <p className="text-xs text-[var(--muted)]">
                              Farmer
                            </p>

                            <p className="text-sm font-medium">
                              {survey.farmer
                                ?.full_name ||
                                "Farmer unavailable"}
                            </p>

                            {survey.farmer && (
                              <p className="text-xs text-[var(--primary)]">
                                {
                                  survey
                                    .farmer
                                    .farmer_code
                                }
                              </p>
                            )}

                          </div>

                        </div>

                        {/* Field */}

                        <div className="flex items-start gap-2">

                          <MapIcon
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                          />

                          <div>

                            <p className="text-xs text-[var(--muted)]">
                              Field
                            </p>

                            <p className="text-sm font-medium">
                              {survey.field
                                ?.field_name ||
                                "Unnamed Field"}
                            </p>

                            {survey.field && (
                              <p className="text-xs text-[var(--primary)]">
                                {
                                  survey
                                    .field
                                    .field_code
                                }
                              </p>
                            )}

                          </div>

                        </div>

                        {/* Enumerator */}

                        <div className="flex items-start gap-2">

                          <User
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                          />

                          <div>

                            <p className="text-xs text-[var(--muted)]">
                              Enumerator
                            </p>

                            <p className="text-sm font-medium">
                              {survey
                                .enumerator
                                ?.full_name ||
                                "Unavailable"}
                            </p>

                            <p className="text-xs text-[var(--muted)]">
                              {survey
                                .enumerator
                                ?.employee_code ||
                                "No ID"}
                            </p>

                          </div>

                        </div>

                        {/* Visit */}

                        <div className="flex items-start gap-2">

                          <CalendarDays
                            size={16}
                            className="mt-0.5 shrink-0 text-[var(--muted)]"
                          />

                          <div>

                            <p className="text-xs text-[var(--muted)]">
                              Visit Date
                            </p>

                            <p className="text-sm">
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

                          <p className="text-xs text-[var(--muted)]">
                            GPS
                          </p>

                          <p className="mt-1 text-sm">
                            {survey.gps_captured
                              ? `${survey.gps_latitude}, ${survey.gps_longitude}`
                              : "Not captured"}
                          </p>

                        </div>

                      </div>

                      {/* Submitted */}

                      {survey.submitted_at && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3">
                          <p className="text-xs font-medium text-green-700">Submitted</p>
                          <p className="mt-1 text-xs text-green-800">
                            {new Date(survey.submitted_at).toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}

                      <Link
                        href={`/surveys/${survey.id}/a`}
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                      >
                        Open survey and sections
                      </Link>
                    </div>
                  )
                )}

              </div>
            )}

        </div>
      </main>
    </InternLayout>
  );
}