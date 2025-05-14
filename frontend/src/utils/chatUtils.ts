let alreadySentReadyToPlay: boolean = false;

export function setReadyToPlaySent(val: boolean): void {
  alreadySentReadyToPlay = val;
}

export function hasSentReadyToPlay(): boolean {
  return alreadySentReadyToPlay;
}

export function getHiddenRoomIds(): number[] {
  const raw = localStorage.getItem("hiddenChatRooms");
  return raw ? JSON.parse(raw) : [];
}

export function addHiddenRoomId(roomId: number): void {
  const hidden = getHiddenRoomIds();
  if (!hidden.includes(roomId)) {
    hidden.push(roomId);
    localStorage.setItem("hiddenChatRooms", JSON.stringify(hidden));
  }
}

export function removeHiddenRoomId(roomId: number): void {
  const hidden = getHiddenRoomIds();
  const updated = hidden.filter((id) => id !== roomId);
  localStorage.setItem("hiddenChatRooms", JSON.stringify(updated));
}