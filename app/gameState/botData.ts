import { Readable } from "stream";
import { GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { s3Client } from "~/awsClients";

type ScoreInputs = {
  form: number;
  pointsPerGame: number;
  ictIndex: number;
  teamStrength: number;
  teamStrengthForPosition: number;
  opponentStrength: number;
  futureOpponentStrength: number;
  chanceOfPlaying: number;
  numberOfGames: number;
  numberOfGamesInNext3Gameweeks: number;
};

type ScoreDetails = {
  score: number;
  overallScore: number;
  scoreThisWeek: number;
  inputs: ScoreInputs;
  weightedInputs: ScoreInputs;
  weights: { [weight: string]: { min?: number; max: number; weight: number } };
};

export type BotData = {
  event: number;
  playerData: {
    name: string;
    id: number;
    code: number;
    team: number;
    position: string;
    score: number;
    value: number;
    scoreDetails: ScoreDetails;
  }[];
};

export const getLatestBotData = async () => {
  const params = {
    Bucket: process.env.FPLBOT_BUCKET_NAME as string,
    Prefix: "player-score-data/",
  };
  const client = s3Client();
  const listObjectsCommand = new ListObjectsV2Command(params);
  const scoreObjects = await client.send(listObjectsCommand);
  const latestScore = scoreObjects.Contents?.sort((a, b) =>
    b.Key!.localeCompare(a.Key!)
  )[0];

  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.FPLBOT_BUCKET_NAME as string,
    Key: latestScore!.Key!,
  });
  const result = await client.send(getObjectCommand);
  const scores = (await new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    (result.Body as Readable)?.on("data", (chunk) => chunks.push(chunk));
    (result.Body as Readable).on("error", reject);
    (result.Body as Readable).on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8"))
    );
  })) as string;
  return JSON.parse(scores ?? "{}") as BotData;
};
