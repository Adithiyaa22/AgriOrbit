"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import InternLayout from "@/components/layout/InternLayout";
import VoiceRecorder from "@/components/survey/VoiceRecorder";
import { useOnlineStatus } from "@/lib/offline/useOnlineStatus";
import {
  saveSurveySectionOffline,
  getSurveySectionOffline,
  markSectionSynced,
} from "@/lib/offline/surveyManager";

export default function SurveyOPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [surveyCode, setSurveyCode] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [existingVoicePath, setExistingVoicePath] = useState("");

  const [supportNeeded, setSupportNeeded] = useState("");
  const [usefulTraining, setUsefulTraining] = useState("");

  const [interestedCropPriceInfo, setInterestedCropPriceInfo] =
    useState<boolean | null>(null);

  const [interestedBuyerInfo, setInterestedBuyerInfo] =
    useState<boolean | null>(null);

  const [interestedWeatherInfo, setInterestedWeatherInfo] =
    useState<boolean | null>(null);

  const [
    interestedTrainingExpertSessions,
    setInterestedTrainingExpertSessions,
  ] = useState<boolean | null>(null);

  const [
    interestedComparingSeedVarieties,
    setInterestedComparingSeedVarieties,
  ] = useState<boolean | null>(null);

  const [interestedExpenseRecording, setInterestedExpenseRecording] =
    useState<boolean | null>(null);

  const [interestedProfitability, setInterestedProfitability] =
    useState<boolean | null>(null);

  const [biggestNextSeasonConcern, setBiggestNextSeasonConcern] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSurvey();
  }, [surveyId, isOnline]);

  async function loadSurvey() {
    setLoading(true);
    setError("");

    let onlineSurvey:
      | {
          id: string;
          survey_code: string;
          farmer_id: string;
          field_id: string;
        }
      | null = null;

    if (isOnline) {
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .select("id, survey_code, farmer_id, field_id")
        .eq("id", surveyId)
        .single();

      if (!surveyError && survey) {
        onlineSurvey = survey;

        setSurveyCode(survey.survey_code);
        setFarmerId(survey.farmer_id);
        setFieldId(survey.field_id);
      }
    }

    const localDraft = await getSurveySectionOffline(surveyId, "O");
    const localSectionA = await getSurveySectionOffline(surveyId, "A");
    const localSectionC = await getSurveySectionOffline(surveyId, "C");

    const localData = localDraft?.data || {};

    const localFarmerId =
      typeof localData.farmerId === "string"
        ? localData.farmerId
        : typeof localSectionA?.data.farmerId === "string"
        ? localSectionA.data.farmerId
        : "";

    const localFieldId =
      typeof localData.fieldId === "string"
        ? localData.fieldId
        : typeof localSectionC?.data.fieldId === "string"
        ? localSectionC.data.fieldId
        : "";

    const localSurveyCode =
      typeof localData.surveyCode === "string"
        ? localData.surveyCode
        : typeof localSectionA?.data.surveyCode === "string"
        ? localSectionA.data.surveyCode
        : "";

    if (localFarmerId) {
      setFarmerId(localFarmerId);
    }

    if (localFieldId) {
      setFieldId(localFieldId);
    }

    if (localSurveyCode) {
      setSurveyCode(localSurveyCode);
    }

    if (!onlineSurvey && !localDraft) {
      setError("Survey could not be loaded.");
      setLoading(false);
      return;
    }

    if (isOnline) {
      const { data: existing, error: existingError } = await supabase
        .from("future_farmer_needs")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (existingError) {
        setError(existingError.message);
        setLoading(false);
        return;
      }

      if (existing) {
        setSupportNeeded(existing.support_needed ?? "");
        setUsefulTraining(existing.useful_training ?? "");

        setInterestedCropPriceInfo(
          existing.interested_crop_price_info ?? null
        );

        setInterestedBuyerInfo(
          existing.interested_buyer_info ?? null
        );

        setInterestedWeatherInfo(
          existing.interested_weather_info ?? null
        );

        setInterestedTrainingExpertSessions(
          existing.interested_training_expert_sessions ?? null
        );

        setInterestedComparingSeedVarieties(
          existing.interested_comparing_seed_varieties ?? null
        );

        setInterestedExpenseRecording(
          existing.interested_expense_recording ?? null
        );

        setInterestedProfitability(
          existing.interested_profitability ?? null
        );

        setBiggestNextSeasonConcern(
          existing.biggest_next_season_concern ?? ""
        );
      }

      const { data: voice } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "O")
        .eq("question_key", "future_farmer_needs")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (voice?.storage_path) {
        setExistingVoicePath(voice.storage_path);
      }
    }

    if (localDraft) {
      const data = localDraft.data;

      if (typeof data.support_needed === "string") {
        setSupportNeeded(data.support_needed);
      }

      if (typeof data.useful_training === "string") {
        setUsefulTraining(data.useful_training);
      }

      if (
        typeof data.interested_crop_price_info === "boolean"
      ) {
        setInterestedCropPriceInfo(
          data.interested_crop_price_info
        );
      }

      if (typeof data.interested_buyer_info === "boolean") {
        setInterestedBuyerInfo(data.interested_buyer_info);
      }

      if (typeof data.interested_weather_info === "boolean") {
        setInterestedWeatherInfo(data.interested_weather_info);
      }

      if (
        typeof data.interested_training_expert_sessions ===
        "boolean"
      ) {
        setInterestedTrainingExpertSessions(
          data.interested_training_expert_sessions
        );
      }

      if (
        typeof data.interested_comparing_seed_varieties ===
        "boolean"
      ) {
        setInterestedComparingSeedVarieties(
          data.interested_comparing_seed_varieties
        );
      }

      if (
        typeof data.interested_expense_recording === "boolean"
      ) {
        setInterestedExpenseRecording(
          data.interested_expense_recording
        );
      }

      if (
        typeof data.interested_profitability === "boolean"
      ) {
        setInterestedProfitability(
          data.interested_profitability
        );
      }

      if (
        typeof data.biggest_next_season_concern === "string"
      ) {
        setBiggestNextSeasonConcern(
          data.biggest_next_season_concern
        );
      }

      if (typeof data.voicePath === "string") {
        setExistingVoicePath(data.voicePath);
      }
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

      support_needed: supportNeeded,
      useful_training: usefulTraining,

      interested_crop_price_info: interestedCropPriceInfo,
      interested_buyer_info: interestedBuyerInfo,
      interested_weather_info: interestedWeatherInfo,
      interested_training_expert_sessions:
        interestedTrainingExpertSessions,
      interested_comparing_seed_varieties:
        interestedComparingSeedVarieties,
      interested_expense_recording:
        interestedExpenseRecording,
      interested_profitability:
        interestedProfitability,

      biggest_next_season_concern: biggestNextSeasonConcern,

      voicePath: existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "O",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/p`);
        return;
      }

      const { error: saveError } = await supabase
        .from("future_farmer_needs")
        .upsert(
          {
            survey_id: surveyId,
            field_id: fieldId,

            support_needed: supportNeeded,
            useful_training: usefulTraining,

            interested_crop_price_info:
              interestedCropPriceInfo,
            interested_buyer_info: interestedBuyerInfo,
            interested_weather_info:
              interestedWeatherInfo,
            interested_training_expert_sessions:
              interestedTrainingExpertSessions,
            interested_comparing_seed_varieties:
              interestedComparingSeedVarieties,
            interested_expense_recording:
              interestedExpenseRecording,
            interested_profitability:
              interestedProfitability,

            biggest_next_season_concern:
              biggestNextSeasonConcern,
          },
          {
            onConflict: "survey_id",
          }
        );

      if (saveError) {
        setError(saveError.message);
        setSaving(false);
        return;
      }

      await markSectionSynced(surveyId, "O");

      router.push(`/surveys/${surveyId}/p`);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save future farmer needs.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  function YesNoButtons({
    value,
    setValue,
  }: {
    value: boolean | null;
    setValue: (value: boolean) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setValue(true)}
          className={`rounded-lg border px-5 py-2 text-sm font-medium transition ${
            value === true
              ? "border-green-600 bg-green-600 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          Yes
        </button>

        <button
          type="button"
          onClick={() => setValue(false)}
          className={`rounded-lg border px-5 py-2 text-sm font-medium transition ${
            value === false
              ? "border-red-500 bg-red-500 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          No
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm text-slate-500">
            Loading Survey O...
          </p>
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {!isOnline && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are offline. Your future farmer needs responses
            will be saved on this device and synced when the
            internet connection returns.
          </div>
        )}

        <div className="mb-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
              Section O
            </span>

            <span className="text-sm text-slate-500">
              Survey {surveyCode}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            O. Future Farmer Needs
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Capture the farmer&apos;s future needs, interests and concerns.
          </p>
        </div>

        <div className="space-y-6">

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Support &amp; Training
            </h2>

            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  What support does the farmer need?
                </label>

                <textarea
                  value={supportNeeded}
                  onChange={(e) => setSupportNeeded(e.target.value)}
                  rows={4}
                  placeholder="Enter the support or assistance needed..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  What type of training would be useful?
                </label>

                <textarea
                  value={usefulTraining}
                  onChange={(e) => setUsefulTraining(e.target.value)}
                  rows={4}
                  placeholder="Enter useful training topics..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">
              Farmer Interests
            </h2>

            <p className="mb-5 text-sm text-slate-500">
              Record whether the farmer is interested in each type
              of information or support.
            </p>

            <div className="space-y-6">

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in crop price information?
                </p>

                <YesNoButtons
                  value={interestedCropPriceInfo}
                  setValue={setInterestedCropPriceInfo}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in buyer information?
                </p>

                <YesNoButtons
                  value={interestedBuyerInfo}
                  setValue={setInterestedBuyerInfo}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in weather information?
                </p>

                <YesNoButtons
                  value={interestedWeatherInfo}
                  setValue={setInterestedWeatherInfo}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in training or expert sessions?
                </p>

                <YesNoButtons
                  value={interestedTrainingExpertSessions}
                  setValue={setInterestedTrainingExpertSessions}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in comparing seed varieties?
                </p>

                <YesNoButtons
                  value={interestedComparingSeedVarieties}
                  setValue={setInterestedComparingSeedVarieties}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in expense recording?
                </p>

                <YesNoButtons
                  value={interestedExpenseRecording}
                  setValue={setInterestedExpenseRecording}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">
                  Interested in profitability information?
                </p>

                <YesNoButtons
                  value={interestedProfitability}
                  setValue={setInterestedProfitability}
                />
              </div>

            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Next Season
            </h2>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              What is the farmer&apos;s biggest concern for the next season?
            </label>

            <textarea
              value={biggestNextSeasonConcern}
              onChange={(e) =>
                setBiggestNextSeasonConcern(e.target.value)
              }
              rows={4}
              placeholder="Enter the farmer's biggest concern..."
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <VoiceRecorder
              surveyId={surveyId}
              farmerId={farmerId}
              fieldId={fieldId}
              section="O"
              questionKey="future_farmer_needs"
              title="Future Farmer Needs Voice Note"
              description="Record the farmer's explanation about their future needs, interests, support requirements and next-season concerns."
              existingVoicePath={existingVoicePath}
              onUploaded={(storagePath) => {
                setExistingVoicePath(storagePath);
              }}
            />
          </section>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

            <button
              type="button"
              onClick={() =>
                router.push(`/surveys/${surveyId}/n`)
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
            >
              Back
            </button>

            <button
              type="button"
              onClick={saveAndContinue}
              disabled={saving}
              className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {saving
                ? "Saving..."
                : isOnline
                ? "Save & Continue"
                : "Save Offline & Continue"}
            </button>

          </div>

        </div>
      </div>
    </InternLayout>
  );
}