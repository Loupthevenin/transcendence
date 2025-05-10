import { navigateTo } from "../router";
import { sendMessage, subscribeTo } from "../websocketManager";
import { getUserInfoFromToken } from "../utils/getUserInfoFromToken";
import {
  isNewMsgReceivedMessage,
  isInviteToGameMessage,
  NewMsgSendMessage,
  isStartGameRedirectMessage,
} from "@shared/chat/chatMessageTypes";
import { openInviteToGameModal } from "../controllers/InviteGame";
import { showBlockedUsersModal } from "../controllers/blockedUser";
import { showPublicProfile } from "../controllers/publicProfile";
import {
  loadChatList as fetchChatList,
  createOrGetChatRoom,
  loadChatRoomMessages,
} from "../controllers/chatService";
import { setReadyToPlaySent } from "../utils/chatUtils";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../components/showNotificationToast";

const SELF_MSG_BOX: string = "self-end bg-[#6366f1] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";
const OTHER_MSG_BOX: string = "self-start bg-[#6d28d9] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";

let currentMessageList: HTMLUListElement | null = null;
let currentOtherUserId: number | null = null;
let currentOtherUserUuid: string | null = null;
let currentRoomId: number | null = null;

export function setupChat(container: HTMLElement): void {
  const chatApp = container.querySelector("#chat-app");
  const notConnected = container.querySelector("#not-connected-screen");
  console.log("chatApp =", chatApp, "notConnected =", notConnected);

  const searchInput = container.querySelector("#user-search-input");

  const token = localStorage.getItem("auth_token");

  if (!token) {
    chatApp?.classList.add("hidden");
    notConnected?.classList.remove("hidden");
    searchInput?.classList.add("hidden");
    container
      .querySelector("#login-btn")
      ?.addEventListener("click", () => navigateTo("/auth/login"));
    return;
  }

  chatApp?.classList.remove("hidden");
  notConnected?.classList.add("hidden");
  searchInput?.classList.remove("hidden");
  setReadyToPlaySent(false);

  setupSidebarMenu();
  setupDropdownMenu();
  setupSearchInput();
  setupWebSocketEvents();
  renderChatList();
}

function setupWebSocketEvents(): void {
  subscribeTo("chat", (data) => {
    if (isInviteToGameMessage(data))
      return openInviteToGameModal(data.from, data.userId);
    if (isStartGameRedirectMessage(data)) {
      localStorage.setItem("opponentUuid", data.userId);
      localStorage.setItem("returnTo", window.location.pathname);
      navigateTo("/game");
      return;
    }
    if (isNewMsgReceivedMessage(data)) {
      if (data.roomId === currentRoomId && currentMessageList) {
        const li = document.createElement("li");
        li.className = OTHER_MSG_BOX;
        li.textContent = data.msg;
        currentMessageList.appendChild(li);
        currentMessageList.scrollTop = currentMessageList.scrollHeight;
        return;
      }

      const chatItem = document.querySelector(
        `li[data-room-id='${data.roomId}']`,
      );
      if (chatItem && !chatItem.querySelector(".new-msg-badge")) {
        const badge = document.createElement("span");
        badge.className =
          "new-msg-badge bg-red-600 text-white text-xs px-2 py-1 rounded-full ml-auto";
        badge.textContent = "Nouveau";
        chatItem.appendChild(badge);
      }
    }
  });
}

function setupSidebarMenu(): void {
  const sidebarMenuBtn = document.getElementById("menu-sidebar");
  if (!sidebarMenuBtn) return;

  sidebarMenuBtn.addEventListener("click", () => {
    const existing = document.getElementById("sidebar-options-menu");
    if (existing) return existing.remove();

    const menu = document.createElement("div");
    menu.id = "sidebar-options-menu";
    menu.className =
      "absolute right-6 mt-2 w-48 bg-white text-black rounded shadow-lg z-50";
    menu.innerHTML = `<button id="sidebar-manage-blocked-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">🚫 Gérer mes blocages</button>`;

    document.body.appendChild(menu);

    document
      .getElementById("sidebar-manage-blocked-btn")
      ?.addEventListener("click", () => {
        menu.remove();
        showBlockedUsersModal();
      });

    document.addEventListener(
      "click",
      (ev) => {
        if (!menu.contains(ev.target as Node) && ev.target !== sidebarMenuBtn)
          menu.remove();
      },
      { once: true },
    );
  });
}

function setupDropdownMenu(): void {
  const optionsBtn = document.getElementById("chat-options-btn");
  const optionsMenu = document.getElementById("chat-options-menu");
  const manageBlockedBtn = document.getElementById("manage-blocked-btn");

  if (!optionsBtn || !optionsMenu || !manageBlockedBtn) return;

  optionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    optionsMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    optionsMenu.classList.add("hidden");
  });

  manageBlockedBtn.addEventListener("click", () => {
    optionsMenu.classList.add("hidden");
    showBlockedUsersModal();
  });
}

function setupSearchInput(): void {
  const searchInput = document.getElementById(
    "user-search-input",
  ) as HTMLInputElement;
  const resultsContainer = document.getElementById(
    "search-results",
  ) as HTMLUListElement;

  if (!searchInput || !resultsContainer) return;

  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    if (!query) return (resultsContainer.innerHTML = "");

    try {
      const token: string | null = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Pas de token !");
        throw new Error("No token");
      }

      const res = await fetch(
        `/api/search-user/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok) throw new Error();

      const users = (await res.json()) as {
        id: number;
        name: string;
        avatar_url: string;
      }[];
      resultsContainer.innerHTML = "";

      for (const user of users) {
        const li = document.createElement("li");
        li.className =
          "flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#2a255c]";
        li.innerHTML = `<img src="${user.avatar_url}" class="w-8 h-8 rounded-full object-cover" /><span>${user.name}</span>`;

        li.addEventListener("click", async () => {
          resultsContainer.innerHTML = "";
          searchInput.value = "";
          await handleNewChat(user.id);
        });

        resultsContainer.appendChild(li);
      }
    } catch (error: any) {
      console.error("Error searching users", error);
      resultsContainer.innerHTML =
        "<li class='text-red-400 px-2'>Erreur de recherche</li>";
    }
  });
}

async function renderChatList(): Promise<void> {
  const list = document.getElementById("chat-list");
  if (!list) return;

  try {
    const chatrooms = await fetchChatList();
    list.innerHTML = "";

    for (const room of chatrooms) {
      const li = document.createElement("li");
      li.className =
        "flex items-center gap-4 p-2 rounded-lg hover:bg-[#2a255c] cursor-pointer transition";
      li.dataset.roomId = room.roomId.toString();

      const img = document.createElement("img");
      img.src =
        room.otherUserAvatar ??
        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
      img.className = "w-10 h-10 rounded-full object-cover";
      img.alt = "Avatar";

      const userInfoDiv = document.createElement("div");
      userInfoDiv.className = "flex flex-col";
      userInfoDiv.innerHTML = `
        <span class="font-semibold">${room.otherUserName}</span>
        <span class="text-xs text-gray-400">${new Date(room.lastMessageAt).toLocaleString()}</span>
      `;

      li.appendChild(img);
      li.appendChild(userInfoDiv);

      li.addEventListener("click", () => {
        openChatWindow(
          room.roomId,
          room.otherUserName,
          room.otherUserEmail,
          room.otherUserAvatar,
          room.otherUserId,
          room.otherUserUuid,
        );
      });

      list.appendChild(li);
    }
  } catch (error: any) {
    console.error("Erreur chargement chat list", error);
  }
}

async function handleNewChat(receiverId: number): Promise<void> {
  try {
    const {
      roomId,
      otherUserName,
      otherUserAvatar,
      otherUserEmail,
      otherUserId,
      otherUserUuid,
    } = await createOrGetChatRoom(receiverId);
    openChatWindow(
      roomId,
      otherUserName,
      otherUserEmail,
      otherUserAvatar,
      otherUserId,
      otherUserUuid,
    );
  } catch (error: any) {
    console.error("Failed to create or join chatroom", error);
    showErrorToast("Impossible d'ouvrir une conversation");
  }
}

export async function openChatWindow(
  roomId: number,
  otherUserName: string,
  receiverEmail: string,
  avatar_url: string | null,
  otherUserId: number,
  otherUserUuid: string,
): Promise<void> {
  const chatsContainer = document.getElementById("chats");
  if (!chatsContainer) return;

  chatsContainer.innerHTML = "";
  currentRoomId = roomId;
  currentOtherUserId = otherUserId;
  currentOtherUserUuid = otherUserUuid;

  const chatBox = document.createElement("div");
  chatBox.className =
    "flex flex-col flex-1 h-full min-h-0 bg-[#1e1b4b] rounded-2xl m-4 p-4 shadow-lg";
  chatBox.innerHTML = `
  <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <img id="chat-avatar" class="w-10 h-10 rounded-full object-cover cursor-pointer" src="${avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" alt="Avatar">
        <h2 id="chat-username" class="text-lg font-semibold">${otherUserName}</h2>
      </div>
      <div class="relative">
        <button id="chat-menu-btn" class="text-xl">⋮</button>
        <div id="chat-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#1e1b4b] text-white rounded shadow-lg z-50">
          <button id="view-profile-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">👤 Voir le profil</button>
          <button id="block-user-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">Chargement...</button>
        <button id="invite-to-game-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">🎮 Inviter à un match</button>
        </div>
      </div>
    </div>
    <ul id="chat-messages" class="flex flex-col flex-grow overflow-y-auto bg-[#2e2c60] rounded-xl p-4 mb-4 text-white"></ul>
  <form id="chat-form" class="flex gap-2">
    <input type="text" class="flex-1 border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Message..." />
    <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Send</button>
  </form>
  `;

  chatsContainer.appendChild(chatBox);
  const list = chatBox.querySelector("#chat-messages") as HTMLUListElement;
  currentMessageList = list;

  const chatItem = document.querySelector(`li[data-room-id='${roomId}']`);
  chatItem?.querySelector(".new-msg-badge")?.remove();

  chatBox.querySelector("#chat-avatar")?.addEventListener("click", () => {
    if (currentOtherUserId !== null) showPublicProfile(currentOtherUserId);
  });

  const menuBtn = chatBox.querySelector("#chat-menu-btn") as HTMLButtonElement;
  const dropdown = chatBox.querySelector(
    "#chat-menu-dropdown",
  ) as HTMLDivElement;

  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("hidden");
  });
  document.addEventListener("click", () => dropdown.classList.add("hidden"));

  chatBox.querySelector("#view-profile-btn")?.addEventListener("click", () => {
    if (currentOtherUserId !== null) showPublicProfile(currentOtherUserId);
  });

  const inviteBtn = chatBox.querySelector(
    "#invite-to-game-btn",
  ) as HTMLButtonElement;
  inviteBtn.addEventListener("click", async () => {
    try {
      const token: string | null = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Pas de token !");
        throw new Error("No token");
      }

      const res = await fetch("/api/invite-to-game", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserUuid: currentOtherUserUuid }),
      });

      console.log(">> Envoi invitation à :", currentOtherUserUuid);
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 404 && text.includes("not connected")) {
          showInfoToast("L'utilisateur n'est pas en ligne.");
        } else {
          throw new Error("Erreur d'invitation");
        }
      } else {
        showSuccessToast("Invitation envoyée 🎮");
      }
    } catch (error: any) {
      console.error("Erreur d'envoi d'invitation:", error);
      showErrorToast("Erreur lors de l'envoi de l'invitation");
    }
  });

  const blockBtn = chatBox.querySelector(
    "#block-user-btn",
  ) as HTMLButtonElement;

  const updateBlockButton = (isBlocked: boolean) => {
    blockBtn.textContent = isBlocked
      ? "✅ Débloquer cet utilisateur"
      : "🚫 Bloquer cet utilisateur";
    blockBtn.className = `w-full text-left px-4 py-2 hover:bg-gray-200 ${isBlocked ? "text-green-500" : "text-red-500"}`;
  };

  const toggleBlock = async (isBlocked: boolean) => {
    const confirmMsg = isBlocked
      ? "Veux-tu vraiment débloquer cet utilisateur ?"
      : "Veux-tu vraiment le bloquer ?";
    if (!confirm(confirmMsg)) return;

    try {
      const token: string | null = localStorage.getItem("auth_token");
      if (!token) {
        showErrorToast("Pas de token !");
        throw new Error("No token");
      }

      const endpoint = isBlocked
        ? "/api/block-user/unblock"
        : "/api/block-user";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId: currentOtherUserId }),
      });

      if (!response.ok) throw new Error("Erreur blocage/déblocage");
      showSuccessToast(
        isBlocked ? "Utilisateur débloqué ✅" : "Utilisateur bloqué 🚫",
      );

      updateBlockButton(!isBlocked);
      blockBtn.onclick = () => toggleBlock(!isBlocked);
    } catch (error: any) {
      console.error("Erreur blocage:", error);
      showErrorToast("Erreur lors de l'action de blocage/déblocage");
    }
  };

  try {
    const token: string | null = localStorage.getItem("auth_token");
    if (!token) {
      showErrorToast("Pas de token !");
      throw new Error("No token");
    }

    const res = await fetch(
      `/api/block-user/is-blocked?targetUserId=${currentOtherUserId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const { blocked } = await res.json();
    updateBlockButton(blocked);
    blockBtn.onclick = () => toggleBlock(blocked);
  } catch (error: any) {
    updateBlockButton(false);
    blockBtn.onclick = () => toggleBlock(false);
  }

  try {
    const messages = await loadChatRoomMessages(roomId);
    messages.forEach((msg) => {
      const li = document.createElement("li");
      li.textContent = msg.content;
      li.className =
        msg.sender_id === currentOtherUserId
          ? OTHER_MSG_BOX
          : SELF_MSG_BOX;
      list.appendChild(li);
    });
    list.scrollTop = list.scrollHeight;
  } catch (error: any) {
    console.error("Erreur chargement messages", error);
  }

  const form = chatBox.querySelector("#chat-form") as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    const user = getUserInfoFromToken();
    if (!user) return showErrorToast("Utilisateur non authentifié");

    const newMessage: NewMsgSendMessage = {
      type: "newMessageSend",
      senderEmail: user.email,
      senderName: user.name,
      receiverEmail,
      msg,
    };

    sendMessage("chat", newMessage);

    const li = document.createElement("li");
    li.className = SELF_MSG_BOX;
    li.textContent = msg;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
    input.value = "";
  });
}
