import {
  showErrorToast,
  showSuccessToast,
} from "../components/showNotificationToast";
import { navigateTo } from "../router";
import { disconnectFromServer } from "../websocketManager";
import { UserProfile } from "./types";
import { MatchHistory } from "@shared/match/matchHistory";

async function loadUserProfile(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const rawData: any = await res.json();
    if (!res.ok) {
      const errorMsg: string = rawData?.message || "Erreur chargement profile";
      showErrorToast(errorMsg);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
        disconnectFromServer(true);
      }
      return;
    }
    const data: UserProfile = rawData as UserProfile;

    const avatarElement: HTMLImageElement = document.getElementById(
      "user-avatar",
    ) as HTMLImageElement;
    if (avatarElement && data.avatarUrl) {
      avatarElement.src = data.avatarUrl;
    }
    const nameElement: HTMLElement = document.getElementById(
      "display-name",
    ) as HTMLElement;
    if (nameElement && data.name) {
      nameElement.textContent = data.name;
    }
    const emailElement: HTMLElement = document.getElementById(
      "user-email",
    ) as HTMLElement;
    if (emailElement && data.email) {
      emailElement.textContent = data.email;
    }
  } catch (error: any) {
    console.error("Error profile :", error);
    showErrorToast(`Impossible de charger le profile`);
  }
}

async function updateUserProfile(
  updatedData: any,
  request: string,
): Promise<any> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch(`/api/profile/${request}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise a jour du profile");

    return await res.json();
  } catch (error: any) {
    console.error("Erreur update :", error);
    showErrorToast("Impossible de mettre à jour le profile");
  }
}

function listenerName(): void {
  const displayName: HTMLElement | null =
    document.getElementById("display-name");
  if (!displayName) return;
  displayName.addEventListener("click", () => {
    let currentName: string = displayName.textContent || "";

    const input: HTMLInputElement = document.createElement("input");
    input.type = "text";
    input.value = currentName;
    input.className =
      "bg-[#2a255c] text-white border border-indigo-500 rounded px-2 py-1";

    input.addEventListener("blur", async () => {
      const newName: string = input.value.trim();
      if (newName && newName !== currentName) {
        await updateUserProfile({ name: newName }, "name");
        displayName.textContent = newName;
      }
      displayName.classList.remove("hidden");
      input.remove();
    });

    displayName.classList.add("hidden");
    if (displayName.parentNode) {
      displayName.parentNode.appendChild(input);
    }
    input.focus();
  });
}

function listenerEmail(): void {
  const emailElement: HTMLElement | null =
    document.getElementById("user-email");
  if (!emailElement) return;

  emailElement.addEventListener("click", () => {
    const currentEmail: string = emailElement.textContent || "";
    const input: HTMLInputElement = document.createElement("input");
    input.type = "email";
    input.value = currentEmail;
    input.className =
      "bg-[#2a255c] text-white border border-indigo-500 rounded px-2 py-1";
    input.addEventListener("blur", async () => {
      const newEmail: string = input.value.trim();
      const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        showErrorToast("Veuillez entrer une adresse email valide.");
        emailElement.textContent = currentEmail;
      } else if (newEmail && newEmail !== currentEmail) {
        const res: any = await updateUserProfile({ email: newEmail }, "email");
        if (res && res.success) {
          showSuccessToast(res.message);
          localStorage.removeItem("auth_token");
          setTimeout(() => {
            navigateTo("/auth/login");
          }, 5000);
        } else {
          showErrorToast(res?.error);
          emailElement.textContent = currentEmail;
        }
      }
      emailElement.classList.remove("hidden");
      input.remove();
    });
    emailElement.classList.add("hidden");
    emailElement.parentNode?.appendChild(input);
    input.focus;
  });
}

function listenerAvatar(): void {
  const avatarInput: HTMLInputElement = document.getElementById(
    "avatar-upload",
  ) as HTMLInputElement;
  const avatarWrapper: HTMLDivElement = document.querySelector(
    ".group",
  ) as HTMLDivElement;
  const avatarImg: HTMLImageElement = document.getElementById(
    "user-avatar",
  ) as HTMLImageElement;

  if (!avatarInput || !avatarImg || !avatarWrapper) return;

  avatarWrapper.addEventListener("click", () => {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", async () => {
    if (!avatarInput.files || avatarInput.files.length === 0) return;

    const file: File = avatarInput.files[0];
    const formData: FormData = new FormData();
    formData.append("avatar", file);

    const token: string | null = localStorage.getItem("auth_token");
    if (!token) {
      showErrorToast("Pas de token !");
      return;
    }
    try {
      const res: Response = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: any = await res.json();
      if (!res.ok) {
        const errorMsg: string =
          data?.message || data?.error || "Error update Avatar";
        showErrorToast(errorMsg);
        return;
      }

      if (data.avatarUrl) {
        avatarImg.src = data.avatarUrl;
        showSuccessToast("Success loading image");
      }
    } catch (error: any) {
      console.error("Erreur update avatar : ", error);
      showErrorToast("Impossible d'update l'avatar");
    }
  });
}

function formatDate(dateStr: string): string {
  const date: Date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

async function loadHistory(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch("/api/profile/history", {
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
        disconnectFromServer(true);
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

      const container: HTMLDivElement = document.createElement("div");
      container.className = "flex justify-between items-center";

      const left: HTMLDivElement = document.createElement("div");

      const dateP: HTMLElement = document.createElement("p");
      dateP.className = "text-sm text-purple-300 mb-1";
      dateP.textContent = formatDate(match.date);

      const opponentP: HTMLElement = document.createElement("p");
      opponentP.className = "match-opponent font-semibold";
      opponentP.textContent = `${match.mode} vs ${match.opponent}`;

      const resultP: HTMLElement = document.createElement("p");
      resultP.className = "text-sm";
      resultP.textContent = resultText;

      left.appendChild(dateP);
      left.appendChild(opponentP);
      left.appendChild(resultP);

      const scoreDiv: HTMLDivElement = document.createElement("div");
      scoreDiv.className = `text-xl font-bold ${scoreColor}`;
      scoreDiv.textContent = match.score;

      const button: HTMLButtonElement = document.createElement("button");
      button.className =
        "replay-button bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-2 py-1 rounded-lg";
      button.setAttribute("data-uuid", match.uuid);
      button.textContent = "🔁 Replay";

      container.appendChild(left);
      container.appendChild(scoreDiv);
      container.appendChild(button);

      li.appendChild(container);
      historyList.appendChild(li);
    });

    updateWinRate(wins, draws, totalMatches);
    listenerButtonReplay();
  } catch (error: any) {
    console.error("Error history : ", error);
    showErrorToast("Impossible de charger l'historique");
  }
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

async function listener2FA(container: HTMLElement): Promise<void> {
  const button2FA: HTMLElement | null = container.querySelector(
    "#activate-2fa",
  ) as HTMLElement;
  const buttonDisable2FA: HTMLElement | null = container.querySelector(
    "#deactivate-2fa",
  ) as HTMLElement;
  const qrCodeContainer: HTMLElement | null = container.querySelector(
    "#qr-code-container",
  ) as HTMLElement;
  if (!button2FA || !buttonDisable2FA || !qrCodeContainer) return;

  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }

  try {
    const resStatus: Response = await fetch("/api/setup-2fa/check-2fa-status", {
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    const dataStatus: any = await resStatus.json();
    if (!resStatus.ok) {
      const errorMsg: string =
        dataStatus?.message || dataStatus?.error || "Error check 2FA";
      showErrorToast(errorMsg);
      return;
    }
    if (dataStatus.require2FA) {
      button2FA.classList.add("hidden");
      buttonDisable2FA.classList.remove("hidden");
    }
  } catch (error: any) {
    console.error(error);
    showErrorToast(`${error}`);
  }

  button2FA.addEventListener("click", async () => {
    try {
      const res: Response = await fetch("/api/setup-2fa", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data: any = await res.json();
      if (!res.ok) {
        const errorMsg: string =
          data?.message || data?.error || "Error activation 2FA";
        showErrorToast(errorMsg);
        return;
      }

      const qrCodeDataURL: any = data.qrCodeDataURL;
      if (qrCodeDataURL) {
        if (qrCodeContainer) {
          qrCodeContainer.innerHTML = `<img src="${qrCodeDataURL}" alt="QR Code 2FA" />`;
          button2FA.classList.add("hidden");
          buttonDisable2FA.classList.remove("hidden");
        }
      } else {
        showErrorToast(data?.message);
      }
    } catch (error: any) {
      console.error(error);
      showErrorToast("Erreur lors de l'activation 2FA");
    }
  });

  buttonDisable2FA.addEventListener("click", async () => {
    try {
      const resDisable: Response = await fetch("/api/setup-2fa/disable2fa", {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const dataDisable: any = await resDisable.json();
      if (!resDisable.ok) {
        const errorMsg: string =
          dataDisable?.message || dataDisable?.error || "Error disable 2FA";
        showErrorToast(errorMsg);
        return;
      }

      if (dataDisable.success) {
        showSuccessToast(dataDisable?.message);
        button2FA.classList.remove("hidden");
        buttonDisable2FA.classList.add("hidden");
        qrCodeContainer.innerHTML = "";
      } else {
        showErrorToast(dataDisable?.message);
      }
    } catch (error: any) {
      console.error(error);
      showErrorToast(`${error}`);
    }
  });
}

function logout(container: HTMLElement): void {
  const buttonLogout: HTMLElement | null = container.querySelector(
    "#logout-button",
  ) as HTMLElement;
  if (!buttonLogout) return;

  buttonLogout.addEventListener("click", () => {
    const token: string | null = localStorage.getItem("auth_token");
    if (!token) {
      showErrorToast("Pas de token !");
      return;
    }
    localStorage.removeItem("auth_token");
    disconnectFromServer();
    navigateTo("/");
    showSuccessToast("Logout successful!");
  });
}

export function setupProfile(container: HTMLElement): void {
  loadUserProfile();
  loadHistory();
  listener2FA(container);
  logout(container);

  listenerName();
  listenerAvatar();
  listenerEmail();
}
