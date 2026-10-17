"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
} from "lucide-react";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";
import { getClientUser } from "@/lib/auth/get-client-user";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  saveSurveySectionOffline,
  getSurveySectionOffline,
  markSectionSynced,
} from "@/lib/offline/surveyManager";

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
  status: string;
  information_provider: string | null;
};

type Profile = {
  full_name: string;
  employee_code: string;
};

export default function SurveyAPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [gpsCaptured, setGpsCaptured] = useState("");
  const [gpsLatitude, setGpsLatitude] = useState("");
  const [gpsLongitude, setGpsLongitude] = useState("");
  const [capturingGps, setCapturingGps] = useState(false);
  const [internetAvailable, setInternetAvailable] = useState("");
  const [informationProvider, setInformationProvider] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [offlineMessage, setOfflineMessage] = useState("");

  useEffect(() => {
    async function loadSurvey() {
      setLoading(true);
      setError("");
      setOfflineMessage("");

      const user = await getClientUser();

      if (!user) {
        router.push("/login");
        return;
      }

      let surveyData: Survey | null = null;

      /*
       * First try loading the survey from Supabase.
       */
      if (navigator.onLine) {
        const { data, error: surveyError } = await supabase
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
            status,
            information_provider
          `
          )
          .eq("id", surveyId)
          .single();

        if (!surveyError && data) {
          surveyData = data;
        }
      }

      /*
       * Load the local Section A draft.
       */
      const offlineDraft = await getSurveySectionOffline(
        surveyId,
        "A"
      );

      /*
       * If Supabase is unavailable, restore the survey
       * from the locally saved draft.
       */
      if (!surveyData && offlineDraft) {
        const localData = offlineDraft.data;

        surveyData = {
          id: surveyId,
          survey_code: offlineDraft.surveyCode,
          farmer_id:
            typeof localData.farmerId === "string"
              ? localData.farmerId
              : "",
          field_id:
            typeof localData.fieldId === "string"
              ? localData.fieldId
              : "",
          enumerator_id: user.id,
          survey_version: 1,
          visit_date: null,
          visit_time: null,
          gps_captured:
            typeof localData.gpsCaptured === "boolean"
              ? localData.gpsCaptured
              : null,
          gps_latitude:
            typeof localData.gpsLatitude === "number"
              ? localData.gpsLatitude
              : null,
          gps_longitude:
            typeof localData.gpsLongitude === "number"
              ? localData.gpsLongitude
              : null,
          internet_available:
            typeof localData.internetAvailable === "boolean"
              ? localData.internetAvailable
              : null,
          status: "draft",
          information_provider:
            typeof localData.informationProvider === "string"
              ? localData.informationProvider
              : null,
        };

        setOfflineMessage(
          "This survey was restored from the saved offline draft."
        );
      }

      if (!surveyData) {
        setError(
          isOnline
            ? "Survey could not be found."
            : "This survey is not available offline yet."
        );
        setLoading(false);
        return;
      }

      /*
       * Profile is normally loaded from Supabase.
       * If offline, keep the page usable even if the profile
       * request is unavailable.
       */
      if (isOnline) {
        const { data: profileData, error: profileError } =
          await supabase
            .from("profiles")
            .select("full_name, employee_code")
            .eq("id", user.id)
            .single();

        if (!profileError && profileData) {
          setProfile(profileData);
        }
      }

      /*
       * Start with values from the online survey.
       */
      let nextGpsCaptured =
        surveyData.gps_captured === null
          ? ""
          : surveyData.gps_captured
            ? "Yes"
            : "No";

      let nextGpsLatitude =
        surveyData.gps_latitude === null
          ? ""
          : String(surveyData.gps_latitude);

      let nextGpsLongitude =
        surveyData.gps_longitude === null
          ? ""
          : String(surveyData.gps_longitude);

      let nextInternetAvailable =
        surveyData.internet_available === null
          ? ""
          : surveyData.internet_available
            ? "Yes"
            : "No";

      let nextInformationProvider =
        surveyData.information_provider ?? "";

      /*
       * Local offline data has priority because it may contain
       * newer unsynced changes.
       */
      if (offlineDraft) {
        const localData = offlineDraft.data;

        if (
          typeof localData.gpsCaptured === "string"
        ) {
          nextGpsCaptured = localData.gpsCaptured;
        }

        if (typeof localData.gpsLatitude === "number") {
          nextGpsLatitude = String(localData.gpsLatitude);
        }

        if (typeof localData.gpsLongitude === "number") {
          nextGpsLongitude = String(localData.gpsLongitude);
        }

        if (
          typeof localData.internetAvailable === "string"
        ) {
          nextInternetAvailable =
            localData.internetAvailable;
        }

        if (
          typeof localData.informationProvider === "string"
        ) {
          nextInformationProvider =
            localData.informationProvider;
        }

        if (offlineDraft.status !== "synced") {
          setOfflineMessage(
            "Saved offline changes have been restored."
          );
        }
      }

      setSurvey(surveyData);
      setGpsCaptured(nextGpsCaptured);
      setGpsLatitude(nextGpsLatitude);
      setGpsLongitude(nextGpsLongitude);
      setInternetAvailable(nextInternetAvailable);
      setInformationProvider(nextInformationProvider);

      setLoading(false);
    }

    loadSurvey();
  }, [surveyId, router, supabase, isOnline]);

  function captureGps() {
    setError("");
    setOfflineMessage("");

    if (!navigator.geolocation) {
      setError("Location is not supported by this browser.");
      return;
    }

    setCapturingGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLatitude(String(position.coords.latitude));
        setGpsLongitude(String(position.coords.longitude));
        setGpsCaptured("Yes");
        setCapturingGps(false);
      },
      (positionError) => {
        console.error(positionError);
        setGpsCaptured("No");
        setCapturingGps(false);
        setError(
          "Unable to capture GPS. Please allow location access and try again."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }

  async function saveSectionOffline() {
    if (!survey) {
      throw new Error("Survey information is missing.");
    }

    await saveSurveySectionOffline({
      surveyId,
      surveyCode: survey.survey_code,
      section: "A",
      data: {
        survey_id: surveyId,
        farmerId: survey.farmer_id,
        fieldId: survey.field_id,
        enumeratorId: survey.enumerator_id,
        survey_version: survey.survey_version,
        status: survey.status || "draft",
        gpsCaptured,
        gpsLatitude:
          gpsLatitude.trim() !== ""
            ? Number(gpsLatitude)
            : null,
        gpsLongitude:
          gpsLongitude.trim() !== ""
            ? Number(gpsLongitude)
            : null,
        internetAvailable,
        informationProvider,
        visitDate:
          survey.visit_date ??
          new Date().toISOString().split("T")[0],
      },
    });
  }

  async function handleSaveAndContinue() {
    setError("");
    setOfflineMessage("");

    if (!gpsCaptured) {
      setError("Please select whether GPS was captured.");
      return;
    }

    if (gpsCaptured === "Yes" && (!gpsLatitude || !gpsLongitude)) {
      setError("GPS is marked as captured, but latitude and longitude are missing. Please capture GPS again.");
      return;
    }

    if (!internetAvailable) {
      setError("Please select whether internet was available.");
      return;
    }

    if (!informationProvider) {
      setError(
        "Please select who provided the information."
      );
      return;
    }

    setSaving(true);

    try {
      /*
       * Always save locally first.
       * This protects the data even if the connection
       * disappears while saving.
       */
      await saveSectionOffline();

      /*
       * If offline, continue immediately.
       * OfflineSyncManager will sync Section A later.
       */
      if (!navigator.onLine) {
        setOfflineMessage(
          "Section A saved on this device. It will sync automatically when internet returns."
        );

        router.push(`/surveys/${surveyId}/b`);
        return;
      }

      /*
       * Online save to Supabase.
       */
      const { error: updateError } = await supabase
        .from("surveys")
        .update({
          gps_captured: gpsCaptured === "Yes",
          gps_latitude:
            gpsLatitude.trim() !== ""
              ? Number(gpsLatitude)
              : null,
          gps_longitude:
            gpsLongitude.trim() !== ""
              ? Number(gpsLongitude)
              : null,
          internet_available:
            internetAvailable === "Yes",
          information_provider:
            informationProvider,
          visit_date:
            survey?.visit_date ??
            new Date().toISOString().split("T")[0],
        })
        .eq("id", surveyId);

      if (updateError) {
        /*
         * Local copy is already safe.
         * Leave it as unsynced so the sync manager can retry.
         */
        console.error(updateError);

        setOfflineMessage(
          "Section A was saved on this device. It will retry syncing when the connection is available."
        );

        router.push(`/surveys/${surveyId}/b`);
        return;
      }

      /*
       * Supabase save succeeded, so the local section
       * can be marked as synced.
       */
      await markSectionSynced(surveyId, "A");

      router.push(`/surveys/${surveyId}/b`);
    } catch (error) {
      console.error(error);

      /*
       * Try to preserve the data locally even if something
       * unexpected happens.
       */
      try {
        await saveSectionOffline();

        setOfflineMessage(
          "Section A was saved locally and will be synced later."
        );

        router.push(`/surveys/${surveyId}/b`);
      } catch (offlineError) {
        console.error(
          "Unable to save Section A offline:",
          offlineError
        );

        setError(
          "Unable to save Section A. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndExit() {
    setError("");
    setOfflineMessage("");
    setSaving(true);

    try {
      /*
       * Save whatever has been entered without requiring
       * the Section A fields to be complete.
       */
      await saveSectionOffline();

      if (navigator.onLine) {
        const { error: updateError } = await supabase
          .from("surveys")
          .update({
            gps_captured:
              gpsCaptured === ""
                ? null
                : gpsCaptured === "Yes",
            internet_available:
              internetAvailable === ""
                ? null
                : internetAvailable === "Yes",
            information_provider:
              informationProvider || null,
            visit_date:
              survey?.visit_date ??
              new Date().toISOString().split("T")[0],
          })
          .eq("id", surveyId);

        if (!updateError) {
          await markSectionSynced(surveyId, "A");
        }
      }

      router.push("/drafts");
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save the draft. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <main className="min-h-screen bg-[var(--background)]">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading survey...
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
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

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
                  Survey {survey.survey_code}
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  A — Survey & Enumerator Details
                </h1>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Record the basic details of this field visit.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--muted)]">
                  Survey progress
                </p>

                <p className="mt-1 text-sm font-semibold">
                  Section A of P
                </p>
              </div>

              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Draft
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: "6.25%" }}
              />
            </div>
          </div>

          {offlineMessage && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {offlineMessage}
            </div>
          )}

          {!isOnline && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              You are currently offline. Your changes will be
              saved on this device and synced automatically
              when internet returns.
            </div>
          )}

          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">
            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Survey information
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                Some values are automatically taken from the
                logged-in account and survey record.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Survey ID
                </label>

                <input
                  value={survey.survey_code}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Enumerator / Intern ID
                </label>

                <input
                  value={profile?.employee_code ?? ""}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Enumerator name
                </label>

                <input
                  value={profile?.full_name ?? ""}
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Visit date
                </label>

                <input
                  value={
                    survey.visit_date
                      ? survey.visit_date
                      : "Will be recorded when saved"
                  }
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Visit time
                </label>

                <input
                  value={
                    survey.visit_time
                      ? new Date(
                          survey.visit_time
                        ).toLocaleTimeString()
                      : "Automatically recorded"
                  }
                  readOnly
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      GPS captured <span className="text-red-600">*</span>
                    </label>
                    <p className="text-xs text-[var(--muted)]">
                      Capture the device location for this survey visit.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={captureGps}
                    disabled={saving || capturingGps}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--primary)] bg-white px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--light-green)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {capturingGps ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Capturing GPS...
                      </>
                    ) : (
                      <>
                        <MapPin size={17} />
                        Capture GPS
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                      GPS status
                    </label>
                    <input
                      value={gpsCaptured || "Not captured"}
                      readOnly
                      className="h-11 w-full rounded-lg border border-[var(--border)] bg-slate-50 px-3 text-sm text-slate-600 outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="gpsLatitude" className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                      Latitude
                    </label>
                    <input
                      id="gpsLatitude"
                      value={gpsLatitude}
                      onChange={(event) => setGpsLatitude(event.target.value)}
                      type="number"
                      step="any"
                      placeholder="e.g. 11.0168"
                      disabled={saving}
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="gpsLongitude" className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
                      Longitude
                    </label>
                    <input
                      id="gpsLongitude"
                      value={gpsLongitude}
                      onChange={(event) => setGpsLongitude(event.target.value)}
                      type="number"
                      step="any"
                      placeholder="e.g. 76.9558"
                      disabled={saving}
                      className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="internet"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Internet available{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="internet"
                  value={internetAvailable}
                  onChange={(event) =>
                    setInternetAvailable(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select option
                  </option>

                  <option value="Yes">Yes</option>

                  <option value="No">No</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="provider"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Information provider{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="provider"
                  value={informationProvider}
                  onChange={(event) =>
                    setInformationProvider(
                      event.target.value
                    )
                  }
                  disabled={saving}
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100"
                >
                  <option value="">
                    Select information provider
                  </option>

                  <option value="Farmer">
                    Farmer
                  </option>

                  <option value="Family member">
                    Family member
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
            </div>
          </section>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleSaveAndExit}
              disabled={saving}
              className="h-11 rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60"
            >
              Save & Exit
            </button>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={saving}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Section B
                  <MapPin size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </InternLayout>
  );
}