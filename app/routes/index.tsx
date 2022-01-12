import { Link, LoaderFunction, redirect, useLoaderData } from "remix";
import { getFplOverview, Overview } from "~/fplApi/getFplOverview";
import { getMyTeam, MyTeam } from "~/fplApi/myTeam";
import { GameState, getGameState } from "~/gameState/gameState";
import { getSession } from "~/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("fplCookie")) {
    return redirect("/login");
  }
  return getGameState(session.get("fplCookie"), session.get("username"));
};

export default function Index() {
  const { players, myTeam } = useLoaderData<GameState>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>FPL Bot</h1>
      <Link to="/scores">Update score settings</Link>
      <h2>My Team</h2>
      <ul>
        {myTeam.players.map((player) => (
          <li key={player.id}>
            <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
          </li>
        ))}
      </ul>
      <h2>All Players</h2>
      <ul>
        {players.slice(0, 25).map((player) => (
          <li key={player.id}>
            <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
