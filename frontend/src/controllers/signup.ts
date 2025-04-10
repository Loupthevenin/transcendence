import { navigateTo } from "../router";

export function setupSignupHandlers(container: HTMLElement) {
  const signupForm = container.querySelector(
    "#signupForm",
  ) as HTMLFormElement | null;

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = (container.querySelector("#name") as HTMLInputElement).value;
      const email = (container.querySelector("#email") as HTMLInputElement)
        .value;
      const password = (
        container.querySelector("#password") as HTMLInputElement
      ).value;
      const confirm_password = (
        container.querySelector("#confirm_password") as HTMLInputElement
      ).value;

      if (password != confirm_password) {
        alert("Les mots de passe en correspondent pas");
        return;
      }

      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!res.ok) throw new Error("Error signup");

        const data = await res.json();
        localStorage.setItem("auth_token", data.token);
        navigateTo("/");
      } catch (err) {
        console.error("Signup error", err);
        alert("Une erreur est survenue pendant l'inscription");
      }
    });
  }
}
