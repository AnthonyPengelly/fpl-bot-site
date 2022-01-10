export type MyTeam = {
  picks: {
    element: number;
    position: number;
    is_captain: boolean;
    is_vice_captain: boolean;
    multiplier: number;
    purchase_price: number;
    selling_price: number;
  }[];
  chips: [];
  transfers: {
    cost: number;
    status: string;
    limit: number;
    made: number;
    bank: number;
    value: number;
  };
};
const baseUrl = "https://fantasy.premierleague.com/api";

const getMyDetails = async (fplCookie: string) => {
  const url = baseUrl + "/me/";
  const response = await fetch(url, { headers: { Cookie: fplCookie } });
  return (await response.json()) as { player: { entry: number } };
};

export const getMyTeam = async (fplCookie: string) => {
  const teamId = (await getMyDetails(fplCookie)).player.entry;
  const url = baseUrl + "/my-team/" + teamId + "/";
  const response = await fetch(url, { headers: { Cookie: fplCookie } });
  return (await response.json()) as MyTeam;
};
