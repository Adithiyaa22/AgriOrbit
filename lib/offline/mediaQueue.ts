import {
  offlineDB,
  type OfflineMediaQueueItem,
} from "./db";

type QueueMediaParams = {
  surveyId: string;
  section: string;
  file: Blob;
  fileName: string;
  mimeType: string;
  metadata: Record<string, unknown>;
};

export async function queueOfflinePhoto({
  surveyId,
  section,
  file,
  fileName,
  mimeType,
  metadata,
}: QueueMediaParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item: OfflineMediaQueueItem = {
    id,
    surveyId,
    section,
    mediaType: "photo",
    file,
    fileName,
    mimeType,
    metadata,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await offlineDB.mediaQueue.put(item);

  return item;
}

export async function queueOfflineVoice({
  surveyId,
  section,
  file,
  fileName,
  mimeType,
  metadata,
}: QueueMediaParams) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const item: OfflineMediaQueueItem = {
    id,
    surveyId,
    section,
    mediaType: "voice",
    file,
    fileName,
    mimeType,
    metadata,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  await offlineDB.mediaQueue.put(item);

  return item;
}

export async function getPendingMedia() {
  return await offlineDB.mediaQueue
    .where("status")
    .anyOf(["pending", "failed"])
    .toArray();
}

export async function getPendingMediaForSurvey(
  surveyId: string
) {
  return await offlineDB.mediaQueue
    .where("surveyId")
    .equals(surveyId)
    .filter(
      (item) =>
        item.status === "pending" ||
        item.status === "failed"
    )
    .toArray();
}

export async function resetStaleUploadingMedia() {
  const items = await offlineDB.mediaQueue
    .where("status")
    .equals("uploading")
    .toArray();

  if (items.length === 0) {
    return;
  }

  const now = Date.now();

  const staleItems = items.filter((item) => {
    const updatedAt = new Date(
      item.updatedAt
    ).getTime();

    if (Number.isNaN(updatedAt)) {
      return true;
    }

    return now - updatedAt > 10 * 60 * 1000;
  });

  if (staleItems.length === 0) {
    return;
  }

  await offlineDB.mediaQueue.bulkPut(
    staleItems.map((item) => ({
      ...item,
      status: "failed" as const,
      updatedAt: new Date().toISOString(),
      errorMessage:
        "Previous upload did not finish. Retrying.",
    }))
  );
}

export async function markMediaUploading(
  id: string
) {
  await offlineDB.mediaQueue.update(id, {
    status: "uploading",
    updatedAt: new Date().toISOString(),
    errorMessage: undefined,
  });
}

export async function markMediaUploaded(
  id: string
) {
  await offlineDB.mediaQueue.update(id, {
    status: "uploaded",
    updatedAt: new Date().toISOString(),
    errorMessage: undefined,
  });
}

export async function markMediaFailed(
  id: string,
  errorMessage: string
) {
  await offlineDB.mediaQueue.update(id, {
    status: "failed",
    updatedAt: new Date().toISOString(),
    errorMessage,
  });
}

export async function deleteMediaQueueItem(
  id: string
) {
  await offlineDB.mediaQueue.delete(id);
}

export async function clearUploadedMedia() {
  const uploaded = await offlineDB.mediaQueue
    .where("status")
    .equals("uploaded")
    .toArray();

  if (uploaded.length === 0) {
    return;
  }

  await offlineDB.mediaQueue.bulkDelete(
    uploaded.map((item) => item.id)
  );
}