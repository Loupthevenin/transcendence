import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

type CreateChatroomBody = {
  receiverUuid: string;
};

export async function createOrGetChatRoom(
  request: FastifyRequest<{ Body: CreateChatroomBody }>,
  reply: FastifyReply
) {
  const senderEmail = request.user?.email;
  if (!senderEmail) return reply.status(401).send({ error: "Invalid Token" });

  const { receiverUuid } = request.body;
  if (!receiverUuid) return reply.status(400).send({ error: "Missing receiverUuid" });

  const senderRow = db.prepare(`SELECT uuid FROM users WHERE email = ?`).get(senderEmail) as { uuid: string } | undefined;
  if (!senderRow) return reply.status(404).send({ error: "Sender not found" });

  const senderUuid = senderRow.uuid;
  if (senderUuid === receiverUuid)
    return reply.status(400).send({ error: "Impossible de créer une conversation avec toi-même" });

  const [firstUuid, secondUuid] =
    senderUuid < receiverUuid
      ? [senderUuid, receiverUuid]
      : [receiverUuid, senderUuid];

  const existingRoom = db.prepare(`
    SELECT id FROM chat_rooms
    WHERE user1_uuid = ? AND user2_uuid = ?
  `).get(firstUuid, secondUuid) as { id: number } | undefined;

  let roomId: number;

  if (existingRoom) {
    roomId = existingRoom.id;
  } else {
    const result = db
      .prepare(`
        INSERT INTO chat_rooms (user1_uuid, user2_uuid)
        VALUES (?, ?)
      `)
      .run(firstUuid, secondUuid);

    roomId = Number(result.lastInsertRowid);
  }

  const otherUserUuid = senderUuid === firstUuid ? secondUuid : firstUuid;

  const otherUser = db.prepare(`
    SELECT uuid, name, avatar_url, email
    FROM users
    WHERE uuid = ?
  `).get(otherUserUuid) as { uuid: string; name: string; avatar_url: string; email: string } | undefined;

  if (!otherUser) return reply.status(404).send({ error: "Other user not found" });

  return reply.send({
    roomId,
    otherUserUuid,
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar_url,
    otherUserEmail: otherUser.email,
  });
}

export async function getUserChatRooms(request: FastifyRequest, reply: FastifyReply) {
  const userEmail = request.user?.email;
  if (!userEmail) return reply.status(401).send({ error: "Invalid Token" });

  const userRow = db.prepare(`SELECT uuid FROM users WHERE email = ?`).get(userEmail) as { uuid: string } | undefined;
  if (!userRow) return reply.status(404).send({ error: "User not found" });

  const userUuid = userRow.uuid;

  const rawChatRooms = db.prepare(`
    SELECT id, user1_uuid, user2_uuid, updated_at
    FROM chat_rooms
    WHERE user1_uuid = ? OR user2_uuid = ?
    ORDER BY updated_at DESC
  `).all(userUuid, userUuid) as {
    id: number;
    user1_uuid: string;
    user2_uuid: string;
    updated_at: string;
  }[];

  const enrichedChatRooms = rawChatRooms.map(room => {
    const otherUserUuid = room.user1_uuid === userUuid ? room.user2_uuid : room.user1_uuid;

    const otherUser = db.prepare(`
      SELECT uuid, name, avatar_url, email
      FROM users
      WHERE uuid = ?
    `).get(otherUserUuid) as { uuid: string; name: string; avatar_url: string; email: string } | undefined;

    return {
      roomId: room.id,
      otherUserUuid: otherUser?.uuid ?? null,
      otherUserName: otherUser?.name ?? "Unknown",
      otherUserAvatar: otherUser?.avatar_url ?? null,
      otherUserEmail: otherUser?.email ?? null,
      lastMessageAt: room.updated_at,
    };
  });

  return reply.send(enrichedChatRooms);
}

export async function getChatRoomMessages(
  request: FastifyRequest<{ Params: { roomId: string } }>,
  reply: FastifyReply
) {
  const { roomId } = request.params;
  const numericRoomId = parseInt(roomId, 10);
  if (isNaN(numericRoomId)) return reply.status(400).send({ error: "Invalid Room ID" });

  const userEmail = request.user?.email;
  if (!userEmail) return reply.status(401).send({ error: "Invalid Token" });

  const user = db.prepare(`SELECT uuid FROM users WHERE email = ?`).get(userEmail) as { uuid: string } | undefined;
  if (!user) return reply.status(404).send({ error: "User not found" });

  const membership = db.prepare(`
    SELECT id FROM chat_rooms
    WHERE id = ?
      AND (user1_uuid = ? OR user2_uuid = ?)
  `).get(numericRoomId, user.uuid, user.uuid);

  if (!membership) return reply.status(403).send({ error: "Access denied" });

  const messages = db.prepare(`
    SELECT id, sender_uuid, content, created_at
    FROM messages
    WHERE room_id = ?
    ORDER BY created_at ASC
  `).all(numericRoomId) as {
    id: number;
    sender_uuid: string;
    content: string;
    created_at: string;
  }[];

  return reply.send(messages);
}

type SendMessageBody = {
  roomId: number;
  content: string;
};

export async function sendMessage(
  request: FastifyRequest<{ Body: SendMessageBody }>,
  reply: FastifyReply
) {
  const { roomId, content } = request.body;
  if (!content || content.trim() === "") return reply.status(400).send({ error: "Message content required" });

  const userEmail = request.user?.email;
  if (!userEmail) return reply.status(401).send({ error: "Invalid Token" });

  const sender = db.prepare(`SELECT uuid FROM users WHERE email = ?`).get(userEmail) as { uuid: string } | undefined;
  if (!sender) return reply.status(404).send({ error: "Sender not found" });

  const room = db.prepare(`
    SELECT user1_uuid, user2_uuid FROM chat_rooms WHERE id = ?
  `).get(roomId) as { user1_uuid: string; user2_uuid: string } | undefined;

  if (!room) return reply.status(404).send({ error: "Chat room not found" });

  const receiverUuid = room.user1_uuid === sender.uuid ? room.user2_uuid : room.user1_uuid;

  const block = db.prepare(`
    SELECT 1 FROM blocked_users
    WHERE (blocker_uuid = ? AND blocked_uuid = ?)
       OR (blocker_uuid = ? AND blocked_uuid = ?)
  `).get(sender.uuid, receiverUuid, receiverUuid, sender.uuid);

  if (block) {
    return reply.status(403).send({ error: "Message blocked due to user block relationship" });
  }

  db.prepare(`
    INSERT INTO messages (room_id, sender_uuid, content)
    VALUES (?, ?, ?)
  `).run(roomId, sender.uuid, content);

  db.prepare(`
    UPDATE chat_rooms
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(roomId);

  return reply.send({ success: true });
}
