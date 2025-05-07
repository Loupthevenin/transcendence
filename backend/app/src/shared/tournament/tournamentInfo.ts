type TournamentInfo = {
  uuid: string;
  name: string;
  ownerUuid: string;
  playerRegistered: number;
  maxPlayers: number;
  status: "Ongoing" | "Pending";
  joined: boolean;
};

export default TournamentInfo;

