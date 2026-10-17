import {
  offlineDB,
  type OfflineSurveyDraft,
} from "./db";

type SaveSurveySectionParams = {
  surveyId: string;
  surveyCode: string;
  section: string;
  data: Record<string, unknown>;
};

export async function saveSurveySectionOffline({
  surveyId,
  surveyCode,
  section,
  data,
}: SaveSurveySectionParams) {
  const id = `${surveyId}-${section}`;

  const draft: OfflineSurveyDraft = {
    id,
    surveyId,
    surveyCode,
    section,
    data,
    status: "saved",
    updatedAt: new Date().toISOString(),
  };

  await offlineDB.surveyDrafts.put(draft);

  return draft;
}

export async function getSurveySectionOffline(
  surveyId: string,
  section: string
) {
  return await offlineDB.surveyDrafts.get(
    `${surveyId}-${section}`
  );
}

export async function getAllSurveyOfflineData(
  surveyId: string
) {
  return await offlineDB.surveyDrafts
    .where("surveyId")
    .equals(surveyId)
    .sortBy("section");
}

export async function getAllOfflineDrafts() {
  return await offlineDB.surveyDrafts
    .orderBy("updatedAt")
    .reverse()
    .toArray();
}

export async function deleteSurveyOfflineData(
  surveyId: string
) {
  const drafts = await offlineDB.surveyDrafts
    .where("surveyId")
    .equals(surveyId)
    .toArray();

  await offlineDB.surveyDrafts.bulkDelete(
    drafts.map((draft) => draft.id)
  );
}

export async function markSectionPendingSync(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;
  const existing = await offlineDB.surveyDrafts.get(id);

  if (!existing) return;

  await offlineDB.surveyDrafts.update(id, {
    status: "pending_sync",
    updatedAt: new Date().toISOString(),
    errorMessage: undefined,
  });
}

export async function markSectionSynced(
  surveyId: string,
  section: string
) {
  const id = `${surveyId}-${section}`;
  const existing = await offlineDB.surveyDrafts.get(id);

  if (!existing) return;

  await offlineDB.surveyDrafts.update(id, {
    status: "synced",
    updatedAt: new Date().toISOString(),
    errorMessage: undefined,
  });
}

export async function markSectionSyncFailed(
  surveyId: string,
  section: string,
  errorMessage: string
) {
  const id = `${surveyId}-${section}`;
  const existing = await offlineDB.surveyDrafts.get(id);

  if (!existing) return;

  await offlineDB.surveyDrafts.update(id, {
    status: "sync_failed",
    updatedAt: new Date().toISOString(),
    errorMessage,
  });
}