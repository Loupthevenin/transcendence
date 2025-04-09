import { Sidebar } from "../components/sidebar";
import { CreateGameCanvas, InitGame } from "../game/game";

export function MainLayout(content?: HTMLElement): HTMLElement {
  const container = Sidebar();

  CreateGameCanvas();
  InitGame();

  if (content) {
    container.appendChild(content);
  }

  return container;
}
