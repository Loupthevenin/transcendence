import { navigateTo } from "../router";

export function setupLoginHandlers(container: HTMLElement) {
  const loginForm: HTMLFormElement | null = container.querySelector(
    "#loginForm",
  ) as HTMLFormElement | null;

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email: string = (container.querySelector("#email") as HTMLInputElement).value;
      const password: string = (container.querySelector("#password") as HTMLInputElement).value;

      try {
        const res: Response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) throw new Error("Error connexion login");

        const data: any = await res.json();
        if (data.require2FA) {
          localStorage.setItem("temp_token", data.tempToken);
          navigateTo("/auth/verify-2fa");
        } else {
          localStorage.setItem("auth_token", data.token);
          navigateTo("/");
        }
      } catch (err) {
        alert("Email ou mot de passe incorrect");
        console.error(err);
      }
    });
  }
}
