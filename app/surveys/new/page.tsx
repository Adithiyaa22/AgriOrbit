"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Play,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";

import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import { saveSurveySectionOffline } from "@/lib/offline/surveyManager";
import {
  cacheFarmers,
  cacheFields,
  getCachedFarmers,
  getCachedFields,
} from "@/lib/offline/referenceData";
import { getClientUser } from "@/lib/auth/get-client-user";

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
  field_name: string;
  area: number | null;
  area_unit: string | null;
};

export default function NewSurveyPage() {
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [fields, setFields] = useState<Field[]>([]);

  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");

  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [starting, setStarting] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const requestedFarmer = new URLSearchParams(window.location.search).get("farmer");
    if (requestedFarmer) setFarmerId(requestedFarmer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFarmers() {
      setLoadingFarmers(true);
      setError("");

      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("farmers")
            .select(
              "id, farmer_code, full_name, village, district"
            )
            .order("full_name", { ascending: true });

          if (!error && data) {
            await cacheFarmers(data);
            if (!cancelled) setFarmers(data);
            setLoadingFarmers(false);
            return;
          }

          console.error(error);
        }

        const cached = await getCachedFarmers();

        if (!cancelled) {
          setFarmers(cached);
          if (cached.length === 0) {
            setError(
              "No farmer data is available offline. Open this screen while connected once to cache the farmer list."
            );
          }
        }
      } catch (error) {
        console.error("Unable to load farmers:", error);
        const cached = await getCachedFarmers();
        if (!cancelled) {
          setFarmers(cached);
          setError(
            cached.length > 0
              ? "Using the farmers saved on this device."
              : "Unable to load farmers."
          );
        }
      } finally {
        if (!cancelled) setLoadingFarmers(false);
      }
    }

    loadFarmers();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);

  useEffect(() => {
    let cancelled = false;

    async function loadFields() {
      if (!farmerId) {
        setFields([]);
        setFieldId("");
        return;
      }

      setLoadingFields(true);
      setFieldId("");
      setError("");

      try {
        if (navigator.onLine) {
          const { data, error } = await supabase
            .from("fields")
            .select(
              "id, field_code, field_name, area, area_unit"
            )
            .eq("farmer_id", farmerId)
            .order("field_name", { ascending: true });

          if (!error && data) {
            await cacheFields(
              data.map((field) => ({
                ...field,
                farmerId,
              }))
            );
            if (!cancelled) setFields(data);
            setLoadingFields(false);
            return;
          }

          console.error(error);
        }

        const cached = await getCachedFields(farmerId);
        if (!cancelled) {
          setFields(cached);
          if (cached.length === 0) {
            setError(
              "No fields for this farmer are available offline. Open the farmer's field list while connected once to cache them."
            );
          }
        }
      } catch (error) {
        console.error("Unable to load fields:", error);
        const cached = await getCachedFields(farmerId);
        if (!cancelled) {
          setFields(cached);
          setError(
            cached.length > 0
              ? "Using the fields saved on this device."
              : "Unable to load fields for this farmer."
          );
        }
      } finally {
        if (!cancelled) setLoadingFields(false);
      }
    }

    loadFields();

    return () => {
      cancelled = true;
    };
  }, [farmerId, isOnline]);

  async function handleStartSurvey() {
    setError("");

    if (!farmerId) {
      setError("Please select a farmer.");
      return;
    }

    if (!fieldId) {
      setError("Please select a field.");
      return;
    }

    setStarting(true);

    const user = await getClientUser();

    if (!user) {
      setError(
        "Your session has expired. Please log in again."
      );
      setStarting(false);
      return;
    }

    const surveyId = crypto.randomUUID();

    const localSurveyData = {
      survey_id: surveyId,
      farmerId,
      fieldId,
      enumeratorId: user.id,
      survey_version: 1,
      status: "draft",
      visitDate: new Date().toISOString().split("T")[0],
    };

    try {
      /*
       * Always save the initial survey information locally.
       * This guarantees that the survey can be recovered even
       * if the internet connection disappears immediately.
       */
      await saveSurveySectionOffline({
        surveyId,
        surveyCode: `LOCAL-${surveyId.slice(0, 8).toUpperCase()}`,
        section: "A",
        data: localSurveyData,
      });

      /*
       * If online, create the actual Supabase survey row
       * using the same UUID generated locally.
       */
      if (navigator.onLine) {
        const { data, error } = await supabase
          .from("surveys")
          .insert({
            id: surveyId,
            farmer_id: farmerId,
            field_id: fieldId,
            enumerator_id: user.id,
            survey_version: 1,
            status: "draft",
          })
          .select("id, survey_code")
          .single();

        if (error) {
          console.error(error);

          /*
           * The local draft is already saved, so even if
           * the online creation fails, the user can continue
           * from the locally saved survey.
           */
          router.push(`/surveys/${surveyId}/a`);
          return;
        }

        /*
         * Replace the temporary local survey code with the
         * real Supabase survey code.
         */
        await saveSurveySectionOffline({
          surveyId,
          surveyCode: data.survey_code,
          section: "A",
          data: localSurveyData,
        });
      }

      router.push(`/surveys/${surveyId}/a`);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to start the survey."
      );

      setStarting(false);
    }
  }

  const selectedFarmer = farmers.find(
    (item) => item.id === farmerId
  );

  const selectedField = fields.find(
    (item) => item.id === fieldId
  );

  return (
    <InternLayout>
      <main className="min-h-screen bg-[var(--background)] text-[var(--text)]">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

          <Link
            href="/farmers"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] hover:underline"
          >
            <ArrowLeft size={17} />
            Back to Farmers
          </Link>

          <section className="mb-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--light-green)] text-[var(--primary)]">
                <ClipboardList size={21} />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--primary)]">
                  Field Data Collection
                </p>

                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                  Start New Survey
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                  Select the farmer and field before beginning the survey.
                </p>
              </div>
            </div>
          </section>

          {!isOnline && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <WifiOff
                size={18}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  You are offline
                </p>

                <p className="mt-1">
                  You can start a survey offline when the farmer
                  and field were previously cached on this device.
                </p>
              </div>
            </div>
          )}

          <section className="rounded-xl border border-[var(--border)] bg-white shadow-sm">

            <div className="border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-semibold">
                Survey setup
              </h2>

              <p className="mt-1 text-xs text-[var(--muted)]">
                This will create a new draft survey linked
                to the selected farmer and field.
              </p>
            </div>

            <div className="space-y-5 p-5">

              <div>
                <label
                  htmlFor="farmer"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Farmer{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="farmer"
                  value={farmerId}
                  onChange={(event) => {
                    setFarmerId(event.target.value);
                    setError("");
                  }}
                  disabled={
                    loadingFarmers ||
                    starting
                  }
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {loadingFarmers
                      ? "Loading farmers..."
                      : farmers.length === 0
                      ? "No cached farmers"
                      : "Select farmer"}
                  </option>

                  {farmers.map((farmer) => (
                    <option
                      key={farmer.id}
                      value={farmer.id}
                    >
                      {farmer.full_name} —{" "}
                      {farmer.farmer_code}
                      {farmer.village
                        ? ` — ${farmer.village}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedFarmer && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    Selected farmer
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {selectedFarmer.full_name}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {selectedFarmer.farmer_code}
                    {selectedFarmer.village
                      ? ` · ${selectedFarmer.village}`
                      : ""}
                    {selectedFarmer.district
                      ? ` · ${selectedFarmer.district}`
                      : ""}
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="field"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Field{" "}
                  <span className="text-red-600">*</span>
                </label>

                <select
                  id="field"
                  value={fieldId}
                  onChange={(event) => {
                    setFieldId(event.target.value);
                    setError("");
                  }}
                  disabled={
                    !farmerId ||
                    loadingFields ||
                    starting
                  }
                  className="h-11 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                >
                  <option value="">
                    {!farmerId
                      ? "Select a farmer first"
                      : loadingFields
                      ? "Loading fields..."
                      : fields.length === 0
                      ? "No fields registered"
                      : "Select field"}
                  </option>

                  {fields.map((field) => (
                    <option
                      key={field.id}
                      value={field.id}
                    >
                      {field.field_name} —{" "}
                      {field.field_code}
                      {field.area
                        ? ` — ${field.area} ${
                            field.area_unit ?? ""
                          }`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedField && (
                <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                  <p className="text-xs font-medium text-[var(--muted)]">
                    Selected field
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {selectedField.field_name}
                  </p>

                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {selectedField.field_code}
                    {selectedField.area
                      ? ` · ${selectedField.area} ${
                          selectedField.area_unit ?? ""
                        }`
                      : ""}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                The survey will be created as a{" "}
                <strong>Draft</strong>. You can complete
                the survey and submit it later.
              </div>

              {!isOnline && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <strong>Offline note:</strong> This survey will be
                  stored on this device first and synchronized when
                  the connection returns.
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">

                <Link
                  href="/farmers"
                  className="flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-white px-6 text-sm font-semibold transition hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="button"
                  onClick={handleStartSurvey}
                  disabled={
                    starting ||
                    !farmerId ||
                    !fieldId
                  }
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Starting Survey...
                    </>
                  ) : (
                    <>
                      <Play size={18} />
                      Start Survey
                    </>
                  )}
                </button>

              </div>
            </div>
          </section>
        </div>
      </main>
    </InternLayout>
  );
}