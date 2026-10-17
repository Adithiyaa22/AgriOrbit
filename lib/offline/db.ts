import Dexie, { type Table } from "dexie";

export type OfflineSurveyDraft = {
  id: string;
  surveyId: string;
  surveyCode: string;
  section: string;
  data: Record<string, unknown>;
  status: "saved" | "pending_sync" | "synced" | "sync_failed";
  updatedAt: string;
  errorMessage?: string;
};

export type CachedFarmer = {
  id: string;
  farmer_code: string;
  full_name: string;
  village: string | null;
  district: string | null;
};

export type CachedField = {
  id: string;
  farmerId: string;
  field_code: string;
  field_name: string;
  area: number | null;
  area_unit: string | null;
};

export type OfflineMediaQueueItem = {
  id: string;
  surveyId: string;
  section: string;
  mediaType: "photo" | "voice";
  file: Blob;
  fileName: string;
  mimeType: string;
  metadata: Record<string, unknown>;
  status: "pending" | "uploading" | "uploaded" | "failed";
  createdAt: string;
  updatedAt: string;
  errorMessage?: string;
};

class AgriOrbitOfflineDB extends Dexie {
  surveyDrafts!: Table<OfflineSurveyDraft, string>;
  mediaQueue!: Table<OfflineMediaQueueItem, string>;
  farmerCache!: Table<CachedFarmer, string>;
  fieldCache!: Table<CachedField, string>;

  constructor() {
    super("AgriOrbitOfflineDB");

    this.version(1).stores({
      surveyDrafts: "id, surveyId, section, status, updatedAt",
    });

    this.version(2).stores({
      surveyDrafts: "id, surveyId, section, status, updatedAt",
      mediaQueue:
        "id, surveyId, section, mediaType, status, createdAt, updatedAt",
    });

    this.version(3).stores({
      surveyDrafts: "id, surveyId, section, status, updatedAt",
      mediaQueue:
        "id, surveyId, section, mediaType, status, createdAt, updatedAt",
      farmerCache: "id, farmer_code, full_name, village, district",
      fieldCache: "id, farmerId, field_code, field_name",
    });
  }
}

export const offlineDB = new AgriOrbitOfflineDB();