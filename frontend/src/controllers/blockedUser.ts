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

  const title = document.createElement("h2");
  title.className = "text-2xl font-bold mb-4 text-center";
  title.textContent = "Utilisateurs bloqués";

  const listContainer = document.createElement("div");
  listContainer.id = "blocked-users-list";
  listContainer.className = "flex flex-col gap-4";

  const closeBtn = document.createElement("button");
  closeBtn.id = "close-blocked-users";
  closeBtn.className = "w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded";
  closeBtn.textContent = "Fermer";

  modal.appendChild(title);
  modal.appendChild(listContainer);
  modal.appendChild(closeBtn);
  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  closeBtn.addEventListener("click", () => backdrop.remove());
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });

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
      uuid: string;
      name: string;
      avatar_url: string;
    }[];

    if (blockedUsers.length === 0) {
      const p = document.createElement("p");
      p.className = "text-center text-gray-500";
      p.textContent = "Aucun utilisateur bloqué.";
      listContainer.appendChild(p);
      return;
    }

    for (const user of blockedUsers) {
      const userDiv = document.createElement("div");
      userDiv.className = "flex items-center justify-between";

      const userInfo = document.createElement("div");
      userInfo.className = "flex items-center gap-4";

      const avatar = document.createElement("img");
      avatar.src = user.avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
      avatar.className = "w-10 h-10 rounded-full object-cover";
      avatar.alt = "Avatar";

      const name = document.createElement("span");
      name.className = "font-semibold";
      name.textContent = user.name;

      userInfo.appendChild(avatar);
      userInfo.appendChild(name);

      const unblockBtn = document.createElement("button");
      unblockBtn.className = "unblock-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded";
      unblockBtn.dataset.userUuid = user.uuid;
      unblockBtn.textContent = "Débloquer";

      userDiv.appendChild(userInfo);
      userDiv.appendChild(unblockBtn);
      listContainer.appendChild(userDiv);
    }

    listContainer
      .querySelectorAll<HTMLButtonElement>(".unblock-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const userUuid = button.getAttribute("data-user-uuid");
          if (!userUuid) return;

          const confirmed = confirm("Veux-tu vraiment débloquer cet utilisateur ?");
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
              body: JSON.stringify({ targetUserUuid: userUuid }),
            });

            if (!unblockRes.ok) throw new Error("Failed to unblock user");

            showSuccessToast("Utilisateur débloqué !");
            button.parentElement?.parentElement?.remove();
            emitBlockStatusChanged({ uuid: userUuid, blocked: false });

            if (!listContainer.children.length) {
              const p = document.createElement("p");
              p.className = "text-center text-gray-500";
              p.textContent = "Aucun utilisateur bloqué.";
              listContainer.appendChild(p);
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
    const p = document.createElement("p");
    p.className = "text-center text-red-500";
    p.textContent = "Erreur de chargement.";
    listContainer.appendChild(p);
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

export async function setupBlockFeature(container: HTMLElement, userUuid: string) {
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
        body: JSON.stringify({ targetUserUuid: userUuid }),
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
    const res = await fetch(`/api/block-user/is-blocked?targetUserUuid=${userUuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { blocked } = await res.json();
    updateUI(blocked);
    blockBtn.onclick = () => toggleBlock(blocked);
    onBlockStatusChanged((event) => {
      if (event.uuid === userUuid) {
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