let sidebar: HTMLElement | null = null;
let isAnimate: boolean = false;

export function initSideBarNavigation(): void {
  sidebar = document.getElementById("sidebar");
  const sidebarToggle: HTMLElement | null = document.getElementById("sidebarToggle");

  if (!sidebar || !sidebarToggle) return;

  sidebarToggle.addEventListener("click", toggleSidebar);
}

export function isSidebarOpen(): boolean {
  return sidebar?.classList.contains("open") ?? false;
}

export function toggleSidebar(): void {
  if (!sidebar || isAnimate) return;
  isAnimate = true;

  if (!isSidebarOpen()) {
    sidebar.classList.add("open");
    setTimeout(() => {
      isAnimate = false;
    }, 700);
  } else {
    sidebar.classList.add("closing");
    sidebar.classList.remove("open");

    setTimeout(() => {
      sidebar?.classList.remove("closing");
      isAnimate = false;
    }, 700);
  }
}