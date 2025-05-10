import { MatchHistory } from "@shared/match/matchHistory";
import { navigateTo } from "../router";
import { refreshBlockButtons } from "../controllers/blockedUser";
import {
  showErrorToast,
  showSuccessToast,
} from "../components/showNotificationToast";

export async function showPublicProfile(userId: number): Promise<void> {
  try {
    const res = await fetch(`/api/public-profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!res.ok) throw new Error("Failed to load public profile");

    const profile = (await res.json()) as {
      id: number;
      uuid: string;
      name: string;
      avatar_url: string;
    };
    openProfileModal(profile);
  } catch (err) {
    console.error("Error fetching public profile", err);
    showErrorToast("Impossible de charger le profil public");
  }
}

export async function openProfileModal(profile: {
  id: number;
  uuid: string;
  name: string;
  avatar_url: string;
}): Promise<void> {
  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  backdrop.id = "profile-backdrop";

  const modal = document.createElement("div");
  modal.className =
    "relative bg-[#1e1b4b] p-6 rounded-2xl text-white w-3/4 h-[90vh] overflow-hidden flex flex-col items-center gap-4";
  modal.innerHTML = `
  <button id="block-user-btn" class="absolute top-4 right-4 px-3 py-1 rounded text-sm text-white bg-red-600 hover:bg-red-700">
  🚫
  </button>

  <img src="${profile.avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" 
        class="w-24 h-24 rounded-full object-cover" alt="Avatar">
  <h2 class="text-2xl font-bold">${profile.name}</h2>
  <p class="text-white text-sm">User ID : ${profile.id}</p>

  <div class="bg-[#2e2c60] p-6 rounded-xl shadow-lg text-white">
    <h3 class="text-xl font-semibold text-indigo-300 mb-4">Statistiques</h3>
    <div class="flex items-center justify-between">
      <div class="flex space-x-6">
        <div>
          <p id="win-rate-header" class="text-sm text-purple-300 mb-1">Win Rate</p>
          <div id="win-rate-container" class="text-2xl font-bold text-green-400"></div>
        </div>
        <div>
          <p id="draw-rate-header" class="text-sm text-purple-300 mb-1">Draw Rate</p>
          <div id="draw-rate-container" class="text-2xl font-bold text-gray-400"></div>
        </div>
        <div>
          <p id="lose-rate-header" class="text-sm text-purple-300 mb-1">Lose Rate</p>
          <div id="lose-rate-container" class="text-2xl font-bold text-red-400"></div>
        </div>
      </div>
      <div class="flex-shrink-0 ml-6">
        <div id="pie-chart" class="pie-chart"></div>
      </div>
    </div>
  </div>

  <div id="history-section" class="w-full flex-1 overflow-y-auto bg-[#2e2c60] rounded-xl p-4 mt-4">
    <h3 class="text-lg font-semibold mb-2">Historique des matchs</h3>
    <ul id="match-history" class="flex flex-col gap-2"></ul>
  </div>

  <button id="close-profile-modal" class="absolute top-4 left-4 text-gray-400 hover:text-white text-xl">
  ✖
  </button>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  modal
    .querySelector("#close-profile-modal")
    ?.addEventListener("click", () => backdrop.remove());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  const blockButton = modal.querySelector(
    "#block-user-btn",
  ) as HTMLButtonElement;

  const updateBlockButton = (isBlocked: boolean) => {
    blockButton.textContent = isBlocked
      ? "✅ Débloquer cet utilisateur"
      : "🚫 Bloquer cet utilisateur";
    blockButton.className = `${isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-3 py-1 rounded text-sm absolute top-4 right-4`;
  };

  const toggleBlock = async (isBlocked: boolean) => {
    const confirmMsg = isBlocked
      ? `Veux-tu vraiment débloquer ${profile.name} ?`
      : `Veux-tu vraiment bloquer ${profile.name} ?`;
    if (!confirm(confirmMsg)) return;

    const endpoint = isBlocked ? "/api/block-user/unblock" : "/api/block-user";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ targetUserId: profile.id }),
      });

      if (!res.ok) throw new Error("Erreur blocage/déblocage");

      showSuccessToast(
        isBlocked
          ? `${profile.name} a été débloqué ✅`
          : `${profile.name} a été bloqué 🚫`,
      );
      updateBlockButton(!isBlocked);
      blockButton.onclick = () => toggleBlock(!isBlocked);
      refreshBlockButtons(profile.uuid);
    } catch (err) {
      console.error("Erreur lors du blocage/déblocage", err);
      showErrorToast("Erreur lors du blocage/déblocage.");
    }
  };

  try {
    const res = await fetch(
      `/api/block-user/is-blocked?targetUserId=${profile.id}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      },
    );
    const { blocked } = await res.json();
    updateBlockButton(blocked);
    blockButton.onclick = () => toggleBlock(blocked);
  } catch (err) {
    console.error("Erreur de vérification blocage", err);
    showErrorToast("Erreur de vérification blacage");
    updateBlockButton(false);
    blockButton.onclick = () => toggleBlock(false);
  }

  await loadHistory(profile.id);
}

async function loadHistory(userId: number): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch(`/api/public-profile/history/${userId}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const rawData: any = await res.json();
    if (!res.ok) {
      const errorMsg: string =
        rawData?.message || "Erreur chargement historique";
      showErrorToast(errorMsg);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
      }
      return;
    }
    const data: MatchHistory[] = rawData as MatchHistory[];

    let wins: number = 0;
    let draws: number = 0;
    let totalMatches: number = 0;

    const historyList: HTMLElement | null =
      document.getElementById("match-history");
    if (!historyList) return;

    historyList.innerHTML = "";

    data.forEach((match: MatchHistory) => {
      const li: HTMLLIElement = document.createElement("li");
      const isWin: boolean = match.result === "win";
      const isDraw: boolean = match.result === "draw";
      const borderColor: string = isWin
        ? "border-green-400"
        : isDraw
          ? "border-gray-400"
          : "border-red-400";
      const scoreColor: string = isWin
        ? "text-green-400"
        : isDraw
          ? "text-gray-400"
          : "text-red-400";
      const resultText: string = isWin
        ? "✅ Victoire"
        : isDraw
          ? "⚖️ Match nul"
          : "❌ Défaite";

      if (isWin) {
        wins++;
      } else if (isDraw) {
        draws++;
      }
      totalMatches++;

      li.className = `p-4 rounded-lg bg-[#2a255c] shadow border-l-4 ${borderColor}`;
      li.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <p class="text-sm text-purple-300 mb-1">${formatDate(match.date)}</p>
          <p class="font-semibold">${match.mode} vs ${match.opponent}</p>
          <p class="text-sm">${resultText}</p>
        </div>
        <div class="text-xl font-bold ${scoreColor}">${match.score}</div>
    <button class="replay-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-2 py-1 rounded-lg" data-uuid="${match.uuid}">
        🔁 Replay
    </button>
      </div>
  `;
      historyList.appendChild(li);
    });

    updateWinRate(wins, draws, totalMatches);
    listenerButtonReplay();
  } catch (error: any) {
    console.error("Error history : ", error);
    showErrorToast("Impossible de charger l'historique");
  }
}

(window as any).updateWinRate = updateWinRate;
function updateWinRate(
  wins: number,
  draws: number,
  totalMatches: number,
): void {
  const winRateContainer: HTMLElement | null =
    document.getElementById("win-rate-container");
  const drawRateContainer: HTMLElement | null = document.getElementById(
    "draw-rate-container",
  );
  const loseRateContainer: HTMLElement | null = document.getElementById(
    "lose-rate-container",
  );
  const winRateHeader: HTMLElement | null =
    document.getElementById("win-rate-header");
  const drawRateHeader: HTMLElement | null =
    document.getElementById("draw-rate-header");
  const loseRateHeader: HTMLElement | null =
    document.getElementById("lose-rate-header");
  const pieChart: HTMLElement | null = document.getElementById("pie-chart");

  winRateHeader?.classList.remove("font-bold", "text-xl");
  drawRateHeader?.classList.remove("font-bold", "text-xl");
  loseRateHeader?.classList.remove("font-bold", "text-xl");

  if (
    !winRateContainer ||
    !drawRateContainer ||
    !loseRateContainer ||
    !pieChart
  )
    return;

  // If no matches played, set default text and styles
  if (totalMatches === 0) {
    winRateContainer.textContent = "Aucun match joué";
    drawRateContainer.textContent = "";
    loseRateContainer.textContent = "";
    pieChart.style.background = "#444";
    return;
  }

  // Calculate win, draw, and lose rates
  const winRate: number = (wins / totalMatches) * 100;
  const drawRate: number = (draws / totalMatches) * 100;
  const loseRate: number = Math.max(100 - winRate - drawRate, 0);

  // Update text content for the new containers
  winRateContainer.textContent = `${winRate.toFixed(2)}%`;
  drawRateContainer.textContent = `${drawRate.toFixed(2)}%`;
  loseRateContainer.textContent = `${loseRate.toFixed(2)}%`;

  if (winRate >= drawRate && winRate >= loseRate) {
    winRateHeader?.classList.add("font-bold", "text-xl");
  } else if (drawRate >= winRate && drawRate >= loseRate) {
    drawRateHeader?.classList.add("font-bold", "text-xl");
  } else if (loseRate >= winRate && loseRate >= drawRate) {
    loseRateHeader?.classList.add("font-bold", "text-xl");
  }

  pieChart.style.background = `conic-gradient(
  #4caf50 0% ${winRate}%,
  #ffeb3b ${winRate}% ${winRate + drawRate}%,
  #f44336 ${winRate + drawRate}% 100%
  )`;
}

function formatDate(dateStr: string): string {
  const date: Date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function listenerButtonReplay(): void {
  const buttonsReplay: NodeListOf<HTMLButtonElement> =
    document.querySelectorAll(".replay-button");
  buttonsReplay.forEach((buttonReplay: HTMLButtonElement) => {
    const uuid: string | null = buttonReplay.getAttribute("data-uuid");
    if (uuid) {
      buttonReplay.addEventListener("click", () => {
        navigateTo(`/replay?match_id=${uuid}`);
      });
    }
  });
}

