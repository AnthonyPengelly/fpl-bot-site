import * as WebRequest from "web-request";
import { tryGetFromCache } from "./cache";

export type FplPlayer = {
  id: number;
  photo: string;
  web_name: string;
  team_code: number;
  status: string;
  code: number;
  first_name: string;
  second_name: string;
  squad_number: number;
  news: string;
  now_cost: number;
  chance_of_playing_this_round: number;
  chance_of_playing_next_round: number;
  value_form: string;
  value_season: string;
  cost_change_start: number;
  cost_change_event: number;
  cost_change_start_fall: number;
  cost_change_event_fall: number;
  in_dreamteam: boolean;
  dreamteam_count: number;
  selected_by_percent: string;
  form: string;
  transfers_out: number;
  transfers_in: number;
  transfers_out_event: number;
  transfers_in_event: number;
  loans_in: number;
  loans_out: number;
  loaned_in: number;
  loaned_out: number;
  total_points: number;
  event_points: number;
  points_per_game: string;
  ep_this: string;
  ep_next: string;
  special: boolean;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  ict_index_rank: number;
  ea_index: number;
  element_type: number;
  team: number;
};

export type FplTeam = {
  id: number;
  name: string;
  code: number;
  short_name: string;
  unavailable: boolean;
  strength: number;
  position: number;
  played: number;
  win: number;
  loss: number;
  draw: number;
  points: number;
  form: number;
  link_url: string;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
  team_division: number;
};

export type FplPosition = {
  id: number;
  singular_name: string;
  singular_name_short: string;
  plural_name: string;
  plural_name_short: string;
};

export enum PositionMap {
  GOALKEEPER = 1,
  DEFENDER = 2,
  MIDFIELDER = 3,
  FORWARD = 4,
}

type FplOverview = {
  phases: any;
  elements: FplPlayer[];
  "game-settings": any;
  "total-players": number;
  teams: FplTeam[];
  element_types: FplPosition[];
  events: {
    id: number;
    name: string;
    deadline_time: string;
    average_entry_score: number;
    finished: boolean;
    data_checked: boolean;
    highest_scoring_entry: number;
    deadline_time_epoch: number;
    deadline_time_game_offset: number;
    deadline_time_formatted: number;
    highest_score: number;
    is_previous: boolean;
    is_current: boolean;
    is_next: boolean;
  }[];
};

export type FplFixture = {
  code: number;
  event: number;
  finished: boolean;
  finished_provisional: boolean;
  id: number;
  kickoff_time: string;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean;
  team_a: number;
  team_a_score: number;
  team_h: number;
  team_h_score: number;
  stats: any;
  team_h_difficulty: number; // difficulty for home team
  team_a_difficulty: number; // difficulty for away team
};

export type Overview = FplOverview & { fixtures: FplFixture[] };

const baseUrl = "https://fantasy.premierleague.com/api";

const getFixtures = async () => {
  const url = baseUrl + "/fixtures/";
  return await tryGetFromCache(url, () => WebRequest.json<FplFixture[]>(url));
};

export const getFplOverview = async () => {
  const url = baseUrl + "/bootstrap-static/";
  // File size too large to cache
  const overview = await WebRequest.json<FplOverview>(url);
  return {
    ...overview,
    fixtures: await getFixtures(),
  };
};
