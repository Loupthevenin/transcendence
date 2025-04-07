// let players: { id: string; position: BABYLON.Vector2 }[] = [];

// export function addPlayer(id: string): boolean {
//   if (players.length < 2) {
//     players.push({ id, position: new BABYLON.Vector2(0, 0) }); // Default paddle position
//     return true;
//   }
//   return false; // Lobby full
// }

// export function removePlayer(id: string): void {
//   players = players.filter((player) => player.id !== id);
// }

// export function updatePlayerPosition(id: string, position: BABYLON.Vector2): void {
//   const player = players.find((p) => p.id === id);
//   if (player) {
//     player.position = position;
//   }
// }
