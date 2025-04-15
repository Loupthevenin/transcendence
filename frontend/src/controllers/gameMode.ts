import { SinglePlayer, LocalGame, OnlineGame } from "../game/game";

export function listenerButtonGameMode() {
  const modes = ["singleplayer", "local", "online"];

  modes.forEach((mode) => {
    const button = document.getElementById(mode);
    if (button) {
      button.addEventListener("click", () => {
        switch (mode) {
          case "singleplayer":
            SinglePlayer();
            break;
          case "local":
            LocalGame();
            break;
          case "online":
            OnlineGame();
            break;
        }
      });
    }
  });
}
