import {
  addItemToMemoryCache,
  getItemFromMemoryCache,
  invalidateInMemoryCache,
} from "./inMemoryCache";
import {
  addItemToS3Cache,
  getItemFromS3Cache,
  invalidateS3Cache,
} from "./s3Cache";

const dataExpirySeconds = 60 * 15; // keep API calls for 15 mins

export const tryGetFromCache = async <T>(
  key: string,
  action: () => Promise<T>
): Promise<T> => {
  console.time("cacheLookup");
  const data = await getItem<T>(key);
  if (data) {
    console.log(`Cache HIT for ${key}`);
    console.timeEnd("cacheLookup");
    return data;
  }
  console.log(`Cache MISS for ${key}`);
  const newData = await action();
  await addItem(key, newData);
  console.timeEnd("cacheLookup");
  return newData;
};

const getItem = async <T>(key: string) => {
  const inMemoryResult = getItemFromMemoryCache<T>(key);
  if (inMemoryResult && !isInThePast(inMemoryResult.expiryEpoch)) {
    return inMemoryResult.value;
  }
  const cacheEntry = inMemoryResult || (await getItemFromS3Cache<T>(key));
  if (!cacheEntry) {
    return null;
  }
  if (isInThePast(cacheEntry.expiryEpoch)) {
    invalidateCache(key);
    return null;
  }
  addItemToMemoryCache(key, cacheEntry.value, cacheEntry.expiryEpoch);
  console.log(`In-memory cache MISS for ${key}`);
  return cacheEntry.value;
};

const addItem = async <T>(key: string, data: T) => {
  const expiryEpochSeconds = Math.floor(+new Date() / 1000) + dataExpirySeconds;
  addItemToMemoryCache(key, data, expiryEpochSeconds);
  await addItemToS3Cache(key, data, expiryEpochSeconds);
};

const invalidateCache = async (key: string) => {
  console.log("Invalidating expired cache");
  invalidateInMemoryCache(key);
  await invalidateS3Cache(key);
};

const isInThePast = (expirySeconds: number) =>
  Math.floor(+new Date() / 1000) > expirySeconds;
