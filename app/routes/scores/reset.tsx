import { ActionFunction, redirect } from "remix";
import { invalidateCachedGameState } from "~/gameState/gameState";
import { resetWeightsForUsername } from "~/gameState/scoreWeightings";
import { getSession } from "~/utilities/session";

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("fplCookie")) {
    return redirect("/login");
  }
  console.log("resetting");
  await resetWeightsForUsername(session.get("username"));
  await invalidateCachedGameState(session.get("username"));
  return redirect("/scores");
};

const Reset = () => <h1>Not Found</h1>;
export default Reset;
