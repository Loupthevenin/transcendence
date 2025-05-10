import {
  showErrorToast,
  showSuccessToast,
} from "../components/showNotificationToast";
import { navigateTo } from "../router";
import { connectToServer } from "../websocketManager";

export function setupTwoFAHandlers(container: HTMLElement): void {
  const twoFaForm: HTMLFormElement = document.getElementById(
    "2FAForm",
  ) as HTMLFormElement;
  if (!twoFaForm) return;

  twoFaForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault();
    const code: string = (document.getElementById("code") as HTMLInputElement)
      .value;
    const tempToken: string | null = localStorage.getItem("temp_token");

    if (!tempToken) {
      navigateTo("/auth/login");
      showErrorToast("Session expirée, reconnecte-toi");
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
        const errorMsg: string = data?.message || data?.error || "Code invalid";
        showErrorToast(errorMsg);
        return;
      }

      localStorage.removeItem("temp_token");
      localStorage.setItem("auth_token", data.token);
      connectToServer();
      navigateTo("/");
      showSuccessToast("Login successful!");
    } catch (error: any) {
      console.error(error);
      showErrorToast("Code 2FA incorrect");
    }
  });
}
