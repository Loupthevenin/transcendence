import { LoginView } from "./views/login";
import { SignupView } from "./views/signup";
import { MainLayout } from "./layout/layout";
import { TwoFAView } from "./views/2fa";

import { initSideBarNavigation } from "./controllers/navbar";
import { InitGame, CreateGameCanvas } from "./game/game";

type RouteHandler = () => HTMLElement;
type Route = {
  view: RouteHandler;
  setup?: (root: HTMLElement) => void;
};

const routes: Record<string, Route> = {
  "/auth/login": {
    view: LoginView,
    setup: (root) =>
      import("./controllers/login").then((mod) => mod.setupLoginHandlers(root)),
  },
  "/auth/signup": {
    view: SignupView,
    setup: (root) =>
      import("./controllers/signup").then((mod) =>
        mod.setupSignupHandlers(root),
      ),
  },
  "/auth/2fa": {
    view: TwoFAView,
    setup: (root) =>
      import("./controllers/2fa").then((mod) => mod.setupTwoFAHandlers(root)),
  },
  "/": {
    view: () => MainLayout(CreateGameCanvas()),
    setup: () => {
      initSideBarNavigation();
      InitGame();
    },
  },
};

export function navigateTo(path: string) {
  if (path == "/") {
    history.replaceState(null, "", path);
  } else {
    history.pushState(null, "", path);
  }
  renderRoute();
}

export async function renderRoute() {
  const path = location.pathname;
  const route = routes[path];

  document.body.innerHTML = "";

  if (!route) {
    const el = document.createElement("div");
    el.textContent = "404 - Page non trouvée";
    document.body.appendChild(el);
    return;
  }

  const view = route.view();
  document.body.appendChild(view);

  if (route.setup) {
    await route.setup(view);
  }
}

window.addEventListener("popstate", renderRoute);
