import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { requireToken } from "../hook/requireToken";
import { createOrGetChatRoom, getChatRoomMessages, getUserChatRooms , sendMessage} from "../controllers/chatRoomController";

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.register(chatRoomRoutes);
}

async function chatRoomRoutes(app: FastifyInstance) {
  app.addHook("onRequest", requireToken);
  app.post("/", createOrGetChatRoom);
  app.get("/", getUserChatRooms);
  app.get("/:roomId/messages", getChatRoomMessages);
  app.post("/message", sendMessage);

}
