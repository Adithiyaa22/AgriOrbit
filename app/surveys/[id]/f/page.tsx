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

export default function SurveyFPage() {
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

  const [seedName, setSeedName] = useState("");
  const [variety, setVariety] = useState("");
  const [brand, setBrand] = useState("");

  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [supplierDealer, setSupplierDealer] = useState("");

  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");

  const [seedCost, setSeedCost] = useState("");

  const [certifiedLabelled, setCertifiedLabelled] = useState("");

  const [usedBefore, setUsedBefore] = useState("");

  const [previousYield, setPreviousYield] = useState("");
  const [previousYieldUnit, setPreviousYieldUnit] = useState("");

  const [satisfactionRating, setSatisfactionRating] = useState("");

  const [bestYieldSeedVariety, setBestYieldSeedVariety] = useState("");
  const [whyPreferred, setWhyPreferred] = useState("");

  const [seedProblems, setSeedProblems] = useState("");

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
      "F"
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
            : surveyCode || "Offline Survey";

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

    let seedData: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: seedError,
      } = await supabase
        .from("seed_information")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (seedError) {
        console.error(seedError);
      } else {
        seedData = data;
      }

      const {
        data: photoData,
        error: photoError,
      } = await supabase
        .from("photos")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("photo_type", "seed_input")
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

    setSeedName(
      typeof localData.seed_name === "string"
        ? localData.seed_name
        : typeof seedData?.seed_name === "string"
          ? seedData.seed_name
          : ""
    );

    setVariety(
      typeof localData.variety === "string"
        ? localData.variety
        : typeof seedData?.variety === "string"
          ? seedData.variety
          : ""
    );

    setBrand(
      typeof localData.brand === "string"
        ? localData.brand
        : typeof seedData?.brand === "string"
          ? seedData.brand
          : ""
    );

    setPurchaseLocation(
      typeof localData.purchase_location === "string"
        ? localData.purchase_location
        : typeof seedData?.purchase_location === "string"
          ? seedData.purchase_location
          : ""
    );

    setSupplierDealer(
      typeof localData.supplier_dealer === "string"
        ? localData.supplier_dealer
        : typeof seedData?.supplier_dealer === "string"
          ? seedData.supplier_dealer
          : ""
    );

    setQuantity(
      localData.quantity !== undefined
        ? String(localData.quantity)
        : seedData?.quantity !== null &&
            seedData?.quantity !== undefined
          ? String(seedData.quantity)
          : ""
    );

    setQuantityUnit(
      typeof localData.quantity_unit === "string"
        ? localData.quantity_unit
        : typeof seedData?.quantity_unit === "string"
          ? seedData.quantity_unit
          : ""
    );

    setSeedCost(
      localData.seed_cost !== undefined
        ? String(localData.seed_cost)
        : seedData?.seed_cost !== null &&
            seedData?.seed_cost !== undefined
          ? String(seedData.seed_cost)
          : ""
    );

    setCertifiedLabelled(
      typeof localData.certified_labelled === "string"
        ? localData.certified_labelled
        : typeof seedData?.certified_labelled === "string"
          ? seedData.certified_labelled
          : ""
    );

    if (localData.used_before !== undefined) {
      setUsedBefore(
        localData.used_before === true ||
          localData.used_before === "yes"
          ? "yes"
          : localData.used_before === false ||
              localData.used_before === "no"
            ? "no"
            : ""
      );
    } else if (
      seedData?.used_before !== null &&
      seedData?.used_before !== undefined
    ) {
      setUsedBefore(
        seedData.used_before
          ? "yes"
          : "no"
      );
    } else {
      setUsedBefore("");
    }

    setPreviousYield(
      localData.previous_yield !== undefined
        ? String(localData.previous_yield)
        : seedData?.previous_yield !== null &&
            seedData?.previous_yield !== undefined
          ? String(seedData.previous_yield)
          : ""
    );

    setPreviousYieldUnit(
      typeof localData.previous_yield_unit === "string"
        ? localData.previous_yield_unit
        : typeof seedData?.previous_yield_unit === "string"
          ? seedData.previous_yield_unit
          : ""
    );

    setSatisfactionRating(
      localData.satisfaction_rating !== undefined
        ? String(localData.satisfaction_rating)
        : seedData?.satisfaction_rating !== null &&
            seedData?.satisfaction_rating !== undefined
          ? String(seedData.satisfaction_rating)
          : ""
    );

    setBestYieldSeedVariety(
      typeof localData.best_yield_seed_variety === "string"
        ? localData.best_yield_seed_variety
        : typeof seedData?.best_yield_seed_variety === "string"
          ? seedData.best_yield_seed_variety
          : ""
    );

    setWhyPreferred(
      typeof localData.why_preferred === "string"
        ? localData.why_preferred
        : typeof seedData?.why_preferred === "string"
          ? seedData.why_preferred
          : ""
    );

    setSeedProblems(
      typeof localData.seed_problems === "string"
        ? localData.seed_problems
        : typeof seedData?.seed_problems === "string"
          ? seedData.seed_problems
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

      seed_name: seedName || null,
      variety: variety || null,
      brand: brand || null,

      purchase_location:
        purchaseLocation || null,

      supplier_dealer:
        supplierDealer || null,

      quantity:
        quantity ? Number(quantity) : null,

      quantity_unit:
        quantityUnit || null,

      seed_cost:
        seedCost ? Number(seedCost) : null,

      certified_labelled:
        certifiedLabelled || null,

      used_before:
        usedBefore === ""
          ? null
          : usedBefore === "yes",

      previous_yield:
        previousYield
          ? Number(previousYield)
          : null,

      previous_yield_unit:
        previousYieldUnit || null,

      satisfaction_rating:
        satisfactionRating
          ? Number(satisfactionRating)
          : null,

      best_yield_seed_variety:
        bestYieldSeedVariety || null,

      why_preferred:
        whyPreferred || null,

      seed_problems:
        seedProblems || null,

      photoPath:
        existingPhotoPath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "F",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/g`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        seed_name: seedName || null,
        variety: variety || null,
        brand: brand || null,

        purchase_location:
          purchaseLocation || null,

        supplier_dealer:
          supplierDealer || null,

        quantity:
          quantity ? Number(quantity) : null,

        quantity_unit:
          quantityUnit || null,

        seed_cost:
          seedCost ? Number(seedCost) : null,

        certified_labelled:
          certifiedLabelled || null,

        used_before:
          usedBefore === ""
            ? null
            : usedBefore === "yes",

        previous_yield:
          previousYield
            ? Number(previousYield)
            : null,

        previous_yield_unit:
          previousYieldUnit || null,

        satisfaction_rating:
          satisfactionRating
            ? Number(satisfactionRating)
            : null,

        best_yield_seed_variety:
          bestYieldSeedVariety || null,

        why_preferred:
          whyPreferred || null,

        seed_problems:
          seedProblems || null,

        updated_at:
          new Date().toISOString(),
      };

      const { error: saveError } =
        await supabase
          .from("seed_information")
          .upsert(onlinePayload, {
            onConflict: "survey_id",
          });

      if (saveError) {
        console.error(saveError);

        setError(
          "Seed information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "F"
      );

      router.push(
        `/surveys/${surveyId}/g`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/g`
        );
        return;
      }

      setError(
        "Could not save seed information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6 text-slate-600">
          Loading seed information...
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
            F. Seed & Variety
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record the seed and variety information used by the farmer.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">
              Survey Progress
            </span>

            <span className="text-slate-500">
              Section F
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600"
              style={{ width: "37.5%" }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section F data will be saved
            on this device and synchronized when the connection
            is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Seed Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <Field
              label="Seed Name"
              value={seedName}
              onChange={setSeedName}
              placeholder="Enter seed name"
              disabled={saving}
            />

            <Field
              label="Variety"
              value={variety}
              onChange={setVariety}
              placeholder="Enter variety"
              disabled={saving}
            />

            <Field
              label="Brand"
              value={brand}
              onChange={setBrand}
              placeholder="Enter brand"
              disabled={saving}
            />

            <Field
              label="Purchase Location"
              value={purchaseLocation}
              onChange={setPurchaseLocation}
              placeholder="Dealer / shop / location"
              disabled={saving}
            />

            <Field
              label="Supplier / Dealer"
              value={supplierDealer}
              onChange={setSupplierDealer}
              placeholder="Enter supplier or dealer"
              disabled={saving}
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
                    setQuantity(e.target.value)
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                  placeholder="Quantity"
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
                  className="w-28 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                  placeholder="Unit"
                />
              </div>
            </div>

            <Field
              label="Seed Cost"
              type="number"
              value={seedCost}
              onChange={setSeedCost}
              placeholder="Enter cost"
              disabled={saving}
            />

            <SelectField
              label="Certified / Labelled"
              value={certifiedLabelled}
              onChange={setCertifiedLabelled}
              disabled={saving}
              options={[
                ["yes", "Yes"],
                ["no", "No"],
                ["dont_know", "Don't know"],
              ]}
            />
          </div>
        </section>

        <PhotoUpload
          surveyId={surveyId}
          farmerId={farmerId}
          fieldId={fieldId}
          photoType="seed_input"
          title="Seed / Variety Photo"
          description="Capture a clear photo of the seed packet, seed label, variety, or seed used by the farmer."
          existingPhotoPath={existingPhotoPath}
          onUploaded={(storagePath) => {
            setExistingPhotoPath(
              storagePath
            );
          }}
        />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Previous Usage
          </h2>

          <div className="grid gap-4 md:grid-cols-2">

            <SelectField
              label="Have you used this seed before?"
              value={usedBefore}
              onChange={setUsedBefore}
              disabled={saving}
              options={[
                ["yes", "Yes"],
                ["no", "No"],
              ]}
            />

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Previous Yield
              </label>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={previousYield}
                  onChange={(e) =>
                    setPreviousYield(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                  placeholder="Yield"
                />

                <input
                  type="text"
                  value={previousYieldUnit}
                  onChange={(e) =>
                    setPreviousYieldUnit(
                      e.target.value
                    )
                  }
                  disabled={saving}
                  className="w-32 rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-green-600 disabled:bg-slate-50"
                  placeholder="Unit"
                />
              </div>
            </div>

            <SelectField
              label="Satisfaction Rating"
              value={satisfactionRating}
              onChange={setSatisfactionRating}
              disabled={saving}
              options={[
                ["1", "1 - Very dissatisfied"],
                ["2", "2 - Dissatisfied"],
                ["3", "3 - Neutral"],
                ["4", "4 - Satisfied"],
                ["5", "5 - Very satisfied"],
              ]}
            />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Farmer&apos;s Seed Preference
          </h2>

          <div className="space-y-4">

            <Field
              label="Best-Yield Seed / Variety"
              value={bestYieldSeedVariety}
              onChange={setBestYieldSeedVariety}
              placeholder="Which seed or variety gave the best yield?"
              disabled={saving}
            />

            <TextAreaField
              label="Why is it preferred?"
              value={whyPreferred}
              onChange={setWhyPreferred}
              placeholder="Why does the farmer prefer this seed or variety?"
              disabled={saving}
            />

            <TextAreaField
              label="Seed Problems"
              value={seedProblems}
              onChange={setSeedProblems}
              placeholder="Any problems faced with seeds or varieties?"
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
                `/surveys/${surveyId}/e`
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