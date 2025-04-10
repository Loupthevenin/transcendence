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
