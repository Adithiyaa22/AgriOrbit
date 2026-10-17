import { createClient } from "@/lib/supabase/client";
import {
  getPendingMedia,
  markMediaUploading,
  markMediaUploaded,
  markMediaFailed,
  resetStaleUploadingMedia,
  clearUploadedMedia,
} from "./mediaQueue";

function getFileExtension(
  fileName: string,
  mimeType: string
) {
  const existingExtension = fileName.includes(".")
    ? fileName.split(".").pop()
    : null;

  if (existingExtension) {
    return existingExtension.toLowerCase();
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  return "bin";
}

async function syncPhoto(
  item: Awaited<ReturnType<typeof getPendingMedia>>[number]
) {
  const supabase = createClient();
  const metadata = item.metadata;

  const surveyId = metadata.surveyId;
  const farmerId = metadata.farmerId;
  const fieldId = metadata.fieldId;
  const enumeratorId = metadata.enumeratorId;
  const photoType = metadata.photoType;

  if (
    typeof surveyId !== "string" ||
    typeof farmerId !== "string" ||
    typeof fieldId !== "string" ||
    typeof enumeratorId !== "string" ||
    typeof photoType !== "string"
  ) {
    throw new Error(
      "Required photo metadata is missing."
    );
  }

  const extension = getFileExtension(
    item.fileName,
    item.mimeType
  );

  const storagePath =
    `${enumeratorId}/${surveyId}/${item.id}.${extension}`;

  const { data: existingPhoto, error: lookupError } =
    await supabase
      .from("photos")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingPhoto) {
    return;
  }

  const { error: uploadError } =
    await supabase.storage
      .from("photos")
      .upload(storagePath, item.file, {
        contentType: item.mimeType,
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { error: databaseError } =
    await supabase
      .from("photos")
      .insert({
        survey_id: surveyId,
        farmer_id: farmerId,
        field_id: fieldId,
        enumerator_id: enumeratorId,
        photo_type: photoType,
        storage_path: storagePath,
        file_name: item.fileName,
        mime_type: item.mimeType,
        file_size: item.file.size,
        latitude:
          typeof metadata.latitude === "number"
            ? metadata.latitude
            : null,
        longitude:
          typeof metadata.longitude === "number"
            ? metadata.longitude
            : null,
      });

  if (databaseError) {
    throw databaseError;
  }
}

async function syncVoice(
  item: Awaited<ReturnType<typeof getPendingMedia>>[number]
) {
  const supabase = createClient();
  const metadata = item.metadata;

  const surveyId = metadata.surveyId;
  const farmerId = metadata.farmerId;
  const fieldId = metadata.fieldId;
  const enumeratorId = metadata.enumeratorId;
  const section = metadata.section;
  const questionKey = metadata.questionKey;

  if (
    typeof surveyId !== "string" ||
    typeof farmerId !== "string" ||
    typeof fieldId !== "string" ||
    typeof enumeratorId !== "string" ||
    typeof section !== "string" ||
    typeof questionKey !== "string"
  ) {
    throw new Error(
      "Required voice metadata is missing."
    );
  }

  const extension = getFileExtension(
    item.fileName,
    item.mimeType
  );

  const storagePath =
    `${enumeratorId}/${surveyId}/${item.id}.${extension}`;

  const { data: existingVoice, error: lookupError } =
    await supabase
      .from("voice_notes")
      .select("id")
      .eq("storage_path", storagePath)
      .maybeSingle();

  if (lookupError) {
    throw lookupError;
  }

  if (existingVoice) {
    return;
  }

  const { error: uploadError } =
    await supabase.storage
      .from("voices")
      .upload(storagePath, item.file, {
        contentType:
          item.mimeType || "audio/webm",
        upsert: true,
      });

  if (uploadError) {
    throw uploadError;
  }

  const { error: databaseError } =
    await supabase
      .from("voice_notes")
      .insert({
        survey_id: surveyId,
        farmer_id: farmerId,
        field_id: fieldId,
        enumerator_id: enumeratorId,
        section,
        question_key: questionKey,
        storage_path: storagePath,
        file_name: item.fileName,
        mime_type:
          item.mimeType || "audio/webm",
        file_size: item.file.size,
        duration_seconds:
          typeof metadata.durationSeconds === "number"
            ? metadata.durationSeconds
            : null,
        language:
          typeof metadata.language === "string"
            ? metadata.language
            : null,
        latitude:
          typeof metadata.latitude === "number"
            ? metadata.latitude
            : null,
        longitude:
          typeof metadata.longitude === "number"
            ? metadata.longitude
            : null,
      });

  if (databaseError) {
    throw databaseError;
  }
}

export async function syncOfflineMedia() {
  if (!navigator.onLine) {
    return {
      success: false,
      synced: 0,
      failed: 0,
    };
  }

  await resetStaleUploadingMedia();

  const items = await getPendingMedia();

  if (items.length === 0) {
    return {
      success: true,
      synced: 0,
      failed: 0,
    };
  }

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await markMediaUploading(item.id);

      if (item.mediaType === "photo") {
        await syncPhoto(item);
      } else if (item.mediaType === "voice") {
        await syncVoice(item);
      } else {
        throw new Error(
          `Unsupported media type: ${item.mediaType}`
        );
      }

      await markMediaUploaded(item.id);

      synced++;
    } catch (error) {
      failed++;

      const message =
        error instanceof Error
          ? error.message
          : "Unknown media sync error";

      await markMediaFailed(
        item.id,
        message
      );
    }
  }

  await clearUploadedMedia();

  return {
    success: failed === 0,
    synced,
    failed,
  };
}