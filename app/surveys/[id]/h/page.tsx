"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InternLayout from "@/components/layout/InternLayout";
import PhotoUpload from "@/components/survey/PhotoUpload";
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

export default function SurveyHPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [surveyCode, setSurveyCode] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");

  const [existingPhotoPath, setExistingPhotoPath] =
    useState<string | null>(null);

  const [waterSource, setWaterSource] = useState("");
  const [irrigationMethod, setIrrigationMethod] = useState("");
  const [waterAvailability, setWaterAvailability] = useState("");

  const [irrigationFrequency, setIrrigationFrequency] =
    useState("");
  const [irrigationDuration, setIrrigationDuration] =
    useState("");
  const [seasonalChanges, setSeasonalChanges] =
    useState("");

  const [biggestWaterDifficulty, setBiggestWaterDifficulty] =
    useState("");

  const [groundwaterShortage, setGroundwaterShortage] =
    useState("");

  const [electricityEffect, setElectricityEffect] =
    useState("");

  const [dripSprinklerUsed, setDripSprinklerUsed] =
    useState("");

  const [
    dripSprinklerEffectiveness,
    setDripSprinklerEffectiveness,
  ] = useState("");

  const [
    traditionalWaterManagement,
    setTraditionalWaterManagement,
  ] = useState("");

  useEffect(() => {
    loadSurvey();
  }, [surveyId, isOnline]);

  async function loadSurvey() {
    setLoading(true);
    setError("");

    let onlineSurvey: Survey | null = null;

    if (isOnline) {
      const {
        data: survey,
        error: surveyError,
      } = await supabase
        .from("surveys")
        .select(
          "id, survey_code, farmer_id, field_id"
        )
        .eq("id", surveyId)
        .single();

      if (surveyError || !survey) {
        console.error(surveyError);
      } else {
        onlineSurvey = survey;
      }
    }

    const localDraft = await getSurveySectionOffline(
      surveyId,
      "H"
    );

    const localSectionA = await getSurveySectionOffline(
      surveyId,
      "A"
    );

    const localSectionC = await getSurveySectionOffline(
      surveyId,
      "C"
    );

    let activeSurvey = onlineSurvey;

    if (!activeSurvey) {
      const sectionAData =
        localSectionA?.data ?? {};

      const sectionCData =
        localSectionC?.data ?? {};

      const localFarmerId =
        typeof sectionAData.farmerId === "string"
          ? sectionAData.farmerId
          : typeof localDraft?.data.farmerId === "string"
            ? localDraft.data.farmerId
            : "";

      const localFieldId =
        typeof sectionAData.fieldId === "string"
          ? sectionAData.fieldId
          : typeof sectionCData.fieldId === "string"
            ? sectionCData.fieldId
            : typeof localDraft?.data.fieldId === "string"
              ? localDraft.data.fieldId
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

    setSurveyCode(activeSurvey.survey_code);
    setFarmerId(activeSurvey.farmer_id);
    setFieldId(activeSurvey.field_id);

    let irrigationData: Record<string, unknown> | null =
      null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: irrigationError,
      } = await supabase
        .from("irrigation_information")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (irrigationError) {
        console.error(irrigationError);
      } else {
        irrigationData = data;
      }

      const {
        data: photoData,
        error: photoError,
      } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq(
          "photo_type",
          "water_irrigation"
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (photoError) {
        console.error(photoError);
      }

      if (photoData?.storage_path) {
        setExistingPhotoPath(
          photoData.storage_path
        );
      }
    }

    const localData =
      localDraft?.data ?? {};

    setWaterSource(
      typeof localData.water_source === "string"
        ? localData.water_source
        : typeof irrigationData?.water_source === "string"
          ? irrigationData.water_source
          : ""
    );

    setIrrigationMethod(
      typeof localData.irrigation_method === "string"
        ? localData.irrigation_method
        : typeof irrigationData?.irrigation_method === "string"
          ? irrigationData.irrigation_method
          : ""
    );

    setWaterAvailability(
      typeof localData.water_availability === "string"
        ? localData.water_availability
        : typeof irrigationData?.water_availability === "string"
          ? irrigationData.water_availability
          : ""
    );

    setIrrigationFrequency(
      typeof localData.irrigation_frequency === "string"
        ? localData.irrigation_frequency
        : typeof irrigationData?.irrigation_frequency === "string"
          ? irrigationData.irrigation_frequency
          : ""
    );

    setIrrigationDuration(
      typeof localData.irrigation_duration === "string"
        ? localData.irrigation_duration
        : typeof irrigationData?.irrigation_duration === "string"
          ? irrigationData.irrigation_duration
          : ""
    );

    setSeasonalChanges(
      typeof localData.seasonal_changes === "string"
        ? localData.seasonal_changes
        : typeof irrigationData?.seasonal_changes === "string"
          ? irrigationData.seasonal_changes
          : ""
    );

    setBiggestWaterDifficulty(
      typeof localData.biggest_water_difficulty === "string"
        ? localData.biggest_water_difficulty
        : typeof irrigationData?.biggest_water_difficulty === "string"
          ? irrigationData.biggest_water_difficulty
          : ""
    );

    setGroundwaterShortage(
      typeof localData.groundwater_shortage === "string"
        ? localData.groundwater_shortage
        : typeof irrigationData?.groundwater_shortage === "string"
          ? irrigationData.groundwater_shortage
          : ""
    );

    setElectricityEffect(
      typeof localData.electricity_effect === "string"
        ? localData.electricity_effect
        : typeof irrigationData?.electricity_effect === "string"
          ? irrigationData.electricity_effect
          : ""
    );

    if (localData.drip_sprinkler_used !== undefined) {
      setDripSprinklerUsed(
        localData.drip_sprinkler_used === true ||
          localData.drip_sprinkler_used === "yes"
          ? "yes"
          : localData.drip_sprinkler_used === false ||
              localData.drip_sprinkler_used === "no"
            ? "no"
            : ""
      );
    } else if (
      irrigationData?.drip_sprinkler_used !==
        null &&
      irrigationData?.drip_sprinkler_used !==
        undefined
    ) {
      setDripSprinklerUsed(
        irrigationData.drip_sprinkler_used
          ? "yes"
          : "no"
      );
    }

    setDripSprinklerEffectiveness(
      typeof localData.drip_sprinkler_effectiveness ===
        "string"
        ? localData.drip_sprinkler_effectiveness
        : typeof irrigationData?.drip_sprinkler_effectiveness ===
              "string"
          ? irrigationData.drip_sprinkler_effectiveness
          : ""
    );

    setTraditionalWaterManagement(
      typeof localData.traditional_water_management ===
        "string"
        ? localData.traditional_water_management
        : typeof irrigationData?.traditional_water_management ===
              "string"
          ? irrigationData.traditional_water_management
          : ""
    );

    if (typeof localData.photoPath === "string") {
      setExistingPhotoPath(
        localData.photoPath
      );
    }

    setLoading(false);
  }

  async function saveAndContinue() {
    setSaving(true);
    setError("");

    const localPayload = {
      survey_id: surveyId,
      farmerId,
      fieldId,

      water_source:
        waterSource || null,

      irrigation_method:
        irrigationMethod || null,

      water_availability:
        waterAvailability || null,

      irrigation_frequency:
        irrigationFrequency || null,

      irrigation_duration:
        irrigationDuration || null,

      seasonal_changes:
        seasonalChanges || null,

      biggest_water_difficulty:
        biggestWaterDifficulty || null,

      groundwater_shortage:
        groundwaterShortage || null,

      electricity_effect:
        electricityEffect || null,

      drip_sprinkler_used:
        dripSprinklerUsed === ""
          ? null
          : dripSprinklerUsed === "yes",

      drip_sprinkler_effectiveness:
        dripSprinklerEffectiveness || null,

      traditional_water_management:
        traditionalWaterManagement || null,

      photoPath:
        existingPhotoPath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "H",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/i`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        water_source:
          waterSource || null,

        irrigation_method:
          irrigationMethod || null,

        water_availability:
          waterAvailability || null,

        irrigation_frequency:
          irrigationFrequency || null,

        irrigation_duration:
          irrigationDuration || null,

        seasonal_changes:
          seasonalChanges || null,

        biggest_water_difficulty:
          biggestWaterDifficulty || null,

        groundwater_shortage:
          groundwaterShortage || null,

        electricity_effect:
          electricityEffect || null,

        drip_sprinkler_used:
          dripSprinklerUsed === ""
            ? null
            : dripSprinklerUsed === "yes",

        drip_sprinkler_effectiveness:
          dripSprinklerEffectiveness || null,

        traditional_water_management:
          traditionalWaterManagement || null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("irrigation_information")
        .upsert(
          onlinePayload,
          {
            onConflict: "survey_id",
          }
        );

      if (saveError) {
        console.error(saveError);

        setError(
          "Water and irrigation information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "H"
      );

      router.push(
        `/surveys/${surveyId}/i`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/i`
        );
        return;
      }

      setError(
        "Could not save water and irrigation information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-600">
          Loading water and irrigation information...
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">

        <div>
          <div className="mb-2 text-sm text-slate-500">
            Survey {surveyCode}
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            H. Water & Irrigation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record the farmer&apos;s water sources,
            irrigation practices, availability and
            water-related difficulties.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section H
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "50%" }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section H data will
            be saved on this device and synchronized
            when the connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Water Source & Irrigation
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <SelectField
              label="Water Source"
              value={waterSource}
              onChange={setWaterSource}
              disabled={saving}
              options={[
                ["borewell", "Borewell"],
                ["open_well", "Open well"],
                ["canal", "Canal"],
                ["tank", "Tank"],
                ["rain_fed", "Rain-fed"],
                ["other", "Other"],
              ]}
            />

            <SelectField
              label="Irrigation Method"
              value={irrigationMethod}
              onChange={setIrrigationMethod}
              disabled={saving}
              options={[
                ["flood", "Flood"],
                ["drip", "Drip"],
                ["sprinkler", "Sprinkler"],
                ["rain_fed", "Rain-fed"],
                ["other", "Other"],
              ]}
            />

            <SelectField
              label="Water Availability"
              value={waterAvailability}
              onChange={setWaterAvailability}
              disabled={saving}
              options={[
                ["good", "Good"],
                ["moderate", "Moderate"],
                ["low", "Low"],
                ["critical", "Critical"],
              ]}
            />

            <Field
              label="Irrigation Frequency"
              value={irrigationFrequency}
              onChange={setIrrigationFrequency}
              placeholder="Example: Once every 5 days"
              disabled={saving}
            />

            <Field
              label="Irrigation Duration"
              value={irrigationDuration}
              onChange={setIrrigationDuration}
              placeholder="Example: 2 hours"
              disabled={saving}
            />

            <TextAreaField
              label="Seasonal Changes"
              value={seasonalChanges}
              onChange={setSeasonalChanges}
              placeholder="How does water availability change across seasons?"
              disabled={saving}
            />

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Water Difficulties
          </h2>

          <div className="space-y-4">

            <TextAreaField
              label="Biggest Water Difficulty"
              value={biggestWaterDifficulty}
              onChange={setBiggestWaterDifficulty}
              placeholder="What is the biggest water-related difficulty?"
              disabled={saving}
            />

            <TextAreaField
              label="Groundwater Shortage"
              value={groundwaterShortage}
              onChange={setGroundwaterShortage}
              placeholder="Describe any groundwater shortage or related issue"
              disabled={saving}
            />

            <TextAreaField
              label="Effect of Electricity"
              value={electricityEffect}
              onChange={setElectricityEffect}
              placeholder="How does electricity availability affect irrigation?"
              disabled={saving}
            />

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Drip / Sprinkler Usage
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <SelectField
              label="Do you use drip or sprinkler irrigation?"
              value={dripSprinklerUsed}
              onChange={setDripSprinklerUsed}
              disabled={saving}
              options={[
                ["yes", "Yes"],
                ["no", "No"],
              ]}
            />

            <Field
              label="Effectiveness"
              value={dripSprinklerEffectiveness}
              onChange={setDripSprinklerEffectiveness}
              placeholder="How effective is it?"
              disabled={saving}
            />

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Traditional / Local Water Management
          </h2>

          <TextAreaField
            label="Traditional or Local Practice"
            value={traditionalWaterManagement}
            onChange={setTraditionalWaterManagement}
            placeholder="Record any traditional or locally used water-management practice."
            disabled={saving}
          />
        </section>

        <PhotoUpload
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          photoType="water_irrigation"
          title="Water / Irrigation Photo"
          description="Capture a clear photo of the water source, irrigation setup, drip or sprinkler system, or other relevant water-management setup."
          existingPhotoPath={existingPhotoPath}
          onUploaded={(storagePath) => {
            setExistingPhotoPath(
              storagePath
            );
          }}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/g`
              )
            }
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Back
          </button>

          <button
            type="button"
            onClick={saveAndContinue}
            disabled={saving}
            className="rounded-lg bg-green-700 px-6 py-2.5 font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
      >
        <option value="">
          Select...
        </option>

        {options.map(
          ([value, label]) => (
            <option
              key={value}
              value={value}
            >
              {label}
            </option>
          )
        )}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        rows={4}
        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
      />
    </div>
  );
}