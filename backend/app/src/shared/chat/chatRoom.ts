type ChatRoom = {
  roomId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
  otherUserEmail: string;
  otherUserUuid: string;
};

export default ChatRoom;