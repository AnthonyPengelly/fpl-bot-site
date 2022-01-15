import { cacheClient, closeCacheClientConnection } from "./cloudClients";

const dataExpirySeconds = 60 * 15; // keep API calls for 15 mins

export const tryGetFromCache = async <T>(
  key: string,
  action: () => Promise<T>
): Promise<T> => {
  console.time(`cacheLookup-${key}`);
  console.log(`Looking up ${key}`);
  const data = await getItem<T>(key);
  if (data) {
    console.log(`Cache HIT for ${key}`);
    console.timeEnd(`cacheLookup-${key}`);
    if (process.env.NODE_ENV === "development") {
      await closeCacheClientConnection();
    }
    return data;
  }
  console.log(`Cache MISS for ${key}`);
  const newData = await action();
  await addItem(key, newData);
  console.timeEnd(`cacheLookup-${key}`);
  if (process.env.NODE_ENV === "development") {
    await closeCacheClientConnection();
  }
  return newData;
};

const getItem = async <T>(key: string) => {
  const client = await cacheClient();
  const cacheEntry = await client.get(key);
  if (!cacheEntry) {
    return null;
  }
  return JSON.parse(cacheEntry) as T;
};

const addItem = async <T>(key: string, data: T) => {
  const client = await cacheClient();
  await client.set(key, JSON.stringify(data), { EX: dataExpirySeconds });
};

export const invalidateCache = async (key: string) => {
  const client = await cacheClient();
  await client.del(key);
};
