import { navigateTo } from "../router";
import { sendMessage, subscribeTo, unsubscribeTo } from "../websocketManager";
import { getUserInfoFromToken } from "../utils/getUserInfoFromToken";
import {
  isNewMsgReceivedMessage,
  isInviteToGameMessage,
  isStartGameRedirectMessage,
} from "@shared/chat/chatMessageTypes";
import { openInviteToGameModal } from "../controllers/InviteGame";
import {
  showBlockedUsersModal,
  setupBlockFeature,
} from "../controllers/blockedUser";
import {
  loadChatList as fetchChatList,
  createOrGetChatRoom,
  setupChatMenu,
  loadAndDisplayMessages,
} from "../controllers/chatService";
import { setReadyToPlaySent, addHiddenRoomId, removeHiddenRoomId } from "../utils/chatUtils";
import { showErrorToast } from "../components/showNotificationToast";
import { createChatBox } from "../views/chat";
import ChatRoom from "@shared/chat/chatRoom";

const SELF_MSG_BOX: string =
  "self-end bg-[#6366f1] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";
const OTHER_MSG_BOX: string =
  "self-start bg-[#6d28d9] text-white px-4 py-2 rounded-xl max-w-xs mb-2 break-words";

let currentMessageList: HTMLUListElement | null = null;
let currentRoomId: number | null = null;
let chatCallback: ((data: any) => void) | null = null;

export function setupChat(container: HTMLElement): void {
  const chatApp = container.querySelector("#chat-app");
  const notConnected = container.querySelector("#not-connected-screen");

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
  if (chatCallback) {
    unsubscribeTo("chat", chatCallback);
  }

  chatCallback = (data: any) => {
    if (isInviteToGameMessage(data))
      return openInviteToGameModal(data.from, data.userUuid);
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
      const dot = chatItem?.querySelector(".new-msg-dot") as HTMLDivElement;

      if (dot && dot.classList.contains("hidden")) {
        dot.classList.remove("hidden");
      }
    }
  };
  subscribeTo("chat", chatCallback);
  // console.log("[WS] Subscribed new chat callback");
}

function setupSidebarMenu(): void {
  const sidebarMenuBtn = document.getElementById("menu-sidebar");
  const placeholder = document.getElementById("sidebar-menu-placeholder");

  if (!sidebarMenuBtn || !placeholder) return;

  sidebarMenuBtn.addEventListener("click", () => {
    const existing = document.getElementById("sidebar-options-menu");
    if (existing) return existing.remove();

    const menu = document.createElement("div");
    menu.id = "sidebar-options-menu";
    menu.className =
      "absolute right-6 mt-2 w-48 bg-[#2e2c60] text-white rounded shadow-lg z-50";
    menu.innerHTML = `<button id="sidebar-manage-blocked-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">🚫 Gérer mes blocages</button>`;

    placeholder.appendChild(menu);

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
        uuid: string;
        name: string;
        avatar_url: string;
      }[];
      resultsContainer.innerHTML = "";

      for (const user of users) {
        const li: HTMLLIElement = document.createElement("li");
        li.className =
          "flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-[#2a255c]";

        const img: HTMLImageElement = document.createElement("img");
        img.src = user.avatar_url;
        img.className = "w-8 h-8 rounded-full object-cover";

        const span: HTMLSpanElement = document.createElement("span");
        span.textContent = user.name;

        li.appendChild(img);
        li.appendChild(span);

        li.addEventListener("click", async () => {
          resultsContainer.innerHTML = "";
          searchInput.value = "";
          await handleNewChat(user.uuid);
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

function setupChatForm(container: HTMLElement, receiverEmail: string) {
  const form = container.querySelector("#chat-form") as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;
  const list = container.querySelector("#chat-messages") as HTMLUListElement;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    const user = getUserInfoFromToken();
    if (!user) return showErrorToast("Utilisateur non authentifié");

    sendMessage("chat", {
      type: "newMessageSend",
      senderEmail: user.email,
      senderName: user.name,
      receiverEmail,
      msg,
    });

    const li = document.createElement("li");
    li.className = SELF_MSG_BOX;
    li.textContent = msg;
    list.appendChild(li);
    list.scrollTop = list.scrollHeight;
    input.value = "";
  });
}

async function renderChatList(): Promise<void> {
  const list = document.getElementById("chat-list");
  if (!list) return;

  try {
    const chatrooms: ChatRoom[] = await fetchChatList();
    list.innerHTML = "";

    for (const room of chatrooms) {
      const li = document.createElement("li");
      li.className =
        "relative flex items-center gap-4 p-2 rounded-lg hover:bg-[#2a255c] cursor-pointer transition";
      li.dataset.roomId = room.roomId.toString();

      const avatarContainer: HTMLDivElement = document.createElement("div");
      avatarContainer.className = "relative";

      const img = document.createElement("img");
      img.src =
        room.otherUserAvatar ??
        "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg";
      img.className = "w-10 h-10 rounded-full object-cover";
      img.alt = "Avatar";
      img.referrerPolicy = "no-referrer";
      img.onerror = () => {
        img.src = "/api/textures/avatar-default.svg";
      };

      const statusIndicator: HTMLDivElement = document.createElement("div");
      statusIndicator.className = "w-3 h-3 rounded-full absolute top-0 right-0";
      statusIndicator.style.backgroundColor = room.otherIsOnline ? "green" : "red";

      avatarContainer.appendChild(img);
      avatarContainer.appendChild(statusIndicator);

      const userInfoDiv: HTMLDivElement = document.createElement("div");
      userInfoDiv.className = "flex flex-col";

      const nameSpan: HTMLSpanElement = document.createElement("span");
      nameSpan.className = "font-semibold";
      nameSpan.textContent = room.otherUserName;

      const dateSpan: HTMLSpanElement = document.createElement("span");
      dateSpan.className = "text-xs text-gray-400";

      dateSpan.textContent = room.lastMessageAt
        ? new Date(room.lastMessageAt).toLocaleString()
        : "Pas encore de message";

      userInfoDiv.appendChild(nameSpan);
      userInfoDiv.appendChild(dateSpan);

      const deleteButton: HTMLButtonElement = document.createElement("button");
      deleteButton.className = "absolute top-4 right-4 text-gray-400 hover:text-white text-xl";
      deleteButton.textContent = "✖";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        addHiddenRoomId(room.roomId);
        li.remove(); 
        if (currentRoomId === room.roomId) {
          const chatContainer = document.getElementById("chats");
          if (chatContainer) chatContainer.innerHTML = "";
          currentRoomId = null;
        }
      });

      const newMessageDot = document.createElement("div");
      newMessageDot.className =
        "new-msg-dot hidden w-2 h-2 bg-red-500 rounded-full absolute top-2 right-2 z-10";
      li.appendChild(newMessageDot);

      li.appendChild(avatarContainer);
      li.appendChild(userInfoDiv);
      li.appendChild(deleteButton);

      img.parentElement?.appendChild(statusIndicator);

      li.addEventListener("click", () => {
        openChatWindow(
          room.roomId,
          room.otherUserName,
          room.otherUserEmail,
          room.otherUserAvatar,
          room.otherUserUuid,
        );
      });

      list.appendChild(li);
    }
  } catch (error: any) {
    console.error("Erreur chargement chat list", error);
  }
}

async function handleNewChat(receiverUuid: string): Promise<void> {
  try {
    const {
      roomId,
      otherUserName,
      otherUserAvatar,
      otherUserEmail,
      otherUserUuid,
    } = await createOrGetChatRoom(receiverUuid);
    openChatWindow(
      roomId,
      otherUserName,
      otherUserEmail,
      otherUserAvatar,
      otherUserUuid,
    );
    await renderChatList();
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
  otherUserUuid: string,
): Promise<void> {
  const chatsContainer = document.getElementById("chats");
  if (!chatsContainer) return;

  removeHiddenRoomId(roomId);

  chatsContainer.innerHTML = "";
  currentRoomId = roomId;
  const chatBox = createChatBox(otherUserName, avatar_url);
  chatsContainer.appendChild(chatBox);

  const list = chatBox.querySelector("#chat-messages") as HTMLUListElement;
  currentMessageList = list;

  document
    .querySelector(`li[data-room-id='${roomId}']`)
    ?.querySelector(".new-msg-dot")
    ?.classList.add("hidden");

  setupChatMenu(chatBox, otherUserUuid);
  await setupBlockFeature(chatBox, otherUserUuid);
  await loadAndDisplayMessages(roomId, list, otherUserUuid);
  setupChatForm(chatBox, receiverEmail);
}
