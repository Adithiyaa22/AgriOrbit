"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import InternLayout from "@/components/layout/InternLayout";
import VoiceRecorder from "@/components/survey/VoiceRecorder";
import { createClient } from "@/lib/supabase/client";
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
};

export default function SectionEPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [survey, setSurvey] = useState<Survey | null>(null);

  const [fieldId, setFieldId] = useState("");
  const [farmerId, setFarmerId] = useState("");

  const [existingVoicePath, setExistingVoicePath] =
    useState<string | null>(null);

  const [seasonsCultivated, setSeasonsCultivated] = useState("");
  const [cropPerSeason, setCropPerSeason] = useState("");
  const [previousCrop, setPreviousCrop] = useState("");
  const [currentCrop, setCurrentCrop] = useState("");
  const [variety, setVariety] = useState("");

  const [area, setArea] = useState("");
  const [areaUnit, setAreaUnit] = useState("");

  const [sowingDate, setSowingDate] = useState("");
  const [expectedHarvestDate, setExpectedHarvestDate] =
    useState("");
  const [actualHarvestDate, setActualHarvestDate] =
    useState("");

  const [cropSelectionReason, setCropSelectionReason] =
    useState("");

  const [cropRotation, setCropRotation] = useState("");
  const [rotatedCrops, setRotatedCrops] = useState("");

  const [historicallyBestCrop, setHistoricallyBestCrop] =
    useState("");

  const [poorPerformingCrop, setPoorPerformingCrop] =
    useState("");

  const [
    poorPerformingCropReason,
    setPoorPerformingCropReason,
  ] = useState("");

  useEffect(() => {
    loadSectionE();
  }, [surveyId, isOnline]);

  async function loadSectionE() {
    setLoading(true);
    setError("");

    let onlineSurvey: Survey | null = null;

    if (isOnline) {
      const { data: surveyData, error: surveyError } =
        await supabase
          .from("surveys")
          .select(
            "id, survey_code, farmer_id, field_id"
          )
          .eq("id", surveyId)
          .single();

      if (surveyError || !surveyData) {
        console.error(surveyError);
      } else {
        onlineSurvey = surveyData;
      }
    }

    const localDraft = await getSurveySectionOffline(
      surveyId,
      "E"
    );

    const localSectionA = await getSurveySectionOffline(
      surveyId,
      "A"
    );

    if (!onlineSurvey && !localDraft) {
      setError(
        "Survey information could not be loaded. Please open the survey while online first."
      );
      setLoading(false);
      return;
    }

    let activeSurvey: Survey | null = onlineSurvey;

    if (!activeSurvey) {
      const localData =
        localSectionA?.data ?? localDraft?.data ?? {};

      const localFarmerId =
        typeof localData.farmerId === "string"
          ? localData.farmerId
          : "";

      const localFieldId =
        typeof localData.fieldId === "string"
          ? localData.fieldId
          : "";

      const localSurveyCode =
        typeof localSectionA?.surveyCode === "string"
          ? localSectionA.surveyCode
          : typeof localDraft?.surveyCode === "string"
            ? localDraft.surveyCode
            : "Offline Survey";

      if (!localFarmerId || !localFieldId) {
        setError(
          "Survey information is incomplete for offline use."
        );
        setLoading(false);
        return;
      }

      activeSurvey = {
        id: surveyId,
        survey_code: localSurveyCode,
        farmer_id: localFarmerId,
        field_id: localFieldId,
      };
    }

    setSurvey(activeSurvey);
    setFieldId(activeSurvey.field_id);
    setFarmerId(activeSurvey.farmer_id);

    let onlineCropData: Record<string, unknown> | null =
      null;

    if (isOnline && onlineSurvey) {
      const { data: cropData, error: cropError } =
        await supabase
          .from("crop_information")
          .select("*")
          .eq("survey_id", surveyId)
          .maybeSingle();

      if (cropError) {
        console.error(cropError);
      } else if (cropData) {
        onlineCropData = cropData;
      }

      const { data: voiceData, error: voiceError } =
        await supabase
          .from("voice_notes")
          .select("storage_path")
          .eq("survey_id", surveyId)
          .eq("section", "E")
          .eq("question_key", "crop_history")
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

      if (voiceError) {
        console.error(voiceError);
      }

      if (voiceData?.storage_path) {
        setExistingVoicePath(
          voiceData.storage_path
        );
      }
    }

    const localData =
      localDraft?.data ?? {};

    const cropData =
      onlineCropData ?? null;

    setSeasonsCultivated(
      typeof localData.seasons_cultivated === "string"
        ? localData.seasons_cultivated
        : typeof cropData?.seasons_cultivated === "string"
          ? cropData.seasons_cultivated
          : ""
    );

    setCropPerSeason(
      typeof localData.crop_per_season === "string"
        ? localData.crop_per_season
        : typeof cropData?.crop_per_season === "string"
          ? cropData.crop_per_season
          : ""
    );

    setPreviousCrop(
      typeof localData.previous_crop === "string"
        ? localData.previous_crop
        : typeof cropData?.previous_crop === "string"
          ? cropData.previous_crop
          : ""
    );

    setCurrentCrop(
      typeof localData.current_crop === "string"
        ? localData.current_crop
        : typeof cropData?.current_crop === "string"
          ? cropData.current_crop
          : ""
    );

    setVariety(
      typeof localData.variety === "string"
        ? localData.variety
        : typeof cropData?.variety === "string"
          ? cropData.variety
          : ""
    );

    setArea(
      localData.area !== undefined
        ? String(localData.area)
        : cropData?.area !== null &&
            cropData?.area !== undefined
          ? String(cropData.area)
          : ""
    );

    setAreaUnit(
      typeof localData.area_unit === "string"
        ? localData.area_unit
        : typeof cropData?.area_unit === "string"
          ? cropData.area_unit
          : ""
    );

    setSowingDate(
      typeof localData.sowing_date === "string"
        ? localData.sowing_date
        : typeof cropData?.sowing_date === "string"
          ? cropData.sowing_date
          : ""
    );

    setExpectedHarvestDate(
      typeof localData.expected_harvest_date === "string"
        ? localData.expected_harvest_date
        : typeof cropData?.expected_harvest_date === "string"
          ? cropData.expected_harvest_date
          : ""
    );

    setActualHarvestDate(
      typeof localData.actual_harvest_date === "string"
        ? localData.actual_harvest_date
        : typeof cropData?.actual_harvest_date === "string"
          ? cropData.actual_harvest_date
          : ""
    );

    setCropSelectionReason(
      typeof localData.crop_selection_reason === "string"
        ? localData.crop_selection_reason
        : typeof cropData?.crop_selection_reason === "string"
          ? cropData.crop_selection_reason
          : ""
    );

    if (localData.crop_rotation !== undefined) {
      setCropRotation(
        localData.crop_rotation === true ||
          localData.crop_rotation === "yes"
          ? "yes"
          : localData.crop_rotation === false ||
              localData.crop_rotation === "no"
            ? "no"
            : ""
      );
    } else if (
      cropData?.crop_rotation !== null &&
      cropData?.crop_rotation !== undefined
    ) {
      setCropRotation(
        cropData.crop_rotation
          ? "yes"
          : "no"
      );
    } else {
      setCropRotation("");
    }

    setRotatedCrops(
      typeof localData.rotated_crops === "string"
        ? localData.rotated_crops
        : typeof cropData?.rotated_crops === "string"
          ? cropData.rotated_crops
          : ""
    );

    setHistoricallyBestCrop(
      typeof localData.historically_best_crop === "string"
        ? localData.historically_best_crop
        : typeof cropData?.historically_best_crop === "string"
          ? cropData.historically_best_crop
          : ""
    );

    setPoorPerformingCrop(
      typeof localData.poor_performing_crop === "string"
        ? localData.poor_performing_crop
        : typeof cropData?.poor_performing_crop === "string"
          ? cropData.poor_performing_crop
          : ""
    );

    setPoorPerformingCropReason(
      typeof localData.poor_performing_crop_reason === "string"
        ? localData.poor_performing_crop_reason
        : typeof cropData?.poor_performing_crop_reason === "string"
          ? cropData.poor_performing_crop_reason
          : ""
    );

    setLoading(false);
  }

  async function handleSaveAndContinue() {
    setSaving(true);
    setError("");

    const cropPayload = {
      survey_id: surveyId,
      field_id: fieldId,

      seasons_cultivated:
        seasonsCultivated || null,

      crop_per_season:
        cropPerSeason || null,

      previous_crop:
        previousCrop || null,

      current_crop:
        currentCrop || null,

      variety:
        variety || null,

      area:
        area === ""
          ? null
          : Number(area),

      area_unit:
        areaUnit || null,

      sowing_date:
        sowingDate || null,

      expected_harvest_date:
        expectedHarvestDate || null,

      actual_harvest_date:
        actualHarvestDate || null,

      crop_selection_reason:
        cropSelectionReason || null,

      crop_rotation:
        cropRotation === ""
          ? null
          : cropRotation === "yes",

      rotated_crops:
        rotatedCrops || null,

      historically_best_crop:
        historicallyBestCrop || null,

      poor_performing_crop:
        poorPerformingCrop || null,

      poor_performing_crop_reason:
        poorPerformingCropReason || null,

      farmerId,
      fieldId,
      surveyId,
    };

    if (!survey) {
      setError("Survey information is missing.");
      setSaving(false);
      return;
    }

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode: survey.survey_code,
        section: "E",
        data: cropPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/f`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        seasons_cultivated:
          seasonsCultivated || null,

        crop_per_season:
          cropPerSeason || null,

        previous_crop:
          previousCrop || null,

        current_crop:
          currentCrop || null,

        variety:
          variety || null,

        area:
          area === ""
            ? null
            : Number(area),

        area_unit:
          areaUnit || null,

        sowing_date:
          sowingDate || null,

        expected_harvest_date:
          expectedHarvestDate || null,

        actual_harvest_date:
          actualHarvestDate || null,

        crop_selection_reason:
          cropSelectionReason || null,

        crop_rotation:
          cropRotation === ""
            ? null
            : cropRotation === "yes",

        rotated_crops:
          rotatedCrops || null,

        historically_best_crop:
          historicallyBestCrop || null,

        poor_performing_crop:
          poorPerformingCrop || null,

        poor_performing_crop_reason:
          poorPerformingCropReason || null,
      };

      const { error: saveError } =
        await supabase
          .from("crop_information")
          .upsert(onlinePayload, {
            onConflict: "survey_id",
          });

      if (saveError) {
        console.error(saveError);
        setError(
          "Crop information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );
        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "E"
      );

      router.push(
        `/surveys/${surveyId}/f`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/f`
        );
        return;
      }

      setError(
        "Could not save crop information."
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-500">
          Loading crop details...
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-5xl p-4 sm:p-6">

        <div className="mb-6">
          <div className="mb-2 text-sm font-medium text-green-700">
            Survey Section E
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Season & Crop History
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record the farmer&apos;s seasonal cultivation and crop
            history for this field.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section E of P
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "31%" }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section E data will be saved
            on this device and synchronized when the connection
            is restored.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Seasonal Cultivation
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Seasons Normally Cultivated
              </label>

              <input
                value={seasonsCultivated}
                onChange={(e) =>
                  setSeasonsCultivated(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="e.g. Kharif, Rabi, Summer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Crop Per Season
              </label>

              <input
                value={cropPerSeason}
                onChange={(e) =>
                  setCropPerSeason(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="e.g. Rice in Kharif"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Previous Crop
              </label>

              <input
                value={previousCrop}
                onChange={(e) =>
                  setPreviousCrop(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Enter previous crop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Current Crop
              </label>

              <input
                value={currentCrop}
                onChange={(e) =>
                  setCurrentCrop(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Enter current crop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Variety
              </label>

              <input
                value={variety}
                onChange={(e) =>
                  setVariety(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Enter crop variety"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Crop Area & Dates
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Crop Area
              </label>

              <input
                type="number"
                step="any"
                value={area}
                onChange={(e) =>
                  setArea(e.target.value)
                }
                disabled={saving}
                placeholder="Enter area"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Area Unit
              </label>

              <select
                value={areaUnit}
                onChange={(e) =>
                  setAreaUnit(e.target.value)
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              >
                <option value="">
                  Select unit
                </option>
                <option value="Acre">
                  Acre
                </option>
                <option value="Cent">
                  Cent
                </option>
                <option value="Hectare">
                  Hectare
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Sowing Date
              </label>

              <input
                type="date"
                value={sowingDate}
                onChange={(e) =>
                  setSowingDate(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Expected Harvest Date
              </label>

              <input
                type="date"
                value={expectedHarvestDate}
                onChange={(e) =>
                  setExpectedHarvestDate(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Actual Harvest Date
              </label>

              <input
                type="date"
                value={actualHarvestDate}
                onChange={(e) =>
                  setActualHarvestDate(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Crop Selection
          </h2>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Why was this crop selected?
          </label>

          <textarea
            value={cropSelectionReason}
            onChange={(e) =>
              setCropSelectionReason(
                e.target.value
              )
            }
            disabled={saving}
            rows={4}
            placeholder="Describe why the farmer selected this crop..."
            className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
          />
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Crop Rotation
          </h2>

          <label className="mb-3 block text-sm font-medium text-slate-700">
            Does the farmer practice crop rotation?
          </label>

          <div className="flex flex-wrap gap-3">

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
              <input
                type="radio"
                name="cropRotation"
                value="yes"
                checked={cropRotation === "yes"}
                onChange={(e) =>
                  setCropRotation(
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <span className="text-sm">
                Yes
              </span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3">
              <input
                type="radio"
                name="cropRotation"
                value="no"
                checked={cropRotation === "no"}
                onChange={(e) =>
                  setCropRotation(
                    e.target.value
                  )
                }
                disabled={saving}
              />

              <span className="text-sm">
                No
              </span>
            </label>

          </div>

          {cropRotation === "yes" && (
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Crops Used in Rotation
              </label>

              <input
                value={rotatedCrops}
                onChange={(e) =>
                  setRotatedCrops(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="e.g. Rice → Black gram → Rice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>
          )}
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Historical Crop Performance
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Historically Best-Performing Crop
              </label>

              <input
                value={historicallyBestCrop}
                onChange={(e) =>
                  setHistoricallyBestCrop(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Enter crop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Poor-Performing Crop
              </label>

              <input
                value={poorPerformingCrop}
                onChange={(e) =>
                  setPoorPerformingCrop(
                    e.target.value
                  )
                }
                disabled={saving}
                placeholder="Enter crop"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
              />
            </div>

          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Why did the crop perform poorly?
            </label>

            <textarea
              value={poorPerformingCropReason}
              onChange={(e) =>
                setPoorPerformingCropReason(
                  e.target.value
                )
              }
              disabled={saving}
              rows={4}
              placeholder="Describe the reason..."
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="mb-6">
          <VoiceRecorder
            surveyId={surveyId}
            farmerId={farmerId}
            fieldId={fieldId}
            section="E"
            questionKey="crop_history"
            title="Crop History Voice Note"
            description="Record the farmer's explanation about their seasonal cultivation, crop choices, rotation and crop history."
            existingVoicePath={existingVoicePath}
            onUploaded={(storagePath) =>
              setExistingVoicePath(
                storagePath
              )
            }
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/d`
              )
            }
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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