import { showErrorToast } from "../components/showNotificationToast";
import { navigateTo } from "../router";
import { handleGoogle } from "./google";

export function setupSignupHandlers(container: HTMLElement): void {
  handleGoogle();
  const signupForm: HTMLFormElement | null = container.querySelector(
    "#signupForm",
  ) as HTMLFormElement | null;
  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();

    const name: string = (container.querySelector("#name") as HTMLInputElement)
      .value;
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
      showErrorToast(`Les mots de passe ne correspondent pas`);
      return;
    }

    try {
      const res: Response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        const errorMsg: string = data?.message || "Error signup";
        showErrorToast(`${errorMsg}`);
        return;
      }
      navigateTo("/");
    } catch (error: any) {
      console.error("Signup error", error);
      showErrorToast(`Une erreur est survenue pendant l'inscription ${error}`);
    }
  });
}
