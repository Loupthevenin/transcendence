import { SinglePlayer, LocalGame, OnlineGame } from "../game/game";
import { subscribeTo, unsubscribeTo, isConnected } from "../websocketManager";
import nodeRemovalObserver from "../utils/nodeRemovalObserver";
import { isSidebarOpen, toggleSidebar } from "./navbar";

export function showGameModeSelectionMenu(): void {
  document.getElementById("menu-mode")?.classList.remove("hidden");
}

export function hideGameModeSelectionMenu(): void {
  document.getElementById("menu-mode")?.classList.add("hidden");
}

export function listenerButtonGameMode(): void {
  const modeActions: Record<string, () => void> = {
    "singleplayer": SinglePlayer,
    "local": LocalGame,
    "online": OnlineGame
  };

  Object.keys(modeActions).forEach((mode: string) => {
    const button: HTMLElement | null = document.getElementById("game-mode-" + mode);
    if (button) {
      const callback: () => void = modeActions[mode];
      button.addEventListener("click", () => {
        if (isSidebarOpen()) {
          toggleSidebar();
        }
        callback();
      });

      if (mode === "online") {
        setupOnlineButton(button);
      }
    }
  });

  showGameModeSelectionMenu();
}

// Setup the event and the nodeRemovalObserver of the online button
function setupOnlineButton(button: HTMLElement): void {
  // Set the current appearance
  updateOnlineButtonAppearance();

  subscribeTo("onConnected", updateOnlineButtonAppearance);
  subscribeTo("onDisconnected", updateOnlineButtonAppearance);

  nodeRemovalObserver(button, () => {
    // Unsubscribe from the event since the button has been removed
    unsubscribeTo("onConnected", updateOnlineButtonAppearance);
    unsubscribeTo("onDisconnected", updateOnlineButtonAppearance);
  });
}

// Update the appearance of the online button, when the user connects/disconnects from the websocket
function updateOnlineButtonAppearance(): void {
  const onlineButton: HTMLElement | null = document.getElementById("game-mode-online");
  if (onlineButton) {
    if (isConnected()) {
      onlineButton.classList.remove("bg-gray-400", "cursor-not-allowed", "hover:bg-gray-400");
      onlineButton.classList.add("bg-indigo-700", "hover:bg-indigo-800");
    } else {
      onlineButton.classList.add("bg-gray-400", "cursor-not-allowed", "hover:bg-gray-400");
      onlineButton.classList.remove("bg-indigo-700", "hover:bg-indigo-800");
    }
  }
}
