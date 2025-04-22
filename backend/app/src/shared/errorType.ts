const ERROR_TYPE = {
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  UNKNOW_ERROR: "UNKNOW_ERROR",
} as const;

type ERROR_TYPE = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

export default ERROR_TYPE;

export const ERROR_MSG = {
  TOKEN_MISSING_OR_INVALID: "Token is missing or invalid",
  ALREADY_CONNECTED: "Already connected",
} as const;
