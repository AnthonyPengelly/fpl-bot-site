import { Link, LoaderFunction, redirect, useLoaderData } from "remix";
import { GameState, getGameState } from "~/gameState/gameState";
import { getSession } from "~/utilities/session";

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
    <div>
      <Link to="/scores">Update score settings</Link>
      <h1>You're Team</h1>
      <h2>Recommended Linup</h2>
      <h3>Starting XI</h3>
      <ul>
        {myTeam.starting11.map((player) => (
          <li key={player.id}>
            <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
          </li>
        ))}
      </ul>
      <p>Captain: {myTeam.captain.name}</p>
      <p>Vice Captain: {myTeam.viceCaptain.name}</p>
      <h3>Subs</h3>
      <ul>
        {myTeam.subs.map((player) => (
          <li key={player.id}>
            <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
          </li>
        ))}
      </ul>
      <h2>Top Players</h2>
      <ul>
        {players.slice(0, 25).map((player) => (
          <li key={player.id}>
            <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
          </li>
        ))}
      </ul>
      <h2>Top Goalkeepers</h2>
      <ul>
        {players
          .filter((player) => player.position.id === 1)
          .slice(0, 25)
          .map((player) => (
            <li key={player.id}>
              <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
            </li>
          ))}
      </ul>
      <h2>Top Defenders</h2>
      <ul>
        {players
          .filter((player) => player.position.id === 2)
          .slice(0, 25)
          .map((player) => (
            <li key={player.id}>
              <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
            </li>
          ))}
      </ul>
      <h2>Top Midfielders</h2>
      <ul>
        {players
          .filter((player) => player.position.id === 3)
          .slice(0, 25)
          .map((player) => (
            <li key={player.id}>
              <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
            </li>
          ))}
      </ul>
      <h2>Top Forwards</h2>
      <ul>
        {players
          .filter((player) => player.position.id === 4)
          .slice(0, 25)
          .map((player) => (
            <li key={player.id}>
              <b>{player.scoreDetails.score.toFixed(2)}</b> - {player.name}
            </li>
          ))}
      </ul>
    </div>
  );
}
