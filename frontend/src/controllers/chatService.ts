import { showPublicProfile } from "../controllers/publicProfile";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../components/showNotificationToast";
// import { onBlockStatusChanged } from "../controllers/blockedUser";

const SELF_MSG_BOX: string =
  "self-end bg-[#6366f1] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";
const OTHER_MSG_BOX: string =
  "self-start bg-[#6d28d9] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";

export type ChatRoom = {
  roomId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
  otherUserEmail: string;
  otherUserUuid: string;
};

export type ChatMessage = {
  id: number;
  sender_uuid: string;
  content: string;
  created_at: string;
};

export async function createOrGetChatRoom(receiverUuid: string): Promise<{
  roomId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserEmail: string;
  otherUserUuid: string;
}> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    throw new Error("No token");
  }

  const res = await fetch("/api/chatroom", {
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

  const res = await fetch("/api/chatroom", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load chatrooms");
  }

  return await res.json();
}

export async function loadChatRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    throw new Error("No token");
  }

  const res = await fetch(`/api/chatroom/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return await res.json();
}

export function setupChatMenu(container: HTMLElement, userUuid: string) {
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

      const res = await fetch("/api/invite-to-game", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserUuid: userUuid }),
      });

      if (!res.ok) {
        const text = await res.text();
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
) {
  try {
    const messages = await loadChatRoomMessages(roomId);
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
