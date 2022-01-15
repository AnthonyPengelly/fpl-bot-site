import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";
import { createClient, RedisClientType, RedisScripts } from "redis";

export const dbClient = () =>
  new DynamoDBClient({
    region: process.env.FPLBOT_AWS_REGION,
    credentials: {
      accessKeyId: process.env.FPLBOT_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.FPLBOT_AWS_SECRET_ACCESS_KEY!,
    },
  });

export const s3Client = () =>
  new S3Client({
    region: process.env.FPLBOT_AWS_REGION,
    credentials: {
      accessKeyId: process.env.FPLBOT_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.FPLBOT_AWS_SECRET_ACCESS_KEY!,
    },
  });

let redisClient: RedisClientType<any, RedisScripts> | null = null;

export const cacheClient = async () => {
  if (redisClient) {
    return redisClient;
  }
  redisClient = createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_URL}`,
  });
  await redisClient.connect();
  return redisClient;
};

export const closeCacheClientConnection = async () => {
  if (!redisClient) {
    console.log("No redis client to close");
    return;
  }
  await redisClient.disconnect();
  redisClient = null;
  console.log("Redis client connection closed");
};
