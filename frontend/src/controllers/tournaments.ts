import { UserProfile, Tournament } from "./types";

interface TournamentFormData {
  name: string;
  pointsTowin: number;
  playersCount: number;
}

function createCardTournament(tournament: Tournament): HTMLElement {
  const card: HTMLElement = document.createElement("div");
  card.className =
    "bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between";
  const isFull: boolean = tournament.playerRegistered >= tournament.maxPlayers;
  const isJoined: boolean = tournament.joined;
  card.innerHTML = `
        <div class="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">${tournament.name}</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : ${tournament.playerRegistered}/${tournament.maxPlayers}</p>
            <p class="text-purple-200">Statut : ${tournament.status}</p>
          </div>
          <button class="join-tournament mt-6 ${isJoined ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"} text-white py-2 rounded-md transition-all" ${isFull || isJoined ? "disabled" : ""}>
				${isJoined ? "Déjà inscrit" : "Rejoindre"}
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
            <button type="button" class="cancel-join bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg">
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
  // TODO: replace GET request by function get Info Tournament (const tournaments: Tournament[] = getInfo());
  try {
    const res: Response = await fetch("/api/tournaments", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return;

    // TODO: here:
    const tournaments: Tournament[] = await res.json();
    container.innerHTML = "";
    tournaments.forEach((tournament) => {
      const card: HTMLElement = createCardTournament(tournament);
      container.appendChild(card);

      const joinButton: HTMLButtonElement | null =
        card.querySelector<HTMLButtonElement>("#join-tournament");
      const form: HTMLFormElement | null =
        card.querySelector<HTMLFormElement>("#join-form");
      if (!joinButton || !form) return;

      joinButton.addEventListener("click", () => {
        if (joinButton.disabled) return;
        document
          .querySelectorAll<HTMLFormElement>(".join-form")
          .forEach((f) => f.classList.add("hidden"));
        form.classList.remove("hidden");
        setDisplayNameInputs();
      });

      form.addEventListener("reset", () => {
        form.classList.add("hidden");
      });

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        form.classList.add("hidden");
        const formdata: FormData = new FormData(form);
        const displayName: string = formdata.get("displayName") as string;
        // TODO: Add join Tournament function;
        console.log("rejoindre le tournoi name: ", displayName);
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

  form.addEventListener("submit", (e) => {
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
    const tournamentData: TournamentFormData = {
      name: name,
      pointsTowin: pointsToWin,
      playersCount: playersCount,
    };
    // TODO: Add function to create Tournament with tournamentData;
    console.log(tournamentData);
  });
}

export function tournamentsHandlers(container: HTMLElement): void {
  loadTournaments();
  setDisplayNameInputs();
  createTournament();
}
