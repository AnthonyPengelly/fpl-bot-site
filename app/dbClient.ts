import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const dbClient = () =>
  new DynamoDBClient({
    region: process.env.FPLBOT_AWS_REGION,
    credentials: {
      accessKeyId: process.env.FPLBOT_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.FPLBOT_AWS_SECRET_ACCESS_KEY!,
    },
  });
