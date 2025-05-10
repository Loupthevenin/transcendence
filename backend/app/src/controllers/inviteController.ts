import { FastifyRequest, FastifyReply } from "fastify";
import { getPlayerByUUID } from "../ws/setupWebSocket";
import db from "../db/db";
import { requireToken } from "../hook/requireToken";
import { InviteToGameMessage } from "../shared/chat/chatMessageTypes";

type InviteToGameBody = {
  targetUserUuid: string;
};

export async function invite( request: FastifyRequest<{ Body: InviteToGameBody }>, reply: FastifyReply) {
  await requireToken(request, reply);
  if (!request.user) return reply.status(401).send("Unauthorized");

  const { targetUserUuid } = request.body;

  const userRow = db.prepare("SELECT uuid FROM users WHERE uuid = ?").get(targetUserUuid) as { uuid: string } | undefined;
  if (!userRow) return reply.status(404).send("User not found");

  const receiver = getPlayerByUUID(userRow.uuid);
  if (!receiver) return reply.status(404).send("User not connected");

  if (receiver.socket?.readyState === WebSocket.OPEN) {
    receiver.socket.send(
      JSON.stringify({
        type: "chat",
        data: {
          type: "inviteToGame",
          from: request.user.name,
          userId: request.user.uuid,
          targetUserId: userRow.uuid,
        } as InviteToGameMessage,
      })
    );
  }
  return reply.send({ ok: true });
}

