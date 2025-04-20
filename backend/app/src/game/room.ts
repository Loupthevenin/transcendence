import {
  GAME_CONSTANT,
  GameData,
  newGameData,
} from "../shared/game/gameElements";
import { resetBall, updateBallPosition } from "../shared/game/ball";
import {
  GameDataMessage,
  GameStartedMessage,
  GameResultMessage,
  DisconnectionMessage,
} from "../shared/game/gameMessageTypes";
import { GameMessage, GameMessageData } from "../shared/messageType";
import { Player } from "./player";
import db from "../db/db";

export enum RoomType {
  Matchmaking,
  Tournament,
}

const rooms: Map<string, Room> = new Map();
let roomCounter: number = 1;

export function addPlayerToMatchmaking(player: Player): void {
  // Check for an available room of type Matchmaking
  for (const [, room] of rooms) {
    if (
      room.getType() === RoomType.Matchmaking &&
      !room.isFull() &&
      !room.isGameLaunched() &&
      !room.isGameEnded()
    ) {
      if (room.addPlayer(player)) {
        startGameIfRoomFull(room);
        return;
      }
    }
  }

  // If no available room, create a new room
  const newRoomId: string = `room-${roomCounter++}`;
  const newRoom: Room = new Room(newRoomId, RoomType.Matchmaking);
  newRoom.addPlayer(player);

  rooms.set(newRoomId, newRoom);
}

// Start the game if room is full
function startGameIfRoomFull(room: Room) {
  if (room.isFull()) {
    room
      .startGame()
      .then(() => {
        console.log(
          `Game started: ${room.getId()} with p1 '${room.getPlayer(1)?.username}' and p2 '${room.getPlayer(2)?.username}'`,
        );
      })
      .catch((error) => {
        console.error(`Error starting game in room '${room.getId()}':`, error);
        rooms.delete(room.getId());
      });
  }
}

export class Room {
  private id: string;
  private type: RoomType;
  private player1: Player | null;
  private player2: Player | null;
  private gameData: GameData;
  private gameLaunched: boolean;
  private gameEnded: boolean;

  public constructor(id: string, type: RoomType) {
    this.id = id;
    this.type = type;
    this.player1 = null; // Start with no players
    this.player2 = null;
    this.gameData = newGameData();
    this.gameLaunched = false;
    this.gameEnded = false;
  }

  /**
   * @returns 'id' of the room.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * @returns 'type' of the room.
   */
  public getType(): RoomType {
    return this.type;
  }

  /**
   * @param index The index of the player.
   * @returns player of index N of the room.
   */
  public getPlayer(index: 1 | 2): Player | null {
    if (index === 1) {
      return this.player1;
    } else if (index === 2) {
      return this.player2;
    }
    return null;
  }

  /**
   * @returns True if the game is launched, else False.
   */
  public isGameLaunched(): boolean {
    return this.gameLaunched;
  }

  /**
   * @returns True if the game is ended, else False.
   */
  public isGameEnded(): boolean {
    return this.gameEnded;
  }

  /**
   * @param index The index of the owner of the paddle.
   */
  public setPaddlePosition(index: 1 | 2, pos: BABYLON.Vector2): void {
    if (index === 1) {
      this.gameData.paddle1Position = pos;
    } else if (index === 2) {
      this.gameData.paddle2Position = pos;
    }
  }

  /**
   * Add a player to the room.
   * @param player The player to join the room.
   * @returns True if the player was added successfully, otherwise false.
   */
  public addPlayer(player: Player): boolean {
    if (this.gameLaunched || this.gameEnded) {
      return false; // Cannot add players after the game has started or ended
    }
    if (this.containsPlayer(player)) {
      return false; // Player already in the room
    }

    if (!this.player1) {
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
   * Remove a player from the room.
   * @param player The player to remove.
   */
  public removePlayer(player: Player): void {
    player.room = null; // Clear the player's room reference
    if (this.player1?.id === player.id) {
      this.player1 = null;
    } else if (this.player2?.id === player.id) {
      this.player2 = null;
    }
  }

  /**
   * Removes all players from the room.
   */
  private clear(): void {
    if (this.player1) {
      this.player1.room = null;
      this.player1 = null;
    } else if (this.player2) {
      this.player2.room = null;
      this.player2 = null;
    }
  }

  /**
   * Checks if the room is empty.
   * @returns True if both player1 and player2 are null, otherwise false.
   */
  public isEmpty(): boolean {
    return !this.player1 && !this.player2;
  }

  /**
   * Checks if the room is full.
   * @returns True if both player1 and player2 are present, otherwise false.
   */
  public isFull(): boolean {
    return !!this.player1 && !!this.player2;
  }

  /**
   * Checks if the room contains a specific player.
   * @param player The player to check.
   * @returns True if the room contains the player, otherwise false.
   */
  public containsPlayer(player: Player): boolean {
    return this.player1?.id === player.id || this.player2?.id === player.id;
  }

  /**
   * Get the index of the player.
   * @param player The player to check.
   * @returns the index of player (p1 = 1, p2 = 2) or -1 if player isn't in this room.
   */
  public indexOfPlayer(player: Player): -1 | 1 | 2 {
    if (this.player1?.id === player.id) {
      return 1;
    } else if (this.player2?.id === player.id) {
      return 2;
    }
    return -1;
  }

  /**
   * Start the game by initializing game data.
   * @returns A promise that resolves when the game successfully started.
   */
  public startGame(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.gameEnded) {
        reject("Game already ended");
      } else if (this.gameLaunched) {
        reject("Game already started");
      } else if (!this.isFull()) {
        reject("Room is not full");
      }

      this.gameLaunched = true;

      // Initialize game data
      this.gameData = newGameData();
      resetBall(this.gameData.ball);

      if (this.isPlayerAlive(this.player1)) {
        const gameStartedMessage: GameMessage = {
          type: "game",
          data: { type: "gameStarted", id: 1 } as GameStartedMessage,
        };
        this.player1?.socket.send(JSON.stringify(gameStartedMessage));
      }
      if (this.isPlayerAlive(this.player2)) {
        const gameStartedMessage: GameMessage = {
          type: "game",
          data: { type: "gameStarted", id: 2 } as GameStartedMessage,
        };
        this.player2?.socket.send(JSON.stringify(gameStartedMessage));
      }

      this.startMainLoop();
      resolve();
    });
  }

  /**
   * Start the game main loop.
   */
  private startMainLoop(): void {
    let previousTime: number = Date.now();
    let roomMainLoopInterval: NodeJS.Timeout;

    roomMainLoopInterval = setInterval(() => {
      // Stop the game if one player disconnects
      if (
        !this.isPlayerAlive(this.player1) ||
        !this.isPlayerAlive(this.player2)
      ) {
        clearInterval(roomMainLoopInterval);
        this.gameEnded = true;
        const disconnectionMessage: DisconnectionMessage = {
          type: "disconnection",
        };
        this.sendMessage(disconnectionMessage);
        this.clear();
        console.log(`[Room ${this.id}] : A player disconnected midgame`);
      }

      const currentTime: number = Date.now(); // Get the current time
      const deltaTime: number = (currentTime - previousTime) / 1000; // Time elapsed in seconds
      previousTime = currentTime; // Update the previous time

      // Use the computed deltaTime to update the ball position
      updateBallPosition(this.gameData, deltaTime);
      const gameDataMessage: GameDataMessage = {
        type: "gameData",
        data: this.gameData,
      };
      this.sendMessage(gameDataMessage);

      // Stop the game if one player reaches enought points
      if (
        this.gameData.p1Score >= GAME_CONSTANT.scoreToWin ||
        this.gameData.p2Score >= GAME_CONSTANT.scoreToWin
      ) {
        clearInterval(roomMainLoopInterval);
        this.endGame();
      }
    }, 16.67); // 60 TPS
  }

  /**
   * End the game
   */
  private endGame(): void {
    if (!this.gameLaunched) {
      throw new Error("Cannot end a game not launched");
    }
    this.gameEnded = true;
    this.saveGameSessionData();

    const gameResultMessage: GameResultMessage = {
      type: "gameResult",
      p1Score: this.gameData.p1Score,
      p2Score: this.gameData.p2Score,
      winner: this.gameData.p1Score >= GAME_CONSTANT.scoreToWin ? 1 : 2
    };
    this.sendMessage(gameResultMessage);

    this.clear();
  }

  /**
   * Save the game result and data in the database
   */
  private saveGameSessionData(): void {
    if (!this.gameEnded || !this.player1 || !this.player2) {
      throw new Error("Cannot save the data of a game not ended");
    }
    db.prepare(
      `INSERT INTO match_history (
      player_a_name, player_b_name, player_a_uuid, player_b_uuid, score_a, score_b, mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      this.player1.username,
      this.player2.username,
      this.player1.id,
      this.player2.id,
      this.gameData.p1Score,
      this.gameData.p2Score,
      RoomType[this.type],
    );
  }

  /**
   * Sends a message to both players.
   * @param message The message to send.
   */
  public sendMessage(data: GameMessageData, excludedPlayerId?: string[]): void {
    const message: GameMessage = {
      type: "game",
      data: data,
    };
    const msg: string = JSON.stringify(message);

    if (
      this.player1 &&
      this.isPlayerAlive(this.player1) &&
      !excludedPlayerId?.includes(this.player1.id)
    ) {
      this.player1?.socket.send(msg);
    }
    if (
      this.player2 &&
      this.isPlayerAlive(this.player2) &&
      !excludedPlayerId?.includes(this.player2.id)
    ) {
      this.player2?.socket.send(msg);
    }
  }

  /**
   * Checks if player is still alive (connected).
   * @returns True if player exist and is still connected, otherwise false.
   */
  public isPlayerAlive(player: Player | null | undefined): boolean {
    return player?.socket.readyState === WebSocket.OPEN;
  }
}
