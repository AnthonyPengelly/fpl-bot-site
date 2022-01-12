import {
  FplFixture,
  FplPlayer,
  FplPosition,
  FplTeam,
} from "~/fplApi/getFplOverview";
import { BotData } from "./botData";
import { calculateScore, OpponentFixture, Score } from "./playerScore";
import { ScoreWeights } from "./scoreWeightings";

export type Fixture = {
  isHome: boolean;
  opponent: Team;
};

export type Team = {
  fixtures: Fixture[];
  name: string;
  shortName: string;
  id: number;
  fplData: FplTeam;
};

export type Position = {
  id: number;
  name: string;
  fplData: FplPosition;
};

export type Player = {
  id: number;
  name: string;
  scoreDetails: Score;
  cost: number;
  fplData: FplPlayer;
  team: Team;
  position: Position;
};

export const scorePlayer = (
  player: FplPlayer,
  scoreWeights: ScoreWeights,
  fixtures: FplFixture[],
  teams: FplTeam[],
  positions: FplPosition[],
  gameweeksPlayed: number,
  nextEventId: number,
  botData: BotData
) => {
  const team = getTeam(player.team, teams);
  const opponents = getOpponents(
    team,
    teams,
    getGameweekFixtures(team, fixtures, nextEventId)
  );
  const futureOpponents = getOpponents(
    team,
    teams,
    getFutureGameweekFixtures(team, fixtures, nextEventId)
  );
  const position = positions.find((e) => e.id === player.element_type)!;
  const previousForm = getPreviousFormFromBotData(player, botData);
  const scoreDetails = calculateScore(
    player,
    scoreWeights,
    team,
    opponents,
    futureOpponents,
    gameweeksPlayed,
    previousForm
  );
  return mapScoredPlayer(player, position, team, scoreDetails, [
    ...opponents,
    ...futureOpponents,
  ]);
};

const mapScoredPlayer = (
  player: FplPlayer,
  position: FplPosition,
  team: FplTeam,
  scoreDetails: Score,
  upcomingFixtures: OpponentFixture[]
): Player => ({
  id: player.id,
  name: player.web_name,
  scoreDetails: scoreDetails,
  cost: player.now_cost / 10,
  fplData: player,
  team: mapTeam(team, upcomingFixtures),
  position: {
    id: position.id,
    name: position.singular_name_short,
    fplData: position,
  },
});

const getOpponents = (
  team: FplTeam,
  teams: FplTeam[],
  fixtures: FplFixture[]
) => {
  const homeFixtures = fixtures.filter((fixture) => fixture.team_h === team.id);
  const awayFixtures = fixtures.filter((fixture) => fixture.team_a === team.id);
  const homeOpponentIds = homeFixtures.map((fixture) => fixture.team_a);
  const awayOpponentIds = awayFixtures.map((fixture) => fixture.team_h);
  const homeOpponents = homeOpponentIds
    .map((id) => teams.filter((team) => team.id === id)[0])
    .map((opponent) => ({ opponent, isHome: true })) as OpponentFixture[];
  const awayOpponents = awayOpponentIds
    .map((id) => teams.filter((team) => team.id === id)[0])
    .map((opponent) => ({ opponent, isHome: false })) as OpponentFixture[];
  return homeOpponents.concat(awayOpponents);
};

const getGameweekFixtures = (
  team: FplTeam,
  fixtures: FplFixture[],
  nextEventId: number
) => {
  return fixtures.filter(
    (fixture) =>
      fixture.event === nextEventId &&
      (fixture.team_h === team.id || fixture.team_a === team.id)
  );
};

const getFutureGameweekFixtures = (
  team: FplTeam,
  fixtures: FplFixture[],
  nextEventId: number
) => {
  return fixtures.filter(
    (fixture) =>
      fixture.event > nextEventId &&
      fixture.event <= nextEventId + 3 &&
      (fixture.team_h === team.id || fixture.team_a === team.id)
  );
};

const getPreviousFormFromBotData = (player: FplPlayer, botData: BotData) => {
  if (!botData || !botData.playerData || botData.playerData.length === 0) {
    return 0;
  }
  const previousPlayerData = botData.playerData.find(
    (playerData) => playerData.id === player.id
  );
  return previousPlayerData?.scoreDetails.inputs.form ?? 0;
};

const mapTeam = (team: FplTeam, fixtures: OpponentFixture[]): Team => {
  return {
    name: team.name,
    shortName: team.short_name,
    id: team.id,
    fplData: team,
    fixtures: fixtures.map((fixture) => ({
      isHome: fixture.isHome,
      opponent: mapTeam(fixture.opponent, []),
    })),
  };
};

const getTeam = (id: number, teams: FplTeam[]) =>
  teams.find((team) => team.id === id)!;
