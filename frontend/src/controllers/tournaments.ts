import { UserProfile } from "./types";
import { sendMessage } from "../websocketManager";
import TournamentInfo from "@shared/tournament/tournamentInfo";
import { TournamentSettings } from "@shared/tournament/tournamentSettings";
import * as TournamentMessages from "@shared/tournament/tournamentMessageTypes";
import { navigateTo } from "../router";

function createCardTournament(tournament: TournamentInfo): HTMLElement {
  const card: HTMLElement = document.createElement("div");
  card.className =
    "bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between";
  const isFull: boolean = tournament.playerRegistered >= tournament.maxPlayers;
  const isJoined: boolean = tournament.joined;
  const isRunning: boolean = tournament.status === "Ongoing";
  console.log(isRunning);
  card.innerHTML = `
		<div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">${tournament.name}</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : ${tournament.playerRegistered}/${tournament.maxPlayers}</p>
            <p class="text-purple-200">Statut : ${tournament.status}</p>
          <button class="join-tournament mt-6 ${isJoined ? "bg-red-600 hover:bg-red-700" : isFull ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} text-white py-2 rounded-md transition-all" ${isFull && !isJoined ? "disabled" : ""}>
				${isJoined ? "Se désinscrire" : isFull ? "Complet" : "Rejoindre"}
          </button>
       <button class="view-progress bg-blue-600 hover:bg-blue-700 text-white py-2 mt-2 rounded-md transition-all">
              Voir la progression
        </button>
        </div>
		<form class="join-form hidden mt-4 bg-[#2a255c] p-4 rounded-lg shadow-md text-white space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Nom</label>
            <input
              type="text"
              name="displayName"
              class="display-name-input w-full px-4 py-2 rounded-lg bg-[#1e1b4b] text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          </div>
          <div class="flex justify-end gap-4">
            <button type="submit" class="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg">
              Confirmer
            </button>
            <button type="reset" class="cancel-join bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg">
              Annuler
            </button>
          </div>
        </form>
`;
  return card;
}

async function loadTournaments(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
    return;
  }
  const container: HTMLElement | null = document.getElementById(
    "tournaments-container",
  );
  if (!container) return;
  try {
    const res: Response = await fetch("/api/tournaments/list", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return;

    const tournaments: TournamentInfo[] = await res.json();
    container.innerHTML = "";
    tournaments.forEach((tournament: TournamentInfo) => {
      const card: HTMLElement = createCardTournament(tournament);
      container.appendChild(card);

      const joinButton: HTMLButtonElement | null =
        card.querySelector<HTMLButtonElement>(".join-tournament");
      const form: HTMLFormElement | null =
        card.querySelector<HTMLFormElement>(".join-form");
      const progressButton: HTMLButtonElement | null =
        card.querySelector<HTMLButtonElement>(".view-progress");
      if (!joinButton || !form || !progressButton) return;

      joinButton.addEventListener("click", () => {
        if (tournament.joined) {
          const tournamentLeaveMessage: TournamentMessages.LeaveMessage = {
            type: "leave",
            uuid: tournament.uuid,
          };
          sendMessage("tournament", tournamentLeaveMessage);
          loadTournaments();
        } else {
          document
            .querySelectorAll<HTMLFormElement>(".join-form")
            .forEach((f: HTMLFormElement) => f.classList.add("hidden"));
          form.classList.remove("hidden");
          setDisplayNameInputs();
        }
      });

      form.addEventListener("reset", () => {
        form.classList.add("hidden");
      });

      form.addEventListener("submit", (e: SubmitEvent) => {
        e.preventDefault();
        form.classList.add("hidden");

        const inputElement: HTMLInputElement | null =
          form.querySelector<HTMLInputElement>(".display-name-input");
        if (inputElement) {
          const tournamentJoinMessage: TournamentMessages.JoinMessage = {
            type: "join",
            uuid: tournament.uuid,
            username: inputElement.value,
          };
          sendMessage("tournament", tournamentJoinMessage);
          loadTournaments();
        }
      });
      progressButton.addEventListener("click", () => {
        navigateTo(`/tournaments/tournament?uuid=${tournament.uuid}`);
      });
    });
  } catch (error: any) {
    console.error("Error loading Tournaments", error);
  }
}

async function setDisplayNameInputs(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const res: Response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return;

    const data: UserProfile = await res.json();
    if (data?.name) {
      const displayInputs: NodeListOf<HTMLInputElement> =
        document.querySelectorAll<HTMLInputElement>(
          'input[name="displayName"]',
        );
      displayInputs.forEach((input: HTMLInputElement) => {
        input.value = data.name;
      });
    }
  } catch (error: any) {
    console.error("Error loading name : ", error);
  }
}

function createTournament(): void {
  const buttonCreateTournament: HTMLButtonElement | null =
    document.getElementById("create-tournament") as HTMLButtonElement;
  const form: HTMLFormElement | null = document.getElementById(
    "tournament-form",
  ) as HTMLFormElement;
  if (!buttonCreateTournament || !form) return;

  buttonCreateTournament.addEventListener("click", () => {
    form.classList.remove("hidden");
    buttonCreateTournament.classList.add("hidden");
  });

  form.addEventListener("reset", () => {
    form.classList.add("hidden");
    buttonCreateTournament.classList.remove("hidden");
  });

  form.addEventListener("submit", (e: SubmitEvent) => {
    e.preventDefault(); // Empêche le rechargement de la page
    const formData: FormData = new FormData(form);
    const name: string = formData.get("tournamentName") as string;
    const pointsToWin: number = parseInt(
      formData.get("pointsToWin") as string,
      10,
    );
    const playersCount: number = parseInt(
      formData.get("playersCount") as string,
      10,
    );

    const tournamentCreateMessage: TournamentMessages.CreateMessage = {
      type: "create",
      name: name,
      settings: {
        maxPlayerCount: playersCount,
        scoreToWin: pointsToWin,
      } as TournamentSettings,
    };
    sendMessage("tournament", tournamentCreateMessage);
    loadTournaments();
  });
}

type Player = {
  username: string;
  isBot?: boolean;
};

type MatchNode = {
  player: Player | null;
  left: MatchNode | null;
  right: MatchNode | null;
};

export function tournamentsHandlers(container: HTMLElement): void {
  loadTournaments();
  setDisplayNameInputs();
  createTournament();
}

function generateTournamentTree(size: 4 | 8 | 16 | 32): MatchNode {
  const NAMES = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Heidi",
    "Ivan",
    "Judy",
    "Mallory",
    "Niaj",
    "Olivia",
    "Peggy",
    "Rupert",
    "Sybil",
    "Trent",
    "Victor",
    "Walter",
    "Yasmine",
    "Zoe",
    "Quentin",
    "Laura",
    "Xavier",
    "Yuri",
    "Sophie",
    "Martin",
    "Clara",
    "Noah",
    "Liam",
    "Emma",
    "Lucas",
  ];

  function getRandomNamePool(count: number): string[] {
    const shuffled = [...NAMES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function buildMatchTree(players: Player[]): MatchNode {
    if (players.length === 1) {
      return {
        player: players[0],
        left: null,
        right: null,
      };
    }

    const half = players.length / 2;
    const left = buildMatchTree(players.slice(0, half));
    const right = buildMatchTree(players.slice(half));

    const winner = Math.random() < 0.5 ? left.player : right.player;

    return {
      player: winner,
      left,
      right,
    };
  }

  const playerNames = getRandomNamePool(size);
  const players = playerNames.map((name) => ({ username: name }));
  return buildMatchTree(players);
}

function renderMatch(match: MatchNode) {
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.className = "node-wrapper";

  const matchBox: HTMLDivElement = document.createElement("div");
  matchBox.className = "node";

  const p1: string = match.left?.player?.username ?? "En attente";
  const p2: string = match.right?.player?.username ?? "En attente";
  const winner: string | undefined = match.player?.username;

  const isP1Winner = winner && p1 === winner;
  const isP2Winner = winner && p2 === winner;

  const p1Class: string =
    p1 === "En attente" ? "waiting" : isP1Winner ? "winner" : "loser";
  const p2Class: string =
    p2 === "En attente" ? "waiting" : isP2Winner ? "winner" : "loser";

  matchBox.innerHTML = `
  <div class="${p1Class}">${p1}</div>
  <div class="${p2Class}">${p2}</div>
`;

  wrapper.appendChild(matchBox);

  if (match.left || match.right) {
    const branch = document.createElement("div");
    branch.className = "branch";

    if (match.left) branch.appendChild(renderMatch(match.left));
    if (match.right) branch.appendChild(renderMatch(match.right));

    wrapper.appendChild(branch);
  }

  return wrapper;
}

export async function tournamentProgress(
  container: HTMLElement,
): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
    return;
  }
  const params: URLSearchParams = new URLSearchParams(window.location.search);
  const uuid: string | null = params.get("uuid");
  if (!uuid) return;

  const bracket: HTMLDivElement = document.getElementById(
    "bracket",
  ) as HTMLDivElement;
  if (!bracket) return;

  try {
    const res: Response = await fetch(
      `/api/tournaments/tournament?uuid=${uuid}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    );
    if (!res.ok) return;
    const data: any = await res.json();
    console.log(data.tree.root);

    bracket.appendChild(renderMatch(generateTournamentTree(8)));
  } catch (error) {
    console.error("Error tournament progress : ", error);
  }
}
