import { FplPlayer, FplTeam, PositionMap } from "~/fplApi/getFplOverview";
import { ScoreWeight, ScoreWeights } from "./scoreWeightings";

export type OpponentFixture = {
  opponent: FplTeam;
  isHome: boolean;
};

type ScoreSetting = {
  min: number;
  max: number;
};

type ScoreSettings = {
  form: ScoreSetting;
  pointsPerGame: ScoreSetting;
  ictIndex: ScoreSetting;
  teamStrength: ScoreSetting;
  teamStrengthForPosition: ScoreSetting;
  opponentStrength: ScoreSetting;
  futureOpponentStrength: ScoreSetting;
  chanceOfPlaying: ScoreSetting;
  numberOfGames: ScoreSetting;
  numberOfGamesInNext3Gameweeks: ScoreSetting;
};

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

export type Score = {
  scoreThisWeek: number;
  score: number;
  scoreInputs: ScoreInputs;
};

export const calculateScore = (
  player: FplPlayer,
  scoreWeights: ScoreWeights,
  team: FplTeam,
  opponentFixtures: OpponentFixture[],
  futureFixtures: OpponentFixture[],
  gamesPlayed: number,
  previousForm: number
): Score => {
  const settings = getSettingsForPlayer(player, scoreWeights);
  const inputs: ScoreInputs = {
    form: getForm(player, gamesPlayed, previousForm),
    pointsPerGame: parseFloat(player.points_per_game),
    ictIndex: player.ict_index_rank,
    teamStrength: team.strength,
    teamStrengthForPosition: teamStrengthForPosition(
      player,
      team,
      opponentFixtures
    ),
    opponentStrength: getOpponentAverageStrength(
      player,
      opponentFixtures,
      scoreWeights,
      settings.opponentStrength.max,
      settings.opponentStrength.min
    ),
    futureOpponentStrength: getOpponentAverageStrength(
      player,
      futureFixtures,
      scoreWeights,
      settings.opponentStrength.max,
      settings.opponentStrength.min
    ),
    chanceOfPlaying:
      // I think any injuries/suspensions will be reported explicitly, so if it is null,
      // it's probably meant to be 100% chance of playing
      player.chance_of_playing_next_round === null
        ? 100
        : player.chance_of_playing_next_round,
    numberOfGames: opponentFixtures.length,
    numberOfGamesInNext3Gameweeks: futureFixtures.length,
  };

  const weightedInputs = calculateWeightedInputs(
    player,
    inputs,
    scoreWeights,
    settings,
    gamesPlayed < 4
  );
  const score = Object.values(weightedInputs).reduce(
    (total, value) => total + value,
    0
  );
  const scoreForThisWeek =
    score -
    weightedInputs.numberOfGamesInNext3Gameweeks -
    weightedInputs.futureOpponentStrength;

  const totalWeight = getTotalWeight(player, scoreWeights);
  const weightForThisWeek =
    totalWeight -
    getWeightForPosition(player, scoreWeights.numberOfGamesInNext3Gameweeks) -
    getWeightForPosition(player, scoreWeights.futureOpponentStrength);

  const overallScore = (100 * score) / totalWeight;
  const overallScoreThisWeek = (100 * scoreForThisWeek) / weightForThisWeek;

  const scoreWithPositionPenalty =
    overallScore - getPositionPenalty(player, scoreWeights.positionPenalty);
  const scoreWithPositionPenaltyThisWeek =
    overallScoreThisWeek -
    getPositionPenalty(player, scoreWeights.positionPenalty);

  return {
    score: scoreWithPositionPenalty,
    scoreThisWeek: scoreWithPositionPenaltyThisWeek,
    scoreInputs: inputs,
  };
};

const calculateWeightedInputs = (
  player: FplPlayer,
  inputs: ScoreInputs,
  weights: ScoreWeights,
  settings: ScoreSettings,
  capForm: boolean
): ScoreInputs => ({
  form: capForm
    ? calculateCappedWeight(
        inputs.form,
        getWeightForPosition(player, weights.form),
        settings.form.max
      )
    : (inputs.form * getWeightForPosition(player, weights.form)) /
      settings.form.max,

  pointsPerGame: calculateCappedWeight(
    inputs.pointsPerGame,
    getWeightForPosition(player, weights.pointsPerGame),
    settings.pointsPerGame.max
  ),
  ictIndex: calculateCappedWeight(
    settings.ictIndex.max - inputs.ictIndex,
    getWeightForPosition(player, weights.ictIndex),
    settings.ictIndex.max
  ),
  teamStrength: calculateCappedWeight(
    inputs.teamStrength - settings.teamStrength.min,
    getWeightForPosition(player, weights.teamStrength),
    settings.teamStrength.max - settings.teamStrength.min
  ),
  teamStrengthForPosition: calculateCappedWeight(
    inputs.teamStrengthForPosition - settings.teamStrengthForPosition.min,
    getWeightForPosition(player, weights.teamStrengthForPosition),
    settings.teamStrengthForPosition.max - settings.teamStrengthForPosition.min
  ),
  opponentStrength: calculateCappedWeight(
    settings.opponentStrength.max - inputs.opponentStrength,
    getWeightForPosition(player, weights.opponentStrength),
    settings.opponentStrength.max - settings.opponentStrength.min
  ),
  futureOpponentStrength: calculateCappedWeight(
    settings.futureOpponentStrength.max - inputs.futureOpponentStrength,
    getWeightForPosition(player, weights.futureOpponentStrength),
    settings.futureOpponentStrength.max - settings.futureOpponentStrength.min
  ),
  chanceOfPlaying: calculateCappedWeight(
    inputs.chanceOfPlaying,
    getWeightForPosition(player, weights.chanceOfPlaying),
    settings.chanceOfPlaying.max
  ),
  // Don't cap these two. If they exceed the max, then they deserve it!
  numberOfGames:
    (inputs.numberOfGames *
      getWeightForPosition(player, weights.numberOfGames)) /
    settings.numberOfGames.max,

  numberOfGamesInNext3Gameweeks:
    ((inputs.numberOfGamesInNext3Gameweeks -
      settings.numberOfGamesInNext3Gameweeks.min) *
      getWeightForPosition(player, weights.numberOfGamesInNext3Gameweeks)) /
    (settings.numberOfGamesInNext3Gameweeks.max -
      settings.numberOfGamesInNext3Gameweeks.min),
});

const getForm = (
  player: FplPlayer,
  gamesPlayed: number,
  previousForm: number
) => {
  const form = parseFloat(player.form);
  if (gamesPlayed < 4) {
    return (form + 3 * previousForm) / 4;
  }
  return form;
};

const teamStrengthForPosition = (
  player: FplPlayer,
  team: FplTeam,
  fixtures: OpponentFixture[]
) => {
  if (fixtures.length === 0) {
    return player.element_type === PositionMap.GOALKEEPER ||
      player.element_type === PositionMap.DEFENDER
      ? team.strength_defence_home
      : team.strength_attack_home;
  }
  return (
    fixtures.reduce(
      (total, fixture) =>
        total +
        (player.element_type === PositionMap.GOALKEEPER ||
        player.element_type === PositionMap.DEFENDER
          ? fixture.isHome
            ? team.strength_defence_home
            : team.strength_defence_away
          : fixture.isHome
          ? team.strength_attack_home
          : team.strength_attack_away),
      0
    ) / fixtures.length
  );
};

const getOpponentAverageStrength = (
  player: FplPlayer,
  fixtures: OpponentFixture[],
  weights: ScoreWeights,
  maxOpponentStrength: number,
  minOpponentStrength: number
) => {
  if (fixtures.length === 0) {
    return (maxOpponentStrength - minOpponentStrength) / 2;
  }
  return (
    fixtures.reduce(
      (total, fixture) =>
        total +
        fixture.opponent.strength +
        (!fixture.isHome
          ? getWeightForPosition(player, weights.homeAdvantage)
          : 0),
      0
    ) / fixtures.length
  );
};

const calculateCappedWeight = (
  input: number,
  weight: number,
  max: number
): number => {
  if (input > max) {
    return weight;
  }
  if (input < 0) {
    return 0;
  }
  return (input * weight) / max;
};

const getTotalWeight = (player: FplPlayer, weights: ScoreWeights) => {
  return Object.values({
    ...weights,
    homeAdvantage: undefined,
    positionPenalty: undefined,
  }).reduce(
    (total, weight) =>
      total + (weight ? getWeightForPosition(player, weight) : 0),
    0
  );
};

const getSettingsForPlayer = (
  player: FplPlayer,
  scoreWeights: ScoreWeights
) => {
  const homeAdvantage = getWeightForPosition(
    player,
    scoreWeights.homeAdvantage
  );
  return {
    form: { min: 0, max: 8 },
    pointsPerGame: { min: 0, max: 6 },
    ictIndex: { min: 0, max: 100 },
    teamStrength: { min: 2, max: 5 },
    teamStrengthForPosition: { min: 950, max: 1350 },
    opponentStrength: { min: 2, max: 5 + homeAdvantage },
    futureOpponentStrength: { min: 2, max: 5 + homeAdvantage },
    chanceOfPlaying: { min: 0, max: 100 },
    numberOfGames: { min: 0, max: 2 },
    numberOfGamesInNext3Gameweeks: { min: 2, max: 6 },
  };
};

const getWeightForPosition = (player: FplPlayer, scoreWeight: ScoreWeight) => {
  switch (player.element_type) {
    case PositionMap.GOALKEEPER:
      return scoreWeight.goalkeeper ?? scoreWeight.weight;
    case PositionMap.DEFENDER:
      return scoreWeight.defender ?? scoreWeight.weight;
    case PositionMap.MIDFIELDER:
      return scoreWeight.midfielder ?? scoreWeight.weight;
    case PositionMap.FORWARD:
      return scoreWeight.forward ?? scoreWeight.weight;
    default:
      return scoreWeight.weight;
  }
};

const getPositionPenalty = (
  player: FplPlayer,
  scoreWeight: ScoreWeights["positionPenalty"]
) => {
  switch (player.element_type) {
    case PositionMap.GOALKEEPER:
      return scoreWeight.goalkeeper;
    case PositionMap.DEFENDER:
      return scoreWeight.defender;
    case PositionMap.MIDFIELDER:
      return scoreWeight.midfielder;
    case PositionMap.FORWARD:
      return scoreWeight.forward;
    default:
      return scoreWeight.forward;
  }
};
