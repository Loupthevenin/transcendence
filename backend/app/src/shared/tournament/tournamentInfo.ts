type TournamentInfo = {
  uuid: string;
  name: string;
  isOwner: boolean;
  playerRegistered: number;
  maxPlayers: number;
  status: "Ongoing" | "Pending";
  joined: boolean;
};

export default TournamentInfo;

