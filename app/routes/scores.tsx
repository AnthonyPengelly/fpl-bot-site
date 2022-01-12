import {
  ActionFunction,
  Form,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import {
  getWeightsForUsername,
  saveWeightsForUsername,
  ScoreWeight,
  ScoreWeights,
} from "~/scoreWeightings";
import { getSession } from "~/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("fplCookie")) {
    return redirect("/login");
  }
  return getWeightsForUsername(session.get("username"));
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  const form = readWeightFromForm(data, "form");
  const pointsPerGame = readWeightFromForm(data, "pointsPerGame");
  const ictIndex = readWeightFromForm(data, "ictIndex");
  const teamStrength = readWeightFromForm(data, "teamStrength");
  const teamStrengthForPosition = readWeightFromForm(
    data,
    "teamStrengthForPosition"
  );
  const opponentStrength = readWeightFromForm(data, "opponentStrength");
  const futureOpponentStrength = readWeightFromForm(
    data,
    "futureOpponentStrength"
  );
  const chanceOfPlaying = readWeightFromForm(data, "chanceOfPlaying");
  const numberOfGames = readWeightFromForm(data, "numberOfGames");
  const numberOfGamesInNext3Gameweeks = readWeightFromForm(
    data,
    "numberOfGamesInNext3Gameweeks"
  );
  const homeAdvantage = readWeightFromForm(data, "homeAdvantage");
  const positionPenalty = readPositionWeightsFromForm(
    data,
    "positionPenalty"
  ) as {
    goalkeeper: number;
    defender: number;
    midfielder: number;
    forward: number;
  };
  if (
    typeof positionPenalty.goalkeeper === "undefined" ||
    typeof positionPenalty.defender === "undefined" ||
    typeof positionPenalty.midfielder === "undefined" ||
    typeof positionPenalty.forward === "undefined"
  ) {
    throw new Error("Position penalty must be set for all positions");
  }
  await saveWeightsForUsername(session.get("username"), {
    form,
    pointsPerGame,
    ictIndex,
    teamStrength,
    teamStrengthForPosition,
    opponentStrength,
    futureOpponentStrength,
    chanceOfPlaying,
    numberOfGames,
    numberOfGamesInNext3Gameweeks,
    homeAdvantage,
    positionPenalty,
  });

  return redirect("/");
};

const readWeightFromForm = (form: FormData, weightName: string) => {
  const weight = form.get(`${weightName}.weight`);
  if (weight === null || weight.toString() === "") {
    throw new Error(`Weight must be set for ${weightName}`);
  }
  return {
    weight: parseInt(weight.toString(), 10),
    ...readPositionWeightsFromForm(form, weightName),
  };
};

const readPositionWeightsFromForm = (form: FormData, weightName: string) => {
  const goalkeeper = form.get(`${weightName}.goalkeeper`);
  const defender = form.get(`${weightName}.defender`);
  const midfielder = form.get(`${weightName}.midfielder`);
  const forward = form.get(`${weightName}.forward`);

  return {
    goalkeeper: goalkeeper ? parseInt(goalkeeper.toString(), 10) : undefined,
    defender: defender ? parseInt(defender.toString(), 10) : undefined,
    midfielder: midfielder ? parseInt(midfielder.toString(), 10) : undefined,
    forward: forward ? parseInt(forward.toString(), 10) : undefined,
  };
};

const Scores = () => {
  const initialData = useLoaderData<ScoreWeights>();

  return (
    <main>
      <h1>Scores</h1>
      <Form method="post">
        <h2>Score Weights</h2>
        <WeightInputs weightName="form" initialWeight={initialData.form} />
        <WeightInputs
          weightName="pointsPerGame"
          initialWeight={initialData.pointsPerGame}
        />
        <WeightInputs
          weightName="ictIndex"
          initialWeight={initialData.ictIndex}
        />
        <WeightInputs
          weightName="teamStrength"
          initialWeight={initialData.teamStrength}
        />
        <WeightInputs
          weightName="teamStrengthForPosition"
          initialWeight={initialData.teamStrengthForPosition}
        />
        <WeightInputs
          weightName="opponentStrength"
          initialWeight={initialData.opponentStrength}
        />
        <WeightInputs
          weightName="futureOpponentStrength"
          initialWeight={initialData.futureOpponentStrength}
        />
        <WeightInputs
          weightName="chanceOfPlaying"
          initialWeight={initialData.chanceOfPlaying}
        />
        <WeightInputs
          weightName="numberOfGames"
          initialWeight={initialData.numberOfGames}
        />
        <WeightInputs
          weightName="numberOfGamesInNext3Gameweeks"
          initialWeight={initialData.numberOfGamesInNext3Gameweeks}
        />
        <WeightInputs
          weightName="homeAdvantage"
          initialWeight={initialData.homeAdvantage}
          max={3}
        />
        <PositionPenalty initialValues={initialData.positionPenalty} />
        <button type="submit">Save</button>
      </Form>
    </main>
  );
};

const WeightInputs = ({
  weightName,
  initialWeight,
  max = 100,
}: {
  weightName: string;
  initialWeight: ScoreWeight;
  max?: number;
}) => (
  <fieldset>
    <label htmlFor={`${weightName}.weight`}>
      <b>{weightName}</b>
    </label>
    <input
      type="number"
      name={`${weightName}.weight`}
      defaultValue={initialWeight.weight}
      max={max}
      min="0"
      required
    />
    <label htmlFor={`${weightName}.goalkeeper`}>Goalkeepers</label>
    <input
      type="number"
      name={`${weightName}.goalkeeper`}
      max={max}
      min="0"
      defaultValue={initialWeight.goalkeeper}
    />
    <label htmlFor={`${weightName}.defender`}>Defenders</label>
    <input
      type="number"
      name={`${weightName}.defender`}
      max={max}
      min="0"
      defaultValue={initialWeight.defender}
    />
    <label htmlFor={`${weightName}.midfielder`}>Midfielders</label>
    <input
      type="number"
      name={`${weightName}.midfielder`}
      max={max}
      min="0"
      defaultValue={initialWeight.midfielder}
    />
    <label htmlFor={`${weightName}.forward`}>Forwards</label>
    <input
      type="number"
      name={`${weightName}.forward`}
      max={max}
      min="0"
      defaultValue={initialWeight.forward}
    />
  </fieldset>
);

const PositionPenalty = ({
  initialValues,
}: {
  initialValues: {
    goalkeeper: number;
    defender: number;
    midfielder: number;
    forward: number;
  };
}) => (
  <fieldset>
    <h2>Position Penalty</h2>
    <label htmlFor="positionPenalty.goalkeeper">Goalkeepers</label>
    <input
      type="number"
      name="positionPenalty.goalkeeper"
      max="20"
      min="0"
      defaultValue={initialValues.goalkeeper}
      required
    />
    <label htmlFor="positionPenalty.defender">Defenders</label>
    <input
      type="number"
      name="positionPenalty.defender"
      max="20"
      min="0"
      defaultValue={initialValues.defender}
      required
    />
    <label htmlFor="positionPenalty.midfielder">Midfielders</label>
    <input
      type="number"
      name="positionPenalty.midfielder"
      max="20"
      min="0"
      defaultValue={initialValues.midfielder}
      required
    />
    <label htmlFor="positionPenalty.forward">Forwards</label>
    <input
      type="number"
      name="positionPenalty.forward"
      max="20"
      min="0"
      defaultValue={initialValues.forward}
      required
    />
  </fieldset>
);

export default Scores;
