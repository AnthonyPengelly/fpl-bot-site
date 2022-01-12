import { getFplOverview } from "~/fplApi/getFplOverview";
import { getMyTeam, MyTeam } from "~/fplApi/myTeam";
import { getWeightsForUsername } from "~/gameState/scoreWeightings";
import { getLatestBotData } from "./botData";
import { Player, scorePlayer } from "./players";

export type GameState = {
  players: Player[];
  myTeam: {
    budget: number;
    transfersRemaining: number;
    players: (Player & { sellingPrice: number })[];
    fplData: MyTeam;
    teamScore: number;
  };
};

export const getGameState = async (fplCookie: string, username: string) => {
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
  const myTeamPlayers = myTeam.picks.map((pick) => ({
    sellingPrice: pick.selling_price,
    ...players.find((player) => player.id === pick.element)!,
  }));
  return {
    players,
    myTeam: {
      budget: myTeam.transfers.bank,
      transfersRemaining: myTeam.transfers.limit - myTeam.transfers.made,
      players: myTeamPlayers,
      fplData: myTeam,
      teamScore: myTeamPlayers.reduce(
        (total, player) => total + player.scoreDetails.score,
        0
      ),
    },
  };
};
