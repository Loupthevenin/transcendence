import { LoginView } from "./views/login";
import { SignupView } from "./views/signup";
import { MainLayout } from "./layout/layout";
import { initSideBarNavigation } from "./interactions/navbar";

type RouteHandler = () => HTMLElement;

const routes: Record<string, RouteHandler> = {
  "/auth/login": LoginView,
  "/auth/signup": SignupView,
  "/": () => MainLayout(),
};

export function navigateTo(path: string) {
  history.pushState(null, "", path);
  renderRoute();
}

export function renderRoute() {
  const path = location.pathname;

  const handler =
    routes[path] ||
    (() => {
      const el = document.createElement("div");
      el.textContent = "404 - Page non trouvée";
      return el;
    });

  document.body.innerHTML = "";
  if (path == "/") {
    document.body.appendChild(MainLayout());
    initSideBarNavigation();
  } else {
    document.body.appendChild(handler());
  }
}

window.addEventListener("popstate", renderRoute);
