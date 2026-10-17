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

export default function MarketSellingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const surveyId = params.id as string;
  const isOnline = useOnlineStatus();

  const [surveyCode, setSurveyCode] = useState("");
  const [farmerId, setFarmerId] = useState("");
  const [fieldId, setFieldId] = useState("");

  const [existingVoicePath, setExistingVoicePath] = useState("");

  const [sellingPlace, setSellingPlace] = useState("");
  const [buyerType, setBuyerType] = useState("");
  const [buyerDiscovery, setBuyerDiscovery] = useState("");
  const [buyerDistance, setBuyerDistance] = useState("");
  const [buyerDistanceUnit, setBuyerDistanceUnit] = useState("km");

  const [transportMethod, setTransportMethod] = useState("");
  const [transportCost, setTransportCost] = useState("");

  const [
    priceInformationBeforeHarvest,
    setPriceInformationBeforeHarvest,
  ] = useState("");

  const [priceDecision, setPriceDecision] = useState("");
  const [buyerDifficulty, setBuyerDifficulty] = useState("");
  const [storageAvailable, setStorageAvailable] = useState("");
  const [marketDifficulty, setMarketDifficulty] = useState("");

  const [
    interestedInDirectBuyerConnections,
    setInterestedInDirectBuyerConnections,
  ] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMarketInformation();
  }, [surveyId, isOnline]);

  async function loadMarketInformation() {
    setLoading(true);
    setError("");

    let onlineSurvey: Survey | null = null;

    if (isOnline) {
      const { data: survey, error: surveyError } =
        await supabase
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
      "L"
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

    let marketData: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: marketError,
      } = await supabase
        .from("market_information")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (marketError) {
        console.error(
          "Market information loading error:",
          marketError
        );
      } else {
        marketData = data;
      }

      const { data: voice } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "L")
        .eq("question_key", "market_selling")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (voice?.storage_path) {
        setExistingVoicePath(
          voice.storage_path
        );
      }
    }

    const localData = localDraft?.data ?? {};

    setSellingPlace(
      typeof localData.selling_place === "string"
        ? localData.selling_place
        : typeof marketData?.selling_place === "string"
          ? marketData.selling_place
          : ""
    );

    setBuyerType(
      typeof localData.buyer_type === "string"
        ? localData.buyer_type
        : typeof marketData?.buyer_type === "string"
          ? marketData.buyer_type
          : ""
    );

    setBuyerDiscovery(
      typeof localData.buyer_discovery === "string"
        ? localData.buyer_discovery
        : typeof marketData?.buyer_discovery === "string"
          ? marketData.buyer_discovery
          : ""
    );

    setBuyerDistance(
      typeof localData.buyer_distance === "string"
        ? localData.buyer_distance
        : typeof marketData?.buyer_distance === "number"
          ? marketData.buyer_distance.toString()
          : ""
    );

    setBuyerDistanceUnit(
      typeof localData.buyer_distance_unit === "string"
        ? localData.buyer_distance_unit
        : typeof marketData?.buyer_distance_unit === "string"
          ? marketData.buyer_distance_unit
          : "km"
    );

    setTransportMethod(
      typeof localData.transport_method === "string"
        ? localData.transport_method
        : typeof marketData?.transport_method === "string"
          ? marketData.transport_method
          : ""
    );

    setTransportCost(
      typeof localData.transport_cost === "string"
        ? localData.transport_cost
        : typeof marketData?.transport_cost === "number"
          ? marketData.transport_cost.toString()
          : ""
    );

    setPriceInformationBeforeHarvest(
      typeof localData.price_information_before_harvest ===
        "string"
        ? localData.price_information_before_harvest
        : typeof marketData?.price_information_before_harvest ===
              "string"
          ? marketData.price_information_before_harvest
          : ""
    );

    setPriceDecision(
      typeof localData.price_decision === "string"
        ? localData.price_decision
        : typeof marketData?.price_decision === "string"
          ? marketData.price_decision
          : ""
    );

    setBuyerDifficulty(
      typeof localData.buyer_difficulty === "string"
        ? localData.buyer_difficulty
        : typeof marketData?.buyer_difficulty === "string"
          ? marketData.buyer_difficulty
          : ""
    );

    setStorageAvailable(
      typeof localData.storage_available === "string"
        ? localData.storage_available
        : typeof marketData?.storage_available === "string"
          ? marketData.storage_available
          : ""
    );

    setMarketDifficulty(
      typeof localData.market_difficulty === "string"
        ? localData.market_difficulty
        : typeof marketData?.market_difficulty === "string"
          ? marketData.market_difficulty
          : ""
    );

    if (
      typeof localData.interested_in_direct_buyer_connections ===
      "string"
    ) {
      setInterestedInDirectBuyerConnections(
        localData.interested_in_direct_buyer_connections
      );
    } else if (
      marketData?.interested_in_direct_buyer_connections ===
      true
    ) {
      setInterestedInDirectBuyerConnections("yes");
    } else if (
      marketData?.interested_in_direct_buyer_connections ===
      false
    ) {
      setInterestedInDirectBuyerConnections("no");
    } else {
      setInterestedInDirectBuyerConnections("");
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

      selling_place: sellingPlace || "",
      buyer_type: buyerType || "",
      buyer_discovery: buyerDiscovery || "",

      buyer_distance: buyerDistance || "",
      buyer_distance_unit: buyerDistanceUnit || "km",

      transport_method: transportMethod || "",
      transport_cost: transportCost || "",

      price_information_before_harvest:
        priceInformationBeforeHarvest || "",

      price_decision: priceDecision || "",
      buyer_difficulty: buyerDifficulty || "",
      storage_available: storageAvailable || "",
      market_difficulty: marketDifficulty || "",

      interested_in_direct_buyer_connections:
        interestedInDirectBuyerConnections,

      voicePath: existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "L",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/m`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        selling_place:
          sellingPlace || null,

        buyer_type:
          buyerType || null,

        buyer_discovery:
          buyerDiscovery || null,

        buyer_distance:
          buyerDistance
            ? Number(buyerDistance)
            : null,

        buyer_distance_unit:
          buyerDistanceUnit || null,

        transport_method:
          transportMethod || null,

        transport_cost:
          transportCost
            ? Number(transportCost)
            : null,

        price_information_before_harvest:
          priceInformationBeforeHarvest || null,

        price_decision:
          priceDecision || null,

        buyer_difficulty:
          buyerDifficulty || null,

        storage_available:
          storageAvailable || null,

        market_difficulty:
          marketDifficulty || null,

        interested_in_direct_buyer_connections:
          interestedInDirectBuyerConnections === ""
            ? null
            : interestedInDirectBuyerConnections ===
                "yes",

        updated_at:
          new Date().toISOString(),
      };

      const { error: saveError } =
        await supabase
          .from("market_information")
          .upsert(
            onlinePayload,
            {
              onConflict: "survey_id",
            }
          );

      if (saveError) {
        console.error(saveError);

        setError(
          "Market information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "L"
      );

      router.push(
        `/surveys/${surveyId}/m`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/m`
        );
        return;
      }

      setError(
        "Could not save market information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500">
            Loading market information...
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
            L. Market & Selling
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record how the farmer sells produce, finds buyers,
            manages transport, and experiences the market.
          </p>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section L data will
            be saved on this device and synchronized
            when the connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Selling Information
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Where do you usually sell your produce?
              </label>

              <input
                value={sellingPlace}
                onChange={(e) =>
                  setSellingPlace(
                    e.target.value
                  )
                }
                placeholder="Example: Local market"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buyer type
              </label>

              <select
                value={buyerType}
                onChange={(e) =>
                  setBuyerType(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="">
                  Select buyer type
                </option>
                <option value="Local trader">
                  Local trader
                </option>
                <option value="Wholesale">
                  Wholesale
                </option>
                <option value="Direct consumer">
                  Direct consumer
                </option>
                <option value="Cooperative">
                  Cooperative
                </option>
                <option value="Company">
                  Company
                </option>
                <option value="Other">
                  Other
                </option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                How do you usually find your buyers?
              </label>

              <textarea
                value={buyerDiscovery}
                onChange={(e) =>
                  setBuyerDiscovery(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Example: Through local traders / previous contacts"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Approximate distance to buyer
              </label>

              <input
                type="number"
                min="0"
                value={buyerDistance}
                onChange={(e) =>
                  setBuyerDistance(
                    e.target.value
                  )
                }
                placeholder="Example: 8"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Distance unit
              </label>

              <select
                value={buyerDistanceUnit}
                onChange={(e) =>
                  setBuyerDistanceUnit(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="km">
                  Kilometres
                </option>
                <option value="miles">
                  Miles
                </option>
              </select>
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Transport
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                How is produce transported?
              </label>

              <input
                value={transportMethod}
                onChange={(e) =>
                  setTransportMethod(
                    e.target.value
                  )
                }
                placeholder="Example: Tractor / Van / Auto"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Transport cost
              </label>

              <input
                type="number"
                min="0"
                value={transportCost}
                onChange={(e) =>
                  setTransportCost(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Price & Buyer Experience
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Do you get price information before harvest?
              </label>

              <select
                value={priceInformationBeforeHarvest}
                onChange={(e) =>
                  setPriceInformationBeforeHarvest(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="">
                  Select an option
                </option>
                <option value="Yes">
                  Yes
                </option>
                <option value="No">
                  No
                </option>
                <option value="Sometimes">
                  Sometimes
                </option>
                <option value="Don't know">
                  Don't know
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                How do you decide the selling price?
              </label>

              <textarea
                value={priceDecision}
                onChange={(e) =>
                  setPriceDecision(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe how the farmer decides the selling price"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What difficulty do you face with buyers?
              </label>

              <textarea
                value={buyerDifficulty}
                onChange={(e) =>
                  setBuyerDifficulty(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe any buyer-related difficulties"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Storage & Market Access
          </h2>

          <div className="mt-5 space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Is storage available for your produce?
              </label>

              <select
                value={storageAvailable}
                onChange={(e) =>
                  setStorageAvailable(
                    e.target.value
                  )
                }
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              >
                <option value="">
                  Select an option
                </option>
                <option value="Yes">
                  Yes
                </option>
                <option value="No">
                  No
                </option>
                <option value="Limited">
                  Limited
                </option>
                <option value="Don't know">
                  Don't know
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                What is the biggest market difficulty?
              </label>

              <textarea
                value={marketDifficulty}
                onChange={(e) =>
                  setMarketDifficulty(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Describe the main market difficulty"
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Interested in direct buyer connections?
              </label>

              <div className="flex flex-wrap gap-3">
                {[
                  ["yes", "Yes"],
                  ["no", "No"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setInterestedInDirectBuyerConnections(
                        value
                      )
                    }
                    disabled={saving}
                    className={`rounded-lg border px-5 py-2.5 text-sm font-medium disabled:opacity-60 ${
                      interestedInDirectBuyerConnections ===
                      value
                        ? "border-green-600 bg-green-50 text-green-700"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-green-200 bg-green-50 p-5">

          <h2 className="text-lg font-semibold text-slate-900">
            Market & Selling Voice Note
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Record the farmer explaining their selling practices,
            buyers, transport, pricing and market difficulties.
          </p>

          <div className="mt-4">
            <VoiceRecorder
              surveyId={surveyId}
              farmerId={farmerId}
              fieldId={fieldId}
              section="L"
              questionKey="market_selling"
              title="Market & Selling Voice Note"
              description="Record the farmer's explanation about buyers, selling practices, transport, pricing and market difficulties."
              existingVoicePath={existingVoicePath}
              onUploaded={(storagePath) => {
                setExistingVoicePath(
                  storagePath
                );
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
              router.push(
                `/surveys/${surveyId}/k`
              )
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