export function initSideBarNavigation(): void {
  const sidebar: HTMLElement | null = document.getElementById("sidebar");
  const sidebarToggle: HTMLElement | null =
    document.getElementById("sidebarToggle");

  if (!sidebar || !sidebarToggle) return;

  let isAnimate = false;

  sidebarToggle.addEventListener("click", () => {
    if (isAnimate) return;
    isAnimate = true;

    if (!sidebar.classList.contains("open")) {
      sidebar.classList.add("open");
      setTimeout(() => {
        isAnimate = false;
      }, 700);
    } else {
      sidebar.classList.add("closing");
      sidebar.classList.remove("open");

      setTimeout(() => {
        sidebar.classList.remove("closing");
        isAnimate = false;
      }, 700);
    }
  });
}
