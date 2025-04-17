import WebSocket from "ws";
import { Player } from "../types/player";
import db from "../db/db";
import { isInviteToGameMessage, isAcceptGameInviteMessage, isNewMsgSendMessage, NewMsgReceivedMessage } from "../shared/chat/chatMessageTypes";
import { ChatMessageData } from "../shared/messageType";
import { isBlocked } from "../utils/blocked";
import { getPlayerById, getPlayerByUuid } from "./setupWebSocket";

export function handleChatAndInviteMessages(
  msgData: any,
  player: Player,
  ws: WebSocket
): boolean {
  if (isInviteToGameMessage(msgData.data)) {
    const data = msgData.data;

    const receiverPlayer = getPlayerById(data.userId);
    if (!receiverPlayer) {
      console.log(`[INVITEGAME ERROR] ${player.username} a tenté d'inviter ${data.userId}, mais il n'est pas connecté.`);
      return true;
    }

    if (receiverPlayer.socket?.readyState === WebSocket.OPEN) {
      receiverPlayer.socket.send(JSON.stringify({
        type: "chat",
        data: {
          type: "inviteToGame",
          from: player.username,
          userId: data.userId,
        }
      }));
    }

    return true;
  }

  if (isAcceptGameInviteMessage(msgData.data)) {
    console.log(`[INVITEGAME] ${msgData.data.from} a accepté l'invitation.`);

    const receiver = player;
    const inviter = getPlayerByUuid(msgData.data.userId);

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
      const senderId = player.uuid;
      const senderName = player.username;

      const sender = db.prepare(`SELECT id FROM users WHERE uuid = ?`).get(senderId) as { id: number } | undefined;
      const receiver = db.prepare(`SELECT id FROM users WHERE email = ?`).get(receiverEmail) as { id: number } | undefined;

      if (!sender || !receiver) {
        console.error("Sender or Receiver not found");
        return true;
      }

      if (isBlocked(receiver.id, sender.id)) {
        console.log(`[BLOCKED] ${senderId} is blocked by ${receiverEmail}`);
        return true; 
      }
  
      if (isBlocked(sender.id, receiver.id)) {
        console.log(`[BLOCKED] ${senderId} has blocked ${receiverEmail}`);
        return true; 
      }

      const room = db.prepare(`
        SELECT id FROM chat_rooms
        WHERE (user1_id = ? AND user2_id = ?)
           OR (user1_id = ? AND user2_id = ?)
      `).get(sender.id, receiver.id, receiver.id, sender.id) as { id: number } | undefined;

      if (!room) {
        console.error("Room not found between users");
        return true;
      }
//  Save the message in database
      db.prepare(`
        INSERT INTO messages (room_id, sender_id, content)
        VALUES (?, ?, ?)
      `).run(room.id, sender.id, msg);
//  Notify the receiver if connected
      const receiverPlayer = getPlayerById(receiver.id);
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
