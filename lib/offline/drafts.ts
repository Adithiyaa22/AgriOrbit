import { offlineDB, type OfflineSurveyDraft } from "./db";

type SaveDraftParams = {
  surveyId: string;
  surveyCode: string;
  section: string;
  data: Record<string, unknown>;
};

export async function saveOfflineDraft({
  surveyId,
  surveyCode,
  section,
  data,
}: SaveDraftParams) {
  const id = `${surveyId}-${section}`;

  await offlineDB.surveyDrafts.put({
    id,
    surveyId,
    surveyCode,
    section,
    data,
    status: "saved",
    updatedAt: new Date().toISOString(),
  });

  return id;
}

export async function getOfflineDraft(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;

  return await offlineDB.surveyDrafts.get(id);
}

export async function getSurveyOfflineDrafts(surveyId: string) {
  return await offlineDB.surveyDrafts
    .where("surveyId")
    .equals(surveyId)
    .toArray();
}

export async function markDraftPendingSync(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;

  await offlineDB.surveyDrafts.update(id, {
    status: "pending_sync",
    updatedAt: new Date().toISOString(),
  });
}

export async function markDraftSynced(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;

  await offlineDB.surveyDrafts.update(id, {
    status: "synced",
    updatedAt: new Date().toISOString(),
  });
}

export async function markDraftSyncFailed(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;

  await offlineDB.surveyDrafts.update(id, {
    status: "sync_failed",
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteOfflineDraft(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;

  await offlineDB.surveyDrafts.delete(id);
}