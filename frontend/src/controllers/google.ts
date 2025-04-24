import { navigateTo } from "../router";
import { connectToServer } from "../websocketManager";

export function handleGoogle(): void {
  const googleAuth: HTMLElement | null = document.getElementById("google-auth");
  if (!googleAuth) return;

  googleAuth.addEventListener("click", () => {
    try {
      window.location.href = "/api/auth/google";
    } catch (err) {
      console.error("Erreur google auth : ", err);
      alert("Erreur Google OAUTH2");
    }
  });
}

export function handleGoogleCallback(): void {
  const hash: string = window.location.hash.substring(1);
  const params: URLSearchParams = new URLSearchParams(hash);

  const token: string | null = params.get("token");
  const require2FA: string | null = params.get("require2FA");
  const error: string | null = params.get("error");

  if (error) {
    alert(decodeURIComponent(error));
    navigateTo("/auth/login");
  } else if (token) {
    if (require2FA === "1") {
      localStorage.setItem("temp_token", token);
      navigateTo("/auth/verify-2fa");
    } else {
      localStorage.setItem("auth_token", token);
      connectToServer();
      navigateTo("/");
    }
  } else {
    alert("Erreur lors de Google OAUTH");
    navigateTo("/auth/login");
  }
}
