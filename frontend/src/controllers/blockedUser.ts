import {
  showErrorToast,
  showSuccessToast,
} from "../components/showNotificationToast";

export async function showBlockedUsersModal(): Promise<void> {
  const backdrop = document.createElement("div");
  backdrop.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  backdrop.id = "blocked-users-backdrop";

  const modal = document.createElement("div");
  modal.className =
    "bg-white p-6 rounded-lg text-black w-96 max-h-[80vh] overflow-y-auto flex flex-col gap-4";
  modal.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-center">Utilisateurs bloqués</h2>
      <div id="blocked-users-list" class="flex flex-col gap-4"></div>
      <button id="close-blocked-users" class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
        Fermer
      </button>
    `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  modal
    .querySelector("#close-blocked-users")
    ?.addEventListener("click", () => backdrop.remove());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

  const listContainer = modal.querySelector(
    "#blocked-users-list",
  ) as HTMLDivElement;

  try {
    const token: string | null = localStorage.getItem("auth_token");
    if (!token) {
      showErrorToast("Pas de token !");
      throw new Error("No token");
    }

    const res = await fetch("/api/block-user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to load blocked users");

    const blockedUsers = (await res.json()) as {
      id: number;
      name: string;
      avatar_url: string;
    }[];

    if (blockedUsers.length === 0) {
      listContainer.innerHTML =
        "<p class='text-center text-gray-500'>Aucun utilisateur bloqué.</p>";
      return;
    }

    for (const user of blockedUsers) {
      const userDiv = document.createElement("div");
      userDiv.className = "flex items-center justify-between";

      const tempWrapper: HTMLDivElement = document.createElement("div");
      tempWrapper.innerHTML = `
          <div class="flex items-center gap-4">
            <img src="${user.avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">
            <span class="font-semibold"></span>
          </div>
          <button class="unblock-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" data-user-id="${user.id}">
            Débloquer
          </button>
        `;

      const span = tempWrapper.querySelector("span");
      if (span) span.textContent = user.name;

      while (tempWrapper.firstChild) {
        userDiv.appendChild(tempWrapper.firstChild);
      }

      listContainer.appendChild(userDiv);
    }

    listContainer
      .querySelectorAll<HTMLButtonElement>(".unblock-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const userId = button.getAttribute("data-user-id");
          if (!userId) return;

          const confirmed = confirm(
            "Veux-tu vraiment débloquer cet utilisateur ?",
          );
          if (!confirmed) return;

          try {
            const token: string | null = localStorage.getItem("auth_token");
            if (!token) {
              showErrorToast("Pas de token !");
              throw new Error("No token");
            }

            const unblockRes = await fetch("/api/block-user/unblock", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ targetUserId: Number(userId) }),
            });

            if (!unblockRes.ok) throw new Error("Failed to unblock user");

            showSuccessToast("Utilisateur débloqué !");
            button.parentElement?.remove();
            emitBlockStatusChanged({
              userId: Number(userId),
              uuid: "unknown",
              blocked: false,
            });

            if (listContainer.children.length === 0) {
              listContainer.innerHTML =
                "<p class='text-center text-gray-500'>Aucun utilisateur bloqué.</p>";
            }
          } catch (error: any) {
            console.error("Error unblocking user", error);
            showErrorToast("Erreur lors du déblocage.");
          }
        });
      });
  } catch (error: any) {
    console.error("Error loading blocked users", error);
    showErrorToast("Erreur de chargement.");
    listContainer.innerHTML =
      "<p class='text-center text-red-500'>Erreur de chargement.</p>";
  }
}

export async function refreshBlockButtons(targetUuid: string) {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showErrorToast("Pas de token !");
    return;
  }

  const res = await fetch(`/api/block-user/status/${targetUuid}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return;

  const { blocked } = await res.json();

  const menuBtn = document.getElementById("block-btn-menu");
  if (menuBtn) {
    menuBtn.textContent = blocked ? "Débloquer" : "Bloquer";
    menuBtn.dataset.blocked = String(blocked);
  }
}

export async function setupBlockFeature(container: HTMLElement, userId: number) {
  const blockBtn = container.querySelector("#block-user-btn") as HTMLButtonElement;
  const form = container.querySelector("#chat-form") as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;
  const sendBtn = form.querySelector("button") as HTMLButtonElement;

  const updateUI = (isBlocked: boolean) => {
    blockBtn.textContent = isBlocked ? "✅ Débloquer cet utilisateur" : "🚫 Bloquer cet utilisateur";
    blockBtn.className = `w-full text-left px-4 py-2 hover:bg-gray-200 ${isBlocked ? "text-green-500" : "text-red-500"}`;

    input.disabled = isBlocked;
    sendBtn.disabled = isBlocked;
    sendBtn.classList.toggle("opacity-50", isBlocked);
    sendBtn.classList.toggle("cursor-not-allowed", isBlocked);
    input.placeholder = isBlocked ? "Vous avez bloqué cet utilisateur." : "Message...";

    const infoMsg = container.querySelector(".text-red-400.text-sm");
    if (isBlocked && !infoMsg) {
      const msg = document.createElement("div");
      msg.className = "text-center text-sm text-red-400 mb-2 font-medium";
      msg.textContent = "Cet utilisateur a été bloqué. Vous ne pouvez plus envoyer de messages.";
      form.parentElement?.insertBefore(msg, form);
    } else if (!isBlocked && infoMsg) {
      infoMsg.remove();
    }
  };

  const toggleBlock = async (isBlocked: boolean) => {
    const confirmMsg = isBlocked ? "Débloquer cet utilisateur ?" : "Bloquer cet utilisateur ?";
    if (!confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No token");

      const endpoint = isBlocked ? "/api/block-user/unblock" : "/api/block-user";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!res.ok) throw new Error("Erreur blocage/déblocage");
      showSuccessToast(isBlocked ? "Utilisateur débloqué ✅" : "Utilisateur bloqué 🚫");

      updateUI(!isBlocked);
      blockBtn.onclick = () => toggleBlock(!isBlocked);
    } catch (err) {
      console.error(err);
      showErrorToast("Erreur lors de l'action de blocage");
    }
  };

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("No token");
    const res = await fetch(`/api/block-user/is-blocked?targetUserId=${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { blocked } = await res.json();
    updateUI(blocked);
    blockBtn.onclick = () => toggleBlock(blocked);
    onBlockStatusChanged((event) => {
      if (event.userId === userId) {
        updateUI(event.blocked);
        blockBtn.onclick = () => toggleBlock(event.blocked);
      }
    });
  } catch (err) {
    updateUI(false);
    blockBtn.onclick = () => toggleBlock(false);
  }
}


export type BlockStatusEvent = {
  userId: number;
  uuid: string;
  blocked: boolean;
};

export function emitBlockStatusChanged(event: BlockStatusEvent) {
  window.dispatchEvent(new CustomEvent("blockStatusChanged", { detail: event }));
}

export function onBlockStatusChanged(callback: (event: BlockStatusEvent) => void) {
  window.addEventListener("blockStatusChanged", (e: Event) => {
    const custom = e as CustomEvent<BlockStatusEvent>;
    callback(custom.detail);
  });
}