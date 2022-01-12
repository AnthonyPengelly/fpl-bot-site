import { ActionFunction, Form, json, LoaderFunction, redirect } from "remix";
import { loginToFpl } from "~/fplApi/login";
import { commitSession, getSession } from "~/session";

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
  const username = data.get("username");
  const password = data.get("password");
  if (!username || !password) {
    console.log("bad input");
    return null;
  }
  const fplCookie = await loginToFpl(username.toString(), password.toString());

  session.set("fplCookie", fplCookie);
  session.set("username", username);
  return redirect("/", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
};

export default function Login() {
  return (
    <Form method="post">
      <label htmlFor="username">
        <b>Username</b>
      </label>
      <input
        type="text"
        placeholder="Enter Username"
        name="username"
        required
      />

      <label htmlFor="password">
        <b>Password</b>
      </label>
      <input
        type="password"
        placeholder="Enter Password"
        name="password"
        required
      />
      <button type="submit">Login</button>
    </Form>
  );
}
