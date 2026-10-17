"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  WifiOff,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  getAllSurveyOfflineData,
  getSurveySectionOffline,
  markSectionPendingSync,
  markSectionSynced,
  saveSurveySectionOffline,
} from "@/lib/offline/surveyManager";

const SURVEY_SECTIONS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
] as const;

type ReviewItem = {
  section: string;
  label: string;
  completed: boolean;
};

type Survey = {
  id: string;
  survey_code: string | null;
  farmer_id: string;
  field_id: string;
  gps_captured: boolean | null;
  status: string;
};

const SECTION_LABELS: Record<string, string> = {
  A: "Survey & Enumerator Details",
  B: "Farmer Profile",
  C: "Field & Land Details",
  D: "Soil Details",
  E: "Season & Crop History",
  F: "Seed & Variety",
  G: "Fertilizer & Other Inputs",
  H: "Water & Irrigation",
  I: "Crop Problems & Difficulties",
  J: "Field Observation",
  K: "Harvest, Yield & Economics",
  L: "Market & Selling",
  M: "Labour & Farming Operations",
  N: "Farmer Knowledge & Tips",
  O: "Future Farmer Needs",
};

export default function SurveyPPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [surveyCode, setSurveyCode] = useState("");
  const [status, setStatus] = useState("draft");
  const [farmerName, setFarmerName] = useState("");
  const [farmerCode, setFarmerCode] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldCode, setFieldCode] = useState("");
  const [gpsCaptured, setGpsCaptured] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadReview() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const localSections = await getAllSurveyOfflineData(surveyId);
      const localA = await getSurveySectionOffline(surveyId, "A");
      const localB = await getSurveySectionOffline(surveyId, "B");
      const localC = await getSurveySectionOffline(surveyId, "C");

      let loadedSurvey: Survey | null = null;
      let loadedFarmer: { farmer_code: string; full_name: string } | null = null;
      let loadedField: { field_code: string; field_name: string } | null = null;

      if (isOnline) {
        const { data, error: surveyError } = await supabase
          .from("surveys")
          .select("id, survey_code, farmer_id, field_id, gps_captured, status")
          .eq("id", surveyId)
          .single();

        if (!surveyError && data) {
          loadedSurvey = data;

          const [{ data: farmer }, { data: field }] = await Promise.all([
            supabase
              .from("farmers")
              .select("farmer_code, full_name")
              .eq("id", data.farmer_id)
              .single(),
            supabase
              .from("fields")
              .select("field_code, field_name")
              .eq("id", data.field_id)
              .single(),
          ]);

          loadedFarmer = farmer;
          loadedField = field;
        }
      }

      const localAData = localA?.data ?? {};
      const localBData = localB?.data ?? {};
      const localCData = localC?.data ?? {};

      if (!loadedSurvey) {
        const farmerId =
          typeof localAData.farmerId === "string"
            ? localAData.farmerId
            : typeof localBData.farmerId === "string"
            ? localBData.farmerId
            : "";

        const fieldId =
          typeof localAData.fieldId === "string"
            ? localAData.fieldId
            : typeof localBData.fieldId === "string"
            ? localBData.fieldId
            : typeof localCData.fieldId === "string"
            ? localCData.fieldId
            : "";

        if (!farmerId || !fieldId) {
          setError(
            "This survey is not available offline yet. Open it while connected once before working offline."
          );
          setLoading(false);
          return;
        }

        loadedSurvey = {
          id: surveyId,
          survey_code:
            localA?.surveyCode ||
            localB?.surveyCode ||
            localC?.surveyCode ||
            `LOCAL-${surveyId.slice(0, 8).toUpperCase()}`,
          farmer_id: farmerId,
          field_id: fieldId,
          gps_captured:
            typeof localAData.gpsCaptured === "string"
              ? localAData.gpsCaptured === "Yes"
              : typeof localAData.gps_captured === "boolean"
              ? localAData.gps_captured
              : false,
          status: "draft",
        };

        loadedFarmer = {
          farmer_code: String(localBData.farmerCode ?? "Offline Farmer"),
          full_name: String(localBData.full_name ?? ""),
        };

        loadedField = {
          field_code: String(localCData.fieldCode ?? "Offline Field"),
          field_name: String(localCData.field_name ?? ""),
        };

        setMessage("Review is using the survey saved on this device.");
      }

      setSurvey(loadedSurvey);
      setSurveyCode(loadedSurvey.survey_code ?? "");
      setStatus(loadedSurvey.status ?? "draft");
      setGpsCaptured(Boolean(loadedSurvey.gps_captured));
      setFarmerName(loadedFarmer?.full_name ?? "");
      setFarmerCode(loadedFarmer?.farmer_code ?? "");
      setFieldName(loadedField?.field_name ?? "");
      setFieldCode(loadedField?.field_code ?? "");

      if (isOnline) {
        const checks: ReviewItem[] = [];

        checks.push({
          section: "A",
          label: SECTION_LABELS.A,
          completed:
            Boolean(loadedSurvey.survey_code) &&
            Boolean(loadedSurvey.status),
        });

        checks.push({
          section: "B",
          label: SECTION_LABELS.B,
          completed: Boolean(loadedFarmer),
        });

        checks.push({
          section: "C",
          label: SECTION_LABELS.C,
          completed: Boolean(loadedField),
        });

        const tableSections: Array<[string, string]> = [
          ["D", "soil_information"],
          ["E", "crop_information"],
          ["F", "seed_information"],
          ["G", "input_information"],
          ["H", "irrigation_information"],
          ["I", "crop_problems"],
          ["J", "field_observations"],
          ["K", "economics"],
          ["L", "market_information"],
          ["M", "labour_operations"],
          ["N", "farmer_knowledge"],
          ["O", "future_farmer_needs"],
        ];

        for (const [section, table] of tableSections) {
          const { data } = await supabase
            .from(table)
            .select("id")
            .eq("survey_id", surveyId)
            .maybeSingle();

          checks.push({
            section,
            label: SECTION_LABELS[section],
            completed: Boolean(data),
          });
        }

        setReviewItems(checks);
      } else {
        const saved = new Set(
          localSections
            .filter((item) => SURVEY_SECTIONS.includes(item.section as (typeof SURVEY_SECTIONS)[number]))
            .map((item) => item.section)
        );

        setReviewItems(
          SURVEY_SECTIONS.map((section) => ({
            section,
            label: SECTION_LABELS[section],
            completed: saved.has(section),
          }))
        );
      }
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Survey review could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReview();
  }, [surveyId, isOnline]);

  const completedCount = useMemo(
    () => reviewItems.filter((item) => item.completed).length,
    [reviewItems]
  );

  const totalCount = reviewItems.length;

  async function submitSurvey() {
    if (status === "submitted") return;

    setSubmitting(true);
    setError("");
    setMessage("");

    const incompleteSections = reviewItems
      .filter((item) => !item.completed)
      .map((item) => item.label);

    if (incompleteSections.length > 0) {
      setError(
        `Please complete these sections before submitting: ${incompleteSections.join(
          ", "
        )}`
      );
      setSubmitting(false);
      return;
    }

    if (!gpsCaptured) {
      setError(
        "GPS has not been captured. Please go back to Section A and capture GPS before submitting."
      );
      setSubmitting(false);
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to submit this survey? After submission, it will be marked as submitted."
    );

    if (!confirmed) {
      setSubmitting(false);
      return;
    }

    try {
      if (!navigator.onLine) {
        await saveSurveySectionOffline({
          surveyId,
          surveyCode:
            surveyCode ||
            `LOCAL-${surveyId.slice(0, 8).toUpperCase()}`,
          section: "P",
          data: {
            submit: true,
            status: "submitted",
          },
        });

        await markSectionPendingSync(surveyId, "P");

        setMessage(
          "Submission is saved on this device. It will be sent automatically when internet returns."
        );
        setStatus("pending_sync");
        setSubmitting(false);
        return;
      }

      const { error: submitError } = await supabase
        .from("surveys")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", surveyId)
        .neq("status", "submitted");

      if (submitError) {
        throw submitError;
      }

      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "P",
        data: { submit: true, status: "submitted" },
      });
      await markSectionSynced(surveyId, "P");

      setStatus("submitted");
      setMessage("Survey submitted successfully.");
    } catch (submitError) {
      console.error(submitError);

      if (!navigator.onLine) {
        await saveSurveySectionOffline({
          surveyId,
          surveyCode:
            surveyCode ||
            `LOCAL-${surveyId.slice(0, 8).toUpperCase()}`,
          section: "P",
          data: { submit: true, status: "submitted" },
        });
        await markSectionPendingSync(surveyId, "P");
        setMessage(
          "Connection was lost. The submission was saved locally and will retry automatically."
        );
        setStatus("pending_sync");
      } else {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Unable to submit the survey."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function saveDraft() {
    if (status === "submitted") return;

    setError("");
    setMessage("");

    if (!navigator.onLine) {
      setMessage("Your completed sections are already saved on this device.");
      return;
    }

    setSubmitting(true);

    try {
      const { error: saveError } = await supabase
        .from("surveys")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", surveyId)
        .neq("status", "submitted");

      if (saveError) throw saveError;

      setStatus("draft");
      setMessage("Survey saved as draft.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the draft."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function goToSection(section: string) {
    if (status === "submitted") return;
    router.push(`/surveys/${surveyId}/${section.toLowerCase()}`);
  }

  if (loading) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Loader2 size={20} className="animate-spin" />
              Loading final review...
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  if (!survey) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error || "Survey could not be found."}
            </div>
          </div>
        </main>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <CheckCircle2 size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Survey {surveyCode}
                </p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  P — Final Review & Submission
                </h1>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Review all sections before submitting the survey.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">Survey progress</p>
                <p className="mt-1 text-sm font-semibold">
                  {completedCount} of {totalCount} sections completed
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                {status === "submitted" ? "Submitted" : status === "pending_sync" ? "Pending sync" : "Draft"}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {!isOnline && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <WifiOff size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">You are offline</p>
                <p className="mt-1">
                  Review uses the data saved on this device. A confirmed submission will be queued and synchronized automatically.
                </p>
              </div>
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <section className="mb-6 rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">Survey Summary</h2>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="rounded-lg bg-[var(--background)] p-4">
                <p className="text-xs font-medium text-[var(--muted)]">Farmer</p>
                <p className="mt-1 text-sm font-semibold">{farmerName || "Not available"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{farmerCode || ""}</p>
              </div>

              <div className="rounded-lg bg-[var(--background)] p-4">
                <p className="text-xs font-medium text-[var(--muted)]">Field</p>
                <p className="mt-1 text-sm font-semibold">{fieldName || "Not available"}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{fieldCode || ""}</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">Section checklist</h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Select a completed section to review or edit it.
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {reviewItems.map((item) => (
                <button
                  key={item.section}
                  type="button"
                  onClick={() => goToSection(item.section)}
                  disabled={status === "submitted"}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[var(--background)] disabled:cursor-default disabled:hover:bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        item.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.section}
                    </div>

                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {item.completed ? "Completed" : "Not completed"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={18} className="shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </section>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={saveDraft}
              disabled={submitting || status === "submitted"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Clock3 size={17} />
              Save as Draft
            </button>

            <button
              type="button"
              onClick={submitSurvey}
              disabled={submitting || status === "submitted"}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : status === "submitted" ? (
                <>
                  <CheckCircle2 size={18} />
                  Submitted
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Submit Survey
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </InternLayout>
  );
}
