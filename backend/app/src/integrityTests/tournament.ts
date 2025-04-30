import { AssertionError } from "assert";
import { Player } from "../types/player";
import { Tournament, TournamentSettings } from "../types/tournament";
import { createNewTournament, addPlayerToTournament, removePlayerFromTournament, closeTournament } from "../tournament/tournamentManager";
import { getRandomPaddleModelId } from "../controllers/assetsController";

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

export async function Test1(): Promise<void> {
  const p1: Player = {
    uuid: "1234",
    isBot: true,
    username: "Player1",
    socket: null,
    room: null,
    paddleSkinId: "2"
  };

  const p2: Player = {
    uuid: "5678",
    isBot: true,
    username: "Player2",
    socket: null,
    room: null,
    paddleSkinId: "6"
  };

  const p3: Player = {
    uuid: "0-0-0",
    isBot: true,
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

  if (!tournament) return;

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

  await tournament.tree.playTournament();
}

export async function Test2(): Promise<void> {
  const players: Player[] = [];
  for (let i = 0; i < 27; i++) {
    players.push({
      uuid: `player-${i}`,
      isBot: true,
      username: `Player${i}`,
      socket: null,
      room: null,
      paddleSkinId: getRandomPaddleModelId()
    });
  }

  const settings: TournamentSettings = {
    maxPlayerCount: 32,
    scoreToWin: 1
  };

  const tournament: Tournament | null = createNewTournament("Test Tournament", players[4], settings);
  assert(tournament !== null, "tournament should not be null");

  if (!tournament) return;

  for (const player of players) {
    const hasBeenAdded: boolean = addPlayerToTournament(tournament.uuid, player);
    assert(hasBeenAdded === true, `'${player.username}' should be added successfully`);
  }

  console.log("tournament:", tournament);

  assert(closeTournament(tournament.uuid, players[4]) === true, "the tournament should be closed");

  assertTry(() => {
    tournament.tree.generate(tournament.players);
  }, "Tournament tree should not be generated twice");

  await tournament.tree.playTournament();
}

export async function Test3(): Promise<void> {
  const players: Player[] = [];
  for (let i = 0; i < 50; i++) {
    players.push({
      uuid: `player-${i}`,
      isBot: true,
      username: `Player${i}`,
      socket: null,
      room: null,
      paddleSkinId: getRandomPaddleModelId()
    });
  }

  const settings: TournamentSettings = {
    maxPlayerCount: 16,
    scoreToWin: 15
  };

  const tournament: Tournament | null = createNewTournament("Test Tournament", players[7], settings);
  assert(tournament !== null, "tournament should not be null");

  if (!tournament) return;

  for (let i = 0; i < 50; i++) {
    const hasBeenAdded: boolean = addPlayerToTournament(tournament.uuid, players[i]);
    if (i < 16) {
      assert(hasBeenAdded === true, `'${players[i].username}' should be added successfully`);
    } else {
      assert(hasBeenAdded === false, `'${players[i].username}' should not be added`);
    }
  }

  console.log("tournament:", tournament);

  assert(closeTournament(tournament.uuid, players[4]) === false, "p5 should not be able to close the tournament");
  assert(closeTournament(tournament.uuid, players[7]) === true, "the tournament should be closed");

  await tournament.tree.playTournament();
}

export async function Test4(): Promise<void> {
  const players: Player[] = [];
  for (let i = 0; i < 15; i++) {
    players.push({
      uuid: `player-${i}`,
      isBot: true,
      username: `Player${i}`,
      socket: null,
      room: null,
      paddleSkinId: getRandomPaddleModelId()
    });
  }

  const settings: TournamentSettings = {
    maxPlayerCount: 16,
    scoreToWin: 10000
  };

  const tournament: Tournament | null = createNewTournament("Test Tournament", players[0], settings);
  assert(tournament !== null, "tournament should not be null");

  if (!tournament) return;

  for (let i = 0; i < 15; i++) {
    const hasBeenAdded: boolean = addPlayerToTournament(tournament.uuid, players[i]);
    assert(hasBeenAdded === true, `'${players[i].username}' should be added successfully`);
  }

  console.log("tournament:", tournament);

  assert(closeTournament(tournament.uuid, players[0]) === true, "the tournament should be closed");

  await tournament.tree.playTournament();

  tournament.tree.printTree();
}