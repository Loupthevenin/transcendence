import { navigateTo } from "../router";
import { handleGoogle } from "./google";

export function setupLoginHandlers(container: HTMLElement): void {
  handleGoogle();
  const loginForm: HTMLFormElement | null = container.querySelector(
    "#loginForm",
  ) as HTMLFormElement | null;

  if (loginForm) {
    loginForm.addEventListener("submit", async (e: SubmitEvent) => {
      e.preventDefault();
      const email: string = (
        container.querySelector("#email") as HTMLInputElement
      ).value;
      const password: string = (
        container.querySelector("#password") as HTMLInputElement
      ).value;

      try {
        const res: Response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          const errorMsg: string = data?.message || data?.error || "Error login";
          alert(errorMsg);
          return;
        }

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
