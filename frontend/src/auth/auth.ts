const loginForm = document.getElementById(
  "loginForm",
) as HTMLFormElement | null;

// LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Error connexion login");

      const data = await res.json();
      if (data.requires2FA) {
        localStorage.setItem("temp_token", data.tempToken);
        window.location.href = "2fa.html";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      alert("Email ou mot de passe incorrect");
      console.error(err);
    }
  });
}

// SIGN-up
const signupForm = document.getElementById(
  "signupForm",
) as HTMLFormElement | null;

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = (document.getElementById("name") as HTMLInputElement).value;
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement)
      .value;
    const confirm_password = (
      document.getElementById("confirm_password") as HTMLInputElement
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

      await res.json();

      window.location.href = "/";
    } catch (err) {
      console.error("Signup error", err);
      alert("Une erreur est survenue pendant l'inscription");
    }
  });
}

// GOOGLE Sign-up
(window as any).handleCredentialResponse = async (response: any) => {
  try {
    const res = await fetch("/api/google-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: response.credential }),
    });

    const data = await res.json();

    if (data.requires2FA) {
      localStorage.setItem("temp_token", data.tempToken);
      window.location.href = "2fa.html";
    } else {
      window.location.href = "/";
    }
  } catch (err) {
    console.error("Error Google login", err);
    alert("Erreur avec Google Sign-in");
  }
};

// 2FA
const twoFaForm = document.getElementById("2FAForm") as HTMLFormElement | null;

if (twoFaForm) {
  twoFaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = (document.getElementById("code") as HTMLInputElement).value;
    const tempToken = localStorage.getItem("temp_token");

    if (!tempToken) {
      alert("Session expirée, reconnecte-toi");
      return (window.location.href = "login.html");
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
      window.location.href = "/";
    } catch (err) {
      alert("Code 2FA incorrect");
      console.error(err);
    }
  });
}
