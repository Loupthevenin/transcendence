import { navigateTo } from "../router";

interface UserProfile {
  avatarUrl: string;
  name: string;
  email: string;
}

async function loadUserProfile() {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur lors du chargement du profile");

    const data: UserProfile = await res.json();

    const avatarElement = document.getElementById(
      "user-avatar",
    ) as HTMLImageElement;
    if (avatarElement && data.avatarUrl) {
      avatarElement.src = data.avatarUrl;
    }
    const nameElement = document.getElementById("display-name") as HTMLElement;
    if (nameElement && data.name) {
      nameElement.textContent = data.name;
    }
    const emailElement = document.getElementById("user-email") as HTMLElement;
    if (emailElement && data.email) {
      emailElement.textContent = data.email;
    }
  } catch (err) {
    console.error("Error profile :", err);
    alert("impossible de charger le profile");
  }
}

async function updateUserProfile(updatedData: any, request: string) {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    alert("Pas de token !");
    return;
  }
  try {
    const res: Response = await fetch(`/api/profile/${request}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });
    if (!res.ok) throw new Error("Erreur lors de la mise a jour du profile");

    return await res.json();
  } catch (err) {
    console.error("Erreur update :", err);
    alert("Impossible de mettre à jour le profile");
  }
}

function listenerName() {
  const displayName = document.getElementById("display-name");
  if (displayName) {
    displayName.addEventListener("click", () => {
      let currentName: string = displayName.textContent || "";

      const input: HTMLInputElement = document.createElement("input");
      input.type = "text";
      input.value = currentName;
      input.className =
        "bg-[#2a255c] text-white border border-indigo-500 rounded px-2 py-1";

      input.addEventListener("blur", async () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
          await updateUserProfile({ name: newName }, "name");
          displayName.textContent = newName;
        }
        displayName.classList.remove("hidden");
        input.remove();
      });

      displayName.classList.add("hidden");
      if (displayName.parentNode) {
        displayName.parentNode.appendChild(input);
      }
      input.focus();
    });
  }
}

function listenerEmail() {
  const emailElement = document.getElementById("user-email");

  if (emailElement) {
    emailElement.addEventListener("click", () => {
      const currentEmail: string = emailElement.textContent || "";
      const input: HTMLInputElement = document.createElement("input");
      input.type = "email";
      input.value = currentEmail;
      input.className =
        "bg-[#2a255c] text-white border border-indigo-500 rounded px-2 py-1";
      input.addEventListener("blur", async () => {
        const newEmail = input.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
          alert("veuillez entrer une adresse email valide.");
          emailElement.textContent = currentEmail;
        } else if (newEmail && newEmail !== currentEmail) {
          const res = await updateUserProfile({ email: newEmail }, "email");
          if (res && res.success) {
            alert(res.message);
            localStorage.removeItem("auth_token");
            setTimeout(() => {
              navigateTo("/auth/login");
            }, 1500);
          } else {
            alert(res?.error);
            emailElement.textContent = currentEmail;
          }
        }
        emailElement.classList.remove("hidden");
        input.remove();
      });
      emailElement.classList.add("hidden");
      emailElement.parentNode?.appendChild(input);
      input.focus;
    });
  }
}

function listenerAvatar() {
  const avatarInput = document.getElementById(
    "avatar-upload",
  ) as HTMLInputElement;
  const avatarWrapper = document.querySelector(".group") as HTMLDivElement;
  const avatarImg = document.getElementById("user-avatar") as HTMLImageElement;

  if (!avatarInput || !avatarImg || !avatarWrapper) return;

  avatarWrapper.addEventListener("click", () => {
    avatarInput.click();
  });

  avatarInput.addEventListener("change", async () => {
    if (!avatarInput.files || avatarInput.files.length === 0) return;

    const file = avatarInput.files[0];
    const formData = new FormData();
    formData.append("avatar", file);

    const token: string | null = localStorage.getItem("auth_token");
    if (!token) {
      alert("Pas de token !");
      return;
    }
    try {
      const res: Response = await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data: any = await res.json();
      if (!res.ok) {
        const errorMsg = data?.message || data?.error || "Error update Avatar";
        alert(errorMsg);
        return;
      }

      if (data.avatarUrl) {
        avatarImg.src = data.avatarUrl;
      }
    } catch (err) {
      console.error("Erreur update avatar : ", err);
      alert("Impossible d'update l'avatar");
    }
  });
}

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
            authorization: `Bearer ${token}`,
          },
        });

        const data: any = await res.json();
        if (!res.ok) {
          const errorMsg =
            data?.message || data?.error || "Error activation 2FA";
          alert(errorMsg);
          return;
        }

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
  loadUserProfile();
  listener2FA(container);
  logout(container);

  listenerName();
  listenerAvatar();
  listenerEmail();
}
