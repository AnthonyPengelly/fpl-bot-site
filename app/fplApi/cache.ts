// TTL

import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { dbClient } from "~/awsClients";

const dataExpirySeconds = 60 * 15; // keep API calls for 15 mins

export const tryGetFromCache = async <T>(
  key: string,
  action: () => Promise<T>
): Promise<T> => {
  const data = await getItem<T>(key);
  if (data) {
    return data;
  }
  const newData = await action();
  await addItem(key, newData);
  return newData;
};

const getItem = async <T>(key: string) => {
  const client = dbClient();
  const command = new GetItemCommand({
    TableName: process.env.API_CACHE_TABLE,
    Key: {
      id: { S: key },
    },
  });
  const result = await client.send(command);
  const data = result.Item?.response?.S ?? null;
  return data ? (JSON.parse(data) as T) : null;
};

const addItem = async <T>(key: string, data: T) => {
  const client = dbClient();
  const command = new PutItemCommand({
    TableName: process.env.API_CACHE_TABLE,
    Item: {
      id: { S: key },
      response: { S: JSON.stringify(data) },
      ttl: {
        N: (Math.floor(+new Date() / 1000) + dataExpirySeconds).toString(),
      },
    },
  });
  await client.send(command);
};
