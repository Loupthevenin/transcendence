export interface UserProfile {
  avatarUrl: string;
  name: string;
  email: string;
}

export interface Tournament {
  id: number;
  name: string;
  playerRegistered: number;
  maxPlayers: number;
  status: "Ongoing" | "Pending";
  joined: boolean;
}
