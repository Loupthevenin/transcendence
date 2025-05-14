type ChatRoom = {
  roomId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
  otherUserEmail: string;
  otherUserUuid: string;
  otherIsOnline: boolean;
};

export default ChatRoom;