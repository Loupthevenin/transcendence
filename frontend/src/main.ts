import { renderRoute, navigateTo } from "./router";

document.addEventListener("DOMContentLoaded", () => {
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

  renderRoute();
});
