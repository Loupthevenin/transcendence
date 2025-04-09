import { navigateTo } from "../router";

export function initSideBarNavigation(): void {
  const sidebar = document.getElementById("sidebar");
  const toggleButton = document.getElementById("sidebarToggle");

  if (!sidebar || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("translate-x-0");
    sidebar.classList.toggle("-translate-x-full");
  });

  sidebar.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", (event: Event) => {
      const target = event.currentTarget as HTMLButtonElement;
      const section = target.dataset.target;
      if (section) {
        navigateTo(`/${section}`);
        sidebar.classList.add("-translate-x-full");
        sidebar.classList.remove("translate-x-0");
      }
    });
  });
}
