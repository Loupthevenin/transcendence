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
