import { GAME_CONSTANT, GameData, newGameData, Player } from "./gameElements";
import { resetBall, updateBallPosition } from "./ball";

export class Room {
  id: string;
  player1: Player | null;
  player2: Player | null;
  gameData: GameData;
  gameLaunched: boolean;

  constructor(id: string) {
    this.id = id;
    this.player1 = null; // Start with no players
    this.player2 = null;
    this.gameData = newGameData();
    this.gameLaunched = false;
  }

  /**
   * Adds a player to the room.
   * @param player The player to join the room.
   * @returns True if the player was added successfully, otherwise false.
   */
  addPlayer(player: Player) : boolean {
    if (this.gameLaunched) {
      return false; // Cannot add players after the game has started
    }
    if (this.containsPlayer(player)) {
      return false; // Player already in the room
    }

    if (!this.player1){
      this.player1 = player;
      player.room = this;
      return true;
    } else if (!this.player2) {
      this.player2 = player;
      player.room = this;
      return true;
    }

    return false;
  }

  /**
   * Removes a player from the room.
   * @param player The player to remove.
   */
  removePlayer(player: Player) : void {
    player.room = null; // Clear the player's room reference
    if (this.player1?.id === player.id) {
      this.player1 = null;
    } else if (this.player2?.id === player.id) {
      this.player2 = null;
    }
  }

  /**
   * Checks if the room is empty.
   * @returns True if both player1 and player2 are null, otherwise false.
   */
  isEmpty() : boolean {
    return !this.player1 && !this.player2;
  }

  /**
   * Checks if the room is full.
   * @returns True if both player1 and player2 are present, otherwise false.
   */
  isFull() : boolean {
      return !!this.player1 && !!this.player2;
  }

  /**
   * Checks if the room contains a specific player.
   * @param player The player to check.
   * @returns True if the room contains the player, otherwise false.
   */
  containsPlayer(player: Player) : boolean {
    return this.player1?.id === player.id || this.player2?.id === player.id;
  }

  /**
   * Starts the game by initializing game data and running mainLoop.
   * @returns A promise that resolves when the game ends.
   */
  startGame() : Promise<void> {
    if (this.gameLaunched) {
      throw new Error("Game already started");
    }
    if (!this.isFull()) {
      throw new Error("Room is not full");
    }

    console.log(`Game started: ${this.id} with p1 '${this.player1?.username}' and p2 '${this.player2?.username}'`);
    this.gameLaunched = true;

    // Initialize game data
    this.gameData = newGameData();
    resetBall(this.gameData.ball);

    if (this.isPlayerAlive(this.player1)) {
      this.player1?.socket.send(JSON.stringify({ type: "gameStarted", id: 1 }));
    }
    if (this.isPlayerAlive(this.player2)) {
      this.player2?.socket.send(JSON.stringify({ type: "gameStarted", id: 2 }));
    }

    let previousTime: number = Date.now();
    let roomMainLoopInterval: NodeJS.Timeout;

    return new Promise((resolve, reject) => {
      roomMainLoopInterval = setInterval(() => {
        // Stop the game if one player disconnects
        if (!this.isPlayerAlive(this.player1) || !this.isPlayerAlive(this.player2)) {
          this.sendMessage(JSON.stringify({ type: "disconnected" }));
          clearInterval(roomMainLoopInterval);
          reject("A player disconnected");
        }

        const currentTime: number = Date.now(); // Get the current time
        const deltaTime: number = (currentTime - previousTime) / 1000; // Time elapsed in seconds
        previousTime = currentTime; // Update the previous time

        // Use the computed deltaTime to update the ball position
        updateBallPosition(this.gameData, deltaTime);
        this.sendMessage(JSON.stringify({ type: "gameData", data: this.gameData }));

        // Stop the game if one player reaches enought points
        if (this.gameData.p1Score >= GAME_CONSTANT.scoreToWin
          || this.gameData.p2Score >= GAME_CONSTANT.scoreToWin) {
          this.sendMessage(JSON.stringify({ type: "gameResult", winner: this.gameData.p1Score >= GAME_CONSTANT.scoreToWin ? 1 : 2 }));
          clearInterval(roomMainLoopInterval);
          resolve();
        }
      }, 16.67); // 60 TPS
    });
  }

  /**
   * Sends a message to both players.
   * @param message The message to send.
   */
  sendMessage(message: string) : void {
    if (this.isPlayerAlive(this.player1)) {
      this.player1?.socket.send(message);
    }
    if (this.isPlayerAlive(this.player2)) {
      this.player2?.socket.send(message);
    }
  }

  /**
   * Checks if player is still alive (connected).
   * @returns True if player exist and is still connected, otherwise false.
   */
  isPlayerAlive(player: Player | null | undefined) : boolean {
    return player?.socket.readyState === WebSocket.OPEN;
  }
}