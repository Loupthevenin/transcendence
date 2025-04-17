import ERROR_TYPE from "./errorType";
import * as GameMessages from "./game/gameMessageTypes";
import * as ChatMessages from "./chat/chatMessageTypes";
import * as TournamentMessages from "./tournament/tournamentMessageTypes";

export type ErrorMessage = {
  readonly type: "error";
  msg: string;
  errorType?: ERROR_TYPE;
};

export function isErrorMessage(data: any): data is ErrorMessage {
  return (
    data &&
    data.type === "error" &&
    typeof data.msg === "string"
  );
}

export type GameMessageData =
  | GameMessages.SkinChangeMessage
  | GameMessages.PaddlePositionMessage
  | GameMessages.GameDataMessage
  | GameMessages.GameStartedMessage
  | GameMessages.GameResultMessage
  | GameMessages.DisconnectionMessage
  | GameMessages.ReconnectionMessage
  | GameMessages.MatchmakingMessage
  | GameMessages.LeaveGameMessage
  | GameMessages.ReadyToPlayMessage;

export type GameMessage = {
  readonly type: "game";
  data: GameMessageData;
};

export function isGameMessage(data: any): data is GameMessage {
  return (
    data &&
    data.type === "game" &&
    "data" in data
  );
}

export type ChatMessageData =
	| ChatMessages.NewMsgReceivedMessage
	| ChatMessages.NewMsgSendMessage
  | ChatMessages.RegisterUserMessage
  | ChatMessages.InviteToGameMessage
  | ChatMessages.AcceptGameInviteMessage
  | ChatMessages.StartGameRedirectMessage;

export type ChatMessage = {
  readonly type: "chat";
  data: ChatMessageData;
};

export function isChatMessage(data: any): data is ChatMessage {
  return (
    data &&
    data.type === "chat" &&
    "data" in data
  );
}

export type TournamentMessageData =
  | TournamentMessages.CreateMessage
  | TournamentMessages.JoinMessage
  | TournamentMessages.LeaveMessage
  | TournamentMessages.CloseMessage
  | TournamentMessages.LaunchMatchMessage;

export type TournamentMessage = {
  readonly type: "tournament";
  data: TournamentMessageData;
};

export function isTournamentMessage(data: any): data is TournamentMessage {
  return (
    data &&
    data.type === "tournament" &&
    "data" in data
  );
}
