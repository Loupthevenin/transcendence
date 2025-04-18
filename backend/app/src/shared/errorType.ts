const ERROR_TYPE = {
  CONNECTION_REFUSED: "CONNECTION_REFUSED",
  UNKNOW_ERROR: "UNKNOW_ERROR",
} as const;

type ERROR_TYPE = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];

export default ERROR_TYPE;
