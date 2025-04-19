import { SinglePlayer, LocalGame, OnlineGame } from "../game/game";
import { ButtonMode } from "../components/buttonMode";
import { navigateTo } from "../router";

function isAuthenticated(): boolean {
  return !!localStorage.getItem("auth_token");
}

export function listenerButtonGameMode() {
  const modes = ["singleplayer", "local", "online"];
  const menu: HTMLElement | null = document.getElementById("menu-mode");
  if (!menu) return;

  modes.forEach((mode) => {
    const button = document.getElementById(mode);
    if (button) {
      if (mode === "online" && !isAuthenticated()) {
        button.classList.add(
          "bg-gray-400",
          "cursor-not-allowed",
          "hover:bg-gray-400",
        );
        button.classList.remove("bg-indigo-700", "hover:bg-indigo-800");
      }
      button.addEventListener("click", () => {
        if (mode === "online" && !isAuthenticated()) {
          alert("Vous devez être authentifié pour jouer en ligne.");
          return;
        }

        menu.innerHTML = "";
        const backMenu: HTMLElement = ButtonMode("back to menu");
        menu.appendChild(backMenu);
        backMenu.addEventListener("click", () => {
          navigateTo("/");
        });

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
