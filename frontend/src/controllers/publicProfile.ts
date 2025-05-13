import { MatchHistory } from "@shared/match/matchHistory";
import UserPublicProfile from "@shared/userPublicProfile";
import { navigateTo } from "../router";
import { emitBlockStatusChanged, onBlockStatusChanged } from "../controllers/blockedUser";
import {
  showErrorToast,
  showSuccessToast,
} from "../components/showNotificationToast";
import { SpectatingMode } from "../game/game";

export async function showPublicProfile(userUuid: string): Promise<void> {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("No token");

    const res = await fetch(`/api/public-profile/${userUuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load public profile");

    const profile: UserPublicProfile = await res.json();
    openProfileModal(profile);
  } catch (error) {
    console.error("Error fetching public profile", error);
    showErrorToast("Impossible de charger le profil public");
  }
}

// <<<<<<< HEAD

// export async function openProfileModal(
//   profile: UserPublicProfile,
// ): Promise<void> {
//   const backdrop: HTMLDivElement = document.createElement("div");
// =======
// export async function openProfileModal(profile: {
//   uuid: string;
//   name: string;
//   avatar_url: string;
// }): Promise<void> {
//   const backdrop = document.createElement("div");
// >>>>>>> 6168046 (WIP)
//   backdrop.className =
//     "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
//   backdrop.id = "profile-backdrop";

//   const modal: HTMLDivElement = document.createElement("div");
//   modal.className =
//     "relative bg-[#1e1b4b] p-6 rounded-2xl text-white w-3/4 h-[90vh] overflow-hidden flex flex-col items-center gap-4";

// <<<<<<< HEAD
//   <img src="${profile.avatarUrl ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" 
//         class="w-24 h-24 rounded-full object-cover" alt="Avatar">
//   <h2 id="profile-username" class="text-2xl font-bold"></h2>
//   <p id="profile-id" class="text-white text-sm"></p>
// =======
//   const blockBtn = document.createElement("button");
//   blockBtn.id = "block-user-btn";
//   blockBtn.className =
//     "absolute top-4 right-4 px-3 py-1 rounded text-sm text-white bg-red-600 hover:bg-red-700";
//   blockBtn.textContent = "🚫";
//   modal.appendChild(blockBtn);
// >>>>>>> 6168046 (WIP)

//   const avatar = document.createElement("img");
//   avatar.src =
//     profile.avatar_url ??
//     "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
//   avatar.className = "w-24 h-24 rounded-full object-cover";
//   avatar.alt = "Avatar";
//   modal.appendChild(avatar);

//   const nameEl = document.createElement("h2");
//   nameEl.id = "profile-username";
//   nameEl.className = "text-2xl font-bold";
//   nameEl.textContent = profile.name;
//   modal.appendChild(nameEl);

//   const uuidEl = document.createElement("p");
//   uuidEl.id = "profile-id";
//   uuidEl.className = "text-white text-sm";
//   uuidEl.textContent = `User UUID : ${profile.uuid}`;
//   modal.appendChild(uuidEl);

//   modal.insertAdjacentHTML("beforeend", `
//     <div class="bg-[#2e2c60] p-6 rounded-xl shadow-lg text-white">
//       <h3 class="text-xl font-semibold text-indigo-300 mb-4">Statistiques</h3>
//       <div class="flex items-center justify-between">
//         <div class="flex space-x-6">
//           <div>
//             <p id="win-rate-header" class="text-sm text-purple-300 mb-1">Win Rate</p>
//             <div id="win-rate-container" class="text-2xl font-bold text-green-400"></div>
//           </div>
//           <div>
//             <p id="draw-rate-header" class="text-sm text-purple-300 mb-1">Draw Rate</p>
//             <div id="draw-rate-container" class="text-2xl font-bold text-gray-400"></div>
//           </div>
//           <div>
//             <p id="lose-rate-header" class="text-sm text-purple-300 mb-1">Lose Rate</p>
//             <div id="lose-rate-container" class="text-2xl font-bold text-red-400"></div>
//           </div>
//         </div>
//         <div class="flex-shrink-0 ml-6">
//           <div id="pie-chart" class="pie-chart"></div>
//         </div>
//       </div>
//     </div>
//   `);

//   modal.insertAdjacentHTML("beforeend", `
//     <div id="history-section" class="w-full flex-1 overflow-y-auto bg-[#2e2c60] rounded-xl p-4 mt-4">
//       <h3 class="text-lg font-semibold mb-2">Historique des matchs</h3>
//       <ul id="match-history" class="flex flex-col gap-2"></ul>
//     </div>
//   `);

// <<<<<<< HEAD
//   <button id="close-profile-modal" class="absolute top-4 left-4 text-gray-400 hover:text-white text-xl">
//   ✖
//   </button>
//   `;

//   const profileUsernameElement: HTMLHeadingElement | null =
//     modal.querySelector("#profile-username");
//   if (profileUsernameElement) {
//     profileUsernameElement.textContent = profile.name;
//   }

//   const profileIdElement: HTMLParagraphElement | null =
//     modal.querySelector("#profile-id");
//   if (profileIdElement) {
//     profileIdElement.textContent = `User ID : ${profile.id}`;
//   }
// =======
//   const closeBtn = document.createElement("button");
//   closeBtn.id = "close-profile-modal";
//   closeBtn.className =
//     "absolute top-4 left-4 text-gray-400 hover:text-white text-xl";
//   closeBtn.textContent = "✖";
//   closeBtn.addEventListener("click", () => backdrop.remove());
//   modal.appendChild(closeBtn);
// >>>>>>> 6168046 (WIP)

//   if (profile.isPlaying) {
//     const spectateButton: HTMLButtonElement = document.createElement("button");
//     spectateButton.id = "spectate";
//     spectateButton.className = "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm absolute top-16 right-4";
//     spectateButton.textContent = "👀 Regarder en direct";
//     modal.appendChild(spectateButton);
//   }

//   backdrop.appendChild(modal);
//   document.body.appendChild(backdrop);
// <<<<<<< HEAD

//   modal
//     .querySelector("#close-profile-modal")
//     ?.addEventListener("click", () => backdrop.remove());
//   backdrop.addEventListener("click", (e: MouseEvent) => {
//     if (e.target === backdrop) backdrop.remove();
//   });

//   const blockButton: HTMLButtonElement = modal.querySelector(
//     "#block-user-btn",
//   ) as HTMLButtonElement;

// =======
//   backdrop.addEventListener("click", (e) => {
//     if (e.target === backdrop) backdrop.remove();
//   });

// >>>>>>> 6168046 (WIP)
//   const updateBlockButton = (isBlocked: boolean) => {
//     blockBtn.textContent = isBlocked
//       ? "✅ Débloquer cet utilisateur"
//       : "🚫 Bloquer cet utilisateur";
//     blockBtn.className = `${isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white px-3 py-1 rounded text-sm absolute top-4 right-4`;
//   };

//   const toggleBlock = async (isBlocked: boolean) => {
//     const confirmMsg: string = isBlocked
//       ? `Veux-tu vraiment débloquer ${profile.name} ?`
//       : `Veux-tu vraiment bloquer ${profile.name} ?`;
//     if (!confirm(confirmMsg)) return;

//     try {
//       const token = localStorage.getItem("auth_token");
//       if (!token) throw new Error("No token");

//       const endpoint: string = isBlocked
//         ? "/api/block-user/unblock"
//         : "/api/block-user";
// <<<<<<< HEAD

//       const res: Response = await fetch(endpoint, {
// =======
//       const res = await fetch(endpoint, {
// >>>>>>> 6168046 (WIP)
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ targetUserUuid: profile.uuid }),
//       });

//       if (!res.ok) throw new Error("Erreur serveur");

//       showSuccessToast(
//         isBlocked
//           ? `${profile.name} a été débloqué ✅`
//           : `${profile.name} a été bloqué 🚫`
//       );

//       const newStatus = !isBlocked;
//       updateBlockButton(newStatus);
//       blockBtn.onclick = () => toggleBlock(!newStatus);
//       emitBlockStatusChanged({ uuid: profile.uuid, blocked: newStatus });
//     } catch (err) {
//       console.error(err);
//       showErrorToast("Erreur lors de l'action de blocage.");
//     }
//   };

//   try {
//     const token = localStorage.getItem("auth_token");
//     if (!token) throw new Error("No token");

// <<<<<<< HEAD
//     const res: Response = await fetch(
//       `/api/block-user/is-blocked?targetUserId=${profile.id}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
// =======
//     const res = await fetch(
//       `/api/block-user/is-blocked?targetUserUuid=${profile.uuid}`,
//       { headers: { Authorization: `Bearer ${token}` } }
// >>>>>>> 6168046 (WIP)
//     );
//     const { blocked } = await res.json();
//     updateBlockButton(blocked);
// <<<<<<< HEAD
//     blockButton.onclick = () => toggleBlock(blocked);
//     listenerButtonSpectate(profile.uuid);
//   } catch (error: any) {
//     console.error("Erreur de vérification blocage:", error);
//     showErrorToast("Erreur de vérification blocage");
// =======
//     blockBtn.onclick = () => toggleBlock(blocked);
//   } catch (err) {
//     console.error(err);
//     showErrorToast("Erreur lors de la récupération du statut de blocage.");
// >>>>>>> 6168046 (WIP)
//     updateBlockButton(false);
//     blockBtn.onclick = () => toggleBlock(false);
//   }

//   onBlockStatusChanged((event) => {
//     if (event.uuid === profile.uuid) {
//       updateBlockButton(event.blocked);
//       blockBtn.onclick = () => toggleBlock(event.blocked);
//     }
//   });

//   await loadHistory(profile.uuid);
// }

export async function openProfileModal(profile: UserPublicProfile): Promise<void> {
  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  backdrop.id = "profile-backdrop";

  const modal = document.createElement("div");
  modal.className =
    "relative bg-[#1e1b4b] p-6 rounded-2xl text-white w-3/4 h-[90vh] overflow-hidden flex flex-col items-center gap-4";

  const blockBtn = document.createElement("button");
  blockBtn.id = "block-user-btn";
  blockBtn.className =
    "absolute top-4 right-4 px-3 py-1 rounded text-sm text-white bg-red-600 hover:bg-red-700";
  blockBtn.textContent = "🚫";
  modal.appendChild(blockBtn);

  const avatar = document.createElement("img");
  avatar.src =
    profile.avatarUrl ??
    "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
  avatar.className = "w-24 h-24 rounded-full object-cover";
  avatar.alt = "Avatar";
  modal.appendChild(avatar);

  const nameEl = document.createElement("h2");
  nameEl.id = "profile-username";
  nameEl.className = "text-2xl font-bold";
  nameEl.textContent = profile.name;
  modal.appendChild(nameEl);

  const uuidEl = document.createElement("p");
  uuidEl.id = "profile-id";
  uuidEl.className = "text-white text-sm";
  uuidEl.textContent = `User UUID : ${profile.uuid}`;
  modal.appendChild(uuidEl);

  if (profile.isPlaying) {
    const spectateButton = document.createElement("button");
    spectateButton.id = "spectate";
    spectateButton.className =
      "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm absolute top-16 right-4";
    spectateButton.textContent = "👀 Regarder en direct";
    modal.appendChild(spectateButton);
  }

  modal.insertAdjacentHTML("beforeend", `
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
  `);

  modal.insertAdjacentHTML("beforeend", `
    <div id="history-section" class="w-full flex-1 overflow-y-auto bg-[#2e2c60] rounded-xl p-4 mt-4">
      <h3 class="text-lg font-semibold mb-2">Historique des matchs</h3>
      <ul id="match-history" class="flex flex-col gap-2"></ul>
    </div>
  `);

  const closeBtn = document.createElement("button");
  closeBtn.id = "close-profile-modal";
  closeBtn.className =
    "absolute top-4 left-4 text-gray-400 hover:text-white text-xl";
  closeBtn.textContent = "✖";
  closeBtn.addEventListener("click", () => backdrop.remove());
  modal.appendChild(closeBtn);

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  const updateBlockButton = (isBlocked: boolean) => {
    blockBtn.textContent = isBlocked
      ? "✅ Débloquer cet utilisateur"
      : "⛔ Bloquer cet utilisateur";
    blockBtn.className = `${
      isBlocked ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
    } text-white px-3 py-1 rounded text-sm absolute top-4 right-4`;
  };

  const toggleBlock = async (isBlocked: boolean) => {
    if (!confirm(
      isBlocked
        ? `Veux-tu vraiment débloquer ${profile.name} ?`
        : `Veux-tu vraiment bloquer ${profile.name} ?`
    )) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No token");

      const endpoint = isBlocked ? "/api/block-user/unblock" : "/api/block-user";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserUuid: profile.uuid }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      showSuccessToast(
        isBlocked
          ? `${profile.name} a été débloqué ✅`
          : `${profile.name} a été bloqué ⛔`
      );

      const newStatus = !isBlocked;
      updateBlockButton(newStatus);
      blockBtn.onclick = () => toggleBlock(!newStatus);
      emitBlockStatusChanged({ uuid: profile.uuid, blocked: newStatus });
    } catch (err) {
      console.error(err);
      showErrorToast("Erreur lors de l'action de blocage.");
    }
  };

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("No token");

    const res = await fetch(
      `/api/block-user/is-blocked?targetUserUuid=${profile.uuid}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const { blocked } = await res.json();
    updateBlockButton(blocked);
    blockBtn.onclick = () => toggleBlock(blocked);
  } catch (err) {
    console.error(err);
    showErrorToast("Erreur lors de la récupération du statut de blocage.");
    updateBlockButton(false);
    blockBtn.onclick = () => toggleBlock(false);
  }

  onBlockStatusChanged((event) => {
    if (event.uuid === profile.uuid) {
      updateBlockButton(event.blocked);
      blockBtn.onclick = () => toggleBlock(event.blocked);
    }
  });

  if (profile.isPlaying) {
    const spectateButton = document.createElement("button");
    spectateButton.id = "spectate";
    spectateButton.className = "bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm absolute top-16 right-4";
    spectateButton.textContent = "👀 Regarder en direct";
    modal.appendChild(spectateButton);
  
    listenerButtonSpectate(profile.uuid); 
  }

  await loadHistory(profile.uuid);
}


async function loadHistory(userUuid: string): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch(`/api/public-profile/history/${userUuid}`, {
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
      const wrapper: HTMLDivElement = document.createElement("div");
      wrapper.className = "flex justify-between items-center";

      // Partie gauche (infos du match)
      const infoDiv: HTMLDivElement = document.createElement("div");

      const dateP: HTMLElement = document.createElement("p");
      dateP.className = "text-sm text-purple-300 mb-1";
      dateP.textContent = formatDate(match.date);

      const modeP: HTMLElement = document.createElement("p");
      modeP.className = "font-semibold";
      modeP.textContent = `${match.mode} vs ${match.opponent}`;

      const resultP: HTMLElement = document.createElement("p");
      resultP.className = "text-sm";
      resultP.textContent = resultText;

      infoDiv.appendChild(dateP);
      infoDiv.appendChild(modeP);
      infoDiv.appendChild(resultP);

      // Partie droite (score + bouton replay)
      const scoreDiv: HTMLDivElement = document.createElement("div");
      scoreDiv.className = `text-xl font-bold ${scoreColor}`;
      scoreDiv.textContent = match.score;

      const replayBtn: HTMLButtonElement = document.createElement("button");
      replayBtn.className =
        "replay-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-2 py-1 rounded-lg";
      replayBtn.dataset.uuid = match.uuid;
      replayBtn.textContent = "🔁 Replay";

      // Assemblage
      wrapper.appendChild(infoDiv);
      wrapper.appendChild(scoreDiv);
      wrapper.appendChild(replayBtn);

      li.appendChild(wrapper);
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

function listenerButtonSpectate(uuid: string): void {
  const buttonSpectate: HTMLButtonElement | null = document.getElementById(
    "spectate",
  ) as HTMLButtonElement;
  if (!buttonSpectate) return;
  buttonSpectate.addEventListener("click", () => {
    SpectatingMode(uuid);
  });
}
