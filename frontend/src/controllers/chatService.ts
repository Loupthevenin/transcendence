
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
  const res = await fetch("/api/chatroom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
    body: JSON.stringify({ receiverId }),
  });

  if (!res.ok) {
    throw new Error("Failed to create or get chatroom");
  }

  return res.json();
}

export async function loadChatList(): Promise<ChatRoom[]> {
  const res = await fetch("/api/chatroom", {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load chatrooms");
  }

  return await res.json();
}

export async function loadChatRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chatroom/${roomId}/messages`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch messages");
  }

  return await res.json();
}
