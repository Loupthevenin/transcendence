import { BackToMenu, SinglePlayer, LocalGame, OnlineGame } from "../game/game";
import { isConnected } from "../websocketManager";

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
  const modes: string[] = [
    "back to menu",
    "singleplayer",
    "local",
    "online"
  ];

  modes.forEach((mode: string) => {
    const button: HTMLElement | null = document.getElementById(mode);
    if (button) {
      if (mode === "online" && !isConnected()) {
        button.classList.add(
          "bg-gray-400",
          "cursor-not-allowed",
          "hover:bg-gray-400",
        );
        button.classList.remove("bg-indigo-700", "hover:bg-indigo-800");
      }

      button.addEventListener("click", () => {
        switch (mode) {
          case "back to menu":
            BackToMenu();
            break;

          case "singleplayer":
            SinglePlayer();
            break;

          case "local":
            LocalGame();
            break;

          case "online":
            if (isConnected()) {
              OnlineGame();
            } else {
              alert("Vous devez être authentifié pour jouer en ligne.");
            }
            break;
        }
      });
    }
  });

  showMenu();
}
