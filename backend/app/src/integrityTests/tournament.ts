import { AssertionError } from "assert";
import { Player } from "../types/player";
import { Tournament } from "../types/tournament";
import { TournamentSettings } from "../shared/tournament/tournamentSettings";
import { createNewTournament, addPlayerToTournament, removePlayerFromTournament, closeTournament } from "../tournament/tournamentManager";
import { getRandomPaddleModelId } from "../controllers/assetsController";
import { ERROR_MSG } from "../shared/errorType";
import { maxScoreToWin } from "../shared/game/constants";

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

  assert(
    createNewTournament(undefined as unknown as string, p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_NAME,
    "tournament should be null because of invalid name"
  );

  assert(
    createNewTournament("", p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_NAME,
    "tournament should be null because of invalid name"
  );

  assert(
    createNewTournament("    ", p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_NAME,
    "tournament should be null because of invalid name"
  );

  settings.scoreToWin = 0;
  assert(
    createNewTournament("Invalid Tournament settings", p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_SETTINGS,
    "tournament should be null because of invalid settings"
  );

  settings.scoreToWin = 10000;
  assert(
    createNewTournament("Invalid Tournament settings", p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_SETTINGS,
    "tournament should be null because of invalid settings"
  );

  settings.scoreToWin = 5;
  (settings as any).maxPlayerCount = 6;
  assert(
    createNewTournament("Invalid Tournament settings", p1, settings)[1] === ERROR_MSG.INVALID_TOURNAMENT_SETTINGS,
    "tournament should be null because of invalid settings"
  );

  settings.maxPlayerCount = 8;

  const [tournament, error]: [Tournament | null, string | undefined] = createNewTournament("Test Tournament", p1, settings);
  assert(tournament !== null && error === undefined, "tournament should not be null");
  console.log("tournament:", tournament);

  assert(
    createNewTournament("Test Tournament 2", p1, settings)[1] === ERROR_MSG.ALREADY_OWNER_OF_TOURNAMENT,
    "tournament2 should be null"
  );

  if (!tournament) return;

  assert(
    addPlayerToTournament(tournament.uuid, p2) === undefined,
    "there should be no error"
  );
  // console.log("\n\nAdded player 2\n");
  // console.log(tournament);

  assert(
    addPlayerToTournament(tournament.uuid, p1) === undefined,
    "there should be no error"
  );
  // console.log("\n\nAdded player 1\n");
  // console.log(tournament);

  assert(
    addPlayerToTournament(tournament.uuid, p2) === ERROR_MSG.PLAYER_ALREADY_IN_TOURNAMENT,
    "p2 is already in the tournament"
  );

  assert(
    removePlayerFromTournament(tournament.uuid, p2) === undefined,
    "there should be no error"
  );
  // console.log("\n\nRemoved player 2\n");
  // console.log(tournament);

  assert(
    removePlayerFromTournament(tournament.uuid, p2) === ERROR_MSG.PLAYER_NOT_IN_TOURNAMENT,
    "p2 is not in the tournament"
  );

  assert(
    addPlayerToTournament(tournament.uuid, p2) === undefined,
    "there should be no error"
  );
  // console.log("\n\nAdded player 2 for the second time\n");
  // console.log(tournament);

  console.log("\n\n\n");

  assertTry(() => {
    tournament.tree.generate(tournament.players);
  }, "Cannot generate the tournament tree here because players count is not a power of 2");

  tournament.tree.printTree(); // not generated yet
  assert(
    closeTournament(tournament.uuid, p2) === ERROR_MSG.NOT_OWNER_OF_TOURNAMENT,
    "p2 should not be able to close the tournament"
  );
  assert(
    closeTournament(tournament.uuid, p1) === ERROR_MSG.NOT_ENOUGHT_PLAYER_TO_CLOSE_TOURNAMENT,
    "not enough players to close the tournament"
  );

  assert(
    addPlayerToTournament(tournament.uuid, p3) === undefined,
    "there should be no error"
  );

  assert(
    closeTournament(tournament.uuid, p1) === undefined,
    "the tournament should be closed"
  );
  assert(
    closeTournament(tournament.uuid, p1) === ERROR_MSG.TOURNAMENT_CLOSED,
    "should not be able to close a tournament already closed"
  );

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

  const [tournament, error]: [Tournament | null, string | undefined] = createNewTournament("Test Tournament", players[4], settings);
  assert(tournament !== null && error === undefined, "tournament should not be null");

  if (!tournament) return;

  for (const player of players) {
    assert(
      addPlayerToTournament(tournament.uuid, player) === undefined,
      `'${player.username}' should be added successfully`
    );
  }

  console.log("tournament:", tournament);

  assert(
    closeTournament(tournament.uuid, players[4]) === undefined,
    "the tournament should be closed"
  );

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

  const [tournament, error]: [Tournament | null, string | undefined] = createNewTournament("Test Tournament", players[7], settings);
  assert(tournament !== null && error === undefined, "tournament should not be null");

  if (!tournament) return;

  for (let i = 0; i < 50; i++) {
    const error: string | undefined = addPlayerToTournament(tournament.uuid, players[i]);
    if (i < 16) {
      assert(error === undefined, `'${players[i].username}' should be added successfully`);
    } else {
      assert(error === ERROR_MSG.TOURNAMENT_FULL, `'${players[i].username}' should not be added`);
    }
  }

  console.log("tournament:", tournament);

  assert(
    closeTournament(tournament.uuid, players[4]) === ERROR_MSG.NOT_OWNER_OF_TOURNAMENT,
    "the tournament should be closed"
  );

  assert(
    closeTournament(tournament.uuid, players[7]) === undefined,
    "the tournament should be closed"
  );

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
    scoreToWin: maxScoreToWin
  };

  const [tournament, error]: [Tournament | null, string | undefined] = createNewTournament("Test Tournament", players[0], settings);
  assert(tournament !== null && error === undefined, "tournament should not be null");

  if (!tournament) return;

  for (let i = 0; i < 15; i++) {
    assert(
      addPlayerToTournament(tournament.uuid, players[i]) === undefined,
      `'${players[i].username}' should be added successfully`
    );
  }

  console.log("tournament:", tournament);

  assert(
    closeTournament(tournament.uuid, players[0]) === undefined,
    "the tournament should be closed"
  );

  await tournament.tree.playTournament();

  tournament.tree.printTree();
}