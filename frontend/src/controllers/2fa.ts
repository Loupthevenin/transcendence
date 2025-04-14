import { navigateTo } from "../router";

export function setupTwoFAHandlers(container: HTMLElement) {
  const twoFaForm: HTMLFormElement = document.getElementById(
    "2FAForm",
  ) as HTMLFormElement;

  if (twoFaForm) {
    twoFaForm.addEventListener("submit", async (e: SubmitEvent) => {
      e.preventDefault();
      const code: string = (document.getElementById("code") as HTMLInputElement)
        .value;
      const tempToken: string | null = localStorage.getItem("temp_token");

      if (!tempToken) {
        alert("Session expirée, reconnecte-toi");
        navigateTo("/auth/login");
        return;
      }

      try {
        const res: Response = await fetch("/api/verify-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify({ code }),
        });

        const data: any = await res.json();
        if (!res.ok) {
          const errorMsg = data?.message || data?.error || "Code invalid";
          alert(errorMsg);
          return;
        }

        localStorage.removeItem("temp_token");
        localStorage.setItem("auth_token", data.token);
        navigateTo("/");
      } catch (err) {
        alert("Code 2FA incorrect");
        console.error(err);
      }
    });
  }
}
