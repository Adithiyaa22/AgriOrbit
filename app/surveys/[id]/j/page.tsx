"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InternLayout from "@/components/layout/InternLayout";
import PhotoUpload from "@/components/survey/PhotoUpload";
import VoiceRecorder from "@/components/survey/VoiceRecorder";
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

export default function SurveySectionJ() {
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

  const [cropHealth, setCropHealth] = useState("");
  const [growthCondition, setGrowthCondition] = useState("");
  const [cropStage, setCropStage] = useState("");

  const [soilObservation, setSoilObservation] = useState("");
  const [waterObservation, setWaterObservation] = useState("");

  const [pestLevel, setPestLevel] = useState("");
  const [diseaseLevel, setDiseaseLevel] = useState("");
  const [weedLevel, setWeedLevel] = useState("");

  const [stressOrDamage, setStressOrDamage] = useState("");
  const [observationNotes, setObservationNotes] = useState("");

  const [photoPath, setPhotoPath] = useState("");
  const [existingVoicePath, setExistingVoicePath] = useState("");

  useEffect(() => {
    loadSection();
  }, [surveyId, isOnline]);

  async function loadSection() {
    setLoading(true);
    setError("");

    let onlineSurvey: Survey | null = null;

    if (isOnline) {
      const {
        data: survey,
        error: surveyError,
      } = await supabase
        .from("surveys")
        .select("id, survey_code, farmer_id, field_id")
        .eq("id", surveyId)
        .single();

      if (!surveyError && survey) {
        onlineSurvey = survey;
      }
    }

    const localDraft = await getSurveySectionOffline(
      surveyId,
      "J"
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
      const sectionAData = localSectionA?.data ?? {};
      const sectionCData = localSectionC?.data ?? {};
      const localData = localDraft?.data ?? {};

      const localFarmerId =
        typeof sectionAData.farmerId === "string"
          ? sectionAData.farmerId
          : typeof localData.farmerId === "string"
            ? localData.farmerId
            : "";

      const localFieldId =
        typeof sectionCData.fieldId === "string"
          ? sectionCData.fieldId
          : typeof localData.fieldId === "string"
            ? localData.fieldId
            : "";

      const localSurveyCode =
        typeof localDraft?.surveyCode === "string"
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

    let observation: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: observationError,
      } = await supabase
        .from("field_observations")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (observationError) {
        console.error(
          "Observation loading error:",
          observationError
        );
      } else {
        observation = data;
      }

      const {
        data: voiceData,
        error: voiceError,
      } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "J")
        .eq("question_key", "field_observation")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (voiceError) {
        console.error(
          "Voice loading error:",
          voiceError
        );
      }

      if (voiceData?.storage_path) {
        setExistingVoicePath(
          voiceData.storage_path
        );
      }
    }

    const localData = localDraft?.data ?? {};

    setCropHealth(
      typeof localData.crop_health === "string"
        ? localData.crop_health
        : typeof observation?.crop_health === "string"
          ? observation.crop_health
          : ""
    );

    setGrowthCondition(
      typeof localData.growth_condition === "string"
        ? localData.growth_condition
        : typeof observation?.growth_condition === "string"
          ? observation.growth_condition
          : ""
    );

    setCropStage(
      typeof localData.crop_stage === "string"
        ? localData.crop_stage
        : typeof observation?.crop_stage === "string"
          ? observation.crop_stage
          : ""
    );

    setSoilObservation(
      typeof localData.soil_observation === "string"
        ? localData.soil_observation
        : typeof observation?.soil_observation === "string"
          ? observation.soil_observation
          : ""
    );

    setWaterObservation(
      typeof localData.water_observation === "string"
        ? localData.water_observation
        : typeof observation?.water_observation === "string"
          ? observation.water_observation
          : ""
    );

    setPestLevel(
      typeof localData.pest_level === "string"
        ? localData.pest_level
        : typeof observation?.pest_level === "string"
          ? observation.pest_level
          : ""
    );

    setDiseaseLevel(
      typeof localData.disease_level === "string"
        ? localData.disease_level
        : typeof observation?.disease_level === "string"
          ? observation.disease_level
          : ""
    );

    setWeedLevel(
      typeof localData.weed_level === "string"
        ? localData.weed_level
        : typeof observation?.weed_level === "string"
          ? observation.weed_level
          : ""
    );

    setStressOrDamage(
      typeof localData.stress_or_damage === "string"
        ? localData.stress_or_damage
        : typeof observation?.stress_or_damage === "string"
          ? observation.stress_or_damage
          : ""
    );

    setObservationNotes(
      typeof localData.observation_notes === "string"
        ? localData.observation_notes
        : typeof observation?.observation_notes === "string"
          ? observation.observation_notes
          : ""
    );

    setPhotoPath(
      typeof localData.photoPath === "string"
        ? localData.photoPath
        : typeof observation?.photo_path === "string"
          ? observation.photo_path
          : ""
    );

    setLoading(false);
  }

  async function saveAndContinue() {
    setSaving(true);
    setError("");

    const localPayload = {
      survey_id: surveyId,
      farmerId,
      fieldId,

      crop_health: cropHealth || null,
      growth_condition: growthCondition || null,
      crop_stage: cropStage || null,

      soil_observation:
        soilObservation || null,

      water_observation:
        waterObservation || null,

      pest_level: pestLevel || null,
      disease_level: diseaseLevel || null,
      weed_level: weedLevel || null,

      stress_or_damage:
        stressOrDamage || null,

      observation_notes:
        observationNotes || null,

      photo_path:
        photoPath || null,

      photoPath:
        photoPath || "",

      voicePath:
        existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "J",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/k`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        crop_health:
          cropHealth || null,

        growth_condition:
          growthCondition || null,

        crop_stage:
          cropStage || null,

        soil_observation:
          soilObservation || null,

        water_observation:
          waterObservation || null,

        pest_level:
          pestLevel || null,

        disease_level:
          diseaseLevel || null,

        weed_level:
          weedLevel || null,

        stress_or_damage:
          stressOrDamage || null,

        observation_notes:
          observationNotes || null,

        photo_path:
          photoPath || null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("field_observations")
        .upsert(
          onlinePayload,
          {
            onConflict: "survey_id",
          }
        );

      if (saveError) {
        console.error(saveError);

        setError(
          "Field observations were saved on this device but could not be uploaded. They will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "J"
      );

      router.push(
        `/surveys/${surveyId}/k`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/k`
        );
        return;
      }

      setError(
        "Could not save field observations."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6">
          Loading Section J...
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">

        <div>
          <p className="text-sm text-slate-500">
            Survey {surveyCode}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            J. Field Observation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record observations made directly during the field visit.
          </p>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section J data will
            be saved on this device and synchronized
            when the connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Crop Condition
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Crop Health
              </label>

              <select
                value={cropHealth}
                onChange={(e) =>
                  setCropHealth(e.target.value)
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
                </option>
                <option value="Excellent">
                  Excellent
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
                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Growth Condition
              </label>

              <input
                value={growthCondition}
                onChange={(e) =>
                  setGrowthCondition(
                    e.target.value
                  )
                }
                placeholder="Describe crop growth condition"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Crop Stage
              </label>

              <input
                value={cropStage}
                onChange={(e) =>
                  setCropStage(
                    e.target.value
                  )
                }
                placeholder="e.g. Vegetative, Flowering"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Soil & Water Observation
          </h2>

          <div className="mt-4 space-y-4">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Soil Observation
              </label>

              <textarea
                value={soilObservation}
                onChange={(e) =>
                  setSoilObservation(
                    e.target.value
                  )
                }
                placeholder="Describe visible soil condition"
                rows={3}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Water Observation
              </label>

              <textarea
                value={waterObservation}
                onChange={(e) =>
                  setWaterObservation(
                    e.target.value
                  )
                }
                placeholder="Describe visible water/irrigation condition"
                rows={3}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Field Condition
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Pest Level
              </label>

              <select
                value={pestLevel}
                onChange={(e) =>
                  setPestLevel(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
                </option>
                <option value="None">
                  None
                </option>
                <option value="Low">
                  Low
                </option>
                <option value="Medium">
                  Medium
                </option>
                <option value="High">
                  High
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Disease Level
              </label>

              <select
                value={diseaseLevel}
                onChange={(e) =>
                  setDiseaseLevel(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
                </option>
                <option value="None">
                  None
                </option>
                <option value="Low">
                  Low
                </option>
                <option value="Medium">
                  Medium
                </option>
                <option value="High">
                  High
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Weed Level
              </label>

              <select
                value={weedLevel}
                onChange={(e) =>
                  setWeedLevel(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
                </option>
                <option value="None">
                  None
                </option>
                <option value="Low">
                  Low
                </option>
                <option value="Medium">
                  Medium
                </option>
                <option value="High">
                  High
                </option>
              </select>
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Stress / Damage
          </h2>

          <textarea
            value={stressOrDamage}
            onChange={(e) =>
              setStressOrDamage(
                e.target.value
              )
            }
            placeholder="Describe any visible stress, damage or unusual condition"
            rows={4}
            disabled={saving}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Observation Notes
          </h2>

          <textarea
            value={observationNotes}
            onChange={(e) =>
              setObservationNotes(
                e.target.value
              )
            }
            placeholder="Add any additional field observations"
            rows={4}
            disabled={saving}
            className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
          />
        </section>

        <PhotoUpload
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          photoType="field_observation"
          title="Field Observation Photo"
          description="Capture a clear photo showing the field condition or visible observation."
          existingPhotoPath={photoPath}
          onUploaded={(storagePath) => {
            setPhotoPath(
              storagePath
            );
          }}
        />

        <VoiceRecorder
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          section="J"
          questionKey="field_observation"
          title="Field Observation Voice Note"
          description="Record a voice note describing the field condition, crop health, soil and water observations, visible damage, and other field observations."
          existingVoicePath={existingVoicePath}
          onUploaded={(storagePath) => {
            setExistingVoicePath(
              storagePath
            );
          }}
        />

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pb-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/i`
              )
            }
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 disabled:opacity-60"
          >
            Back
          </button>

          <button
            type="button"
            onClick={saveAndContinue}
            disabled={saving}
            className="rounded-lg bg-green-700 px-5 py-2.5 font-medium text-white disabled:opacity-50"
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