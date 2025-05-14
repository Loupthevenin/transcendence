import { showPublicProfile } from "../controllers/publicProfile";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../components/showNotificationToast";
import ChatRoom from "@shared/chat/chatRoom";
import ChatMessage from "@shared/chat/chatMessage";
import { getHiddenRoomIds } from "../utils/chatUtils";

const SELF_MSG_BOX: string =
  "self-end bg-[#6366f1] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";
const OTHER_MSG_BOX: string =
  "self-start bg-[#6d28d9] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";

export async function createOrGetChatRoom(receiverUuid: string): Promise<ChatRoom> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    throw new Error("No token");
  }

  const res: Response = await fetch("/api/chatroom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receiverUuid }),
  });

  if (!res.ok) {
    throw new Error("Failed to create or get chatroom");
  }

  return await res.json();
}

export async function loadChatList(): Promise<ChatRoom[]> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    throw new Error("No token");
  }

  const res: Response = await fetch("/api/chatroom", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load chatrooms");
  }

  const chatRooms = await res.json();
  const hiddenRoomIds = getHiddenRoomIds();
  return chatRooms.filter((room: ChatRoom) => !hiddenRoomIds.includes(room.roomId));
}

export async function loadChatRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    throw new Error("No token");
  }

  const res: Response = await fetch(`/api/chatroom/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return await res.json();
}

export function setupChatMenu(container: HTMLElement, userUuid: string): void {
  container.querySelector("#chat-avatar")?.addEventListener("click", () => {
    if (userUuid != null) showPublicProfile(userUuid);
  });

  const dropdown = container.querySelector("#chat-menu-dropdown") as HTMLElement;
  container.querySelector("#chat-menu-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });
  document.addEventListener("click", () => dropdown.classList.add("hidden"));

  container.querySelector("#view-profile-btn")?.addEventListener("click", () => {
    if (userUuid !== null) showPublicProfile(userUuid);
  });

  const inviteBtn = container.querySelector("#invite-to-game-btn") as HTMLButtonElement;
  inviteBtn.addEventListener("click", async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No token");

      const res: Response = await fetch("/api/invite-to-game", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserUuid: userUuid }),
      });

      if (!res.ok) {
        const text: string = await res.text();
        if (res.status === 404 && text.includes("not connected")) {
          showInfoToast("L'utilisateur n'est pas en ligne.");
        } else throw new Error("Erreur d'invitation");
      } else {
        showSuccessToast("Invitation envoyée 🎮");
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Erreur lors de l'envoi de l'invitation");
    }
  });
}

export async function loadAndDisplayMessages(
  roomId: number,
  list: HTMLUListElement,
  otherUserUuid: string
): Promise<void> {
  try {
    const messages: ChatMessage[] = await loadChatRoomMessages(roomId);
    for (const msg of messages) {
      const li = document.createElement("li");
      li.textContent = msg.content;
      li.className = msg.sender_uuid === otherUserUuid ? OTHER_MSG_BOX : SELF_MSG_BOX;
      list.appendChild(li);
    }
    list.scrollTop = list.scrollHeight;
  } catch (err) {
    console.error("Erreur chargement messages", err);
  }
}
