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
    typeof data.settings === "object" &&
    isTournamentSettings(data.settings)
  );
}

export type JoinMessage = {
  readonly type: "join";
  uuid: string; // The uuid of the tournament
  name: string; // The name of the player
};

export function isJoinMessage(data: any): data is JoinMessage {
  return (
    data &&
    data.type === "join" &&
    typeof data.uuid === "string" &&
    typeof data.name === "string"
  );
}

export type LeaveMessage = {
  readonly type: "leave";
  uuid: string; // The uuid of the tournament
};

export function isLeaveMessage(data: any): data is LeaveMessage {
  return (
    data &&
    data.type === "leave" &&
    typeof data.uuid === "string"
  );
}
