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
  username: string; // The username of the player
};

export function isJoinMessage(data: any): data is JoinMessage {
  return (
    data &&
    data.type === "join" &&
    typeof data.uuid === "string" &&
    typeof data.username === "string"
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

export type CloseMessage = {
  readonly type: "close";
  uuid: string; // The uuid of the tournament
};

export function isCloseMessage(data: any): data is CloseMessage {
  return (
    data &&
    data.type === "close" &&
    typeof data.uuid === "string"
  );
}
