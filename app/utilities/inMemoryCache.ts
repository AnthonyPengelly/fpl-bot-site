const cache: {
  [index: string]: { value: any; expiryEpoch: number } | undefined;
} = {};

export const getItemFromMemoryCache = <T>(key: string) => {
  const cacheEntry = cache[key];
  if (!cacheEntry) {
    return null;
  }
  return cacheEntry as { value: T; expiryEpoch: number };
};

export const addItemToMemoryCache = <T>(
  key: string,
  data: T,
  expiryEpochSeconds: number
) => {
  cache[key] = {
    value: data,
    expiryEpoch: expiryEpochSeconds,
  };
};

export const invalidateInMemoryCache = (key: string) => {
  cache[key] = undefined;
};
