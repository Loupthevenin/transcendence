import * as GameMessages from "./game/gameMessageTypes";

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

import * as ChatMessages from "./chat/chatMessageTypes";

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
