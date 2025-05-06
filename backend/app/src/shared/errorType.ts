const ERROR_TYPE = {
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  UNKNOW_ERROR: "UNKNOW_ERROR",
  MATCHMAKING_REFUSED: "MATCHMAKING_REFUSED",
  TOURNAMENT_CREATION_FAILED: "TOURNAMENT_CREATION_FAILED",
  TOURNAMENT_JOIN_FAILED: "TOURNAMENT_JOIN_FAILED",
  TOURNAMENT_LEAVE_FAILED: "TOURNAMENT_LEAVE_FAILED",
} as const;

type ERROR_TYPE = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

export default ERROR_TYPE;

export const ERROR_MSG = {
  TOKEN_MISSING_OR_INVALID: "Token is missing or invalid",
  ALREADY_CONNECTED: "Already connected",
  ALREADY_IN_ROOM: "Already inside a room",
  TOURNAMENT_FULL: "TOURNAMENT_FULL",
  TOURNAMENT_NOT_FOUND: "TOURNAMENT_NOT_FOUND",
  TOURNAMENT_CLOSED: "TOURNAMENT_CLOSED",
  PLAYER_NOT_IN_TOURNAMENT: "Player is not in the tournament",
  PLAYER_ALREADY_IN_TOURNAMENT: "Player is already in the tournament",
  NOT_OWNER_OF_TOURNAMENT: "You are not the owner of this tournament",
  NOT_ENOUGHT_PLAYER_TO_CLOSE_TOURNAMENT: "Not enough players to close the tournament",
  INVALID_TOURNAMENT_NAME: "Invalid tournament name",
  INVALID_TOURNAMENT_SETTINGS: "Invalid tournament settings",
  ALREADY_OWNER_OF_TOURNAMENT: "Already owner of a tournament",
} as const;
