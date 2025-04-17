import { navigateTo } from "../router";
import { handleGoogle } from "./google";

export function setupSignupHandlers(container: HTMLElement) {
  handleGoogle();
  const signupForm: HTMLFormElement | null = container.querySelector(
    "#signupForm",
  ) as HTMLFormElement | null;

  if (signupForm) {
    signupForm.addEventListener("submit", async (e: SubmitEvent) => {
      e.preventDefault();

      const name: string = (
        container.querySelector("#name") as HTMLInputElement
      ).value;
      const email: string = (
        container.querySelector("#email") as HTMLInputElement
      ).value;
      const password: string = (
        container.querySelector("#password") as HTMLInputElement
      ).value;
      const confirm_password: string = (
        container.querySelector("#confirm_password") as HTMLInputElement
      ).value;

      if (password != confirm_password) {
        alert("Les mots de passe en correspondent pas");
        return;
      }

      try {
        const res: Response = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) {
          const errorMsg = data?.message || "Error signup";
          alert(errorMsg);
          return;
        }
        navigateTo("/");
      } catch (err) {
        console.error("Signup error", err);
        alert("Une erreur est survenue pendant l'inscription");
      }
    });
  }
}
