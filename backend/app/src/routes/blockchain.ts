import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { PRIVATE_KEY, CONTRACT_KEY } from "../config";

import contractJson from "../../artifacts/contracts/TestContract.sol/TestContract.json";

const provider = new JsonRpcProvider(
  "https://api.avax-test.network/ext/bc/C/rpc",
);

const signer = new Wallet(PRIVATE_KEY, provider);

const abi = contractJson.abi;

const contract = new Contract(CONTRACT_KEY, abi, signer);

export default async function (
  app: FastifyInstance,
  opts: FastifyPluginOptions,
): Promise<void> {
  app.get("/message", async (request, reply) => {
    try {
      const currentMessage = await contract.message();
      reply.send({ message: currentMessage });
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Failed to fetch message" });
    }
  });

  app.put("/message", async (request, reply) => {
    try {
      const { newMessage } = request.body as { newMessage: string };

      const tx = await contract.setMessage(newMessage); // Envoyer transaction
      await tx.wait(); // Attendre confirmation

      reply.send({ status: "Message updated successfully" });
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Failed to update message" });
    }
  });
}
