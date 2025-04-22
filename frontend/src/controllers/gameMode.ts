import { BackToMenu, SinglePlayer, LocalGame, OnlineGame } from "../game/game";
import { subscribeTo, unsubscribeTo, isConnected } from "../websocketManager";

const menuDisplayConfig: Record<string, Record<string, string>> = {
  "showMenu": {
    "back to menu": "none",
    "singleplayer": "inline-block",
    "local": "inline-block",
    "online": "inline-block"
  },
  "showInGameMenu": {
    "back to menu": "inline-block",
    "singleplayer": "none",
    "local": "none",
    "online": "none"
  }
};

function applyButtonConfig(config: Record<string, string>): void {
  Object.entries(config).forEach(([id, display] : [string, string]) => {
    const button: HTMLElement | null = document.getElementById(id);
    if (button) {
      button.style.display = display;
    }
  });
}

export function showMenu(): void {
  applyButtonConfig(menuDisplayConfig["showMenu"]);
}

export function showInGameMenu(): void {
  applyButtonConfig(menuDisplayConfig["showInGameMenu"]);
}

export function listenerButtonGameMode(): void {
  const modeActions: Record<string, () => void> = {
    "back to menu": BackToMenu,
    "singleplayer": SinglePlayer,
    "local": LocalGame,
    "online": OnlineGame
  };

  Object.keys(modeActions).forEach((mode: string) => {
    const button: HTMLElement | null = document.getElementById(mode);
    if (button) {
      button.addEventListener("click", modeActions[mode]);

      if (mode == "online") {
        setupOnlineButton(button);
      }
    }
  });

  showMenu();
}

// Setup the event and the MutationObserver of the online button
function setupOnlineButton(button: HTMLElement | null): void {
  // Define the default appearance
  updateOnlineButtonAppearance();

  subscribeTo("onConnected", updateOnlineButtonAppearance);
  subscribeTo("onDisconnected", updateOnlineButtonAppearance);

  // Create MutationObserver to detect when the online button is removed
  const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
    for (let mutation of mutations) {
      for (let node of mutation.removedNodes) {
        if (node.contains(button)) {
          // Unsubscribe from the event since the button has been removed
          unsubscribeTo("onConnected", updateOnlineButtonAppearance);
          unsubscribeTo("onDisconnected", updateOnlineButtonAppearance);

          observer.disconnect(); // Stop observing once cleanup is done
          return; // Exit all loops immediately
        }
      }
    }
  });

  observer.observe(document.body, { childList: true });
}

// Update the appearance of the online button, when the user connects/disconnects from the websocket
function updateOnlineButtonAppearance(): void {
  const onlineButton: HTMLElement | null = document.getElementById("online");
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
