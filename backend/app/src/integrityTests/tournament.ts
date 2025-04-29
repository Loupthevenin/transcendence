import { AssertionError } from "assert";
import { Player } from "../types/player";
import { Tournament, TournamentSettings } from "../types/tournament";
import { createNewTournament, addPlayerToTournament, removePlayerFromTournament, closeTournament } from "../tournament/tournamentManager";

const assert = (condition: boolean, message: string): void => {
  if (!condition) throw new AssertionError({ message });
};

const assertTry = (code: () => void, message: string, showError: boolean = false): void => {
  try {
    code();
  }
  catch (error: any) {
    if (showError) {
      console.log("Error catch successfully: ", error);
    }
    return;
  }
  throw new AssertionError({ message });
};

const p1: Player = {
  uuid: "1234",
  isBot: false,
  username: "Player1",
  socket: null,
  room: null,
  paddleSkinId: "2"
};

const p2: Player = {
  uuid: "5678",
  isBot: false,
  username: "Player2",
  socket: null,
  room: null,
  paddleSkinId: "6"
};

const p3: Player = {
  uuid: "0-0-0",
  isBot: false,
  username: "Player3",
  socket: null,
  room: null,
  paddleSkinId: "10"
};

const settings: TournamentSettings = {
  maxPlayerCount: 8,
  scoreToWin: 5
};

const tournament: Tournament | null = createNewTournament("Test Tournament", p1, settings);
assert(tournament !== null, "tournament should not be null");
console.log("tournament:", tournament);

assert(
  createNewTournament("Test Tournament 2", p1, settings) === null,
  "tournament2 should be null"
);

if (tournament) {
  let hasBeenAdded: boolean = addPlayerToTournament(tournament.uuid, p2);
  assert(hasBeenAdded === true, "hasBeenAdded should be true");
  // console.log("\n\nAdded player 2\n");
  // console.log(tournament);

  hasBeenAdded = addPlayerToTournament(tournament.uuid, p1);
  assert(hasBeenAdded === true, "hasBeenAdded should be true");
  // console.log("\n\nAdded player 1\n");
  // console.log(tournament);

  hasBeenAdded = addPlayerToTournament(tournament.uuid, p2);
  assert(hasBeenAdded === false, "p2 is already in the tournament");

  let hasBeenRemoved: boolean = removePlayerFromTournament(tournament.uuid, p2);
  assert(hasBeenRemoved === true, "hasBeenRemoved should be true");
  // console.log("\n\nRemoved player 2\n");
  // console.log(tournament);

  hasBeenRemoved = removePlayerFromTournament(tournament.uuid, p2);
  assert(hasBeenRemoved === false, "p2 is not in the tournament");

  hasBeenAdded = addPlayerToTournament(tournament.uuid, p2);
  assert(hasBeenAdded === true, "hasBeenAdded should be true");
  // console.log("\n\nAdded player 2 for the second time\n");
  // console.log(tournament);

  console.log("\n\n\n");

  assertTry(() => {
    tournament.tree.generate(tournament.players);
  }, "Cannot generate the tournament tree here because players count is not a power of 2");

  tournament.tree.printTree(); // not generated yet
  assert(closeTournament(tournament.uuid, p2) === false, "p2 should not be able to close the tournament");
  assert(closeTournament(tournament.uuid, p1) === false, "not enough players to close the tournament");

  hasBeenAdded = addPlayerToTournament(tournament.uuid, p3);
  assert(hasBeenAdded === true, "hasBeenAdded should be true");

  assert(closeTournament(tournament.uuid, p1) === true, "the tournament should be closed");
  assert(closeTournament(tournament.uuid, p1) === false, "should not be able to close a tournament already closed");

  console.log("tournament:", tournament, "\n");

  tournament.tree.printTree();

  assertTry(() => {
    tournament.tree.generate(tournament.players);
  }, "Tournament tree should not be generated twice");

  assertTry(() => {
    tournament.tree.playMatch(tournament.tree.root!);
  }, "Tree root should not be playable yet");

  tournament.tree.playMatch(tournament.tree.root!.left!);
  tournament.tree.printTree();

  assertTry(() => {
    tournament.tree.playMatch(tournament.tree.root!);
  }, "Tree root should not be playable yet");

  tournament.tree.playMatch(tournament.tree.root!.right!);
  tournament.tree.printTree();

  tournament.tree.playMatch(tournament.tree.root!);
  tournament.tree.printTree();
}