import { Sidebar } from "../components/sidebar";

export function MainLayout(content?: HTMLElement): HTMLElement {
  const container = Sidebar();

  const canvas = document.createElement("canvas");
  canvas.id = "renderCanvas";

  container.appendChild(canvas);

  if (content) {
    container.appendChild(content);
  }

  return container;
}
