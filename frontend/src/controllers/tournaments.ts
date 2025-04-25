import { UserProfile } from "./types";

async function setDisplayNameInputs(): Promise<void> {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const res: Response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return;

    const data: UserProfile = await res.json();
    if (data?.name) {
      const displayInputs: NodeListOf<HTMLInputElement> =
        document.querySelectorAll<HTMLInputElement>(
          'input[name="displayName"]',
        );
      displayInputs.forEach((input: HTMLInputElement) => {
        input.value = data.name;
      });
    }
  } catch (error: any) {
    console.error("Error loading name : ", error);
  }
}

// async function loadTournaments(): Promise<void> {
//   const token: string | null = localStorage.getItem("auth_token");
//   if (!token) {
//     alert("Pas de token !");
//     return;
//   }
//   try {
//     // const res: response = await fetch("/api/tournaments", )
//   } catch (error: any) {
//     console.error("Error loading Tournaments", error);
//   }
// }

function createTournament(): void {
  const buttonCreateTournament: HTMLButtonElement | null =
    document.getElementById("create-tournament") as HTMLButtonElement;
  const form: HTMLFormElement | null = document.getElementById(
    "tournament-form",
  ) as HTMLFormElement;
  if (!buttonCreateTournament || !form) return;

  buttonCreateTournament.addEventListener("click", () => {
    form.classList.remove("hidden");
    buttonCreateTournament.classList.add("hidden");
  });

  form.addEventListener("reset", () => {
    form.classList.add("hidden");
    buttonCreateTournament.classList.remove("hidden");
  });
}
// function joinTournament(): void {}

export function tournamentsHandlers(container: HTMLElement): void {
  // loadTournament();
  setDisplayNameInputs();
  createTournament();
  // joinTournament();
}
