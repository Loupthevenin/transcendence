import { showErrorToast } from "../components/showNotificationToast";

export type ChatRoom = {
  roomId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
  otherUserEmail: string;
  otherUserUuid: string;
};

export type ChatMessage = {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
};

export async function createOrGetChatRoom(receiverId: number): Promise<{
  roomId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  otherUserEmail: string;
  otherUserId: number;
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
    body: JSON.stringify({ receiverId }),
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
