import { getUserInfoFromToken } from "../utils/getUserInfoFromToken";
import { sendMessage, subscribeToMessage } from "../websocketManager";
import { ChatMessageData } from "@shared/messageType";
import { NewMsgSendMessage } from "@shared/chat/chatMessageTypes";

export function setupChat(container: HTMLElement) {
  let currentReceiver: string | null = null;

  const form = container.querySelector("#chat-form") as HTMLFormElement;
  const input = container.querySelector("#chat-input") as HTMLInputElement;
  const list = container.querySelector("#chat-messages") as HTMLUListElement;
  const friendsList = container.querySelector("ul#friends-list") as HTMLUListElement;
  
  if (!form || !input || !list || !friendsList) {
    console.warn("Chat elements not found");
    return;
  }

  const userInfo = getUserInfoFromToken();
  if (!userInfo) {
    console.log("dedans");
    friendsList.innerHTML = `<li class="text-white text-sm italic">Your friends – connect to start chatting.</li>`;
    list.innerHTML = `<li class="text-white text-sm italic">Your messages – connect to start chatting.</li>`;
    form.style.display = "none";
    return;
  }

  const { name: pseudo, email } = userInfo;

  form.style.display = "flex";

  const users = ["Alice", "Bob", "Charlie"];
  users.forEach(username => {
    if (username === pseudo) return;

    const li = document.createElement("li");
    li.className = "flex items-center gap-4 hover:bg-[#2a255c] p-2 rounded-lg transition cursor-pointer";
    li.setAttribute("data-username", username);
    li.innerHTML = `
      <img src="https://placekitten.com/40/40" class="rounded-full w-10 h-10" />
      <div>
        <p class="font-semibold">${username}</p>
        <p class="text-sm text-gray-400">En ligne</p>
      </div>`;
    friendsList.appendChild(li);
  });

  // Écoute tous les clics sur les amis
  container.querySelectorAll("li[data-username]").forEach((li) => {
    li.addEventListener("click", () => {
      currentReceiver = li.getAttribute("data-username");
      console.log("Destinataire sélectionné :", currentReceiver);

      container.querySelectorAll("li[data-username]").forEach((el) =>
        el.classList.remove("bg-indigo-700")
      );
      li.classList.add("bg-indigo-700");
    });
  });

  // Enregistre l'utilisateur dès la connexion
  sendMessage("chat", {
    type: "registerUsername",
    email,
    name: pseudo,
  });

  // Envoi d'un message
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg || !currentReceiver) return;

    const outgoing: NewMsgSendMessage = {
      type: "newMessageSend",
      msg,
      senderEmail: email,
      senderName: pseudo,
      receiverEmail: currentReceiver,
    };

    sendMessage("chat", outgoing);
    input.value = "";
  });

  // Réception
  subscribeToMessage("chat", (data: ChatMessageData) => {
    if (data.type === "newMessageReceived") {
      const li = document.createElement("li");
      li.textContent = `${data.sender}: ${data.msg}`;
      list.appendChild(li);
    }
  });
}
