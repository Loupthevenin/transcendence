export type NewMsgReceivedMessage = {
  readonly type: "newMessageReceived";
  sender: string; // The player's username
  msg: string; // The message
};

export function isNewMsgReceivedMessage(data: any): data is NewMsgReceivedMessage {
  return (
    data &&
    data.type === "newMessageReceived" &&
    typeof data.sender === "string" &&
    typeof data.msg === "string"
  );
}

export type NewMsgSendMessage = {
  readonly type: "newMessageSend";
  sender: string; // The player's username
  msg: string; // The message
};

export function isNewMsgSendMessage(data: any): data is NewMsgSendMessage {
  return (
    data &&
    data.type === "newMessageSend" &&
    typeof data.sender === "string" &&
    typeof data.msg === "string"
  );
}
