import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

type CreateChatroomBody = {
  receiverId: number;
};

export async function createOrGetChatRoom( request: FastifyRequest<{ Body: CreateChatroomBody }>, reply: FastifyReply) {
  const senderEmail = request.user?.email;
  if (!senderEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const { receiverId } = request.body;

  const senderRow = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(senderEmail) as { id: number } | undefined;

  if (!senderRow) {
    return reply.status(404).send({ error: "Sender not found" });
  }

  const senderId = senderRow.id; 
  if (senderId === receiverId) {
    return reply.status(400).send({ error: "Impossible de créer une conversation avec toi-même" });
  }
  
  const firstId = Math.min(senderId, receiverId);
  const secondId = Math.max(senderId, receiverId);

  const existingRoom = db.prepare(`
      SELECT id FROM chat_rooms
      WHERE user1_id = ? AND user2_id = ?
    `).get(firstId, secondId) as { id: number } | undefined;

  let roomId: number;

  if (existingRoom) {
    roomId = existingRoom.id;
  } else {
    const result = db
      .prepare(`
        INSERT INTO chat_rooms (user1_id, user2_id)
        VALUES (?, ?)
      `)
      .run(firstId, secondId);

    roomId = Number(result.lastInsertRowid);
  }
  const otherUserId = senderId === firstId ? secondId : firstId;

  const otherUser = db.prepare(`
    SELECT id, uuid, name, avatar_url, email
    FROM users
    WHERE id = ?
  `).get(otherUserId) as { id: number; uuid: string; name: string; avatar_url: string; email: string } | undefined;

  if (!otherUser) {
    return reply.status(404).send({ error: "Other user not found" });
  }

  return reply.send({
    roomId,
    otherUserId: otherUserId, 
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar_url,
    otherUserEmail: otherUser.email, 
    otherUserUuid: otherUser.uuid,
  });
}

export async function getUserChatRooms( request: FastifyRequest, reply: FastifyReply) {
  const userEmail = request.user?.email;
  if (!userEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const userRow = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(userEmail) as { id: number } | undefined;

  if (!userRow) {
    return reply.status(404).send({ error: "User not found" });
  }

  const userId = userRow.id;

  const rawChatRooms = db.prepare(`
    SELECT id, user1_id, user2_id, updated_at
    FROM chat_rooms
    WHERE user1_id = ? OR user2_id = ?
    ORDER BY updated_at DESC
  `).all(userId, userId) as {
    id: number;
    user1_id: number;
    user2_id: number;
    updated_at: string;
  }[];

  const enrichedChatRooms = rawChatRooms.map(room => {
    const otherUserId = room.user1_id === userId ? room.user2_id : room.user1_id;

    const otherUser = db.prepare(`
      SELECT id, uuid, name, avatar_url, email
      FROM users
      WHERE id = ?
    `).get(otherUserId) as { id: number; uuid: string; name: string; avatar_url: string; email: string } | undefined;

    return {
      roomId: room.id,
      otherUserId: otherUser?.id ?? null,
      otherUserUuid: otherUser?.uuid ?? null,
      otherUserName: otherUser?.name ?? "Unknown",
      otherUserAvatar: otherUser?.avatar_url ?? null,
      otherUserEmail: otherUser?.email ?? null,
      lastMessageAt: room.updated_at,
    };
  });

  return reply.send(enrichedChatRooms);
}

export async function getChatRoomMessages( request: FastifyRequest<{ Params: { roomId: string } }>, reply: FastifyReply) {
  const { roomId } = request.params;

  const numericRoomId = parseInt(roomId, 10);
  if (isNaN(numericRoomId)) {
    return reply.status(400).send({ error: "Invalid Room ID" });
  }

  const userEmail = request.user?.email;
  if (!userEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const user = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(userEmail) as { id: number } | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const membership = db.prepare(`
    SELECT id FROM chat_rooms
    WHERE id = ?
      AND (user1_id = ? OR user2_id = ?)
  `).get(numericRoomId, user.id, user.id);

  if (!membership) {
    return reply.status(403).send({ error: "Access denied" });
  }

  const messages = db.prepare(`
    SELECT id, sender_id, content, created_at
    FROM messages
    WHERE room_id = ?
    ORDER BY created_at ASC
  `).all(numericRoomId) as {
    id: number;
    sender_id: number;
    content: string;
    created_at: string;
  }[];

  return reply.send(messages);
}


type SendMessageBody = {
  roomId: number;
  content: string;
};

export async function sendMessage( request: FastifyRequest<{ Body: SendMessageBody }>, reply: FastifyReply) {
  const { roomId, content } = request.body;

  if (!content || content.trim() === "") {
    return reply.status(400).send({ error: "Message content required" });
  }

  const userEmail = request.user?.email;
  if (!userEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  const user = db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).get(userEmail) as { id: number } | undefined;

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  db.prepare(`
    INSERT INTO messages (room_id, sender_id, content)
    VALUES (?, ?, ?)
  `).run(roomId, user.id, content);

  db.prepare(`
    UPDATE chat_rooms
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(roomId);

  return reply.send({ success: true });
}

