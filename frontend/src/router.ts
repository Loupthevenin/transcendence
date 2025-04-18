import { LoginView } from "./views/login";
import { SignupView } from "./views/signup";
import { MainLayout } from "./layout/layout";
import { ModeLayout } from "./layout/mode";
import { TwoFAView } from "./views/2fa";
import { ProfileView } from "./views/profile";
import { Generate404Page } from "./views/404";

import { initSideBarNavigation } from "./controllers/navbar";
import { handleGoogleCallback } from "./controllers/google";
import { listenerButtonGameMode } from "./controllers/gameMode";
import { createGameCanvas, initGameEnvironment, BackToMenu } from "./game/game";
import {
  createSkinSelectorCanvas,
  initSkinSelector,
} from "./game/skinSelector";
import { connectToServer } from "./websocketManager";

type RouteHandler = () => HTMLElement;
type Route = {
  view: RouteHandler;
  setup?: (root: HTMLElement) => void;
};

const routes: Record<string, Route> = {
  "/auth/login": {
    view: LoginView,
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/login");
      mod.setupLoginHandlers(root);
    },
  },
  "/auth/signup": {
    view: SignupView,
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/signup");
      mod.setupSignupHandlers(root);
    },
  },
  "/profile": {
    view: () => MainLayout(ProfileView()),
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/profile");
      initSideBarNavigation();
      mod.setupProfile(root);
    },
  },
  "/auth/verify-2fa": {
    view: TwoFAView,
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/2fa");
      mod.setupTwoFAHandlers(root);
    },
  },
  "/callback": {
    view: () => {
      const div = document.createElement("div");
      return div;
    },
    setup: () => {
      handleGoogleCallback();
    },
  },
  "/": {
    view: () => MainLayout(createGameCanvas(), ModeLayout()),
    setup: (root: HTMLElement) => {
      document.body.style.overflow = "hidden";
      initSideBarNavigation();
      initGameEnvironment();

      createSkinSelectorCanvas(root);
      initSkinSelector();

      listenerButtonGameMode();

      BackToMenu();
      connectToServer();
    },
  },
};

export function isAuthenticated(): boolean {
  return !!localStorage.getItem("auth_token");
}

export async function navigateTo(path: string) {
  history.pushState(null, "", path);
  await renderRoute();
}

export async function renderRoute() {
  const path: string = location.pathname;
  const route: Route = routes[path];

  document.body.innerHTML = "";

  if (!route) {
    Generate404Page();
    return;
  }

  if (
    isAuthenticated() &&
    (path === "/auth/login" || path === "/auth/signup")
  ) {
    navigateTo("/");
    return;
  }

  const view: HTMLElement = route.view();
  document.body.appendChild(view);

  if (route.setup) {
    await route.setup(view);
  }
}

window.addEventListener("popstate", renderRoute);
