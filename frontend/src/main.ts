import { renderRoute, navigateTo } from "./router";

document.addEventListener("DOMContentLoaded", () => {
  // Button + [data-target] listener;
  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLButtonElement;
    if (target.matches("[data-target]")) {
      e.preventDefault();
      const targetPath = target.dataset.target;
      if (targetPath) {
        navigateTo(`/${targetPath}`);
      }
    }
  });

  // A +[data-link] listener;
  document.body.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.matches("a[data-link]")) {
      e.preventDefault();
      const href = target.getAttribute("href");
      if (href) {
        navigateTo(`/${href}`);
      }
    }
  });

  renderRoute();
});
