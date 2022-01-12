import { GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { dbClient } from "./dbClient";

export type ScoreWeight = {
  weight: number;
  goalkeeper?: number;
  defender?: number;
  midfielder?: number;
  forward?: number;
};

export type ScoreWeights = {
  form: ScoreWeight;
  pointsPerGame: ScoreWeight;
  ictIndex: ScoreWeight;
  teamStrength: ScoreWeight;
  teamStrengthForPosition: ScoreWeight;
  opponentStrength: ScoreWeight;
  futureOpponentStrength: ScoreWeight;
  chanceOfPlaying: ScoreWeight;
  numberOfGames: ScoreWeight;
  numberOfGamesInNext3Gameweeks: ScoreWeight;
  positionPenalty: {
    goalkeeper: number;
    defender: number;
    midfielder: number;
    forward: number;
  }; // Fixed percentage to be taken afterwards
  homeAdvantage: ScoreWeight; // Fixed number to be applied against the upcoming fixtures, not strictly a "weight"
};

const defaultScoreWeights: ScoreWeights = {
  form: { weight: 60 },
  pointsPerGame: { weight: 30 },
  ictIndex: { weight: 45 },
  teamStrength: { weight: 10 },
  teamStrengthForPosition: { weight: 10 },
  opponentStrength: { weight: 25 },
  futureOpponentStrength: { weight: 20 },
  chanceOfPlaying: { weight: 100 },
  numberOfGames: { weight: 90 },
  numberOfGamesInNext3Gameweeks: { weight: 60 },
  positionPenalty: {
    goalkeeper: 5,
    defender: 5,
    midfielder: 0,
    forward: 0,
  },
  homeAdvantage: { weight: 1 },
};

export const getWeightsForUsername = async (username: string) => {
  const scoreWeights = await readTableForId(username);
  if (scoreWeights) {
    return scoreWeights;
  }
  return defaultScoreWeights;
};

export const saveWeightsForUsername = async (
  username: string,
  weights: ScoreWeights
) => {
  const client = dbClient();
  const command = new PutItemCommand({
    TableName: process.env.SCORES_TABLE,
    Item: {
      id: { S: username },
      sessionData: { S: JSON.stringify(weights) },
    },
  });
  await client.send(command);
};

const readTableForId = async (id: string) => {
  const client = dbClient();
  const command = new GetItemCommand({
    TableName: process.env.SCORES_TABLE,
    Key: {
      id: { S: id },
    },
  });
  const result = await client.send(command);
  const data = result.Item?.sessionData?.S ?? null;
  return data ? (JSON.parse(data) as ScoreWeights) : null;
};
