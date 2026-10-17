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

export default function SurveyIPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;

  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [surveyCode, setSurveyCode] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [farmerId, setFarmerId] = useState("");

  const [currentCropProblems, setCurrentCropProblems] =
    useState("");
  const [recurringProblems, setRecurringProblems] =
    useState("");
  const [problemType, setProblemType] = useState("");
  const [severity, setSeverity] = useState("");
  const [dateNoticed, setDateNoticed] = useState("");

  const [actionTaken, setActionTaken] = useState("");
  const [whoHelped, setWhoHelped] = useState("");
  const [actionResult, setActionResult] = useState("");

  const [biggestFarmingChallenge, setBiggestFarmingChallenge] =
    useState("");

  const [photoPath, setPhotoPath] = useState("");
  const [existingVoicePath, setExistingVoicePath] =
    useState("");

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
      "I"
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
    setFieldId(activeSurvey.field_id);
    setFarmerId(activeSurvey.farmer_id);

    let problemData: Record<string, unknown> | null =
      null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: problemError,
      } = await supabase
        .from("crop_problems")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (problemError) {
        console.error(problemError);
      } else {
        problemData = data;
      }

      const {
        data: voiceData,
        error: voiceError,
      } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "I")
        .eq(
          "question_key",
          "crop_problems"
        )
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

    const localData =
      localDraft?.data ?? {};

    setCurrentCropProblems(
      typeof localData.current_crop_problems === "string"
        ? localData.current_crop_problems
        : typeof problemData?.current_crop_problems === "string"
          ? problemData.current_crop_problems
          : ""
    );

    setRecurringProblems(
      typeof localData.recurring_problems === "string"
        ? localData.recurring_problems
        : typeof problemData?.recurring_problems === "string"
          ? problemData.recurring_problems
          : ""
    );

    setProblemType(
      typeof localData.problem_type === "string"
        ? localData.problem_type
        : typeof problemData?.problem_type === "string"
          ? problemData.problem_type
          : ""
    );

    setSeverity(
      typeof localData.severity === "string"
        ? localData.severity
        : typeof problemData?.severity === "string"
          ? problemData.severity
          : ""
    );

    setDateNoticed(
      typeof localData.date_noticed === "string"
        ? localData.date_noticed
        : typeof problemData?.date_noticed === "string"
          ? problemData.date_noticed
          : ""
    );

    setActionTaken(
      typeof localData.action_taken === "string"
        ? localData.action_taken
        : typeof problemData?.action_taken === "string"
          ? problemData.action_taken
          : ""
    );

    setWhoHelped(
      typeof localData.who_helped === "string"
        ? localData.who_helped
        : typeof problemData?.who_helped === "string"
          ? problemData.who_helped
          : ""
    );

    setActionResult(
      typeof localData.action_result === "string"
        ? localData.action_result
        : typeof problemData?.action_result === "string"
          ? problemData.action_result
          : ""
    );

    setBiggestFarmingChallenge(
      typeof localData.biggest_farming_challenge ===
        "string"
        ? localData.biggest_farming_challenge
        : typeof problemData?.biggest_farming_challenge ===
              "string"
          ? problemData.biggest_farming_challenge
          : ""
    );

    setPhotoPath(
      typeof localData.photoPath === "string"
        ? localData.photoPath
        : typeof problemData?.photo_path === "string"
          ? problemData.photo_path
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

      current_crop_problems:
        currentCropProblems || null,

      recurring_problems:
        recurringProblems || null,

      problem_type:
        problemType || null,

      severity:
        severity || null,

      date_noticed:
        dateNoticed || null,

      action_taken:
        actionTaken || null,

      who_helped:
        whoHelped || null,

      action_result:
        actionResult || null,

      biggest_farming_challenge:
        biggestFarmingChallenge || null,

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
        section: "I",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/j`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        current_crop_problems:
          currentCropProblems || null,

        recurring_problems:
          recurringProblems || null,

        problem_type:
          problemType || null,

        severity:
          severity || null,

        date_noticed:
          dateNoticed || null,

        action_taken:
          actionTaken || null,

        who_helped:
          whoHelped || null,

        action_result:
          actionResult || null,

        biggest_farming_challenge:
          biggestFarmingChallenge || null,

        photo_path:
          photoPath || null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("crop_problems")
        .upsert(
          onlinePayload,
          {
            onConflict: "survey_id",
          }
        );

      if (saveError) {
        console.error(saveError);

        setError(
          "Crop problem information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "I"
      );

      router.push(
        `/surveys/${surveyId}/j`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/j`
        );
        return;
      }

      setError(
        "Could not save crop problem information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-600">
          Loading crop problems...
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
            I. Crop Problems & Difficulties
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record current and recurring crop problems,
            actions taken, and the farmer&apos;s biggest
            farming challenge.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section I
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{
                width: "56.25%",
              }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section I data will
            be saved on this device and synchronized
            when the connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Crop Problems
          </h2>

          <div className="space-y-4">

            <TextAreaField
              label="Current Crop Problems"
              value={currentCropProblems}
              onChange={setCurrentCropProblems}
              placeholder="What problems is the farmer currently facing?"
              disabled={saving}
            />

            <TextAreaField
              label="Recurring Problems"
              value={recurringProblems}
              onChange={setRecurringProblems}
              placeholder="Are there problems that occur repeatedly?"
              disabled={saving}
            />

            <div className="grid gap-4 md:grid-cols-2">

              <SelectField
                label="Problem Type"
                value={problemType}
                onChange={setProblemType}
                disabled={saving}
                options={[
                  ["pest", "Pest"],
                  ["disease", "Disease"],
                  ["water", "Water"],
                  ["soil", "Soil"],
                  ["seed", "Seed"],
                  ["fertilizer", "Fertilizer"],
                  ["labour", "Labour"],
                  ["weather", "Weather"],
                  ["market", "Market"],
                  ["storage", "Storage"],
                  ["transport", "Transport"],
                  ["electricity", "Electricity"],
                  ["weed", "Weed"],
                  ["knowledge", "Knowledge"],
                  ["other", "Other"],
                ]}
              />

              <SelectField
                label="Severity"
                value={severity}
                onChange={setSeverity}
                disabled={saving}
                options={[
                  ["low", "Low"],
                  ["medium", "Medium"],
                  ["high", "High"],
                  ["critical", "Critical"],
                ]}
              />

              <Field
                label="Date Noticed"
                type="date"
                value={dateNoticed}
                onChange={setDateNoticed}
                disabled={saving}
              />

            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Action Taken
          </h2>

          <div className="space-y-4">

            <TextAreaField
              label="What action was taken?"
              value={actionTaken}
              onChange={setActionTaken}
              placeholder="Describe what the farmer did to address the problem."
              disabled={saving}
            />

            <Field
              label="Who Helped?"
              value={whoHelped}
              onChange={setWhoHelped}
              placeholder="Farmer / family / dealer / extension officer / other"
              disabled={saving}
            />

            <SelectField
              label="Did the action work?"
              value={actionResult}
              onChange={setActionResult}
              disabled={saving}
              options={[
                ["worked", "Yes"],
                ["partly", "Partly"],
                ["not_worked", "No"],
              ]}
            />

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Biggest Farming Challenge
          </h2>

          <TextAreaField
            label="What is the biggest farming challenge?"
            value={biggestFarmingChallenge}
            onChange={setBiggestFarmingChallenge}
            placeholder="Record the farmer's biggest current farming challenge."
            disabled={saving}
          />
        </section>

        <PhotoUpload
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          photoType="crop_problem"
          title="Problem Photo"
          description="Capture a clear photo showing the crop problem or damage."
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
          section="I"
          questionKey="crop_problems"
          title="Crop Problems Voice Note"
          description="Record the farmer describing the crop problems, difficulties faced, actions taken, and their biggest farming challenge."
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

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/h`
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