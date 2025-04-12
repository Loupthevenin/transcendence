import { Sidebar } from "../components/sidebar";

export function MainLayout(content?: HTMLElement): HTMLElement {
  const container: HTMLElement = Sidebar();

  if (content) {
    container.appendChild(content);
  }

  return container;
}
