"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Map,
  ClipboardList,
  CheckCircle2,
  FileEdit,
  MapPin,
  TrendingUp,
  AlertCircle,
  Loader2,
  CalendarDays,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type DistrictCount = {
  district: string;
  count: number;
};

type StatusCount = {
  status: string;
  count: number;
};

type RecentSurvey = {
  id: string;
  survey_code: string;
  status: string;
  visit_date: string | null;
  created_at: string;
};

export default function AdminAnalyticsContent() {
  const [farmerCount, setFarmerCount] = useState(0);
  const [fieldCount, setFieldCount] = useState(0);
  const [surveyCount, setSurveyCount] = useState(0);
  const [submittedCount, setSubmittedCount] =
    useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [gpsCount, setGpsCount] = useState(0);

  const [districtCounts, setDistrictCounts] =
    useState<DistrictCount[]>([]);

  const [statusCounts, setStatusCounts] =
    useState<StatusCount[]>([]);

  const [recentSurveys, setRecentSurveys] =
    useState<RecentSurvey[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError("");

      try {
        const [
          farmersResult,
          fieldsResult,
          surveysResult,
        ] = await Promise.all([
          supabase
            .from("farmers")
            .select("id, district", {
              count: "exact",
            }),

          supabase
            .from("fields")
            .select("id, latitude, longitude", {
              count: "exact",
            }),

          supabase
            .from("surveys")
            .select(
              `
                id,
                survey_code,
                status,
                visit_date,
                gps_captured,
                created_at
              `
            )
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (farmersResult.error) {
          throw farmersResult.error;
        }

        if (fieldsResult.error) {
          throw fieldsResult.error;
        }

        if (surveysResult.error) {
          throw surveysResult.error;
        }

        const farmers =
          farmersResult.data || [];

        const fields =
          fieldsResult.data || [];

        const surveys =
          surveysResult.data || [];

        setFarmerCount(
          farmersResult.count || 0
        );

        setFieldCount(
          fieldsResult.count || 0
        );

        setSurveyCount(surveys.length);

        const submitted = surveys.filter(
          (survey) =>
            survey.status === "submitted"
        );

        const drafts = surveys.filter(
          (survey) =>
            survey.status === "draft"
        );

        const gpsCaptured = surveys.filter(
          (survey) =>
            survey.gps_captured === true
        );

        setSubmittedCount(submitted.length);
        setDraftCount(drafts.length);
        setGpsCount(gpsCaptured.length);

        const districtMap: Record<
          string,
          number
        > = {};

        farmers.forEach((farmer) => {
          const district =
            farmer.district?.trim() ||
            "Not specified";

          districtMap[district] =
            (districtMap[district] || 0) + 1;
        });

        const districtData: DistrictCount[] =
          Object.entries(districtMap)
            .map(([district, count]) => ({
              district,
              count,
            }))
            .sort(
              (a, b) => b.count - a.count
            );

        setDistrictCounts(districtData);

        const statusMap: Record<
          string,
          number
        > = {};

        surveys.forEach((survey) => {
          const status =
            survey.status || "unknown";

          statusMap[status] =
            (statusMap[status] || 0) + 1;
        });

        const statusData: StatusCount[] =
          Object.entries(statusMap)
            .map(([status, count]) => ({
              status,
              count,
            }))
            .sort(
              (a, b) => b.count - a.count
            );

        setStatusCounts(statusData);

        const recentData: RecentSurvey[] =
          surveys
            .slice(0, 8)
            .map((survey) => ({
              id: survey.id,
              survey_code:
                survey.survey_code,
              status: survey.status,
              visit_date:
                survey.visit_date,
              created_at:
                survey.created_at,
            }));

        setRecentSurveys(recentData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const submissionRate = useMemo(() => {
    if (surveyCount === 0) {
      return 0;
    }

    return Math.round(
      (submittedCount / surveyCount) * 100
    );
  }, [surveyCount, submittedCount]);

  const gpsRate = useMemo(() => {
    if (surveyCount === 0) {
      return 0;
    }

    return Math.round(
      (gpsCount / surveyCount) * 100
    );
  }, [surveyCount, gpsCount]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-green-600">
            Data Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Analytics
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Loading AgriOrbit data...
          </p>
        </div>

        <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />

            <p className="text-sm">
              Preparing analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-green-600">
            Data Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Analytics
          </h1>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h2 className="text-sm font-semibold text-red-800">
                Unable to load analytics
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-green-600">
          Data Overview
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Analytics
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
          Overview of farmer, field and survey
          collection activity in AgriOrbit.
        </p>
      </div>

      {/* Main Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Farmers"
          value={farmerCount}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-green-50 text-green-700"
        />

        <StatCard
          label="Total Fields"
          value={fieldCount}
          icon={<Map className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
        />

        <StatCard
          label="Total Surveys"
          value={surveyCount}
          icon={
            <ClipboardList className="h-5 w-5" />
          }
          iconClass="bg-purple-50 text-purple-600"
        />

        <StatCard
          label="Submitted Surveys"
          value={submittedCount}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          iconClass="bg-green-50 text-green-600"
        />

        <StatCard
          label="Draft Surveys"
          value={draftCount}
          icon={<FileEdit className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
        />

        <StatCard
          label="GPS Captured"
          value={gpsCount}
          icon={<MapPin className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
        />
      </div>

      {/* Collection Quality */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-700" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Survey Submission Rate
              </h2>

              <p className="text-xs text-slate-500">
                Submitted surveys compared with all
                survey records
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-900">
                {submissionRate}%
              </p>

              <p className="text-sm text-slate-500">
                {submittedCount} / {surveyCount}
              </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-green-600 transition-all"
                style={{
                  width: `${submissionRate}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                GPS Capture Rate
              </h2>

              <p className="text-xs text-slate-500">
                Surveys with captured GPS coordinates
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between">
              <p className="text-3xl font-bold text-slate-900">
                {gpsRate}%
              </p>

              <p className="text-sm text-slate-500">
                {gpsCount} / {surveyCount}
              </p>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${gpsRate}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* District + Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Farmers by District */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Farmers by District
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Distribution of registered farmers
              </p>
            </div>

            <Users className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {districtCounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No district data available.
              </p>
            ) : (
              districtCounts
                .slice(0, 8)
                .map((item) => {
                  const percentage =
                    farmerCount > 0
                      ? Math.round(
                          (item.count /
                            farmerCount) *
                            100
                        )
                      : 0;

                  return (
                    <div key={item.district}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-slate-700">
                          {item.district}
                        </p>

                        <p className="shrink-0 text-sm font-semibold text-slate-900">
                          {item.count}
                        </p>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Survey Status */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Survey Status
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current status of survey records
              </p>
            </div>

            <ClipboardList className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-5 space-y-4">
            {statusCounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No survey status data available.
              </p>
            ) : (
              statusCounts.map((item) => {
                const percentage =
                  surveyCount > 0
                    ? Math.round(
                        (item.count /
                          surveyCount) *
                          100
                      )
                    : 0;

                const isSubmitted =
                  item.status === "submitted";

                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium capitalize text-slate-700">
                        {item.status}
                      </p>

                      <p className="text-sm font-semibold text-slate-900">
                        {item.count}
                      </p>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          isSubmitted
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Surveys */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-slate-400" />

            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Recent Survey Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest survey records created in the
                system
              </p>
            </div>
          </div>
        </div>

        {recentSurveys.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />

            <p className="mt-3 text-sm text-slate-500">
              No recent survey activity.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSurveys.map((survey) => (
              <div
                key={survey.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {survey.survey_code}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
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
                      : "Visit date not provided"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      survey.status ===
                      "submitted"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {survey.status}
                  </span>

                  <p className="text-xs text-slate-400">
                    {new Date(
                      survey.created_at
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
};

function StatCard({
  label,
  value,
  icon,
  iconClass,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}