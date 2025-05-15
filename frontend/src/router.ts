import { LoginView } from "./views/login";
import { SignupView } from "./views/signup";
import { MainLayout } from "./layout/layout";
import { ModeLayout } from "./layout/mode";
import { TwoFAView } from "./views/2fa";
import { ProfileView } from "./views/profile";
import { Generate404Page } from "./views/404";
import { TournamentView, TournamentProgressView } from "./views/tournaments";
import { ReplayView } from "./views/replay";
import { initSideBarNavigation, isSidebarOpen, toggleSidebar } from "./controllers/navbar";
import { handleGoogleCallback } from "./controllers/google";
import { listenerButtonGameMode } from "./controllers/gameMode";
import { createGameCanvas, initGameEnvironment, BackToMenu, LeaveGameIfNeeded } from "./game/game";
import { createSkinSelectorCanvas, initSkinSelector} from "./game/skinSelector";
import { ChatView} from "./views/chat";
import { initOnlineGameSession } from "./controllers/InviteGame";


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
  "/auth/verify-2fa": {
    view: TwoFAView,
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/2fa");
      mod.setupTwoFAHandlers(root);
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
  "/tournaments": {
    view: () => MainLayout(TournamentView()),
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/tournaments");
      initSideBarNavigation();
      mod.tournamentsHandlers(root);
    },
  },
  "/tournaments/tournament": {
    view: () => MainLayout(TournamentProgressView()),
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/tournaments");
      initSideBarNavigation();
      mod.tournamentProgress(root);
    },
  },
  "/replay": {
    view: () => MainLayout(ReplayView()),
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/replay");
      initSideBarNavigation();
      mod.setupReplay(root);
    },
  },
  "/chat": {
    view: () => MainLayout(ChatView()),
    setup: async (root: HTMLElement) => {
      const mod = await import("./controllers/chat");
      initSideBarNavigation();
      mod.setupChat(root);
    },
  },
  // "/game": {
  // view: () => MainLayout(createGameCanvas()),
  //   setup: async (root: HTMLElement) => {
  //     initSideBarNavigation();
  //     const opponentUuid: string | null = sessionStorage.getItem("opponentUuid");
  //     if (opponentUuid) {
  //       initOnlineGameSession(opponentUuid);
  //     }
  //   },
  // },
  "/callback": {
    view: () => {
      const div: HTMLDivElement = document.createElement("div");
      return div;
    },
    setup: () => {
      handleGoogleCallback();
    },
  },
  "/": {
    view: () => MainLayout(createGameCanvas(), ModeLayout()),
    setup: (root: HTMLElement) => {
       const opponentUuid: string | null = sessionStorage.getItem("opponentUuid");
      if (opponentUuid) {
        initOnlineGameSession(opponentUuid);
      }
      initSideBarNavigation();
      initGameEnvironment();

      createSkinSelectorCanvas(root);
      initSkinSelector();

      listenerButtonGameMode();

      BackToMenu();
    },
  },
};

export function hasTokenStored(): boolean {
  return !!localStorage.getItem("auth_token");
}

export async function navigateTo(path: string): Promise<void> {
  if (location.pathname === "/" && path === "/") {
    // If we are already on the root path, and we want to go to the root path again
    // use BackToMenu() instead of renderRoute()
    BackToMenu();
    if (isSidebarOpen()) {
      toggleSidebar();
    }
    return;
  }

  history.pushState(null, "", path); // add the new URL to the history stack and change the URL without reloading
  await renderRoute();
}

export async function renderRoute(): Promise<void> {
  LeaveGameIfNeeded();

  const path: string = location.pathname;
  const route: Route = routes[path];

  document.body.innerHTML = "";

  if (!route) {
    Generate404Page();
    return;
  }

  if (hasTokenStored() && (path === "/auth/login" || path === "/auth/signup")) {
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
