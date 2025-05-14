import WebSocket from "ws";
import { Player } from "../types/player";
import db from "../db/db";
import {
  isInviteToGameMessage,
  isAcceptGameInviteMessage,
  isNewMsgSendMessage,
  NewMsgReceivedMessage,
  InviteToGameMessage,
  // StartGameRedirectMessage
} from "../shared/chat/chatMessageTypes";
import { ChatMessageData } from "../shared/messageType";
import { isBlocked } from "../utils/blocked";
import { getPlayerByUUID } from "./setupWebSocket";

export function handleChatAndInviteMessages(
  msgData: any,
  player: Player
): boolean {
  if (isInviteToGameMessage(msgData.data)) {
    const data = msgData.data;

    const receiverPlayer = getPlayerByUUID(data.userUuid);
    if (!receiverPlayer) {
      console.log(`[INVITEGAME ERROR] ${player.username} a tenté d'inviter ${data.userUuid}, mais il n'est pas connecté.`);
      return true;
    }

    if (receiverPlayer.socket?.readyState === WebSocket.OPEN) {
      receiverPlayer.socket.send(JSON.stringify({
        type: "chat",
        data: {
          type: "inviteToGame",
          from: player.username,
          userUuid: player.uuid,
        } as InviteToGameMessage
      }));
    }

    return true;
  }

  if (isAcceptGameInviteMessage(msgData.data)) {
    console.log(`[INVITEGAME] ${msgData.data.from} a accepté l'invitation.`);

    const receiver = player;
    const inviter = getPlayerByUUID(msgData.data.userId);

    if (!inviter) {
      console.error("[INVITEGAME] Inviteur introuvable !");
      return true;
    }

    if (inviter.socket?.readyState === WebSocket.OPEN) {
      inviter.socket.send(JSON.stringify({
        type: "chat",
        data: {
          type: "startGameRedirect",
          from: receiver.username,
          userId: receiver.uuid
        }
      }));
    }
    if (receiver.socket?.readyState === WebSocket.OPEN) {
      receiver.socket.send(JSON.stringify({
        type: "chat",
        data: {
          type: "startGameRedirect",
          from: inviter.username,
          userId: inviter.uuid
        }
      }));
    }
    return true;
  }

  if (msgData.type === "chat") {
    const data: ChatMessageData = msgData.data;
    if (isNewMsgSendMessage(data)) {
      const { receiverEmail, msg } = data;
      const senderUuid = player.uuid;
      const senderName = player.username;

      const sender = db.prepare(`SELECT uuid FROM users WHERE uuid = ?`).get(senderUuid) as { uuid: string } | undefined;
      const receiver = db.prepare(`SELECT uuid FROM users WHERE email = ?`).get(receiverEmail) as { uuid: string } | undefined;

      if (!sender || !receiver) {
        console.error("Sender or Receiver not found");
        return true;
      }

      if (isBlocked(receiver.uuid, sender.uuid)) {
        console.log(`[BLOCKED] ${senderUuid} is blocked by ${receiverEmail}`);
        return true;
      }

      if (isBlocked(sender.uuid, receiver.uuid)) {
        console.log(`[BLOCKED] ${senderUuid} has blocked ${receiverEmail}`);
        return true;
      }

      const room = db.prepare(`
        SELECT id FROM chat_rooms
        WHERE (user1_uuid = ? AND user2_uuid = ?)
           OR (user1_uuid = ? AND user2_uuid = ?)
      `).get(sender.uuid, receiver.uuid, receiver.uuid, sender.uuid) as { id: number } | undefined;

      if (!room) {
        console.error("Room not found between users");
        return true;
      }

      db.prepare(`
        INSERT INTO messages (room_id, sender_uuid, content)
        VALUES (?, ?, ?)
      `).run(room.id, sender.uuid, msg);

      const receiverPlayer = getPlayerByUUID(receiver.uuid);
      if (receiverPlayer && receiverPlayer.socket?.readyState === WebSocket.OPEN) {
        const newMsg: NewMsgReceivedMessage = {
          type: "newMessageReceived",
          sender: senderName,
          msg: msg,
          roomId: room.id,
        };

        receiverPlayer.socket.send(JSON.stringify({ type: "chat", data: newMsg }));
      }
    }

    return true;
  }

  return false;
}
