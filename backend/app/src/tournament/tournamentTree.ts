import { GameResultMessage } from "../shared/game/gameMessageTypes";
import { Room, RoomType, createNewRoom } from "../match/room";
import { Player } from "../types/player";
import {
  isLaunchMatchMessage,
  LaunchMatchMessage,
} from "../shared/tournament/tournamentMessageTypes";
import { isTournamentMessage, TournamentMessage } from "../shared/messageType";
import { Tournament } from "../types/tournament";
import { saveMatchData } from "../db/db";
import { v4 as uuidv4 } from "uuid";
import { JsonRpcProvider, Wallet, Contract } from "ethers";
import { PRIVATE_KEY, CONTRACT_KEY } from "../config";
import contractJson from "../../artifacts/contracts/ScoreStorage.sol/ScoreStorage.json";

export type MatchNode = {
  player: Player | null;
  left: MatchNode | null;
  right: MatchNode | null;
};

export class TournamentTree {
  private tournament: Tournament;
  public root: MatchNode | null = null;

  constructor(tournament: Tournament) {
    this.tournament = tournament;
  }

  // Function to generate the tournament tree
  public generate(players: Player[]): void {
    if (this.root)
      throw new Error("Tournament tree has already been generated.");
    if (players.length < 4)
      throw new Error("Not enough players to generate a tournament tree.");
    if ((players.length & (players.length - 1)) !== 0)
      throw new Error("Number of players must be a power of 2.");

    // Separate real players and bot players
    const realPlayers: Player[] = players.filter((player) => !player.isBot);
    const botPlayers: Player[] = players.filter((player) => player.isBot);

    // Shuffle only the non-bot players
    realPlayers.sort(() => Math.random() - 0.5);

    // Combine the shuffled non-bot players with the bot players at the end
    const shuffledPlayers: Player[] = [...realPlayers, ...botPlayers];

    // Build the tree
    this.root = this.buildTree(shuffledPlayers);
  }

  // Recursive function to build the tree
  private buildTree(players: Player[]): MatchNode {
    if (players.length === 1) {
      return { player: players[0], left: null, right: null };
    }

    const mid: number = Math.floor(players.length / 2);
    const leftTree: MatchNode = this.buildTree(players.slice(0, mid));
    const rightTree: MatchNode = this.buildTree(players.slice(mid));

    return { player: null, left: leftTree, right: rightTree };
  }

  public playTournament(): Promise<void> {
    if (!this.root)
      throw new Error("Tournament tree has not been generated yet.");

    return new Promise<void>(async (resolve) => {
      let currentRoundNodes: MatchNode[] = this.getBottomMatches(); // Start with the first round

      while (currentRoundNodes.length > 0) {
        // 10s of pause before the next round
        await new Promise((res) => setTimeout(res, 10_000));

        await this.playRound(currentRoundNodes); // Play all matches in the round
        currentRoundNodes = this.getNextRound(currentRoundNodes); // Move to the next round
        // this.printTree(); ////////////////////////////////////////
      }

      console.log(
        `[Tournament ${this.tournament.name}] Tournament finished! Winner: '${this.root?.player?.username}'`,
      );
      this.tournament.isEnded = true;
      resolve();
    });
  }

  // Play all matches in the current round asynchronously
  private async playRound(nodes: MatchNode[]): Promise<void> {
    await Promise.all(
      nodes.map((node: MatchNode) => this.playMatchAsync(node)),
    );
  }

  // Collect all the matches from the bottom of the tree (first round)
  private getBottomMatches(): MatchNode[] {
    if (!this.root) return [];
    let queue: MatchNode[] = [this.root];
    let firstRoundMatches: MatchNode[] = [];

    while (queue.length > 0) {
      const node: MatchNode = queue.shift()!;

      if (node.left && node.right) {
        // If both children are leaf nodes (have players assigned), this node is a first-round match
        if (node.left.player && node.right.player) {
          firstRoundMatches.push(node);
        } else {
          queue.push(node.left, node.right);
        }
      }
    }

    return firstRoundMatches;
  }

  // Get the next round matches
  private getNextRound(previousRound: MatchNode[]): MatchNode[] {
    let nextRound: MatchNode[] = [];

    for (const match of previousRound) {
      const parent: MatchNode | null = this.findParent(match);
      if (parent && !nextRound.includes(parent)) {
        nextRound.push(parent);
      }
    }

    return nextRound;
  }

  // Find parent node of a match (needed for advancing rounds)
  private findParent(child: MatchNode): MatchNode | null {
    function findParentRecursively(
      current: MatchNode | null,
      child: MatchNode,
    ): MatchNode | null {
      if (!current || !current.left || !current.right) return null;
      if (current.left === child || current.right === child) return current;

      return (
        findParentRecursively(current.left, child) ||
        findParentRecursively(current.right, child)
      );
    }

    return findParentRecursively(this.root, child);
  }

  // Wrapper to play a match asynchronously
  private playMatchAsync(node: MatchNode): Promise<void> {
    return new Promise((resolve) => {
      if (!node.left?.player || !node.right?.player) {
        throw new Error("Cannot play match for a node with missing players.");
      }

      const player1: Player = node.left.player;
      const player2: Player = node.right.player;

      if (player1.isBot && player2.isBot) {
        // Both players are bots, so randomly select a winner
        this.handleMatchEnded(node, Math.random() < 0.5 ? "A" : "B");
        return resolve(); // Resolve immediately
      }

      const room: Room = createNewRoom(RoomType.Tournament);
      const errorOccured: (error: any, winPriority?: 1 | 2) => void = (
        error: any,
        winPriority?: 1 | 2,
      ) => {
        // If the game cannot be started
        console.error(
          `[Tournament ${this.tournament.name}] Error starting game in room '${room.getId()}':`,
          error,
        );
        room.dispose();

        let winner: "A" | "B";
        if (winPriority) {
          // If there is a winner priority then take it
          winner = winPriority === 1 ? "A" : "B";
        } else {
          // Else select the winner randomly to avoid blocking the tournament
          winner = Math.random() < 0.5 ? "A" : "B";
        }

        saveMatchData(
          uuidv4(),
          player1.uuid,
          player2.uuid,
          0,
          0,
          winner,
          RoomType.Tournament,
        );

        const p1Name: string = this.tournament.pseudoNames.get(player1.uuid)!;
        const p2Name: string = this.tournament.pseudoNames.get(player2.uuid)!;
        this.saveToBlockchain(
          p1Name,
          p2Name,
          0,
          0,
          winner === "A" ? p1Name : p2Name,
        );

        this.handleMatchEnded(node, winner);
        resolve(); // Resolve even if there's an error
      };

      if (!room.addPlayer(player1)) {
        errorOccured(
          `Player 1 (${player1.username}) cannot be added to the room`,
          2,
        );
        return;
      }
      if (!room.addPlayer(player2)) {
        errorOccured(
          `Player 2 (${player2.username}) cannot be added to the room`,
          1,
        );
        return;
      }

      room.setScoreToWin(this.tournament.settings.scoreToWin);
      room.setGameEndedCallback((gameResult: GameResultMessage) => {
        this.saveToBlockchain(
          this.tournament.pseudoNames.get(player1.uuid)!,
          this.tournament.pseudoNames.get(player2.uuid)!,
          gameResult.p1Score,
          gameResult.p2Score,
          this.tournament.pseudoNames.get(gameResult.winnerUUID)!,
        );

        this.handleMatchEnded(
          node,
          gameResult.winner === node.right!.player!.username ? "B" : "A",
        );
        resolve(); // Resolve once the match is over
      });

      const launchMatchMessage: string = JSON.stringify({
        type: "tournament",
        data: { type: "launchMatch" } as LaunchMatchMessage,
      } as TournamentMessage);

      type MatchStartError = {
        msg: string;
        playerId: 1 | 2;
      };

      const waitForResponse: (
        player: Player,
        playerId: 1 | 2,
      ) => Promise<void> = (player: Player, playerId: 1 | 2): Promise<void> => {
        return new Promise((res, rej) => {
          // If its a bot resolve immediatly
          if (player.isBot) {
            res();
          }

          const responseListener: (message: any) => void = (message: any) => {
            const data: any = JSON.parse(message);
            if (isTournamentMessage(data) && isLaunchMatchMessage(data.data)) {
              clearTimeout(timeoutHandler); // Clear the timeout if response is received
              player.socket?.removeListener("message", responseListener);
              res();
            }
          };

          // Set a timeout to reject the promise if no response arrives
          const timeoutHandler: NodeJS.Timeout = setTimeout(() => {
            player.socket?.removeListener("message", responseListener);
            rej({
              msg: `Timeout waiting for response from '${player.username}'`,
              playerId,
            } as MatchStartError);
          }, 10_000); // 10s

          player.socket?.on("message", responseListener);
          player.socket?.send(launchMatchMessage);
        });
      };

      Promise.all([waitForResponse(player1, 1), waitForResponse(player2, 2)])
        .then(() => room.startGame())
        .catch((error: any) => {
          // Check if the error is typeof MatchStartError
          if (
            error &&
            typeof error.msg === "string" &&
            (error.playerId === 1 || error.playerId === 2)
          ) {
            errorOccured(
              (error as MatchStartError).msg,
              (error as MatchStartError).playerId === 1 ? 2 : 1,
            );
          } else {
            errorOccured(error);
          }
        });
    });
  }

  /**
   * Save the game result in blockchain
   */
  private async saveToBlockchain(
    p1username: string,
    p2username: string,
    p1Score: number,
    p2Score: number,
    winner: string, // Winner's username
  ): Promise<void> {
    const provider: JsonRpcProvider = new JsonRpcProvider(
      "https://api.avax-test.network/ext/bc/C/rpc",
    );
    const signer: Wallet = new Wallet(PRIVATE_KEY, provider);
    const abi = contractJson.abi;
    const contract: Contract = new Contract(CONTRACT_KEY, abi, signer);

    try {
      const nonce = await provider.getTransactionCount(
        signer.address,
        "pending",
      );
      const tx = await contract.storeMatch(
        p1username,
        p2username,
        p1Score,
        p2Score,
        winner,
        Math.floor(Date.now() / 1000),
        { nonce },
      );
      await tx.wait();
      console.log("Match stored on blockchain", tx.hash);
    } catch (error: any) {
      console.error("Failed to store match on blockchain: ", error);
    }
  }

  private handleMatchEnded(node: MatchNode, winner: "A" | "B"): void {
    if (node.player) throw new Error("This match has already been played.");
    if (!node.left || !node.right)
      throw new Error("Cannot play a match for a node without two children.");
    if (!node.left.player || !node.right.player)
      throw new Error(
        "Cannot play a match for a node with children without player.",
      );

    // Advance the winner to the current node
    node.player = (winner === "A" ? node.left : node.right).player;
  }

  // DEBUG : Function to print the tree
  public printTree(): void {
    if (!this.root) {
      console.log("The tournament tree has not been generated yet.");
      return;
    }

    console.log("");
    this.printNode(this.root, 0);
    console.log("");
  }

  private printNode(node: MatchNode | null, depth: number): void {
    if (!node) return;

    this.printNode(node.left, depth + 1);
    console.log(
      " ".repeat(depth * 6) + (node.player ? node.player.username : "-----"),
    );
    this.printNode(node.right, depth + 1);
  }
}

