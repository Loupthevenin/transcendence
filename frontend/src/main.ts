import { renderRoute, navigateTo } from "./router";

// check token
document.addEventListener("DOMContentLoaded", async () => {
  const token: string | null = localStorage.getItem("auth_token");

  if (!token) {
    return;
  }

  try {
    const res: Response = await fetch("/api/verify-token", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const data: any = await res.json();
    if (!res.ok) {
      const errorMsg: string = data?.error || "Erreur verification token";
      console.log(errorMsg);
      localStorage.removeItem("auth_token");
      navigateTo("/auth/login");
    }
  } catch (error: any) {
    console.error("Erreur verification token : ", error);
    navigateTo("/auth/login");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // [data-target] listener;
  document.body.addEventListener("click", (e: MouseEvent) => {
    const target: HTMLElement = e.target as HTMLElement;
    if (target.matches("[data-target]")) {
      e.preventDefault();
      const targetPath: string | undefined = target.dataset.target;
      if (targetPath) {
        navigateTo(`${targetPath}`);
      }
    }
  });

  // A +[data-link] listener;
  document.body.addEventListener("click", (e: MouseEvent) => {
    const target: HTMLElement = e.target as HTMLElement;

    if (target.matches("a[data-link]")) {
      e.preventDefault();
      const href: string | null = target.getAttribute("href");
      if (href) {
        navigateTo(`${href}`);
      }
    }
  });

  renderRoute();
});
