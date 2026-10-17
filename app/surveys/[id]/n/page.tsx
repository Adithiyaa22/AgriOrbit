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

export default function FarmerKnowledgePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const surveyId = params.id as string;

  const [surveyCode, setSurveyCode] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [existingVoicePath, setExistingVoicePath] = useState("");

  const [bestCropResult, setBestCropResult] = useState("");
  const [bestSeedVariety, setBestSeedVariety] = useState("");
  const [successfulPractice, setSuccessfulPractice] = useState("");
  const [bestWaterManagement, setBestWaterManagement] = useState("");
  const [bestSoilManagement, setBestSoilManagement] = useState("");
  const [bestPestDiseaseManagement, setBestPestDiseaseManagement] =
    useState("");
  const [traditionalLocalPractice, setTraditionalLocalPractice] =
    useState("");
  const [mistakeNewFarmersShouldAvoid, setMistakeNewFarmersShouldAvoid] =
    useState("");
  const [beginnerAdvice, setBeginnerAdvice] = useState("");
  const [thingFarmerWishesKnown, setThingFarmerWishesKnown] = useState("");
  const [skillFarmerWantsToImprove, setSkillFarmerWantsToImprove] =
    useState("");
  const [willingToShare, setWillingToShare] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadKnowledge();
  }, [surveyId, isOnline]);

  async function loadKnowledge() {
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

    const localDraft = await getSurveySectionOffline(surveyId, "N");

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
      const { data: knowledgeData, error: knowledgeError } =
        await supabase
          .from("farmer_knowledge")
          .select("*")
          .eq("survey_id", surveyId)
          .maybeSingle();

      if (knowledgeError) {
        setError(knowledgeError.message);
        setLoading(false);
        return;
      }

      if (knowledgeData) {
        setBestCropResult(knowledgeData.best_crop_result || "");
        setBestSeedVariety(knowledgeData.best_seed_variety || "");
        setSuccessfulPractice(knowledgeData.successful_practice || "");
        setBestWaterManagement(
          knowledgeData.best_water_management || ""
        );
        setBestSoilManagement(
          knowledgeData.best_soil_management || ""
        );
        setBestPestDiseaseManagement(
          knowledgeData.best_pest_disease_management || ""
        );
        setTraditionalLocalPractice(
          knowledgeData.traditional_local_practice || ""
        );
        setMistakeNewFarmersShouldAvoid(
          knowledgeData.mistake_new_farmers_should_avoid || ""
        );
        setBeginnerAdvice(knowledgeData.beginner_advice || "");
        setThingFarmerWishesKnown(
          knowledgeData.thing_farmer_wishes_known || ""
        );
        setSkillFarmerWantsToImprove(
          knowledgeData.skill_farmer_wants_to_improve || ""
        );

        if (knowledgeData.willing_to_share === true) {
          setWillingToShare("yes");
        } else if (knowledgeData.willing_to_share === false) {
          setWillingToShare("no");
        }
      }

      const { data: voice } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "N")
        .eq("question_key", "farmer_knowledge")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (voice?.storage_path) {
        setExistingVoicePath(voice.storage_path);
      }
    }

    if (localDraft) {
      const data = localDraft.data;

      if (typeof data.bestCropResult === "string") {
        setBestCropResult(data.bestCropResult);
      }

      if (typeof data.bestSeedVariety === "string") {
        setBestSeedVariety(data.bestSeedVariety);
      }

      if (typeof data.successfulPractice === "string") {
        setSuccessfulPractice(data.successfulPractice);
      }

      if (typeof data.bestWaterManagement === "string") {
        setBestWaterManagement(data.bestWaterManagement);
      }

      if (typeof data.bestSoilManagement === "string") {
        setBestSoilManagement(data.bestSoilManagement);
      }

      if (typeof data.bestPestDiseaseManagement === "string") {
        setBestPestDiseaseManagement(
          data.bestPestDiseaseManagement
        );
      }

      if (typeof data.traditionalLocalPractice === "string") {
        setTraditionalLocalPractice(data.traditionalLocalPractice);
      }

      if (
        typeof data.mistakeNewFarmersShouldAvoid === "string"
      ) {
        setMistakeNewFarmersShouldAvoid(
          data.mistakeNewFarmersShouldAvoid
        );
      }

      if (typeof data.beginnerAdvice === "string") {
        setBeginnerAdvice(data.beginnerAdvice);
      }

      if (typeof data.thingFarmerWishesKnown === "string") {
        setThingFarmerWishesKnown(data.thingFarmerWishesKnown);
      }

      if (typeof data.skillFarmerWantsToImprove === "string") {
        setSkillFarmerWantsToImprove(
          data.skillFarmerWantsToImprove
        );
      }

      if (data.willingToShare === "yes") {
        setWillingToShare("yes");
      } else if (data.willingToShare === "no") {
        setWillingToShare("no");
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

      best_crop_result: bestCropResult || null,
      best_seed_variety: bestSeedVariety || null,
      successful_practice: successfulPractice || null,
      best_water_management: bestWaterManagement || null,
      best_soil_management: bestSoilManagement || null,
      best_pest_disease_management:
        bestPestDiseaseManagement || null,
      traditional_local_practice:
        traditionalLocalPractice || null,
      mistake_new_farmers_should_avoid:
        mistakeNewFarmersShouldAvoid || null,
      beginner_advice: beginnerAdvice || null,
      thing_farmer_wishes_known:
        thingFarmerWishesKnown || null,
      skill_farmer_wants_to_improve:
        skillFarmerWantsToImprove || null,

      willing_to_share:
        willingToShare === ""
          ? null
          : willingToShare === "yes",

      voicePath: existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "N",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/o`);
        return;
      }

      const { error: saveError } = await supabase
        .from("farmer_knowledge")
        .upsert(
          {
            survey_id: surveyId,
            field_id: fieldId,

            best_crop_result: bestCropResult || null,
            best_seed_variety: bestSeedVariety || null,
            successful_practice: successfulPractice || null,
            best_water_management: bestWaterManagement || null,
            best_soil_management: bestSoilManagement || null,
            best_pest_disease_management:
              bestPestDiseaseManagement || null,
            traditional_local_practice:
              traditionalLocalPractice || null,
            mistake_new_farmers_should_avoid:
              mistakeNewFarmersShouldAvoid || null,
            beginner_advice: beginnerAdvice || null,
            thing_farmer_wishes_known:
              thingFarmerWishesKnown || null,
            skill_farmer_wants_to_improve:
              skillFarmerWantsToImprove || null,

            willing_to_share:
              willingToShare === ""
                ? null
                : willingToShare === "yes",

            updated_at: new Date().toISOString(),
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

      await markSectionSynced(surveyId, "N");

      router.push(`/surveys/${surveyId}/o`);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Unable to save farmer knowledge.";

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500">
            Loading farmer knowledge...
          </p>
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-10">

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are offline. Your farmer knowledge responses will
            be saved on this device and synced when the internet
            connection returns.
          </div>
        )}

        {/* Header */}
        <div>
          <p className="text-sm font-medium text-green-700">
            Survey {surveyCode}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            N. Farmer Knowledge & Tips
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Capture the farmer's own experience, successful practices,
            lessons learned, and knowledge they want to share.
          </p>
        </div>

        {/* Farmer Experience */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Farmer Experience
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What has been your best crop result?
              </label>

              <textarea
                value={bestCropResult}
                onChange={(e) => setBestCropResult(e.target.value)}
                rows={3}
                placeholder="Record the farmer's experience"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which seed or variety has worked best?
              </label>

              <textarea
                value={bestSeedVariety}
                onChange={(e) => setBestSeedVariety(e.target.value)}
                rows={3}
                placeholder="Record the farmer's answer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which farming practice has worked well?
              </label>

              <textarea
                value={successfulPractice}
                onChange={(e) => setSuccessfulPractice(e.target.value)}
                rows={3}
                placeholder="Describe the successful practice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

          </div>
        </section>

        {/* Management Knowledge */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Farming Management Knowledge
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is your best water management practice?
              </label>

              <textarea
                value={bestWaterManagement}
                onChange={(e) =>
                  setBestWaterManagement(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's experience"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is your best soil management practice?
              </label>

              <textarea
                value={bestSoilManagement}
                onChange={(e) =>
                  setBestSoilManagement(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's experience"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is your best pest or disease management practice?
              </label>

              <textarea
                value={bestPestDiseaseManagement}
                onChange={(e) =>
                  setBestPestDiseaseManagement(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's experience"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Are there any traditional or local practices you use?
              </label>

              <textarea
                value={traditionalLocalPractice}
                onChange={(e) =>
                  setTraditionalLocalPractice(e.target.value)
                }
                rows={3}
                placeholder="Record traditional or local knowledge"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

          </div>
        </section>

        {/* Lessons & Advice */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Lessons & Advice
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What mistake should new farmers avoid?
              </label>

              <textarea
                value={mistakeNewFarmersShouldAvoid}
                onChange={(e) =>
                  setMistakeNewFarmersShouldAvoid(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's advice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What advice would you give a beginner farmer?
              </label>

              <textarea
                value={beginnerAdvice}
                onChange={(e) => setBeginnerAdvice(e.target.value)}
                rows={3}
                placeholder="Record the farmer's advice"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is something you wish you had known earlier?
              </label>

              <textarea
                value={thingFarmerWishesKnown}
                onChange={(e) =>
                  setThingFarmerWishesKnown(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's reflection"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which skill would you like to improve?
              </label>

              <textarea
                value={skillFarmerWantsToImprove}
                onChange={(e) =>
                  setSkillFarmerWantsToImprove(e.target.value)
                }
                rows={3}
                placeholder="Record the farmer's answer"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

          </div>
        </section>

        {/* Sharing */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Knowledge Sharing
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ask whether the farmer is willing to share their
            farming knowledge and experience.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            {[
              ["yes", "Yes"],
              ["no", "No"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setWillingToShare(value)}
                className={`rounded-lg border px-6 py-3 text-sm font-medium ${
                  willingToShare === value
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            ))}

          </div>
        </section>

        {/* Voice Note */}
        <section className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Farmer Knowledge Voice Note
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Record the farmer explaining their farming experience,
            successful practices, lessons learned, advice, and
            knowledge they are willing to share.
          </p>

          <div className="mt-4">
            <VoiceRecorder
              surveyId={surveyId}
              farmerId={farmerId}
              fieldId={fieldId}
              section="N"
              questionKey="farmer_knowledge"
              title="Farmer Knowledge Voice Note"
              description="Record the farmer's explanation about their experience, practices, lessons and knowledge."
              existingVoicePath={existingVoicePath}
              onUploaded={(storagePath) => {
                setExistingVoicePath(storagePath);
              }}
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={() => router.push(`/surveys/${surveyId}/m`)}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back
          </button>

          <button
            type="button"
            onClick={saveAndContinue}
            disabled={saving}
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