import { navigateTo } from "../router";
import { UserProfile, MatchHistory } from "./types";

async function loadUserProfile(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
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
      alert(errorMsg);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
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
    alert("impossible de charger le profile");
  }
}

async function updateUserProfile(
  updatedData: any,
  request: string,
): Promise<any> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
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
    alert("Impossible de mettre à jour le profile");
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
        alert("veuillez entrer une adresse email valide.");
        emailElement.textContent = currentEmail;
      } else if (newEmail && newEmail !== currentEmail) {
        const res: any = await updateUserProfile({ email: newEmail }, "email");
        if (res && res.success) {
          alert(res.message);
          localStorage.removeItem("auth_token");
          setTimeout(() => {
            navigateTo("/auth/login");
          }, 1500);
        } else {
          alert(res?.error);
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
      alert("Pas de token !");
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
        alert(errorMsg);
        return;
      }

      if (data.avatarUrl) {
        avatarImg.src = data.avatarUrl;
      }
    } catch (error: any) {
      console.error("Erreur update avatar : ", error);
      alert("Impossible d'update l'avatar");
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

function updateWinRate(winRate: number): void {
  const winRateContainer: HTMLElement | null =
    document.getElementById("win-rate-container");
  const pieChart: HTMLElement | null = document.getElementById("pie-chart");
  if (!winRateContainer || !pieChart) return;

  if (winRate < 0) {
    winRateContainer.textContent = "Aucun match joué";
    winRateContainer.classList.remove("text-green-400", "text-red-400");
    pieChart.style.background = "#444";
    return;
  }

  winRateContainer.textContent = `${winRate.toFixed(2)}%`;
  if (winRate >= 50) {
    winRateContainer.classList.remove("text-red-400");
    winRateContainer.classList.add("text-green-400");
  } else {
    winRateContainer.classList.remove("text-green-400");
    winRateContainer.classList.add("text-red-400");
  }

  pieChart.style.background = `conic-gradient(#4caf50 0% ${winRate}%, #f44336 ${winRate}% 100%)`;
}

async function loadHistory(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
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
      alert(errorMsg);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("auth_token");
      }
      return;
    }
    const data: MatchHistory[] = rawData as MatchHistory[];

    let wins: number = 0;
    let totalMatches: number = 0;

    const historyList: HTMLElement | null =
      document.getElementById("match-history");
    if (!historyList) return;

    historyList.innerHTML = "";

    data.forEach((match: MatchHistory) => {
      const li: HTMLLIElement = document.createElement("li");
      const isWin: boolean = match.result === "win";
      const borderColor: string = isWin ? "border-green-400" : "border-red-400";
      const scoreColor: string = isWin ? "text-green-400" : "text-red-400";
      const resultText: string = isWin ? "✅ Victoire" : "❌ Défaite";

      if (isWin) {
        wins++;
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

    const winRate: number = totalMatches > 0 ? (wins / totalMatches) * 100 : -1;
    updateWinRate(winRate);
    listenerButtonReplay();
  } catch (error: any) {
    console.error("Error history : ", error);
    alert("impossible de charger l'historique");
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
    alert("Pas de token !");
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
      alert(errorMsg);
      return;
    }
    if (dataStatus.require2FA) {
      button2FA.classList.add("hidden");
      buttonDisable2FA.classList.remove("hidden");
    }
  } catch (error: any) {
    console.error(error);
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
        alert(errorMsg);
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
        alert(data?.message);
      }
    } catch (error: any) {
      alert("Erreur lors de l'activation 2FA");
      console.error(error);
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
        alert(errorMsg);
        return;
      }

      if (dataDisable.success) {
        alert(dataDisable?.message);
        button2FA.classList.remove("hidden");
        buttonDisable2FA.classList.add("hidden");
        qrCodeContainer.innerHTML = "";
      } else {
        alert(dataDisable?.message);
      }
    } catch (error: any) {
      console.error(error);
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
      alert("Pas de token !");
      return;
    }
    localStorage.removeItem("auth_token");
    navigateTo("/");
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
