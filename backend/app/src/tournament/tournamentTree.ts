import { GameResultMessage } from "../shared/game/gameMessageTypes";
import { GAME_CONSTANT } from "../shared/game/gameElements";
import { Room, RoomType, createNewRoom } from "../game/room";
import { Player } from "../types/player";

type MatchNode = {
  player: Player | null;
  left: MatchNode | null;
  right: MatchNode | null;
}

export class TournamentTree {
  public root: MatchNode | null = null;
  public scoreToWin: number = GAME_CONSTANT.defaultScoreToWin;

  constructor(scoreToWin?: number) {
    if (scoreToWin) {
      this.scoreToWin = scoreToWin;
    }
  }

  // Function to generate the tournament tree
  public generate(players: Player[]): void {
    if (this.root) throw new Error("Tournament tree has already been generated.");
    if (players.length < 4) throw new Error("Not enough players to generate a tournament tree.");
    if ((players.length & (players.length - 1)) !== 0) throw new Error("Number of players must be a power of 2.");

    // Separate real players and bot players
    const realPlayers: Player[] = players.filter(player => !player.isBot);
    const botPlayers: Player[] = players.filter(player => player.isBot);

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
    if (!this.root) throw new Error("Tournament tree has not been generated yet.");

    return new Promise<void>(async (resolve) => {
      let currentRoundNodes: MatchNode[] = this.getBottomMatches(); // Start with the first round

      while (currentRoundNodes.length > 0) {
        await this.playRound(currentRoundNodes); // Play all matches in the round
        currentRoundNodes = this.getNextRound(currentRoundNodes); // Move to the next round
        // this.printTree(); ////////////////////////////////////////
      }

      console.log(`Tournament finished! Winner: '${this.root?.player?.username}'`);
      resolve();
    });
  }

  // Play all matches in the current round asynchronously
  private async playRound(nodes: MatchNode[]): Promise<void> {
    await Promise.all(nodes.map((node: MatchNode) => this.playMatchAsync(node)));
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
    function findParentRecursively(current: MatchNode | null, child: MatchNode): MatchNode | null {
      if (!current || !current.left || !current.right) return null;
      if (current.left === child || current.right === child) return current;

      return findParentRecursively(current.left, child) || findParentRecursively(current.right, child);
    }

    return findParentRecursively(this.root, child);
  }

  // Wrapper to play a match asynchronously
  private playMatchAsync(node: MatchNode): Promise<void> {
    return new Promise((resolve) => {
      if (!node.left?.player || !node.right?.player) {
        throw new Error("Cannot play match for a node with missing players.");
      }

      if (node.left.player.isBot && node.right.player.isBot) {
        // Both players are bots, so randomly select a winner
        this.handleMatchEnded(node, Math.random() < 0.5 ? "A" : "B");
        return resolve(); // Resolve immediately
      }

      const room: Room = createNewRoom(RoomType.Tournament);
      room.addPlayer(node.left.player);
      room.addPlayer(node.right.player);

      room.setGameEndedCallback((gameResult: GameResultMessage) => {
        this.handleMatchEnded(node, gameResult.winner === node.right!.player!.username ? "B" : "A");
        resolve(); // Resolve once the match is over
      });
      room.setScoreToWin(this.scoreToWin);

      room.startGame().catch((error: any) => {
        console.error(`Error starting game in room '${room.getId()}':`, error);
        room.dispose();
        // If the game cannot be started, select the winner randomly to avoid blocking the tournament
        this.handleMatchEnded(node, Math.random() < 0.5 ? "A" : "B");
        resolve(); // Resolve even if there's an error
      });
    });
  }

  private handleMatchEnded(node: MatchNode, winner: "A" | "B") {
    if (node.player) throw new Error("This match has already been played.");
    if (!node.left || !node.right) throw new Error("Cannot play a match for a node without two children.");
    if (!node.left.player || !node.right.player) throw new Error("Cannot play a match for a node with children without player.");

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
    console.log(" ".repeat(depth * 6) + (node.player ? node.player.username : "-----"));
    this.printNode(node.right, depth + 1);
  }
}