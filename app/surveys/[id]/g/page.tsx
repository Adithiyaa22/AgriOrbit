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

export default function SurveyGPage() {
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

  const [inputProducts, setInputProducts] = useState("");
  const [inputType, setInputType] = useState("");
  const [organicOrChemical, setOrganicOrChemical] = useState("");

  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");

  const [applicationDate, setApplicationDate] = useState("");
  const [growthStage, setGrowthStage] = useState("");
  const [timesApplied, setTimesApplied] = useState("");

  const [inputCost, setInputCost] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");

  const [whyUsed, setWhyUsed] = useState("");
  const [advisedBy, setAdvisedBy] = useState("");

  const [result, setResult] = useState("");
  const [inputDidNotWork, setInputDidNotWork] = useState("");
  const [highestInputCost, setHighestInputCost] = useState("");

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
        .select("id, survey_code, farmer_id, field_id")
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
      "G"
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

    let inputData: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: inputError,
      } = await supabase
        .from("input_information")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (inputError) {
        console.error(inputError);
      } else {
        inputData = data;
      }

      const {
        data: photoData,
        error: photoError,
      } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("photo_type", "input_product")
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

    setInputProducts(
      typeof localData.input_products === "string"
        ? localData.input_products
        : typeof inputData?.input_products === "string"
          ? inputData.input_products
          : ""
    );

    setInputType(
      typeof localData.input_type === "string"
        ? localData.input_type
        : typeof inputData?.input_type === "string"
          ? inputData.input_type
          : ""
    );

    setOrganicOrChemical(
      typeof localData.organic_or_chemical === "string"
        ? localData.organic_or_chemical
        : typeof inputData?.organic_or_chemical === "string"
          ? inputData.organic_or_chemical
          : ""
    );

    setQuantity(
      localData.quantity !== undefined
        ? String(localData.quantity)
        : inputData?.quantity !== null &&
            inputData?.quantity !== undefined
          ? String(inputData.quantity)
          : ""
    );

    setQuantityUnit(
      typeof localData.quantity_unit === "string"
        ? localData.quantity_unit
        : typeof inputData?.quantity_unit === "string"
          ? inputData.quantity_unit
          : ""
    );

    setApplicationDate(
      typeof localData.application_date === "string"
        ? localData.application_date
        : typeof inputData?.application_date === "string"
          ? inputData.application_date
          : ""
    );

    setGrowthStage(
      typeof localData.growth_stage === "string"
        ? localData.growth_stage
        : typeof inputData?.growth_stage === "string"
          ? inputData.growth_stage
          : ""
    );

    setTimesApplied(
      localData.times_applied !== undefined
        ? String(localData.times_applied)
        : inputData?.times_applied !== null &&
            inputData?.times_applied !== undefined
          ? String(inputData.times_applied)
          : ""
    );

    setInputCost(
      localData.input_cost !== undefined
        ? String(localData.input_cost)
        : inputData?.input_cost !== null &&
            inputData?.input_cost !== undefined
          ? String(inputData.input_cost)
          : ""
    );

    setPurchaseLocation(
      typeof localData.purchase_location === "string"
        ? localData.purchase_location
        : typeof inputData?.purchase_location === "string"
          ? inputData.purchase_location
          : ""
    );

    setWhyUsed(
      typeof localData.why_used === "string"
        ? localData.why_used
        : typeof inputData?.why_used === "string"
          ? inputData.why_used
          : ""
    );

    setAdvisedBy(
      typeof localData.advised_by === "string"
        ? localData.advised_by
        : typeof inputData?.advised_by === "string"
          ? inputData.advised_by
          : ""
    );

    setResult(
      typeof localData.result === "string"
        ? localData.result
        : typeof inputData?.result === "string"
          ? inputData.result
          : ""
    );

    setInputDidNotWork(
      typeof localData.input_did_not_work === "string"
        ? localData.input_did_not_work
        : typeof inputData?.input_did_not_work === "string"
          ? inputData.input_did_not_work
          : ""
    );

    setHighestInputCost(
      typeof localData.highest_input_cost === "string"
        ? localData.highest_input_cost
        : typeof inputData?.highest_input_cost === "string"
          ? inputData.highest_input_cost
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

      input_products:
        inputProducts || null,

      input_type:
        inputType || null,

      organic_or_chemical:
        organicOrChemical || null,

      quantity:
        quantity ? Number(quantity) : null,

      quantity_unit:
        quantityUnit || null,

      application_date:
        applicationDate || null,

      growth_stage:
        growthStage || null,

      times_applied:
        timesApplied
          ? Number(timesApplied)
          : null,

      input_cost:
        inputCost
          ? Number(inputCost)
          : null,

      purchase_location:
        purchaseLocation || null,

      why_used:
        whyUsed || null,

      advised_by:
        advisedBy || null,

      result:
        result || null,

      input_did_not_work:
        inputDidNotWork || null,

      highest_input_cost:
        highestInputCost || null,

      photoPath:
        existingPhotoPath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "G",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/h`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        input_products:
          inputProducts || null,

        input_type:
          inputType || null,

        organic_or_chemical:
          organicOrChemical || null,

        quantity:
          quantity ? Number(quantity) : null,

        quantity_unit:
          quantityUnit || null,

        application_date:
          applicationDate || null,

        growth_stage:
          growthStage || null,

        times_applied:
          timesApplied
            ? Number(timesApplied)
            : null,

        input_cost:
          inputCost
            ? Number(inputCost)
            : null,

        purchase_location:
          purchaseLocation || null,

        why_used:
          whyUsed || null,

        advised_by:
          advisedBy || null,

        result:
          result || null,

        input_did_not_work:
          inputDidNotWork || null,

        highest_input_cost:
          highestInputCost || null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("input_information")
        .upsert(onlinePayload, {
          onConflict: "survey_id",
        });

      if (saveError) {
        console.error(saveError);

        setError(
          "Input information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "G"
      );

      router.push(
        `/surveys/${surveyId}/h`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/h`
        );
        return;
      }

      setError(
        "Could not save input information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-600">
          Loading input information...
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
            G. Fertilizer & Other Inputs
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record fertilizers, manure, pesticides and other
            agricultural inputs used by the farmer.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section G
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "43.75%" }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section G data will be saved
            on this device and synchronized when the connection
            is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Input Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <Field
              label="Input Product(s)"
              value={inputProducts}
              onChange={setInputProducts}
              placeholder="Example: Urea, DAP, compost"
              disabled={saving}
            />

            <SelectField
              label="Input Type"
              value={inputType}
              onChange={setInputType}
              disabled={saving}
              options={[
                ["fertilizer", "Fertilizer"],
                ["organic_manure", "Organic manure"],
                ["micronutrient", "Micronutrient"],
                ["bio_input", "Bio-input"],
                ["pesticide", "Pesticide"],
                ["fungicide", "Fungicide"],
                ["herbicide", "Herbicide"],
                ["other", "Other"],
              ]}
            />

            <SelectField
              label="Organic / Chemical"
              value={organicOrChemical}
              onChange={setOrganicOrChemical}
              disabled={saving}
              options={[
                ["organic", "Organic"],
                ["chemical", "Chemical"],
                ["both", "Both"],
                ["not_applicable", "Not applicable"],
              ]}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Quantity
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Quantity"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                />

                <input
                  type="text"
                  value={quantityUnit}
                  onChange={(e) =>
                    setQuantityUnit(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  placeholder="Unit"
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                />
              </div>
            </div>

            <Field
              label="Application Date"
              type="date"
              value={applicationDate}
              onChange={setApplicationDate}
              disabled={saving}
            />

            <Field
              label="Growth Stage"
              value={growthStage}
              onChange={setGrowthStage}
              placeholder="Example: Vegetative, flowering"
              disabled={saving}
            />

            <Field
              label="Times Applied"
              type="number"
              value={timesApplied}
              onChange={setTimesApplied}
              placeholder="Number of applications"
              disabled={saving}
            />

            <Field
              label="Input Cost"
              type="number"
              value={inputCost}
              onChange={setInputCost}
              placeholder="Cost"
              disabled={saving}
            />

          </div>
        </section>

        <PhotoUpload
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          photoType="input_product"
          title="Input / Fertilizer Photo"
          description="Capture a clear photo of the fertilizer, manure, pesticide, seed treatment or other agricultural input used by the farmer."
          existingPhotoPath={existingPhotoPath}
          onUploaded={(storagePath) => {
            setExistingPhotoPath(
              storagePath
            );
          }}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Purchase & Usage
          </h2>

          <div className="space-y-4">

            <Field
              label="Purchase Location"
              value={purchaseLocation}
              onChange={setPurchaseLocation}
              placeholder="Dealer, shop or location"
              disabled={saving}
            />

            <TextAreaField
              label="Why was this input used?"
              value={whyUsed}
              onChange={setWhyUsed}
              placeholder="Reason for choosing this input"
              disabled={saving}
            />

            <Field
              label="Who advised the farmer?"
              value={advisedBy}
              onChange={setAdvisedBy}
              placeholder="Farmer / dealer / extension officer / family / other"
              disabled={saving}
            />

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Result & Problems
          </h2>

          <div className="space-y-4">

            <TextAreaField
              label="Result"
              value={result}
              onChange={setResult}
              placeholder="What result did the farmer observe after using the input?"
              disabled={saving}
            />

            <TextAreaField
              label="Input that did not work"
              value={inputDidNotWork}
              onChange={setInputDidNotWork}
              placeholder="Record any input that did not work as expected"
              disabled={saving}
            />

            <TextAreaField
              label="Highest Input Cost"
              value={highestInputCost}
              onChange={setHighestInputCost}
              placeholder="Which input contributes the highest cost?"
              disabled={saving}
            />

          </div>
        </section>

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
                `/surveys/${surveyId}/f`
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