import ERROR_TYPE from "./errorType";
import * as GameMessages from "./game/gameMessageTypes";
import * as ChatMessages from "./chat/chatMessageTypes";

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
  | GameMessages.MatchmakingMessage;

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
  | ChatMessages.NewMsgSendMessage;

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
