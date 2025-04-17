export async function showBlockedUsersModal(): Promise<void> {
    const backdrop = document.createElement("div");
    backdrop.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    backdrop.id = "blocked-users-backdrop";
  
    const modal = document.createElement("div");
    modal.className = "bg-white p-6 rounded-lg text-black w-96 max-h-[80vh] overflow-y-auto flex flex-col gap-4";
    modal.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-center">Utilisateurs bloqués</h2>
      <div id="blocked-users-list" class="flex flex-col gap-4"></div>
      <button id="close-blocked-users" class="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
        Fermer
      </button>
    `;
  
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  
    modal.querySelector("#close-blocked-users")?.addEventListener("click", () => backdrop.remove());
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) backdrop.remove(); });
  
    const listContainer = modal.querySelector("#blocked-users-list") as HTMLDivElement;
  
    try {
      const res = await fetch("/api/block-user", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
  
      if (!res.ok) throw new Error("Failed to load blocked users");
  
      const blockedUsers = await res.json() as { id: number; name: string; avatar_url: string }[];
  
      if (blockedUsers.length === 0) {
        listContainer.innerHTML = "<p class='text-center text-gray-500'>Aucun utilisateur bloqué.</p>";
        return;
      }
  
      for (const user of blockedUsers) {
        const userDiv = document.createElement("div");
        userDiv.className = "flex items-center justify-between";
  
        userDiv.innerHTML = `
          <div class="flex items-center gap-4">
            <img src="${user.avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" class="w-10 h-10 rounded-full object-cover" alt="Avatar">
            <span class="font-semibold">${user.name}</span>
          </div>
          <button class="unblock-btn bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" data-user-id="${user.id}">
            Débloquer
          </button>
        `;
  
        listContainer.appendChild(userDiv);
      }
  
      listContainer.querySelectorAll<HTMLButtonElement>(".unblock-btn").forEach((button) => {
        button.addEventListener("click", async () => {
          const userId = button.getAttribute("data-user-id");
          if (!userId) return;
  
          const confirmed = confirm("Veux-tu vraiment débloquer cet utilisateur ?");
          if (!confirmed) return;
  
          try {
            const unblockRes = await fetch("/api/block-user/unblock", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
              },
              body: JSON.stringify({ targetUserId: Number(userId) }),
            });
  
            if (!unblockRes.ok) throw new Error("Failed to unblock user");
  
            alert("Utilisateur débloqué !");
            button.parentElement?.remove();
  
            if (listContainer.children.length === 0) {
              listContainer.innerHTML = "<p class='text-center text-gray-500'>Aucun utilisateur bloqué.</p>";
            }
          } catch (err) {
            console.error("Error unblocking user", err);
            alert("Erreur lors du déblocage.");
          }
        });
      });
    } catch (err) {
      console.error("Error loading blocked users", err);
      listContainer.innerHTML = "<p class='text-center text-red-500'>Erreur de chargement.</p>";
    }
  }
  
  export async function refreshBlockButtons(targetUuid: string) {
    const res = await fetch(`/api/block-user/status/${targetUuid}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
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
  