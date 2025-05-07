import { ButtonMode } from "../components/buttonMode";

export function ModeLayout(): HTMLElement {
  const container: HTMLElement = document.createElement("div");
  container.className =
    "absolute right-8 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4 z-1001";
  container.id = "menu-mode";

  container.appendChild(ButtonMode("singleplayer"));
  container.appendChild(ButtonMode("local"));
  container.appendChild(ButtonMode("online"));

  return container;
}
