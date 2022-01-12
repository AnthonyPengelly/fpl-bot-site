import { LoaderFunction, redirect, useLoaderData } from "remix";
import { GetFplOverview, Overview } from "~/fplApi/getFplOverview";
import { getMyTeam, MyTeam } from "~/fplApi/myTeam";
import { getSession } from "~/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (!session.has("fplCookie")) {
    return redirect("/login");
  }
  return {
    myTeam: await getMyTeam(session.get("fplCookie")),
    overview: await GetFplOverview(),
  };
};

export default function Index() {
  const { myTeam, overview } =
    useLoaderData<{ myTeam: MyTeam; overview: Overview }>();
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        {myTeam.picks.map((pick) => (
          <li key={pick.element}>
            {
              overview.elements.find((element) => element.id === pick.element)
                ?.web_name
            }
          </li>
        ))}
      </ul>
    </div>
  );
}
