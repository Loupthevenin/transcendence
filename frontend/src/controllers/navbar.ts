export function initSideBarNavigation(): void {
  const sidebar: HTMLElement | null = document.getElementById("sidebar");
  const toggleButton: HTMLElement | null = document.getElementById("sidebarToggle");

  if (!sidebar || !toggleButton) return;

  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("translate-x-0");
    sidebar.classList.toggle("-translate-x-full");
  });

  sidebar.querySelectorAll(".nav-link").forEach((button: Element) => {
    button.addEventListener("click", (event: Event) => {
      const target: HTMLButtonElement = event.currentTarget as HTMLButtonElement;
      const section: string | undefined = target.dataset.target;
      if (section) {
        sidebar.classList.add("-translate-x-full");
        sidebar.classList.remove("translate-x-0");
      }
    });
  });
}
