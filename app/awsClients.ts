import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { S3Client } from "@aws-sdk/client-s3";

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
