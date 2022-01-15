import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client } from "./awsClients";
import { Readable } from "stream";

export const getItemFromS3Cache = async <T>(key: string) => {
  const client = s3Client();
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.FPLBOT_BUCKET_NAME as string,
    Key: key,
  });
  try {
    console.time("cacheLookup");
    const result = await client.send(getObjectCommand);
    const cacheEntry = (await new Promise((resolve, reject) => {
      const chunks: Uint8Array[] = [];
      (result.Body as Readable)?.on("data", (chunk) => chunks.push(chunk));
      (result.Body as Readable).on("error", reject);
      (result.Body as Readable).on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf-8"))
      );
    })) as string;
    console.timeEnd("cacheLookup");
    return JSON.parse(cacheEntry ?? "") as { value: T; expiryEpoch: number };
  } catch (e) {
    console.log("S3 error");
    console.log((e as Error).message);
    return null;
  }
};

export const addItemToS3Cache = async <T>(
  key: string,
  data: T,
  expiryEpochSeconds: number
) => {
  const client = s3Client();
  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.FPLBOT_BUCKET_NAME as string,
    Key: key,
    Body: JSON.stringify({ value: data, expiryEpoch: expiryEpochSeconds }),
  });
  await client.send(putObjectCommand);
};

export const invalidateS3Cache = async (key: string) => {
  const client = s3Client();
  const deleteObjectCommand = new DeleteObjectCommand({
    Bucket: process.env.FPLBOT_BUCKET_NAME as string,
    Key: key,
  });
  await client.send(deleteObjectCommand);
};
