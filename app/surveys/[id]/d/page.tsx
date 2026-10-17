"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InternLayout from "@/components/layout/InternLayout";
import { createClient } from "@/lib/supabase/client";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  getSurveySectionOffline,
  saveSurveySectionOffline,
  markSectionSynced,
} from "@/lib/offline/surveyManager";

export default function SectionDPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fieldId, setFieldId] = useState("");

  const [soilType, setSoilType] = useState("");
  const [soilColour, setSoilColour] = useState("");
  const [soilTexture, setSoilTexture] = useState("");
  const [drainage, setDrainage] = useState("");
  const [fertility, setFertility] = useState("");

  const [soilTestDone, setSoilTestDone] = useState("");
  const [soilReportPath, setSoilReportPath] = useState("");

  const [ph, setPh] = useState("");
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");

  const [organicMatterManureRegular, setOrganicMatterManureRegular] =
    useState("");
  const [manureType, setManureType] = useState("");
  const [recurringSoilProblems, setRecurringSoilProblems] = useState("");

  useEffect(() => {
    loadSectionD();
  }, [surveyId, isOnline]);

  async function loadSectionD() {
    setLoading(true);
    setError("");

    const localDraft = await getSurveySectionOffline(
      surveyId,
      "D"
    );

    const localC = await getSurveySectionOffline(
      surveyId,
      "C"
    );

    const localData =
      localDraft?.data &&
      typeof localDraft.data === "object"
        ? localDraft.data
        : null;

    const localCData =
      localC?.data &&
      typeof localC.data === "object"
        ? localC.data
        : null;

    let resolvedFieldId =
      typeof localData?.fieldId === "string"
        ? localData.fieldId
        : typeof localCData?.fieldId === "string"
        ? localCData.fieldId
        : "";

    if (isOnline) {
      const {
        data: survey,
        error: surveyError,
      } = await supabase
        .from("surveys")
        .select("id, survey_code, field_id")
        .eq("id", surveyId)
        .single();

      if (surveyError || !survey) {
        console.error(surveyError);

        if (!localDraft && !localC) {
          setError("Survey could not be found.");
          setLoading(false);
          return;
        }
      } else {
        resolvedFieldId = survey.field_id;
      }

      if (resolvedFieldId) {
        const { data: soilData, error: soilError } =
          await supabase
            .from("soil_information")
            .select("*")
            .eq("survey_id", surveyId)
            .maybeSingle();

        if (soilError) {
          console.error(soilError);

          if (!localDraft) {
            setError("Could not load soil information.");
            setLoading(false);
            return;
          }
        }

        if (soilData) {
          setSoilType(soilData.soil_type ?? "");
          setSoilColour(soilData.soil_colour ?? "");
          setSoilTexture(soilData.soil_texture ?? "");
          setDrainage(soilData.drainage ?? "");
          setFertility(soilData.fertility ?? "");

          setSoilTestDone(
            soilData.soil_test_done === null ||
              soilData.soil_test_done === undefined
              ? ""
              : soilData.soil_test_done
              ? "yes"
              : "no"
          );

          setSoilReportPath(
            soilData.soil_report_path ?? ""
          );

          setPh(soilData.ph?.toString() ?? "");
          setNitrogen(
            soilData.nitrogen?.toString() ?? ""
          );
          setPhosphorus(
            soilData.phosphorus?.toString() ?? ""
          );
          setPotassium(
            soilData.potassium?.toString() ?? ""
          );

          setOrganicMatterManureRegular(
            soilData.organic_matter_manure_regular ===
              null ||
              soilData.organic_matter_manure_regular ===
                undefined
              ? ""
              : soilData.organic_matter_manure_regular
              ? "yes"
              : "no"
          );

          setManureType(
            soilData.manure_type ?? ""
          );

          setRecurringSoilProblems(
            soilData.recurring_soil_problems ?? ""
          );
        }
      }
    }

    if (localData) {
      setFieldId(
        typeof localData.fieldId === "string"
          ? localData.fieldId
          : resolvedFieldId
      );

      if (typeof localData.soil_type === "string") {
        setSoilType(localData.soil_type);
      }

      if (typeof localData.soil_colour === "string") {
        setSoilColour(localData.soil_colour);
      }

      if (typeof localData.soil_texture === "string") {
        setSoilTexture(localData.soil_texture);
      }

      if (typeof localData.drainage === "string") {
        setDrainage(localData.drainage);
      }

      if (typeof localData.fertility === "string") {
        setFertility(localData.fertility);
      }

      if (
        typeof localData.soil_test_done === "boolean"
      ) {
        setSoilTestDone(
          localData.soil_test_done
            ? "yes"
            : "no"
        );
      }

      if (
        typeof localData.soil_report_path === "string"
      ) {
        setSoilReportPath(
          localData.soil_report_path
        );
      }

      if (
        typeof localData.ph === "number"
      ) {
        setPh(String(localData.ph));
      }

      if (
        typeof localData.nitrogen === "number"
      ) {
        setNitrogen(
          String(localData.nitrogen)
        );
      }

      if (
        typeof localData.phosphorus === "number"
      ) {
        setPhosphorus(
          String(localData.phosphorus)
        );
      }

      if (
        typeof localData.potassium === "number"
      ) {
        setPotassium(
          String(localData.potassium)
        );
      }

      if (
        typeof localData.organic_matter_manure_regular ===
        "boolean"
      ) {
        setOrganicMatterManureRegular(
          localData.organic_matter_manure_regular
            ? "yes"
            : "no"
        );
      }

      if (
        typeof localData.manure_type === "string"
      ) {
        setManureType(
          localData.manure_type
        );
      }

      if (
        typeof localData.recurring_soil_problems ===
        "string"
      ) {
        setRecurringSoilProblems(
          localData.recurring_soil_problems
        );
      }
    } else {
      setFieldId(resolvedFieldId);
    }

    setLoading(false);
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    setError("");

    if (!fieldId) {
      setError(
        "Field information is missing. Please go back to Section C."
      );
      setSaving(false);
      return;
    }

    const soilPayload: Record<string, unknown> = {
      fieldId,

      soil_type: soilType || null,
      soil_colour: soilColour || null,
      soil_texture: soilTexture || null,
      drainage: drainage || null,
      fertility: fertility || null,

      soil_test_done:
        soilTestDone === ""
          ? null
          : soilTestDone === "yes",

      soil_report_path:
        soilReportPath || null,

      ph:
        ph === ""
          ? null
          : Number(ph),

      nitrogen:
        nitrogen === ""
          ? null
          : Number(nitrogen),

      phosphorus:
        phosphorus === ""
          ? null
          : Number(phosphorus),

      potassium:
        potassium === ""
          ? null
          : Number(potassium),

      organic_matter_manure_regular:
        organicMatterManureRegular === ""
          ? null
          : organicMatterManureRegular === "yes",

      manure_type:
        manureType || null,

      recurring_soil_problems:
        recurringSoilProblems || null,
    };

    try {
      const localSurvey = await getSurveySectionOffline(
        surveyId,
        "A"
      );

      const surveyCode =
        localDraftSurveyCode(localSurvey) ||
        "Offline Survey";

      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "D",
        data: soilPayload,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/e`);
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        soil_type: soilType || null,
        soil_colour: soilColour || null,
        soil_texture: soilTexture || null,
        drainage: drainage || null,
        fertility: fertility || null,

        soil_test_done:
          soilTestDone === ""
            ? null
            : soilTestDone === "yes",

        soil_report_path:
          soilReportPath || null,

        ph:
          ph === ""
            ? null
            : Number(ph),

        nitrogen:
          nitrogen === ""
            ? null
            : Number(nitrogen),

        phosphorus:
          phosphorus === ""
            ? null
            : Number(phosphorus),

        potassium:
          potassium === ""
            ? null
            : Number(potassium),

        organic_matter_manure_regular:
          organicMatterManureRegular === ""
            ? null
            : organicMatterManureRegular === "yes",

        manure_type:
          manureType || null,

        recurring_soil_problems:
          recurringSoilProblems || null,
      };

      const { error: saveError } =
        await supabase
          .from("soil_information")
          .upsert(onlinePayload, {
            onConflict: "survey_id",
          });

      if (saveError) {
        console.error(saveError);
        setError(
          "Could not save soil information."
        );
        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "D"
      );

      router.push(
        `/surveys/${surveyId}/e`
      );
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Could not save soil information."
      );

      setSaving(false);
    }
  }

  function localDraftSurveyCode(
    draft: Awaited<
      ReturnType<typeof getSurveySectionOffline>
    >
  ) {
    return draft?.surveyCode || "";
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-500">
          Loading soil details...
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-5xl p-4 sm:p-6">

        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-green-700">
            Survey Section D
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Soil Details
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record the soil characteristics and soil-related information
            for this field.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section D of P
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "25%" }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your soil details will be saved
            on this device and synchronized when the connection
            returns.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Soil Characteristics
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Soil Type
              </label>
              <input
                value={soilType}
                onChange={(e) =>
                  setSoilType(e.target.value)
                }
                placeholder="Enter soil type"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Soil Colour
              </label>
              <input
                value={soilColour}
                onChange={(e) =>
                  setSoilColour(e.target.value)
                }
                placeholder="Enter soil colour"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Soil Texture
              </label>

              <select
                value={soilTexture}
                onChange={(e) =>
                  setSoilTexture(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
              >
                <option value="">
                  Select texture
                </option>
                <option value="Sandy">
                  Sandy
                </option>
                <option value="Loamy">
                  Loamy
                </option>
                <option value="Clay">
                  Clay
                </option>
                <option value="Mixed">
                  Mixed
                </option>
                <option value="Don't know">
                  Don't know
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Drainage
              </label>

              <select
                value={drainage}
                onChange={(e) =>
                  setDrainage(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
              >
                <option value="">
                  Select drainage
                </option>
                <option value="Good">
                  Good
                </option>
                <option value="Moderate">
                  Moderate
                </option>
                <option value="Poor">
                  Poor
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Fertility
              </label>

              <select
                value={fertility}
                onChange={(e) =>
                  setFertility(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
              >
                <option value="">
                  Select fertility
                </option>
                <option value="Good">
                  Good
                </option>
                <option value="Average">
                  Average
                </option>
                <option value="Poor">
                  Poor
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Soil Testing
          </h2>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Has the soil been tested?
            </label>

            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <input
                  type="radio"
                  name="soilTestDone"
                  value="yes"
                  checked={
                    soilTestDone === "yes"
                  }
                  onChange={(e) =>
                    setSoilTestDone(
                      e.target.value
                    )
                  }
                />
                <span className="text-sm">
                  Yes
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <input
                  type="radio"
                  name="soilTestDone"
                  value="no"
                  checked={
                    soilTestDone === "no"
                  }
                  onChange={(e) =>
                    setSoilTestDone(
                      e.target.value
                    )
                  }
                />
                <span className="text-sm">
                  No
                </span>
              </label>
            </div>
          </div>

          {soilTestDone === "yes" && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Soil Report
              </label>

              <input
                value={soilReportPath}
                onChange={(e) =>
                  setSoilReportPath(
                    e.target.value
                  )
                }
                placeholder="Soil report path / file reference"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />

              <p className="mt-1 text-xs text-slate-500">
                Actual document upload will be connected
                during the Storage/media phase.
              </p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">
            Soil Test Values
          </h2>

          <p className="mb-4 text-sm text-slate-500">
            Enter values only if they are available from the
            farmer or soil report.
          </p>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                pH
              </label>

              <input
                type="number"
                step="any"
                value={ph}
                onChange={(e) =>
                  setPh(e.target.value)
                }
                placeholder="e.g. 6.5"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nitrogen
              </label>

              <input
                type="number"
                step="any"
                value={nitrogen}
                onChange={(e) =>
                  setNitrogen(e.target.value)
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Phosphorus
              </label>

              <input
                type="number"
                step="any"
                value={phosphorus}
                onChange={(e) =>
                  setPhosphorus(
                    e.target.value
                  )
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Potassium
              </label>

              <input
                type="number"
                step="any"
                value={potassium}
                onChange={(e) =>
                  setPotassium(
                    e.target.value
                  )
                }
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Organic Matter & Manure
          </h2>

          <div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Is organic matter/manure used regularly?
            </label>

            <div className="flex flex-wrap gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <input
                  type="radio"
                  name="organicMatter"
                  value="yes"
                  checked={
                    organicMatterManureRegular ===
                    "yes"
                  }
                  onChange={(e) =>
                    setOrganicMatterManureRegular(
                      e.target.value
                    )
                  }
                />
                <span className="text-sm">
                  Yes
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
                <input
                  type="radio"
                  name="organicMatter"
                  value="no"
                  checked={
                    organicMatterManureRegular ===
                    "no"
                  }
                  onChange={(e) =>
                    setOrganicMatterManureRegular(
                      e.target.value
                    )
                  }
                />
                <span className="text-sm">
                  No
                </span>
              </label>
            </div>
          </div>

          {organicMatterManureRegular === "yes" && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type of manure / organic matter
              </label>

              <input
                value={manureType}
                onChange={(e) =>
                  setManureType(
                    e.target.value
                  )
                }
                placeholder="e.g. Farmyard manure, compost"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600"
              />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Recurring Soil Problems
          </h2>

          <textarea
            value={recurringSoilProblems}
            onChange={(e) =>
              setRecurringSoilProblems(
                e.target.value
              )
            }
            rows={4}
            placeholder="Describe any recurring soil-related problems..."
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/c`
              )
            }
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={handleSaveAndContinue}
            className="rounded-lg bg-green-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : isOnline
              ? "Save & Continue"
              : "Save Offline & Continue"}
          </button>
        </div>
      </div>
    </InternLayout>
  );
}