import db from "../db/db";
import { v4 as uuidv4 } from "uuid";
import {
  GAME_CONSTANT,
  GameData,
  newGameData,
  GameStats,
  newGameStats,
} from "../shared/game/gameElements";
import { resetBall, updateBallPosition } from "../shared/game/ball";
import {
  SkinChangeMessage,
  GameDataMessage,
  GameStartedMessage,
  GameResultMessage,
  DisconnectionMessage,
} from "../shared/game/gameMessageTypes";
import { GameMessage, GameMessageData } from "../shared/messageType";
import { Player } from "./player";
import { ReplayData, newReplayData } from "../shared/game/replayData";
import { snapshotReplayData, saveReplayDataToFile } from "../controllers/replayController";

export enum RoomType {
  Matchmaking,
  Tournament,
}

const rooms: Map<string, Room> = new Map();
let roomCounter: number = 1;

export function addPlayerToMatchmaking(player: Player): void {
  // Check for an available room of type Matchmaking
  for (const [, room] of rooms) {
    if (room.getType() === RoomType.Matchmaking && room.isJoinable()) {
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
function startGameIfRoomFull(room: Room): void {
  if (room.isFull()) {
    room.startGame()
      .then(() => {
        console.log(
          `Game started: ${room.getId()} with p1 '${room.getPlayer(1)?.username}' and p2 '${room.getPlayer(2)?.username}'`,
        );
      })
      .catch((error: any) => {
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
  private gameStats: GameStats;
  private replayData: ReplayData;
  private gameLaunched: boolean;
  private gameEnded: boolean;

  public constructor(id: string, type: RoomType) {
    this.id = id;
    this.type = type;
    this.player1 = null; // Start with no players
    this.player2 = null;
    this.gameData = newGameData();
    this.gameStats = newGameStats();
    this.replayData = newReplayData();
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
   * @returns True if the game is joinable, else False.
   */
  public isJoinable(): boolean {
    return !this.isFull() && !this.isGameLaunched() && !this.isGameEnded();
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
    if (!this.isJoinable()) {
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
    if (!this.containsPlayer(player)) {
      return; // Do nothing if the player is not in the room
    }
    player.room = null; // Clear the player's room reference
    if (this.player1?.uuid === player.uuid) {
      this.player1 = null;
    } else if (this.player2?.uuid === player.uuid) {
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
    return this.player1?.uuid === player.uuid || this.player2?.uuid === player.uuid;
  }

  /**
   * Get the index of the player.
   * @param player The player to check.
   * @returns the index of player (p1 = 1, p2 = 2) or -1 if player isn't in this room.
   */
  public indexOfPlayer(player: Player): -1 | 1 | 2 {
    if (this.player1?.uuid === player.uuid) {
      return 1;
    } else if (this.player2?.uuid === player.uuid) {
      return 2;
    }
    return -1;
  }

  /**
   * Checks if player is still alive (connected).
   * @returns True if player exist and is still connected, otherwise false.
   */
  public isPlayerAlive(player: Player | null | undefined): boolean {
    return player?.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Notify the room about a player skin update.
   */
  public notifySkinUpdate(player: Player): void {
    const playerId: -1 | 1 | 2 = this.indexOfPlayer(player);
    if (playerId === -1) {
      return;
    }

    if (playerId === 1) {
      this.replayData.p1Skin = player.paddleSkinId;
    } else if (playerId === 2) {
      this.replayData.p2Skin = player.paddleSkinId;
    }

    const skinChangeMessage: SkinChangeMessage = {
      type: "skinId",
      id: playerId,
      skinId: player.paddleSkinId,
    };
    this.sendMessage(skinChangeMessage, [player.uuid]);
  }

  /**
   * Notify the room about the player reconnection.
   */
  public notifyReconnection(player: Player): void {
    // TODO: send all message the player didn't receive cause of its disconnection
  }

  /**
   * Sends a message to both players.
   * @param message The message to send.
   */
  public sendMessage(data: GameMessageData, excludedPlayerUUID?: string[]): void {
    const message: GameMessage = {
      type: "game",
      data: data,
    };
    const msg: string = JSON.stringify(message);

    if (
      this.player1 &&
      this.isPlayerAlive(this.player1) &&
      !excludedPlayerUUID?.includes(this.player1.uuid)
    ) {
      this.player1!.socket!.send(msg);
    }

    if (
      this.player2 &&
      this.isPlayerAlive(this.player2) &&
      !excludedPlayerUUID?.includes(this.player2.uuid)
    ) {
      this.player2!.socket!.send(msg);
    }
  }

  /**
   * Start the game by initializing game data.
   * @returns A promise that resolves when the game successfully started.
   */
  public startGame(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.gameEnded) return reject("Game already ended");
      if (this.gameLaunched) return reject("Game already started");
      if (!this.isFull()) return reject("Room is not full");
      if (!this.isPlayerAlive(this.player1)) return reject("Somehow the player 1 disconnected");
      if (!this.isPlayerAlive(this.player2)) return reject("Somehow the player 2 disconnected");

      this.gameLaunched = true;

      // Initialize game
      this.gameData = newGameData();
      resetBall(this.gameData.ball);
      this.gameStats = newGameStats();
      this.gameStats.gameStartTime = Date.now(); // game start time in milliseconds

      // Initialize replay data
      this.replayData.p1Skin = this.player1!.paddleSkinId;
      this.replayData.p2Skin = this.player2!.paddleSkinId;
      snapshotReplayData(this.replayData, 0, this.gameData);

      const gameStartedMessage1: GameMessage = {
        type: "game",
        data: { type: "gameStarted", id: 1 } as GameStartedMessage,
      };
      this.player1?.socket?.send(JSON.stringify(gameStartedMessage1));

      const gameStartedMessage2: GameMessage = {
        type: "game",
        data: { type: "gameStarted", id: 2 } as GameStartedMessage,
      };
      this.player2?.socket?.send(JSON.stringify(gameStartedMessage2));

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
        this.endGame(true);
        return;
      }

      const currentTime: number = Date.now(); // Get the current time
      const deltaTime: number = (currentTime - previousTime) / 1000; // Time elapsed in seconds
      previousTime = currentTime; // Update the previous time

      // Use the computed deltaTime to update the ball position
      updateBallPosition(this.gameData, this.gameStats, deltaTime);
      const gameDataMessage: GameDataMessage = {
        type: "gameData",
        data: this.gameData,
      };
      this.sendMessage(gameDataMessage);

      // Snapshot the current game data
      const elapsedTimeSinceStart: number = currentTime - this.gameStats.gameStartTime;
      snapshotReplayData(this.replayData, elapsedTimeSinceStart, this.gameData);

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
  private endGame(disconnectionOccurred: boolean = false): void {
    if (!this.gameLaunched) {
      throw new Error("Cannot end a game not launched");
    }
    this.gameEnded = true;
    this.gameStats.gameEndTime = Date.now(); // game end time in milliseconds

    let winner: string = "";

    if (disconnectionOccurred) {
      const disconnectedPlayer: 1 | 2 = this.isPlayerAlive(this.player1) ? 2 : 1;
      console.log(`[Room ${this.id}] : The player ${disconnectedPlayer} (${this.getPlayer(disconnectedPlayer)?.username ?? ""}) disconnected midgame`);
      const disconnectionMessage: DisconnectionMessage = {
        type: "disconnection",
        id: disconnectedPlayer
      };
      this.sendMessage(disconnectionMessage);
      winner = this.getPlayer(disconnectedPlayer === 1 ? 2 : 1)?.username ?? "";
    } else {
      const winnerId: 1 | 2 = (this.gameData.p1Score > this.gameData.p2Score ? 1 : 2);
      winner = this.getPlayer(winnerId)?.username ?? "";
    }

    const gameResultMessage: GameResultMessage = {
      type: "gameResult",
      p1Score: this.gameData.p1Score,
      p2Score: this.gameData.p2Score,
      winner: winner,
      gameStats: this.gameStats
    };
    this.sendMessage(gameResultMessage);

    this.saveGameSessionData();

    this.clear();
  }

  /**
   * Save the game result and data in the database
   */
  private saveGameSessionData(): void {
    if (!this.gameEnded) throw new Error("Cannot save the data of a game not ended");
    if (!this.player1) console.warn("[WARNING] missing player 1, this should not happen !");
    if (!this.player2) console.warn("[WARNING] missing player 2, this should not happen !");

    const uuid: string = uuidv4();
    // Save the match replay
    this.replayData.gameDuration = this.gameStats.gameEndTime - this.gameStats.gameStartTime;
    saveReplayDataToFile(this.replayData, uuid);

    // Save the match result in the database
    db.prepare(
      `INSERT INTO match_history (
      uuid, player_a_name, player_b_name, player_a_uuid, player_b_uuid, score_a, score_b, mode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      uuid,
      this.player1?.username ?? "", // put empty string by default if the player is null
      this.player2?.username ?? "",
      this.player1?.uuid ?? "", // same for uuid
      this.player2?.uuid ?? "",
      this.gameData.p1Score,
      this.gameData.p2Score,
      RoomType[this.type],
    );
  }
}
