import { createClient } from "@/lib/supabase/client";
import {
  getAllSurveyOfflineData,
  markSectionPendingSync,
  markSectionSynced,
  markSectionSyncFailed,
} from "./surveyManager";

type DraftData = Record<string, unknown>;

type SyncResult = {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    section: string;
    message: string;
  }>;
};

function removeOfflineMetadata(data: DraftData) {
  const cleaned = { ...data };

  delete cleaned.farmerId;
  delete cleaned.fieldId;
  delete cleaned.surveyId;
  delete cleaned.enumeratorId;

  delete cleaned.photoPath;
  delete cleaned.voicePath;

  delete cleaned.farmerCode;
  delete cleaned.fieldCode;
  delete cleaned.survey_id;
  delete cleaned.section;

  return cleaned;
}

function removeUndefinedValues(data: DraftData) {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) => value !== undefined
    )
  );
}

function toNumberOrNull(value: unknown) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

async function syncSection(
  surveyId: string,
  section: string,
  data: DraftData
) {
  const supabase = createClient();

  switch (section) {
    case "A": {
      const farmerId = data.farmerId;
      const fieldId = data.fieldId;
      const enumeratorId = data.enumeratorId;

      if (typeof farmerId !== "string") {
        throw new Error(
          "Farmer ID is missing for section A."
        );
      }

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section A."
        );
      }

      if (typeof enumeratorId !== "string") {
        throw new Error(
          "Enumerator ID is missing for section A."
        );
      }

      const surveyPayload = removeUndefinedValues({
        id: surveyId,
        farmer_id: farmerId,
        field_id: fieldId,
        enumerator_id: enumeratorId,
        survey_version:
          typeof data.survey_version === "number"
            ? data.survey_version
            : 1,
        gps_captured:
          typeof data.gpsCaptured === "string"
            ? data.gpsCaptured === "Yes"
            : typeof data.gps_captured === "boolean"
            ? data.gps_captured
            : null,
        gps_latitude:
          toNumberOrNull(
            data.gpsLatitude ?? data.gps_latitude
          ),
        gps_longitude:
          toNumberOrNull(
            data.gpsLongitude ?? data.gps_longitude
          ),
        internet_available:
          typeof data.internetAvailable === "string"
            ? data.internetAvailable === "Yes"
            : typeof data.internet_available === "boolean"
            ? data.internet_available
            : null,
        information_provider:
          typeof data.informationProvider === "string"
            ? data.informationProvider || null
            : typeof data.information_provider === "string"
            ? data.information_provider || null
            : null,
        visit_date:
          typeof data.visitDate === "string"
            ? data.visitDate || null
            : typeof data.visit_date === "string"
            ? data.visit_date || null
            : null,
        status:
          typeof data.status === "string"
            ? data.status
            : "draft",
        updated_at: new Date().toISOString(),
      });

      /*
       * First check whether the survey already exists.
       *
       * This handles both cases:
       *
       * 1. Survey was created online and then edited offline.
       * 2. Survey was created completely offline.
       */
      const { data: existingSurvey, error: lookupError } =
        await supabase
          .from("surveys")
          .select("id")
          .eq("id", surveyId)
          .maybeSingle();

      if (lookupError) {
        throw lookupError;
      }

      if (existingSurvey) {
        const { error } = await supabase
          .from("surveys")
          .update(surveyPayload)
          .eq("id", surveyId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase
          .from("surveys")
          .insert(surveyPayload);

        if (error) {
          throw error;
        }
      }

      break;
    }

    case "B": {
      const farmerId = data.farmerId;

      if (typeof farmerId !== "string") {
        throw new Error(
          "Farmer ID is missing for section B."
        );
      }

      const payload = removeUndefinedValues(
        removeOfflineMetadata(data)
      );

      const { error } = await supabase
        .from("farmers")
        .update(payload)
        .eq("id", farmerId);

      if (error) {
        throw error;
      }

      break;
    }

    case "C": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section C."
        );
      }

      const payload = removeUndefinedValues(
        removeOfflineMetadata(data)
      );

      const { error } = await supabase
        .from("fields")
        .update(payload)
        .eq("id", fieldId);

      if (error) {
        throw error;
      }

      break;
    }

    case "D": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section D."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("soil_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "E": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section E."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("crop_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "F": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section F."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("seed_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "G": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section G."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("input_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "H": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section H."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("irrigation_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "I": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section I."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("crop_problems")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "J": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section J."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("field_observations")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "K": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section K."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,

        area_harvested:
          toNumberOrNull(data.area_harvested),

        total_harvest_quantity:
          toNumberOrNull(
            data.total_harvest_quantity
          ),

        calculated_yield_per_acre:
          toNumberOrNull(
            data.calculated_yield_per_acre
          ),

        expected_yield:
          toNumberOrNull(data.expected_yield),

        actual_yield:
          toNumberOrNull(data.actual_yield),

        total_production_cost:
          toNumberOrNull(
            data.total_production_cost
          ),

        seed_spend:
          toNumberOrNull(data.seed_spend),

        fertilizer_input_spend:
          toNumberOrNull(
            data.fertilizer_input_spend
          ),

        labour_cost:
          toNumberOrNull(data.labour_cost),

        irrigation_cost:
          toNumberOrNull(data.irrigation_cost),

        transport_cost:
          toNumberOrNull(data.transport_cost),

        other_cost:
          toNumberOrNull(data.other_cost),

        sold_quantity:
          toNumberOrNull(data.sold_quantity),

        selling_price:
          toNumberOrNull(data.selling_price),

        total_revenue:
          toNumberOrNull(data.total_revenue),

        estimated_profit:
          toNumberOrNull(data.estimated_profit),
      });

      const { error } = await supabase
        .from("economics")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "L": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section L."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,

        buyer_distance:
          toNumberOrNull(data.buyer_distance),

        transport_cost:
          toNumberOrNull(data.transport_cost),
      });

      const { error } = await supabase
        .from("market_information")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "M": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section M."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,

        labour_cost:
          toNumberOrNull(data.labour_cost),

        rental_cost:
          toNumberOrNull(data.rental_cost),
      });

      const { error } = await supabase
        .from("labour_operations")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "N": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section N."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("farmer_knowledge")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "O": {
      const fieldId = data.fieldId;

      if (typeof fieldId !== "string") {
        throw new Error(
          "Field ID is missing for section O."
        );
      }

      const payload = removeUndefinedValues({
        ...removeOfflineMetadata(data),
        survey_id: surveyId,
        field_id: fieldId,
      });

      const { error } = await supabase
        .from("future_farmer_needs")
        .upsert(payload, {
          onConflict: "survey_id",
        });

      if (error) {
        throw error;
      }

      break;
    }

    case "P": {
      const shouldSubmit = data.submit === true;

      if (!shouldSubmit) {
        break;
      }

      const { error } = await supabase
        .from("surveys")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", surveyId)
        .neq("status", "submitted");

      if (error) {
        throw error;
      }

      break;
    }

    default:
      throw new Error(
        `Unsupported survey section: ${section}`
      );
  }
}

export async function syncSurvey(
  surveyId: string
): Promise<SyncResult> {
  const drafts = await getAllSurveyOfflineData(
    surveyId
  );

  if (drafts.length === 0) {
    return {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };
  }

  let synced = 0;
  let failed = 0;

  const errors: Array<{
    section: string;
    message: string;
  }> = [];

  const sortedDrafts = [...drafts].sort(
    (a, b) => a.section.localeCompare(b.section)
  );

  let previousSectionFailed = false;

  for (const draft of sortedDrafts) {
    if (draft.status === "synced") {
      continue;
    }

    if (draft.section === "P" && previousSectionFailed) {
      const message =
        "Final submission is waiting for earlier survey sections to sync successfully.";

      failed++;
      errors.push({ section: "P", message });
      await markSectionSyncFailed(
        surveyId,
        "P",
        message
      );
      continue;
    }

    try {
      await markSectionPendingSync(
        surveyId,
        draft.section
      );

      await syncSection(
        surveyId,
        draft.section,
        draft.data
      );

      await markSectionSynced(
        surveyId,
        draft.section
      );

      synced++;
    } catch (error) {
      failed++;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown sync error";

      errors.push({
        section: draft.section,
        message,
      });

      await markSectionSyncFailed(
        surveyId,
        draft.section,
        message
      );

      if (draft.section !== "P") {
        previousSectionFailed = true;
      }
    }
  }

  return {
    success: failed === 0,
    synced,
    failed,
    errors,
  };
}

export async function syncAllOfflineSurveys() {
  const { offlineDB } = await import("./db");

  const drafts = await offlineDB.surveyDrafts
    .where("status")
    .anyOf([
      "saved",
      "pending_sync",
      "sync_failed",
    ])
    .toArray();

  const surveyIds = [
    ...new Set(
      drafts.map((draft) => draft.surveyId)
    ),
  ];

  const results = [];

  for (const surveyId of surveyIds) {
    const result = await syncSurvey(surveyId);

    results.push({
      surveyId,
      ...result,
    });
  }

  return results;
}