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
  senderEmail: string; // The player's username
  senderName: string;
  receiverEmail: string; //target
  msg: string; // The message
};

export function isNewMsgSendMessage(data: any): data is NewMsgSendMessage {
  return (
    data &&
    data.type === "newMessageSend" &&
    typeof data.senderEmail === "string" &&
    typeof data.msg === "string" &&
    typeof data.receiverEmail === "string" &&
    typeof data.senderName === "string"
  );
}

export type RegisterUserMessage = {
  readonly type: "registerUsername";
  email: string;
  name: string;
};

export function isRegisterUserMessage(data: any): data is RegisterUserMessage {
  return (
    data &&
    data.type === "registerUsername" &&
    typeof data.email === "string" &&
    typeof data.name === "string"
  );
}
