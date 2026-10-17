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

type Survey = {
  id: string;
  survey_code: string;
  farmer_id: string;
  field_id: string;
};

export default function LabourOperationsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const surveyId = params.id as string;
  const isOnline = useOnlineStatus();

  const [surveyCode, setSurveyCode] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [existingVoicePath, setExistingVoicePath] = useState("");

  const [peopleWorking, setPeopleWorking] = useState("");
  const [labourType, setLabourType] = useState("");
  const [labourHeavyActivities, setLabourHeavyActivities] = useState("");
  const [labourAvailability, setLabourAvailability] = useState("");
  const [labourCost, setLabourCost] = useState("");
  const [skilledWorkerDifficulty, setSkilledWorkerDifficulty] = useState("");
  const [machineryUsed, setMachineryUsed] = useState("");
  const [activityWantedToMechanize, setActivityWantedToMechanize] =
    useState("");
  const [
    unusuallyHighTimeOrCostOperation,
    setUnusuallyHighTimeOrCostOperation,
  ] = useState("");

  const [equipmentRentalComfort, setEquipmentRentalComfort] = useState("");
  const [rentalEquipmentName, setRentalEquipmentName] = useState("");
  const [rentalEquipmentType, setRentalEquipmentType] = useState("");
  const [rentalFrequency, setRentalFrequency] = useState("");
  const [rentalCost, setRentalCost] = useState("");
  const [rentalSource, setRentalSource] = useState("");
  const [rentalExperienceFeedback, setRentalExperienceFeedback] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLabourInformation();
  }, [surveyId, isOnline]);

  async function loadLabourInformation() {
    setLoading(true);
    setError("");

    let onlineSurvey: Survey | null = null;

    if (isOnline) {
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .select("id, survey_code, farmer_id, field_id")
        .eq("id", surveyId)
        .single();

      if (!surveyError && survey) {
        onlineSurvey = survey;
      }
    }

    const localDraft = await getSurveySectionOffline(surveyId, "M");
    const localSectionA = await getSurveySectionOffline(surveyId, "A");
    const localSectionC = await getSurveySectionOffline(surveyId, "C");

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
        setError("Survey information is incomplete for offline use.");
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

    let labourData: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const { data, error: labourError } = await supabase
        .from("labour_operations")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (!labourError) {
        labourData = data;
      }

      const { data: voice } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "M")
        .eq("question_key", "labour_operations")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (voice?.storage_path) {
        setExistingVoicePath(voice.storage_path);
      }
    }

    const localData = localDraft?.data ?? {};

    setPeopleWorking(
      typeof localData.people_working === "string"
        ? localData.people_working
        : typeof labourData?.people_working === "number"
          ? String(labourData.people_working)
          : ""
    );

    setLabourType(
      typeof localData.labour_type === "string"
        ? localData.labour_type
        : typeof labourData?.labour_type === "string"
          ? labourData.labour_type
          : ""
    );

    setLabourHeavyActivities(
      typeof localData.labour_heavy_activities === "string"
        ? localData.labour_heavy_activities
        : typeof labourData?.labour_heavy_activities === "string"
          ? labourData.labour_heavy_activities
          : ""
    );

    setLabourAvailability(
      typeof localData.labour_availability === "string"
        ? localData.labour_availability
        : typeof labourData?.labour_availability === "string"
          ? labourData.labour_availability
          : ""
    );

    setLabourCost(
      typeof localData.labour_cost === "string"
        ? localData.labour_cost
        : typeof labourData?.labour_cost === "number"
          ? String(labourData.labour_cost)
          : ""
    );

    setSkilledWorkerDifficulty(
      typeof localData.skilled_worker_difficulty === "string"
        ? localData.skilled_worker_difficulty
        : typeof labourData?.skilled_worker_difficulty === "string"
          ? labourData.skilled_worker_difficulty
          : ""
    );

    setMachineryUsed(
      typeof localData.machinery_used === "string"
        ? localData.machinery_used
        : typeof labourData?.machinery_used === "string"
          ? labourData.machinery_used
          : ""
    );

    setActivityWantedToMechanize(
      typeof localData.activity_wanted_to_mechanize === "string"
        ? localData.activity_wanted_to_mechanize
        : typeof labourData?.activity_wanted_to_mechanize === "string"
          ? labourData.activity_wanted_to_mechanize
          : ""
    );

    setUnusuallyHighTimeOrCostOperation(
      typeof localData.unusually_high_time_or_cost_operation === "string"
        ? localData.unusually_high_time_or_cost_operation
        : typeof labourData?.unusually_high_time_or_cost_operation === "string"
          ? labourData.unusually_high_time_or_cost_operation
          : ""
    );

    setEquipmentRentalComfort(
      typeof localData.equipment_rental_comfort === "string"
        ? localData.equipment_rental_comfort
        : typeof labourData?.equipment_rental_comfort === "string"
          ? labourData.equipment_rental_comfort
          : ""
    );

    setRentalEquipmentName(
      typeof localData.rental_equipment_name === "string"
        ? localData.rental_equipment_name
        : typeof labourData?.rental_equipment_name === "string"
          ? labourData.rental_equipment_name
          : ""
    );

    setRentalEquipmentType(
      typeof localData.rental_equipment_type === "string"
        ? localData.rental_equipment_type
        : typeof labourData?.rental_equipment_type === "string"
          ? labourData.rental_equipment_type
          : ""
    );

    setRentalFrequency(
      typeof localData.rental_frequency === "string"
        ? localData.rental_frequency
        : typeof labourData?.rental_frequency === "string"
          ? labourData.rental_frequency
          : ""
    );

    setRentalCost(
      typeof localData.rental_cost === "string"
        ? localData.rental_cost
        : typeof labourData?.rental_cost === "number"
          ? String(labourData.rental_cost)
          : ""
    );

    setRentalSource(
      typeof localData.rental_source === "string"
        ? localData.rental_source
        : typeof labourData?.rental_source === "string"
          ? labourData.rental_source
          : ""
    );

    setRentalExperienceFeedback(
      typeof localData.rental_experience_feedback === "string"
        ? localData.rental_experience_feedback
        : typeof labourData?.rental_experience_feedback === "string"
          ? labourData.rental_experience_feedback
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

      people_working: peopleWorking || "",
      labour_type: labourType || "",
      labour_heavy_activities: labourHeavyActivities || "",
      labour_availability: labourAvailability || "",
      labour_cost: labourCost || "",
      skilled_worker_difficulty: skilledWorkerDifficulty || "",
      machinery_used: machineryUsed || "",
      activity_wanted_to_mechanize:
        activityWantedToMechanize || "",
      unusually_high_time_or_cost_operation:
        unusuallyHighTimeOrCostOperation || "",

      equipment_rental_comfort:
        equipmentRentalComfort || "",
      rental_equipment_name:
        rentalEquipmentName || "",
      rental_equipment_type:
        rentalEquipmentType || "",
      rental_frequency:
        rentalFrequency || "",
      rental_cost:
        rentalCost || "",
      rental_source:
        rentalSource || "",
      rental_experience_feedback:
        rentalExperienceFeedback || "",

      voicePath: existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "M",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/n`);
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        people_working: peopleWorking
          ? Number(peopleWorking)
          : null,

        labour_type:
          labourType || null,

        labour_heavy_activities:
          labourHeavyActivities || null,

        labour_availability:
          labourAvailability || null,

        labour_cost: labourCost
          ? Number(labourCost)
          : null,

        skilled_worker_difficulty:
          skilledWorkerDifficulty || null,

        machinery_used:
          machineryUsed || null,

        activity_wanted_to_mechanize:
          activityWantedToMechanize || null,

        unusually_high_time_or_cost_operation:
          unusuallyHighTimeOrCostOperation || null,

        equipment_rental_comfort:
          equipmentRentalComfort || null,

        rental_equipment_name:
          rentalEquipmentName || null,

        rental_equipment_type:
          rentalEquipmentType || null,

        rental_frequency:
          rentalFrequency || null,

        rental_cost: rentalCost
          ? Number(rentalCost)
          : null,

        rental_source:
          rentalSource || null,

        rental_experience_feedback:
          rentalExperienceFeedback || null,

        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from("labour_operations")
        .upsert(onlinePayload, {
          onConflict: "survey_id",
        });

      if (saveError) {
        console.error(saveError);

        setError(
          "Labour information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(surveyId, "M");

      router.push(`/surveys/${surveyId}/n`);
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(`/surveys/${surveyId}/n`);
        return;
      }

      setError("Could not save labour information.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500">
            Loading labour information...
          </p>
        </div>
      </InternLayout>
    );
  }

  return (
    <InternLayout>
      <div className="mx-auto max-w-4xl space-y-6 pb-10">

        <div>
          <p className="text-sm font-medium text-green-700">
            Survey {surveyCode}
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            M. Labour & Farming Operations
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record the people, labour requirements, machinery use,
            and equipment rental practices involved in farming.
          </p>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section M data will be
            saved on this device and synchronized when the
            connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Labour Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                How many people usually work on this field?
              </label>

              <input
                type="number"
                min="0"
                value={peopleWorking}
                onChange={(e) =>
                  setPeopleWorking(e.target.value)
                }
                placeholder="Example: 4"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Labour type
              </label>

              <select
                value={labourType}
                onChange={(e) =>
                  setLabourType(e.target.value)
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="">
                  Select labour type
                </option>
                <option value="Family">
                  Family labour
                </option>
                <option value="Hired">
                  Hired labour
                </option>
                <option value="Both">
                  Both family and hired
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which activities require the most labour?
              </label>

              <textarea
                value={labourHeavyActivities}
                onChange={(e) =>
                  setLabourHeavyActivities(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Example: Weeding, harvesting, transplanting"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Labour availability
              </label>

              <select
                value={labourAvailability}
                onChange={(e) =>
                  setLabourAvailability(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="">
                  Select availability
                </option>
                <option value="Good">
                  Good
                </option>
                <option value="Moderate">
                  Moderate
                </option>
                <option value="Low">
                  Low
                </option>
                <option value="Critical">
                  Critical
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Labour cost
              </label>

              <input
                type="number"
                min="0"
                value={labourCost}
                onChange={(e) =>
                  setLabourCost(e.target.value)
                }
                placeholder="₹"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Is it difficult to find skilled workers?
              </label>

              <textarea
                value={skilledWorkerDifficulty}
                onChange={(e) =>
                  setSkilledWorkerDifficulty(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe the difficulty, if any"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Machinery & Mechanization
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What machinery is currently used?
              </label>

              <textarea
                value={machineryUsed}
                onChange={(e) =>
                  setMachineryUsed(e.target.value)
                }
                rows={3}
                placeholder="Example: Tractor, power tiller, pump set"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which activity would you like to mechanize?
              </label>

              <textarea
                value={activityWantedToMechanize}
                onChange={(e) =>
                  setActivityWantedToMechanize(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe the activity"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Which operation takes unusually high time or cost?
              </label>

              <textarea
                value={unusuallyHighTimeOrCostOperation}
                onChange={(e) =>
                  setUnusuallyHighTimeOrCostOperation(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe the operation"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Equipment Rental
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record whether the farmer is comfortable using
              rented farming equipment when needed.
            </p>
          </div>

          <div className="mt-5">

            <label className="mb-3 block text-sm font-medium text-slate-700">
              Are you comfortable getting farming equipment/machinery
              on a rental basis when needed?
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              {[
                "Yes",
                "No",
                "Maybe/Depends on cost",
                "Already use rental equipment",
                "Don't know",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setEquipmentRentalComfort(
                      option
                    )
                  }
                  disabled={saving}
                  className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-60 ${
                    equipmentRentalComfort === option
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option}
                </button>
              ))}

            </div>
          </div>

          {equipmentRentalComfort && (
            <div className="mt-6 border-t border-slate-200 pt-6">

              <h3 className="text-base font-semibold text-slate-900">
                Rental Details
              </h3>

              <div className="mt-5 grid gap-5 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Equipment / machinery name
                  </label>

                  <input
                    value={rentalEquipmentName}
                    onChange={(e) =>
                      setRentalEquipmentName(
                        e.target.value
                      )
                    }
                    placeholder="Example: Tractor"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Equipment type
                  </label>

                  <input
                    value={rentalEquipmentType}
                    onChange={(e) =>
                      setRentalEquipmentType(
                        e.target.value
                      )
                    }
                    placeholder="Example: Tillage equipment"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rental frequency
                  </label>

                  <select
                    value={rentalFrequency}
                    onChange={(e) =>
                      setRentalFrequency(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  >
                    <option value="">
                      Select frequency
                    </option>
                    <option value="Rarely">
                      Rarely
                    </option>
                    <option value="Occasionally">
                      Occasionally
                    </option>
                    <option value="Monthly">
                      Monthly
                    </option>
                    <option value="Seasonally">
                      Seasonally
                    </option>
                    <option value="Frequently">
                      Frequently
                    </option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Approximate rental cost
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={rentalCost}
                    onChange={(e) =>
                      setRentalCost(
                        e.target.value
                      )
                    }
                    placeholder="₹"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Where do you get rental equipment?
                  </label>

                  <input
                    value={rentalSource}
                    onChange={(e) =>
                      setRentalSource(
                        e.target.value
                      )
                    }
                    placeholder="Example: Local rental centre"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Experience / feedback about rental equipment
                  </label>

                  <textarea
                    value={rentalExperienceFeedback}
                    onChange={(e) =>
                      setRentalExperienceFeedback(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Record the farmer's experience or feedback"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
                  />
                </div>

              </div>
            </div>
          )}

        </section>

        <section className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Labour & Farming Operations Voice Note
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Record the farmer explaining their labour situation,
            machinery use, mechanization needs and equipment rental
            experience.
          </p>

          <div className="mt-4">
            <VoiceRecorder
              surveyId={surveyId}
              farmerId={farmerId}
              fieldId={fieldId}
              section="M"
              questionKey="labour_operations"
              title="Labour & Farming Operations Voice Note"
              description="Record the farmer's explanation about labour, machinery, mechanization and equipment rental."
              existingVoicePath={existingVoicePath}
              onUploaded={(storagePath) => {
                setExistingVoicePath(storagePath);
              }}
            />
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(`/surveys/${surveyId}/l`)
            }
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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