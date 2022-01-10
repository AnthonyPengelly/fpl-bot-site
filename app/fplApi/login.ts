import * as WebRequest from "web-request";

const baseUrl = "https://users.premierleague.com";

export const loginToFpl = async (username: string, password: string) => {
  const url = baseUrl + "/accounts/login/";
  const response = await WebRequest.post(
    url,
    {
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    },
    `login=${username}&password=${password}&app=plfpl-web&redirect_uri=https%3A%2F%2Ffantasy.premierleague.com%2F`
  );
  const cookiesArray: string[] = response.headers["set-cookie"];
  const cookies = cookiesArray.map((x) => x.split("; ")[0]).join("; ") + ";";
  return cookies;
};
