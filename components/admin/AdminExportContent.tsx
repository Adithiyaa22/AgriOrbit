"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Download,
  FileDown,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SurveyRecord = {
  id: string;
  survey_code: string | null;
  farmer_id: string;
  field_id: string;
  enumerator_id: string;
  survey_version: number;
  visit_date: string | null;
  visit_time: string | null;
  gps_captured: boolean;
  gps_latitude: number | null;
  gps_longitude: number | null;
  internet_available: boolean | null;
  information_provider: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
};

type FarmerRecord = {
  id: string;
  farmer_code: string;
  full_name: string;
  mobile: string | null;
  village: string | null;
  taluk_block: string | null;
  district: string | null;
  state: string | null;
};

type FieldRecord = {
  id: string;
  field_code: string;
  farmer_id: string;
  field_name: string | null;
  area: number | null;
  area_unit: string | null;
  land_ownership: string | null;
  land_type: string | null;
};

type ExportRow = {
  surveyId: string;
  surveyCode: string;
  surveyVersion: number;
  status: string;
  visitDate: string;
  visitTime: string;
  submittedAt: string;
  farmerCode: string;
  farmerName: string;
  farmerMobile: string;
  village: string;
  talukBlock: string;
  district: string;
  state: string;
  fieldCode: string;
  fieldName: string;
  fieldArea: string;
  fieldAreaUnit: string;
  landOwnership: string;
  landType: string;
  enumeratorId: string;
  gpsCaptured: string;
  latitude: string;
  longitude: string;
  internetAvailable: string;
  informationProvider: string;
};

type StatusFilter = "all" | "draft" | "submitted";

export default function AdminExportContent() {
  const supabase = createClient();

  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [farmers, setFarmers] = useState<FarmerRecord[]>([]);
  const [fields, setFields] = useState<FieldRecord[]>([]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set()
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExportData();
  }, []);

  async function loadExportData() {
    setLoading(true);
    setError("");

    try {
      const [
        surveysResult,
        farmersResult,
        fieldsResult,
      ] = await Promise.all([
        supabase
          .from("surveys")
          .select(
            "id, survey_code, farmer_id, field_id, enumerator_id, survey_version, visit_date, visit_time, gps_captured, gps_latitude, gps_longitude, internet_available, information_provider, status, submitted_at, created_at"
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("farmers")
          .select(
            "id, farmer_code, full_name, mobile, village, taluk_block, district, state"
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("fields")
          .select(
            "id, field_code, farmer_id, field_name, area, area_unit, land_ownership, land_type"
          )
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (surveysResult.error) {
        throw new Error(surveysResult.error.message);
      }

      if (farmersResult.error) {
        throw new Error(farmersResult.error.message);
      }

      if (fieldsResult.error) {
        throw new Error(fieldsResult.error.message);
      }

      setSurveys(surveysResult.data || []);
      setFarmers(farmersResult.data || []);
      setFields(fieldsResult.data || []);

      setSelectedIds(
        new Set((surveysResult.data || []).map((survey) => survey.id))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load export data."
      );
    } finally {
      setLoading(false);
    }
  }

  const farmerMap = useMemo(() => {
    return new Map(
      farmers.map((farmer) => [farmer.id, farmer])
    );
  }, [farmers]);

  const fieldMap = useMemo(() => {
    return new Map(
      fields.map((field) => [field.id, field])
    );
  }, [fields]);

  const exportRows = useMemo<ExportRow[]>(() => {
    return surveys.map((survey) => {
      const farmer = farmerMap.get(survey.farmer_id);
      const field = fieldMap.get(survey.field_id);

      return {
        surveyId: survey.id,
        surveyCode: survey.survey_code || "",
        surveyVersion: survey.survey_version,
        status: survey.status || "",
        visitDate: survey.visit_date || "",
        visitTime: survey.visit_time || "",
        submittedAt: survey.submitted_at || "",
        farmerCode: farmer?.farmer_code || "",
        farmerName: farmer?.full_name || "",
        farmerMobile: farmer?.mobile || "",
        village: farmer?.village || "",
        talukBlock: farmer?.taluk_block || "",
        district: farmer?.district || "",
        state: farmer?.state || "",
        fieldCode: field?.field_code || "",
        fieldName: field?.field_name || "",
        fieldArea:
          field?.area !== null && field?.area !== undefined
            ? String(field.area)
            : "",
        fieldAreaUnit: field?.area_unit || "",
        landOwnership: field?.land_ownership || "",
        landType: field?.land_type || "",
        enumeratorId: survey.enumerator_id,
        gpsCaptured: survey.gps_captured ? "Yes" : "No",
        latitude:
          survey.gps_latitude !== null &&
          survey.gps_latitude !== undefined
            ? String(survey.gps_latitude)
            : "",
        longitude:
          survey.gps_longitude !== null &&
          survey.gps_longitude !== undefined
            ? String(survey.gps_longitude)
            : "",
        internetAvailable:
          survey.internet_available === null
            ? ""
            : survey.internet_available
              ? "Yes"
              : "No",
        informationProvider:
          survey.information_provider || "",
      };
    });
  }, [surveys, farmerMap, fieldMap]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return exportRows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ||
        row.status.toLowerCase() === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        row.surveyCode,
        row.farmerCode,
        row.farmerName,
        row.farmerMobile,
        row.village,
        row.district,
        row.fieldCode,
        row.fieldName,
        row.enumeratorId,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [exportRows, search, statusFilter]);

  const selectedVisibleCount = filteredRows.filter((row) =>
    selectedIds.has(row.surveyId)
  ).length;

  const allVisibleSelected =
    filteredRows.length > 0 &&
    selectedVisibleCount === filteredRows.length;

  function toggleSurvey(id: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((previous) => {
      const next = new Set(previous);

      if (allVisibleSelected) {
        filteredRows.forEach((row) => {
          next.delete(row.surveyId);
        });
      } else {
        filteredRows.forEach((row) => {
          next.add(row.surveyId);
        });
      }

      return next;
    });
  }

  function selectAll() {
    setSelectedIds(
      new Set(exportRows.map((row) => row.surveyId))
    );
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function escapeCsvValue(value: string | number) {
    const stringValue = String(value);

    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  async function handleExport() {
    if (selectedIds.size === 0) {
      setError("Please select at least one survey to export.");
      return;
    }

    setExporting(true);
    setError("");

    try {
      const selectedRows = exportRows.filter((row) =>
        selectedIds.has(row.surveyId)
      );

      const headers = [
        "Survey ID",
        "Survey Code",
        "Survey Version",
        "Status",
        "Visit Date",
        "Visit Time",
        "Submitted At",
        "Farmer Code",
        "Farmer Name",
        "Farmer Mobile",
        "Village",
        "Taluk / Block",
        "District",
        "State",
        "Field Code",
        "Field Name",
        "Field Area",
        "Field Area Unit",
        "Land Ownership",
        "Land Type",
        "Enumerator ID",
        "GPS Captured",
        "Latitude",
        "Longitude",
        "Internet Available",
        "Information Provider",
      ];

      const rows = selectedRows.map((row) => [
        row.surveyId,
        row.surveyCode,
        row.surveyVersion,
        row.status,
        row.visitDate,
        row.visitTime,
        row.submittedAt,
        row.farmerCode,
        row.farmerName,
        row.farmerMobile,
        row.village,
        row.talukBlock,
        row.district,
        row.state,
        row.fieldCode,
        row.fieldName,
        row.fieldArea,
        row.fieldAreaUnit,
        row.landOwnership,
        row.landType,
        row.enumeratorId,
        row.gpsCaptured,
        row.latitude,
        row.longitude,
        row.internetAvailable,
        row.informationProvider,
      ]);

      const csvContent = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((row) =>
          row.map(escapeCsvValue).join(",")
        ),
      ].join("\n");

      const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
          type: "text/csv;charset=utf-8;",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      link.href = url;
      link.download = `agriorbit-surveys-${date}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to export surveys."
      );
    } finally {
      setExporting(false);
    }
  }

  const submittedCount = surveys.filter(
    (survey) => survey.status === "submitted"
  ).length;

  const draftCount = surveys.filter(
    (survey) => survey.status === "draft"
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F5E9]">
                <FileDown className="h-6 w-6 text-[#2E7D32]" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#1E293B]">
                  Export
                </h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Select survey records and download them as CSV.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={
              exporting ||
              loading ||
              selectedIds.size === 0
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E7D32] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#256b2b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            {exporting
              ? "Preparing..."
              : `Export ${selectedIds.size} Selected`}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <p className="text-sm text-[#64748B]">
            Total Surveys
          </p>
          <p className="mt-2 text-2xl font-bold text-[#1E293B]">
            {surveys.length}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <p className="text-sm text-[#64748B]">
            Submitted
          </p>
          <p className="mt-2 text-2xl font-bold text-[#16A34A]">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
          <p className="text-sm text-[#64748B]">
            Drafts
          </p>
          <p className="mt-2 text-2xl font-bold text-[#F59E0B]">
            {draftCount}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded p-1 hover:bg-red-100"
            aria-label="Close error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="rounded-xl border border-[#E2E8F0] bg-white">
        <div className="border-b border-[#E2E8F0] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search surveys, farmers or fields..."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-sm text-[#1E293B] outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["submitted", "Submitted"],
                  ["draft", "Drafts"],
                ] as [StatusFilter, string][]
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(value)
                  }
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    statusFilter === value
                      ? "bg-[#E8F5E9] text-[#2E7D32]"
                      : "border border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-lg bg-[#F8FAFC] p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#64748B]">
              <span className="font-semibold text-[#1E293B]">
                {selectedIds.size}
              </span>{" "}
              selected
              <span className="mx-2">•</span>
              {filteredRows.length} visible
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleSelectAllVisible}
                disabled={filteredRows.length === 0}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {allVisibleSelected
                  ? "Deselect Visible"
                  : "Select Visible"}
              </button>

              <button
                type="button"
                onClick={selectAll}
                disabled={exportRows.length === 0}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#1E293B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Select All
              </button>

              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedIds.size === 0}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[#64748B]">
              <Loader2 className="h-5 w-5 animate-spin text-[#2E7D32]" />
              Loading export data...
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F5E9]">
              <FileDown className="h-7 w-7 text-[#2E7D32]" />
            </div>

            <h2 className="mt-4 text-base font-semibold text-[#1E293B]">
              No surveys found
            </h2>

            <p className="mt-1 max-w-md text-sm text-[#64748B]">
              Try changing the search text or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="w-12 px-4 py-3 text-left">
                      <button
                        type="button"
                        onClick={toggleSelectAllVisible}
                        className={`flex h-5 w-5 items-center justify-center rounded border ${
                          allVisibleSelected
                            ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                            : "border-[#CBD5E1] bg-white"
                        }`}
                        aria-label={
                          allVisibleSelected
                            ? "Deselect visible surveys"
                            : "Select visible surveys"
                        }
                      >
                        {allVisibleSelected && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Survey
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Farmer
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Field
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      GPS
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => {
                    const selected = selectedIds.has(
                      row.surveyId
                    );

                    return (
                      <tr
                        key={row.surveyId}
                        className={`border-b border-[#F1F5F9] transition-colors ${
                          selected
                            ? "bg-[#F8FCF8]"
                            : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleSurvey(row.surveyId)
                            }
                            className={`flex h-5 w-5 items-center justify-center rounded border ${
                              selected
                                ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                                : "border-[#CBD5E1] bg-white"
                            }`}
                            aria-label={
                              selected
                                ? `Deselect ${row.surveyCode}`
                                : `Select ${row.surveyCode}`
                            }
                          >
                            {selected && (
                              <Check className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-[#1E293B]">
                            {row.surveyCode || "No code"}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            Version {row.surveyVersion}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-[#1E293B]">
                            {row.farmerName || "Unknown farmer"}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            {row.farmerCode || "No farmer code"}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-[#1E293B]">
                            {row.fieldName || "Unnamed field"}
                          </p>
                          <p className="mt-1 text-xs text-[#64748B]">
                            {row.fieldCode || "No field code"}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm text-[#64748B]">
                          {row.visitDate || "—"}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.gpsCaptured === "Yes"
                                ? "bg-green-50 text-green-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {row.gpsCaptured}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.status === "submitted"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.status || "Unknown"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-[#E2E8F0] lg:hidden">
              {filteredRows.map((row) => {
                const selected = selectedIds.has(
                  row.surveyId
                );

                return (
                  <div
                    key={row.surveyId}
                    className={`p-4 ${
                      selected ? "bg-[#F8FCF8]" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          toggleSurvey(row.surveyId)
                        }
                        className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-[#2E7D32] bg-[#2E7D32] text-white"
                            : "border-[#CBD5E1] bg-white"
                        }`}
                        aria-label={
                          selected
                            ? `Deselect ${row.surveyCode}`
                            : `Select ${row.surveyCode}`
                        }
                      >
                        {selected && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#1E293B]">
                              {row.surveyCode || "No code"}
                            </p>
                            <p className="mt-1 text-xs text-[#64748B]">
                              Version {row.surveyVersion}
                            </p>
                          </div>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              row.status === "submitted"
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {row.status || "Unknown"}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-[#64748B]">
                              Farmer
                            </p>
                            <p className="mt-1 text-sm text-[#1E293B]">
                              {row.farmerName || "Unknown farmer"}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              {row.farmerCode || "No farmer code"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-[#64748B]">
                              Field
                            </p>
                            <p className="mt-1 text-sm text-[#1E293B]">
                              {row.fieldName || "Unnamed field"}
                            </p>
                            <p className="text-xs text-[#64748B]">
                              {row.fieldCode || "No field code"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-[#64748B]">
                              Visit Date
                            </p>
                            <p className="mt-1 text-sm text-[#1E293B]">
                              {row.visitDate || "—"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-[#64748B]">
                              GPS
                            </p>
                            <p className="mt-1 text-sm text-[#1E293B]">
                              {row.gpsCaptured}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}