import { ActionFunction, Form, json, LoaderFunction, redirect } from "remix";
import { commitSession, getSession } from "~/utilities/session";

export const loader: LoaderFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.has("fplCookie")) {
    return redirect("/");
  }
  return null;
};

export const action: ActionFunction = async ({ request }) => {
  const session = await getSession(request.headers.get("Cookie"));
  const data = await request.formData();
  const cookie = data.get("cookie");
  const username = data.get("username");
  if (!cookie || !username) {
    console.log("bad input");
    return null;
  }

  session.set("fplCookie", cookie);
  session.set("username", username);
  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

export default function Login() {
  return (
    <Form method="post">
      <label htmlFor="cookie">
        <b>Cookie</b>
      </label>
      <input type="text" placeholder="Enter Cookie" name="cookie" required />
      <label htmlFor="username">
        <b>Username</b>
      </label>
      <input
        type="text"
        placeholder="Enter Username"
        name="username"
        required
      />
      <button type="submit">Login</button>
    </Form>
  );
}
