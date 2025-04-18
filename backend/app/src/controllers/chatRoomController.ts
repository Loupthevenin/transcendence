import { FastifyRequest, FastifyReply } from "fastify";
import db from "../db/db";

type CreateChatroomBody = {
  receiverId: number; // ID de la personne à qui je veux parler
};

export async function createOrGetChatRoom(
  request: FastifyRequest<{ Body: CreateChatroomBody }>,
  reply: FastifyReply
) {

  // 1. Je récupère mon propre email à partir du token
  const senderEmail = request.user?.email;
  if (!senderEmail) {
    return reply.status(401).send({ error: "Invalid Token" });
  }

  // 2. Je récupère l'ID de l'utilisateur cible (le receiver)
  const { receiverId } = request.body;

  // 3. Je récupère mon propre user.id à partir de mon email
  const senderRow = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(senderEmail) as { id: number } | undefined;

  if (!senderRow) {
    return reply.status(404).send({ error: "Sender not found" });
  }

  const senderId = senderRow.id; // Plus lisible : j'ai ma propre variable `senderId`
  // 4. Maintenant, je dois chercher si une chatroom existe déjà entre moi et l'autre
  // Pour éviter d'avoir (1,2) et (2,1) comme deux salles différentes,
  // je trie les deux IDs dans l'ordre croissant (le plus petit en premier)

  const firstId = Math.min(senderId, receiverId);
  const secondId = Math.max(senderId, receiverId);

  // 5. Je regarde si une chatroom existe entre ces deux IDs
  const existingRoom = db
    .prepare(`
      SELECT id FROM chat_rooms
      WHERE user1_id = ? AND user2_id = ?
    `)
    .get(firstId, secondId) as { id: number } | undefined;

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
  // TROUVER l'autre utilisateur
  const otherUserId = senderId === firstId ? secondId : firstId;

  const otherUser = db
    .prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `)
    .get(otherUserId) as { name: string; avatar_url: string } | undefined;

  if (!otherUser) {
    return reply.status(404).send({ error: "Other user not found" });
  }

  return reply.send({
    roomId,
    otherUserName: otherUser.name,
    otherUserAvatar: otherUser.avatar_url,
  });
  // 8. Je renvoie la nouvelle room créée
  // return reply.send({ roomId: newRoomId });
}

export async function getUserChatRooms(
  request: FastifyRequest,
  reply: FastifyReply
) {
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

  // Liste toutes les rooms où je suis user1_id ou user2_id
  const rawChatRooms = db.prepare(`
    SELECT id, user1_id, user2_id, created_at
    FROM chat_rooms
    WHERE user1_id = ? OR user2_id = ?
    ORDER BY created_at DESC
  `).all(userId, userId) as {
    id: number;
    user1_id: number;
    user2_id: number;
    created_at: string;
  }[];

  // Pour chaque room, retrouver l'info de l'autre user
  const enrichedChatRooms = rawChatRooms.map(room => {
    const otherUserId = room.user1_id === userId ? room.user2_id : room.user1_id;

    const otherUser = db.prepare(`
      SELECT id, name, avatar_url
      FROM users
      WHERE id = ?
    `).get(otherUserId) as {
      id: number;
      name: string;
      avatar_url: string;
    } | undefined;

    return {
      roomId: room.id,
      otherUserId: otherUser?.id ?? null,
      otherUserName: otherUser?.name ?? "Unknown",
      otherUserAvatar: otherUser?.avatar_url ?? null,
      lastMessageAt: room.created_at, // pour trier plus tard
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

export async function sendMessage(
  request: FastifyRequest<{ Body: SendMessageBody }>,
  reply: FastifyReply
) {
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

  return reply.send({ success: true });
}

