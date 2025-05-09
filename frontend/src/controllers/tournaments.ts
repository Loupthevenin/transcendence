import { UserProfile } from "./types";
import { sendMessage } from "../websocketManager";
import { MatchNode, TournamentInfo } from "@shared/tournament/tournamentInfo";
import { TournamentSettings } from "@shared/tournament/tournamentSettings";
import * as TournamentMessages from "@shared/tournament/tournamentMessageTypes";
import { navigateTo } from "../router";

function createCardTournament(tournament: TournamentInfo): HTMLElement {
  const card: HTMLElement = document.createElement("div");
  card.className =
    "bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between";
  const isFull: boolean = tournament.playerRegistered >= tournament.maxPlayers;
  const isJoined: boolean = tournament.joined;
  const isClosed: boolean = tournament.status !== "Pending";
  card.innerHTML = `
		<div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">${tournament.name}</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : ${tournament.playerRegistered}/${tournament.maxPlayers}</p>
            <p class="text-purple-200">Statut : ${tournament.status}</p>
		${
      !isClosed
        ? `<button class="join-tournament w-full mt-6 ${isJoined ? "bg-red-600 hover:bg-red-700" : isFull ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} text-white py-2 rounded-md transition-all" ${isFull && !isJoined ? "disabled" : ""}>
				${isJoined ? "Se désinscrire" : isFull ? "Complet" : "Rejoindre"}
          </button>`
        : ""
    }
		${
      isClosed
        ? `<button class="view-progress w-full bg-blue-600 hover:bg-blue-700 text-white py-2 mt-2 rounded-md transition-all">
              Voir la progression
			</button>`
        : ""
    }
		${
      !isClosed && tournament.isOwner && tournament.playerRegistered >= 3
        ? `<button class="close-tournament w-full bg-red-700 hover:bg-red-800 text-white py-2 mt-2 rounded-md transition-all">
					Clôturer le tournoi
				</button>`
        : ""
    }
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

let reloadTimeout: NodeJS.Timeout | undefined = undefined;
let isLoading: boolean = false;

async function loadTournaments(): Promise<void> {
  // Clear the previous timer to prevent overlapping reloads
  clearTimeout(reloadTimeout);

  // Prevent multiple simultaneous executions
  if (isLoading) return;
  isLoading = true;

  try {
      await updateTournaments(); // The function that update the tournaments list
  } finally {
      isLoading = false;

      // Set a new timer for 10 seconds
      reloadTimeout = setTimeout(loadTournaments, 10_000);
  }
}

async function updateTournaments(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
    return;
  }

  const container: HTMLElement | null = document.getElementById("tournaments-container");
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

      if (joinButton && form) {
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
      }

      if (form) {
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
      }
      if (progressButton) {
        progressButton.addEventListener("click", () => {
          navigateTo(`/tournaments/tournament?uuid=${tournament.uuid}`);
        });
      }

      const closeTournament: HTMLButtonElement | null =
        card.querySelector<HTMLButtonElement>(".close-tournament");
      if (!closeTournament) return;

      closeTournament.addEventListener("click", () => {
        const tournamentCloseMessage: TournamentMessages.CloseMessage = {
          type: "close",
          uuid: tournament.uuid,
        };
        sendMessage("tournament", tournamentCloseMessage);
        loadTournaments();
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

export function tournamentsHandlers(container: HTMLElement): void {
  loadTournaments();
  setDisplayNameInputs();
  createTournament();
}

function renderMatch(match: MatchNode): HTMLDivElement | null {
  // If the match node is considered empty
  if (!match.player1 && !match.player2 && !match.left && !match.right) {
    return null;
  }

  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.className = "node-wrapper";

  const matchBox: HTMLDivElement = document.createElement("div");
  matchBox.className = "node";

  // Extract player names or "En attente" if not set
  const p1: string = match.player1 ? match.player1.username : "En attente";
  const p2: string = match.player2 ? match.player2.username : "En attente";

  // Determine winners by checking if the player's uuid matches the winnerUUID
  const isP1Winner: boolean = !!(
    match.player1 && match.player1.uuid === match.winnerUUID
  );
  const isP2Winner: boolean = !!(
    match.player2 && match.player2.uuid === match.winnerUUID
  );

  // Set styling classes based on whether a player's name is set and if they win or lose
  const p1Class: string =
    !match.player1 || !match.winnerUUID
      ? "waiting"
      : isP1Winner
        ? "winner"
        : "loser";
  const p2Class: string =
    !match.player2 || !match.winnerUUID
      ? "waiting"
      : isP2Winner
        ? "winner"
        : "loser";

  matchBox.innerHTML = `
  <div class="${p1Class}" title="${p1}">${p1}</div>
  <div class="${p2Class}" title="${p2}">${p2}</div>
`;

  wrapper.appendChild(matchBox);

  // If there are child matches, render them recursively inside a branch container.
  if (match.left || match.right) {
    const branch: HTMLDivElement = document.createElement("div");
    branch.className = "branch";

    if (match.left) {
      const child: HTMLDivElement | null = renderMatch(match.left);
      if (child) branch.appendChild(child);
    }
    if (match.right) {
      const child: HTMLDivElement | null = renderMatch(match.right);
      if (child) branch.appendChild(child);
    }

    // Append branch only if it has (at least one) valid child.
    if (branch.children.length > 0) {
      wrapper.appendChild(branch);
    }
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
    const tree: MatchNode | null = (await res.json()) as MatchNode | null;

    if (tree) {
      const treeDiv: HTMLDivElement | null = renderMatch(tree);
      if (treeDiv) bracket.appendChild(treeDiv);
    }
  } catch (error: any) {
    console.error("Error tournament progress : ", error);
  }
}
