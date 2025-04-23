export interface UserProfile {
  avatarUrl: string;
  name: string;
  email: string;
}

export interface MatchHistory {
  date: string;
  mode: string;
  opponent: string;
  result: "win" | "lose";
  score: string;
}

// interface Tournaments {
//   id: number;
//   playerRegistered: number;
//   maxPlayers: number;
//   status: "Ongoing" | "Pending";
// }
