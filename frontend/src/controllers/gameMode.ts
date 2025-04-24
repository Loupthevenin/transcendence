import { BackToMenu, SinglePlayer, LocalGame, OnlineGame } from "../game/game";
import { subscribeTo, unsubscribeTo, isConnected } from "../websocketManager";
import nodeRemovalObserver from "../utils/nodeRemovalObserver";

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

// Setup the event and the nodeRemovalObserver of the online button
function setupOnlineButton(button: HTMLElement): void {
  // Define the default appearance
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
