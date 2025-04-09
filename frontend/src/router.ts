import { LoginView } from "./views/login";
import { SignupView } from "./views/signup";
import { MainLayout } from "./layout/layout";
import { initSideBarNavigation } from "./controllers/navbar";

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
  "/": {
    view: MainLayout,
    setup: () => initSideBarNavigation(),
  },
};

export function navigateTo(path: string) {
  history.pushState(null, "", path);
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
