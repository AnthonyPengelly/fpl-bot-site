import { PositionMap } from "~/fplApi/getFplOverview";
import { FplMyTeam } from "~/fplApi/myTeam";
import { Player } from "./players";

export type MyTeamPlayer = Player & { sellingPrice: number };

export type MyTeam = {
  budget: number;
  transfersRemaining: number;
  starting11: MyTeamPlayer[];
  subs: MyTeamPlayer[];
  captain: MyTeamPlayer;
  viceCaptain: MyTeamPlayer;
  fplData: FplMyTeam;
  teamScoreThisWeek: number;
  teamScore: number;
};

export const recommendLineup = (
  myTeam: FplMyTeam,
  players: Player[]
): MyTeam => {
  const myTeamPlayers = myTeam.picks.map((pick) => ({
    sellingPrice: pick.selling_price,
    ...players.find((player) => player.id === pick.element)!,
  }));
  const sortedPlayers = myTeamPlayers.sort(
    (a, b) => b.scoreDetails.scoreThisWeek - a.scoreDetails.scoreThisWeek
  );
  const starting11: MyTeamPlayer[] = [];
  const goalkeepers = sortedPlayers.filter(
    (player) => player.position.id === PositionMap.GOALKEEPER
  );
  const defenders = sortedPlayers.filter(
    (player) => player.position.id === PositionMap.DEFENDER
  );
  const midfielders = sortedPlayers.filter(
    (player) => player.position.id === PositionMap.MIDFIELDER
  );
  const forwards = sortedPlayers.filter(
    (player) => player.position.id === PositionMap.FORWARD
  );
  starting11.push(goalkeepers[0]);
  starting11.push(...defenders.slice(0, 3));
  starting11.push(...midfielders.slice(0, 3));
  starting11.push(forwards[0]);
  const omitedPlayers = sortedPlayers.filter(
    (player) => !starting11.find((x) => x.id === player?.id)
  );
  starting11.push(
    ...omitedPlayers
      .filter((x) => x.position.id !== PositionMap.GOALKEEPER)
      .slice(0, 3)
      .map((player) => player)
  );
  const substitutes = sortedPlayers.filter(
    (player) => !starting11.find((x) => x.id === player?.id)
  );
  const orderedSubstitutes = substitutes.filter(
    (player) => player.position.id === PositionMap.GOALKEEPER
  );
  orderedSubstitutes.push(
    ...substitutes.filter(
      (player) => player.position.id !== PositionMap.GOALKEEPER
    )
  );
  return {
    starting11: starting11,
    subs: orderedSubstitutes,
    captain: sortedPlayers[0],
    viceCaptain: sortedPlayers[1],
    teamScoreThisWeek: calculateScore(
      starting11,
      orderedSubstitutes,
      sortedPlayers[0],
      sortedPlayers[1]
    ),
    teamScore: myTeamPlayers.reduce(
      (total, player) => total + player.scoreDetails.score,
      0
    ),
    budget: myTeam.transfers.bank,
    transfersRemaining: myTeam.transfers.limit - myTeam.transfers.made,
    fplData: myTeam,
  };
};

const calculateScore = (
  starting11: Player[],
  subs: Player[],
  captain: Player,
  vice: Player
): number => {
  const startingScore = starting11.reduce(
    (acc, player) => acc + player.scoreDetails.score,
    0
  );
  const subsScore = subs.reduce(
    (acc, player) => acc + player.scoreDetails.score,
    0
  );
  return (
    startingScore +
    0.75 * subsScore +
    captain.scoreDetails.score +
    0.5 * vice.scoreDetails.score
  );
};
