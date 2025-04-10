import { navigateTo } from "../router";

export function setupTwoFAHandlers(container: HTMLElement) {
  const twoFaForm = container.querySelector(
    "#2FAForm",
  ) as HTMLFormElement | null;

  if (twoFaForm) {
    twoFaForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = (container.querySelector("#code") as HTMLInputElement).value;
      const tempToken = localStorage.getItem("temp_token");

      if (!tempToken) {
        alert("Session expirée, reconnecte-toi");
        navigateTo("/auth/login");
        return;
      }

      try {
        const res = await fetch("/api/verify-2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, tempToken }),
        });

        if (!res.ok) throw new Error("Code invalid");

        await res.json();

        localStorage.removeItem("temp_token");
        navigateTo("/");
      } catch (err) {
        alert("Code 2FA incorrect");
        console.error(err);
      }
    });
  }
}
