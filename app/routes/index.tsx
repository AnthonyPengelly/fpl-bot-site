import { LoaderFunction, redirect, useLoaderData } from "remix";
import { getMyTeam, MyTeam } from "~/fplApi/myTeam";
import { getSession } from "~/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("fplCookie")) {
    return redirect("/login");
  }
  return getMyTeam(session.get("fplCookie"));
};

export default function Index() {
  const myTeam = useLoaderData<MyTeam>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        {myTeam.picks.map((pick) => (
          <li key={pick.element}>{JSON.stringify(pick)}</li>
        ))}
      </ul>
    </div>
  );
}
