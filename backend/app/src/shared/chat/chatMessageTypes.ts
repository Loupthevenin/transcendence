export type NewMsgReceivedMessage = {
  readonly type: "newMessageReceived";
  sender: string; // The player's username
  msg: string; // The message
  roomId: number;
};

export function isNewMsgReceivedMessage(data: any): data is NewMsgReceivedMessage {
  return (
    data &&
    data.type === "newMessageReceived" &&
    typeof data.sender === "string" &&
    typeof data.msg === "string" &&
    typeof data.roomId === "number"
  );
}

export type NewMsgSendMessage = {
  readonly type: "newMessageSend";
  senderEmail: string; // Sender
  senderName: string;
  receiverEmail: string; // Target
  msg: string; // The message
};

export function isNewMsgSendMessage(data: any): data is NewMsgSendMessage {
  return (
    data &&
    data.type === "newMessageSend" &&
    typeof data.senderEmail === "string" &&
    typeof data.senderName === "string" &&
    typeof data.receiverEmail === "string" &&
    typeof data.msg === "string"
  );
}

// export type RegisterUserMessage = {
//   readonly type: "registerUsername";
//   email: string;
//   name: string;
// };

// export function isRegisterUserMessage(data: any): data is RegisterUserMessage {
//   return (
//     data &&
//     data.type === "registerUsername" &&
//     typeof data.email === "string" &&
//     typeof data.name === "string"
//   );
// }

export type InviteToGameMessage = {
  readonly type: "inviteToGame";
  from: string;
  userId: string;
};

export function isInviteToGameMessage(data: any): data is InviteToGameMessage {
  return (
    data &&
    data.type === "inviteToGame" &&
    typeof data.from === "string" &&
    typeof data.userId === "string"
  );
}

export type AcceptGameInviteMessage = {
  readonly type: "gameInviteAccepted";
  from: string;
  userId: string;
};

export function isAcceptGameInviteMessage(data: any): data is AcceptGameInviteMessage {
  return (
    data &&
    data.type === "gameInviteAccepted" &&
    typeof data.from === "string" &&
    typeof data.userId === "string"
  );
}

export type StartGameRedirectMessage = {
  readonly type: "startGameRedirect";
  from: string;
  userId: string;
  targetUserId: number;
};

export function isStartGameRedirectMessage(data: any): data is StartGameRedirectMessage {
  return (
    data &&
    data.type === "startGameRedirect" &&
    typeof data.from === "string" &&
    typeof data.userId === "string" &&
    typeof data.targetUserId === "number"
  );
}
