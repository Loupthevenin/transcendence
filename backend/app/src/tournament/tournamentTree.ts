import { Player } from "../types/player";

type MatchNode = {
  player: Player | null;
  left: MatchNode | null;
  right: MatchNode | null;
}

export class TournamentTree {
  public root: MatchNode | null = null;
  //private depth: number = 0;

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
    //this.depth = Math.ceil(Math.log2(players.length));
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

  public playMatch(node: MatchNode): void {
    if (node.player) throw new Error("This match has already been played.");
    if (!node.left || !node.right) throw new Error("Cannot play a match for a node without two children.");
    if (!node.left.player || !node.right.player) throw new Error("Cannot play a match for a node with children without player.");

    // Simulate a match between the two players

    // Get the winner
    const winner: "A" | "B" = Math.random() < 0.5 ? "A" : "B";

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