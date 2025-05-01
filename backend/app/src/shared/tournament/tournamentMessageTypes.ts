import { TournamentSettings, isTournamentSettings } from "./tournamentSettings";

export type CreateMessage = {
  readonly type: "create";
  name: string; // The name of the tournament
  settings: TournamentSettings; // The settings of the tournament
};

export function isCreateMessage(data: any): data is CreateMessage {
  return (
    data &&
    data.type === "create" &&
    typeof data.name === "string" &&
    typeof data.name === "object" &&
    isTournamentSettings(data.settings)
  );
}

export type JoinMessage = {
  readonly type: "join";
  name: string; // The name of the tournament
};

export function isJoinMessage(data: any): data is JoinMessage {
  return (
    data &&
    data.type === "join" &&
    typeof data.name === "string" 
  );
}

export type LeaveMessage = {
  readonly type: "leave";
  name: string; // The name of the tournament
};

export function isLeaveMessage(data: any): data is LeaveMessage {
  return (
    data &&
    data.type === "leave" &&
    typeof data.name === "string" 
  );
}
