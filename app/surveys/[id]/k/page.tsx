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

export default function SurveySectionK() {
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
  const [existingVoicePath, setExistingVoicePath] = useState("");

  const [areaHarvested, setAreaHarvested] = useState("");
  const [areaHarvestedUnit, setAreaHarvestedUnit] = useState("");

  const [totalHarvestQuantity, setTotalHarvestQuantity] =
    useState("");
  const [harvestQuantityUnit, setHarvestQuantityUnit] =
    useState("");

  const [calculatedYieldPerAcre, setCalculatedYieldPerAcre] =
    useState("");

  const [expectedYield, setExpectedYield] = useState("");
  const [expectedYieldUnit, setExpectedYieldUnit] = useState("");

  const [actualYield, setActualYield] = useState("");
  const [actualYieldUnit, setActualYieldUnit] = useState("");

  const [totalProductionCost, setTotalProductionCost] =
    useState("");
  const [seedSpend, setSeedSpend] = useState("");
  const [fertilizerInputSpend, setFertilizerInputSpend] =
    useState("");
  const [labourCost, setLabourCost] = useState("");
  const [irrigationCost, setIrrigationCost] = useState("");
  const [transportCost, setTransportCost] = useState("");
  const [otherCost, setOtherCost] = useState("");

  const [soldQuantity, setSoldQuantity] = useState("");
  const [soldQuantityUnit, setSoldQuantityUnit] = useState("");

  const [sellingPrice, setSellingPrice] = useState("");
  const [sellingPriceUnit, setSellingPriceUnit] = useState("");

  const [totalRevenue, setTotalRevenue] = useState("");
  const [estimatedProfit, setEstimatedProfit] = useState("");

  const [incomeSatisfaction, setIncomeSatisfaction] =
    useState("");
  const [biggestIncomeReduction, setBiggestIncomeReduction] =
    useState("");

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
      "K"
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

    let economics: Record<string, unknown> | null = null;

    if (isOnline && onlineSurvey) {
      const {
        data,
        error: economicsError,
      } = await supabase
        .from("economics")
        .select("*")
        .eq("survey_id", surveyId)
        .maybeSingle();

      if (economicsError) {
        console.error(
          "Economics loading error:",
          economicsError
        );
      } else {
        economics = data;
      }

      const { data: voice } = await supabase
        .from("voice_notes")
        .select("storage_path")
        .eq("survey_id", surveyId)
        .eq("section", "K")
        .eq("question_key", "harvest_economics")
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

    setAreaHarvested(
      typeof localData.area_harvested === "string"
        ? localData.area_harvested
        : typeof economics?.area_harvested === "number"
          ? economics.area_harvested.toString()
          : ""
    );

    setAreaHarvestedUnit(
      typeof localData.area_harvested_unit === "string"
        ? localData.area_harvested_unit
        : typeof economics?.area_harvested_unit === "string"
          ? economics.area_harvested_unit
          : ""
    );

    setTotalHarvestQuantity(
      typeof localData.total_harvest_quantity === "string"
        ? localData.total_harvest_quantity
        : typeof economics?.total_harvest_quantity === "number"
          ? economics.total_harvest_quantity.toString()
          : ""
    );

    setHarvestQuantityUnit(
      typeof localData.harvest_quantity_unit === "string"
        ? localData.harvest_quantity_unit
        : typeof economics?.harvest_quantity_unit === "string"
          ? economics.harvest_quantity_unit
          : ""
    );

    setCalculatedYieldPerAcre(
      typeof localData.calculated_yield_per_acre === "string"
        ? localData.calculated_yield_per_acre
        : typeof economics?.calculated_yield_per_acre === "number"
          ? economics.calculated_yield_per_acre.toString()
          : ""
    );

    setExpectedYield(
      typeof localData.expected_yield === "string"
        ? localData.expected_yield
        : typeof economics?.expected_yield === "number"
          ? economics.expected_yield.toString()
          : ""
    );

    setExpectedYieldUnit(
      typeof localData.expected_yield_unit === "string"
        ? localData.expected_yield_unit
        : typeof economics?.expected_yield_unit === "string"
          ? economics.expected_yield_unit
          : ""
    );

    setActualYield(
      typeof localData.actual_yield === "string"
        ? localData.actual_yield
        : typeof economics?.actual_yield === "number"
          ? economics.actual_yield.toString()
          : ""
    );

    setActualYieldUnit(
      typeof localData.actual_yield_unit === "string"
        ? localData.actual_yield_unit
        : typeof economics?.actual_yield_unit === "string"
          ? economics.actual_yield_unit
          : ""
    );

    setTotalProductionCost(
      typeof localData.total_production_cost === "string"
        ? localData.total_production_cost
        : typeof economics?.total_production_cost === "number"
          ? economics.total_production_cost.toString()
          : ""
    );

    setSeedSpend(
      typeof localData.seed_spend === "string"
        ? localData.seed_spend
        : typeof economics?.seed_spend === "number"
          ? economics.seed_spend.toString()
          : ""
    );

    setFertilizerInputSpend(
      typeof localData.fertilizer_input_spend === "string"
        ? localData.fertilizer_input_spend
        : typeof economics?.fertilizer_input_spend === "number"
          ? economics.fertilizer_input_spend.toString()
          : ""
    );

    setLabourCost(
      typeof localData.labour_cost === "string"
        ? localData.labour_cost
        : typeof economics?.labour_cost === "number"
          ? economics.labour_cost.toString()
          : ""
    );

    setIrrigationCost(
      typeof localData.irrigation_cost === "string"
        ? localData.irrigation_cost
        : typeof economics?.irrigation_cost === "number"
          ? economics.irrigation_cost.toString()
          : ""
    );

    setTransportCost(
      typeof localData.transport_cost === "string"
        ? localData.transport_cost
        : typeof economics?.transport_cost === "number"
          ? economics.transport_cost.toString()
          : ""
    );

    setOtherCost(
      typeof localData.other_cost === "string"
        ? localData.other_cost
        : typeof economics?.other_cost === "number"
          ? economics.other_cost.toString()
          : ""
    );

    setSoldQuantity(
      typeof localData.sold_quantity === "string"
        ? localData.sold_quantity
        : typeof economics?.sold_quantity === "number"
          ? economics.sold_quantity.toString()
          : ""
    );

    setSoldQuantityUnit(
      typeof localData.sold_quantity_unit === "string"
        ? localData.sold_quantity_unit
        : typeof economics?.sold_quantity_unit === "string"
          ? economics.sold_quantity_unit
          : ""
    );

    setSellingPrice(
      typeof localData.selling_price === "string"
        ? localData.selling_price
        : typeof economics?.selling_price === "number"
          ? economics.selling_price.toString()
          : ""
    );

    setSellingPriceUnit(
      typeof localData.selling_price_unit === "string"
        ? localData.selling_price_unit
        : typeof economics?.selling_price_unit === "string"
          ? economics.selling_price_unit
          : ""
    );

    setTotalRevenue(
      typeof localData.total_revenue === "string"
        ? localData.total_revenue
        : typeof economics?.total_revenue === "number"
          ? economics.total_revenue.toString()
          : ""
    );

    setEstimatedProfit(
      typeof localData.estimated_profit === "string"
        ? localData.estimated_profit
        : typeof economics?.estimated_profit === "number"
          ? economics.estimated_profit.toString()
          : ""
    );

    setIncomeSatisfaction(
      typeof localData.income_satisfaction === "string"
        ? localData.income_satisfaction
        : typeof economics?.income_satisfaction === "string"
          ? economics.income_satisfaction
          : ""
    );

    setBiggestIncomeReduction(
      typeof localData.biggest_income_reduction === "string"
        ? localData.biggest_income_reduction
        : typeof economics?.biggest_income_reduction === "string"
          ? economics.biggest_income_reduction
          : ""
    );

    setLoading(false);
  }

  function calculateRevenueAndProfit() {
    setError("");

    const quantity = parseFloat(soldQuantity);
    const price = parseFloat(sellingPrice);
    const cost = parseFloat(totalProductionCost);

    if (isNaN(quantity) || isNaN(price)) {
      setError(
        "Please enter Quantity Sold and Selling Price first."
      );
      return;
    }

    if (quantity < 0 || price < 0) {
      setError(
        "Quantity Sold and Selling Price cannot be negative."
      );
      return;
    }

    const revenue = quantity * price;

    setTotalRevenue(revenue.toFixed(2));

    if (!isNaN(cost)) {
      const profit = revenue - cost;
      setEstimatedProfit(
        profit.toFixed(2)
      );
    } else {
      setEstimatedProfit("");
    }
  }

  async function saveAndContinue() {
    setSaving(true);
    setError("");

    const localPayload = {
      survey_id: surveyId,
      farmerId,
      fieldId,

      area_harvested:
        areaHarvested || "",

      area_harvested_unit:
        areaHarvestedUnit || "",

      total_harvest_quantity:
        totalHarvestQuantity || "",

      harvest_quantity_unit:
        harvestQuantityUnit || "",

      calculated_yield_per_acre:
        calculatedYieldPerAcre || "",

      expected_yield:
        expectedYield || "",

      expected_yield_unit:
        expectedYieldUnit || "",

      actual_yield:
        actualYield || "",

      actual_yield_unit:
        actualYieldUnit || "",

      total_production_cost:
        totalProductionCost || "",

      seed_spend:
        seedSpend || "",

      fertilizer_input_spend:
        fertilizerInputSpend || "",

      labour_cost:
        labourCost || "",

      irrigation_cost:
        irrigationCost || "",

      transport_cost:
        transportCost || "",

      other_cost:
        otherCost || "",

      sold_quantity:
        soldQuantity || "",

      sold_quantity_unit:
        soldQuantityUnit || "",

      selling_price:
        sellingPrice || "",

      selling_price_unit:
        sellingPriceUnit || "",

      total_revenue:
        totalRevenue || "",

      estimated_profit:
        estimatedProfit || "",

      income_satisfaction:
        incomeSatisfaction || "",

      biggest_income_reduction:
        biggestIncomeReduction || "",

      voicePath:
        existingVoicePath || "",
    };

    try {
      await saveSurveySectionOffline({
        surveyId,
        surveyCode,
        section: "K",
        data: localPayload,
      });

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/l`
        );
        return;
      }

      const onlinePayload = {
        survey_id: surveyId,
        field_id: fieldId,

        area_harvested: areaHarvested
          ? Number(areaHarvested)
          : null,

        area_harvested_unit:
          areaHarvestedUnit || null,

        total_harvest_quantity:
          totalHarvestQuantity
            ? Number(totalHarvestQuantity)
            : null,

        harvest_quantity_unit:
          harvestQuantityUnit || null,

        calculated_yield_per_acre:
          calculatedYieldPerAcre
            ? Number(calculatedYieldPerAcre)
            : null,

        expected_yield: expectedYield
          ? Number(expectedYield)
          : null,

        expected_yield_unit:
          expectedYieldUnit || null,

        actual_yield: actualYield
          ? Number(actualYield)
          : null,

        actual_yield_unit:
          actualYieldUnit || null,

        total_production_cost:
          totalProductionCost
            ? Number(totalProductionCost)
            : null,

        seed_spend: seedSpend
          ? Number(seedSpend)
          : null,

        fertilizer_input_spend:
          fertilizerInputSpend
            ? Number(fertilizerInputSpend)
            : null,

        labour_cost: labourCost
          ? Number(labourCost)
          : null,

        irrigation_cost:
          irrigationCost
            ? Number(irrigationCost)
            : null,

        transport_cost:
          transportCost
            ? Number(transportCost)
            : null,

        other_cost: otherCost
          ? Number(otherCost)
          : null,

        sold_quantity: soldQuantity
          ? Number(soldQuantity)
          : null,

        sold_quantity_unit:
          soldQuantityUnit || null,

        selling_price: sellingPrice
          ? Number(sellingPrice)
          : null,

        selling_price_unit:
          sellingPriceUnit || null,

        total_revenue: totalRevenue
          ? Number(totalRevenue)
          : null,

        estimated_profit:
          estimatedProfit
            ? Number(estimatedProfit)
            : null,

        income_satisfaction:
          incomeSatisfaction || null,

        biggest_income_reduction:
          biggestIncomeReduction || null,

        updated_at:
          new Date().toISOString(),
      };

      const {
        error: saveError,
      } = await supabase
        .from("economics")
        .upsert(
          onlinePayload,
          {
            onConflict: "survey_id",
          }
        );

      if (saveError) {
        console.error(saveError);

        setError(
          "Economics information was saved on this device but could not be uploaded. It will sync automatically when the connection is available."
        );

        setSaving(false);
        return;
      }

      await markSectionSynced(
        surveyId,
        "K"
      );

      router.push(
        `/surveys/${surveyId}/l`
      );
    } catch (saveError) {
      console.error(saveError);

      if (!isOnline) {
        router.push(
          `/surveys/${surveyId}/l`
        );
        return;
      }

      setError(
        "Could not save economics information."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <InternLayout>
        <div className="p-6">
          Loading Section K...
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
            K. Harvest, Yield & Economics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Record harvest, yield, production costs, sales and
            income.
          </p>
        </div>

        {!isOnline && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            You are offline. Your Section K data will
            be saved on this device and synchronized
            when the connection is restored.
          </div>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Harvest & Yield
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Area Harvested
              </label>

              <input
                type="number"
                min="0"
                value={areaHarvested}
                onChange={(e) =>
                  setAreaHarvested(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Area Unit
              </label>

              <select
                value={areaHarvestedUnit}
                onChange={(e) =>
                  setAreaHarvestedUnit(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
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
              <label className="text-sm font-medium text-slate-700">
                Total Harvest Quantity
              </label>

              <input
                type="number"
                min="0"
                value={totalHarvestQuantity}
                onChange={(e) =>
                  setTotalHarvestQuantity(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Harvest Quantity Unit
              </label>

              <input
                value={harvestQuantityUnit}
                onChange={(e) =>
                  setHarvestQuantityUnit(
                    e.target.value
                  )
                }
                placeholder="kg, quintal, tonne..."
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Calculated Yield / Acre
              </label>

              <input
                type="number"
                min="0"
                value={calculatedYieldPerAcre}
                onChange={(e) =>
                  setCalculatedYieldPerAcre(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Expected vs Actual Yield
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Expected Yield
              </label>

              <input
                type="number"
                min="0"
                value={expectedYield}
                onChange={(e) =>
                  setExpectedYield(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Expected Yield Unit
              </label>

              <input
                value={expectedYieldUnit}
                onChange={(e) =>
                  setExpectedYieldUnit(
                    e.target.value
                  )
                }
                placeholder="kg, quintal, tonne..."
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Actual Yield
              </label>

              <input
                type="number"
                min="0"
                value={actualYield}
                onChange={(e) =>
                  setActualYield(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Actual Yield Unit
              </label>

              <input
                value={actualYieldUnit}
                onChange={(e) =>
                  setActualYieldUnit(
                    e.target.value
                  )
                }
                placeholder="kg, quintal, tonne..."
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Production Costs
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Total Production Cost
              </label>

              <input
                type="number"
                min="0"
                value={totalProductionCost}
                onChange={(e) =>
                  setTotalProductionCost(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Seed Spend
              </label>

              <input
                type="number"
                min="0"
                value={seedSpend}
                onChange={(e) =>
                  setSeedSpend(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Fertilizer / Input Spend
              </label>

              <input
                type="number"
                min="0"
                value={fertilizerInputSpend}
                onChange={(e) =>
                  setFertilizerInputSpend(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Labour Cost
              </label>

              <input
                type="number"
                min="0"
                value={labourCost}
                onChange={(e) =>
                  setLabourCost(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Irrigation Cost
              </label>

              <input
                type="number"
                min="0"
                value={irrigationCost}
                onChange={(e) =>
                  setIrrigationCost(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Transport Cost
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
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Other Cost
              </label>

              <input
                type="number"
                min="0"
                value={otherCost}
                onChange={(e) =>
                  setOtherCost(
                    e.target.value
                  )
                }
                placeholder="₹"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>

          <p className="mt-3 text-xs text-slate-500">
            Total Production Cost should represent the overall
            production cost. The individual cost fields are recorded
            separately for analysis.
          </p>

        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Sales & Revenue
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Quantity Sold
              </label>

              <input
                type="number"
                min="0"
                value={soldQuantity}
                onChange={(e) =>
                  setSoldQuantity(
                    e.target.value
                  )
                }
                placeholder="Enter quantity"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Sold Quantity Unit
              </label>

              <input
                value={soldQuantityUnit}
                onChange={(e) =>
                  setSoldQuantityUnit(
                    e.target.value
                  )
                }
                placeholder="kg, quintal, tonne..."
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Selling Price
              </label>

              <input
                type="number"
                min="0"
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(
                    e.target.value
                  )
                }
                placeholder="Enter price"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Selling Price Unit
              </label>

              <input
                value={sellingPriceUnit}
                onChange={(e) =>
                  setSellingPriceUnit(
                    e.target.value
                  )
                }
                placeholder="₹ / kg, ₹ / quintal..."
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>

          <button
            type="button"
            onClick={calculateRevenueAndProfit}
            disabled={saving}
            className="mt-5 w-full rounded-lg bg-green-700 px-4 py-3 font-medium text-white hover:bg-green-800 disabled:opacity-50 md:w-auto"
          >
            Calculate Revenue & Profit
          </button>

          <div className="mt-5 grid gap-4 md:grid-cols-2">

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-slate-600">
                Total Revenue
              </p>

              <p className="mt-1 text-2xl font-bold text-green-700">
                {totalRevenue
                  ? `₹${Number(totalRevenue).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                  : "₹0.00"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Quantity Sold × Selling Price
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-medium text-slate-600">
                Estimated Profit
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-700">
                {estimatedProfit
                  ? `₹${Number(
                      estimatedProfit
                    ).toLocaleString(
                      "en-IN",
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}`
                  : "₹0.00"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Revenue − Total Production Cost
              </p>
            </div>

          </div>

        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Income Experience
          </h2>

          <div className="mt-4 space-y-4">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Are you satisfied with the income?
              </label>

              <select
                value={incomeSatisfaction}
                onChange={(e) =>
                  setIncomeSatisfaction(
                    e.target.value
                  )
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              >
                <option value="">
                  Select
                </option>
                <option value="Very satisfied">
                  Very satisfied
                </option>
                <option value="Satisfied">
                  Satisfied
                </option>
                <option value="Neutral">
                  Neutral
                </option>
                <option value="Dissatisfied">
                  Dissatisfied
                </option>
                <option value="Very dissatisfied">
                  Very dissatisfied
                </option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                What reduced income the most?
              </label>

              <textarea
                value={biggestIncomeReduction}
                onChange={(e) =>
                  setBiggestIncomeReduction(
                    e.target.value
                  )
                }
                placeholder="Describe the biggest factor affecting income"
                rows={3}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
              />
            </div>

          </div>

        </section>

        <section className="rounded-xl border border-green-200 bg-green-50 p-5">

          <h2 className="text-lg font-semibold text-slate-900">
            Harvest & Economics Voice Note
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Record the farmer explaining their harvest, yield,
            production costs, sales, income and related experiences.
          </p>

          <div className="mt-4">
            <VoiceRecorder
              surveyId={surveyId}
              farmerId={farmerId}
              fieldId={fieldId}
              section="K"
              questionKey="harvest_economics"
              title="Harvest & Economics Voice Note"
              description="Record the farmer's explanation about harvest, yield, costs, sales and income."
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pb-8">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/surveys/${surveyId}/j`
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