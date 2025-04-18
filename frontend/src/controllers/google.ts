import { navigateTo } from "../router";

export function handleGoogle() {
  const googleAuth: HTMLElement | null = document.getElementById("google-auth");

  if (googleAuth) {
    googleAuth.addEventListener("click", () => {
      try {
        window.location.href = "/api/auth/google";
      } catch (err) {
        console.error("Erreur google auth : ", err);
        alert("Erreur Google OAUTH2");
      }
    });
  }
}

export function handleGoogleCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const token = params.get("token");
  const require2FA = params.get("require2FA");
  const error = params.get("error");

  if (error) {
    alert(decodeURIComponent(error));
    navigateTo("/auth/login");
  } else if (token) {
    if (require2FA === "1") {
      localStorage.setItem("temp_token", token);
      navigateTo("/auth/verify-2fa");
    } else {
      localStorage.setItem("auth_token", token);
      navigateTo("/");
    }
  } else {
    alert("Erreur lors de Google OAUTH");
    navigateTo("/auth/login");
  }
}
