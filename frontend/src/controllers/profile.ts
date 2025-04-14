import { navigateTo } from "../router";

function listener2FA(container: HTMLElement) {
  const button2FA: HTMLElement = container.querySelector(
    "#activate-2fa",
  ) as HTMLElement;

  if (button2FA) {
    button2FA.addEventListener("click", async () => {
      const token: string | null = localStorage.getItem("auth_token");
      if (!token) {
        alert("Pas de token !");
        return;
      }
      try {
        const res: Response = await fetch("/api/setup-2fa", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Error activation 2FA");

        const data: any = await res.json();
        const qrCodeDataURL: any = data.qrCodeDataURL;

        if (qrCodeDataURL) {
          const qrCodeContainer: Element | null =
            container.querySelector("#qr-code-container");
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

function logout(container: HTMLElement) {
  const buttonLogout = container.querySelector("#logout-button") as HTMLElement;
  if (buttonLogout) {
    buttonLogout.addEventListener("click", () => {
      const token: string | null = localStorage.getItem("auth_token");
      if (!token) {
        alert("Pas de token !");
        return;
      }
      localStorage.removeItem("auth_token");
      navigateTo("/");
    });
  }
}

export function setupProfile(container: HTMLElement) {
  listener2FA(container);
  logout(container);
}
