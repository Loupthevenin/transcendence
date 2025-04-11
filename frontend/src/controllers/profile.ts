import { jwtDecode } from "jwt-decode";

function listener2FA(container: HTMLElement) {
  const button2FA = container.querySelector("#activate-2fa") as HTMLElement;

  if (button2FA) {
    button2FA.addEventListener("click", async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        alert("Pas de token !");
        return;
      }
      const decoded: any = jwtDecode(token);
      try {
        const res = await fetch("/api/setup-2fa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: decoded.email,
          }),
        });

        if (!res.ok) throw new Error("Error activation 2FA");

        const data = await res.json();
        const qrCodeDataURL = data.qrCodeDataURL;

        if (qrCodeDataURL) {
          const qrCodeContainer = container.querySelector("#qr-code-container");
          if (qrCodeContainer) {
            qrCodeContainer.innerHTML = `<img src="${qrCodeDataURL}" alt="QR Code 2FA" />`;
          }
        } else {
          alert("Erreur : QR code non reçu.");
        }
      } catch (err) {
        alert("Erreur lors de l'activation 2FA");
        console.error(err);
      }
    });
  }
}

export function setupProfile(container: HTMLElement) {
  listener2FA(container);
}
