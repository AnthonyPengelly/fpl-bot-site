import { invalidateCache, tryGetFromCache } from "~/utilities/cache";
import { getFplOverview } from "~/fplApi/getFplOverview";
import { getMyTeam } from "~/fplApi/myTeam";
import { getWeightsForUsername } from "~/gameState/scoreWeightings";
import { getLatestBotData } from "./botData";
import { Player, scorePlayer } from "./players";
import { MyTeam, recommendLineup } from "./lineup";

export type GameState = {
  players: Player[];
  myTeam: MyTeam;
};

const cacheKey = (username: string) => `gamestate-${username}`;

export const getGameState = async (fplCookie: string, username: string) => {
  return tryGetFromCache(cacheKey(username), () =>
    buildGameState(fplCookie, username)
  );
};

export const invalidateCachedGameState = async (username: string) =>
  invalidateCache(cacheKey(username));

const buildGameState = async (fplCookie: string, username: string) => {
  const myTeam = await getMyTeam(fplCookie, username);
  const fplOverview = await getFplOverview();
  const scoreWeights = await getWeightsForUsername(username);
  const nextEvent = fplOverview.events.filter((event) => event.is_next)[0];
  const fixturesPlayed = fplOverview.fixtures.filter((x) => x.finished);
  const gameweeksPlayed = new Set(fixturesPlayed.map((x) => x.event)).size;
  const botData = await getLatestBotData();
  const players = fplOverview.elements
    .map((player) =>
      scorePlayer(
        player,
        scoreWeights,
        fplOverview.fixtures,
        fplOverview.teams,
        fplOverview.element_types,
        gameweeksPlayed,
        nextEvent?.id ?? 0,
        botData
      )
    )
    .filter((player) => player)
    .sort((a, b) => b.scoreDetails.score - a.scoreDetails.score);
  return {
    players,
    myTeam: recommendLineup(myTeam, players),
  };
};
