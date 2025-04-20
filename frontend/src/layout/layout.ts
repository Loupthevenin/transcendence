import { Sidebar } from "../components/sidebar";

export function MainLayout(...contents: HTMLElement[]): HTMLElement {
  const container: HTMLElement = Sidebar();

  contents.forEach((el: HTMLElement) => {
    container.appendChild(el);
  });

  return container;
}
