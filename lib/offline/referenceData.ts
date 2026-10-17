import { offlineDB, type CachedFarmer, type CachedField } from "./db";

export async function cacheFarmers(farmers: CachedFarmer[]) {
  if (farmers.length === 0) return;
  await offlineDB.farmerCache.bulkPut(farmers);
}

export async function getCachedFarmers() {
  return await offlineDB.farmerCache
    .orderBy("full_name")
    .toArray();
}

export async function cacheFields(fields: CachedField[]) {
  if (fields.length === 0) return;
  await offlineDB.fieldCache.bulkPut(fields);
}

export async function getCachedFields(farmerId: string) {
  return await offlineDB.fieldCache
    .where("farmerId")
    .equals(farmerId)
    .sortBy("field_name");
}
