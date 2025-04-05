// import { Vector2 } from '../utils/vector2';

// let players: { id: string; position: Vector2 }[] = [];

// function addPlayer(id: string): boolean {
//   if (players.length < 2) {
//     players.push({ id, position: Vector2.zero() }); // Default paddle position
//     return true;
//   }
//   return false; // Lobby full
// }

// function removePlayer(id: string): void {
//   players = players.filter((player) => player.id !== id);
// }

// function updatePlayerPosition(id: string, position: Vector2): void {
//   const player = players.find((p) => p.id === id);
//   if (player) {
//     player.position = position;
//   }
// }

// export { addPlayer, removePlayer, updatePlayerPosition };