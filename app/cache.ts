// TTL

const dataExpirySeconds = 60 * 15; // keep API calls for 15 mins

console.log("init cache");
const cache: {
  [index: string]: { value: any; expiryEpoch: number } | undefined;
} = {};

export const tryGetFromCache = async <T>(
  key: string,
  action: () => Promise<T>
): Promise<T> => {
  const data = getItem<T>(key);
  if (data) {
    console.log(`Cache HIT for ${key}`);
    return data;
  }
  console.log(`Cache MISS for ${key}`);
  const newData = await action();
  addItem(key, newData);
  return newData;
};

const getItem = <T>(key: string) => {
  const cacheEntry = cache[key];
  console.log(cacheEntry);
  if (!cacheEntry || isInThePast(cacheEntry.expiryEpoch)) {
    cache[key] = undefined;
    return null;
  }
  return cacheEntry.value as T;
};

const addItem = <T>(key: string, data: T) => {
  cache[key] = {
    value: data,
    expiryEpoch: Math.floor(+new Date() / 1000) + dataExpirySeconds,
  };
};

const isInThePast = (expirySeconds: number) =>
  Math.floor(+new Date() / 1000) > expirySeconds;
