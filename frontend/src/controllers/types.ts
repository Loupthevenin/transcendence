export interface UserProfile {
  avatarUrl: string;
  name: string;
  email: string;
}

export interface Tournament {
  uuid: string;
  name: string;
  playerRegistered: number;
  maxPlayers: number;
  status: "Ongoing" | "Pending";
  joined: boolean;
}
