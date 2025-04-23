import { isRawReplayData, ReplayData, convertRawReplayData } from "@shared/game/replayData"

export function setupReplay(): void {
  // Setup the default progress bar
  const progressBar: HTMLInputElement = document.getElementById("progress-bar") as HTMLInputElement;
  if (progressBar) {
    progressBar.min = "0";
    progressBar.max = "0";

    progressBar.oninput = updateTimeDisplay;
    progressBar.onmousemove = showTooltip;
    progressBar.onmouseleave = hideTooltip;
  }

  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    showError("You need to be connected to access match replay !");
    return;
  }

  // Get the URL parameters
  const urlParams: URLSearchParams = new URLSearchParams(window.location.search);

  // Retrieve the 'match_id' argument
  const matchId: string | null = urlParams.get("match_id");

  if (!matchId) {
    showError("No match id given");
    return;
  }

  fetchMatchData(token, matchId).then((replayData: ReplayData) => {
    if (progressBar) {
      progressBar.max = replayData.gameDuration.toString();

      // Retrieve the 'time' argument (optional)
      const timeArg: string | null = urlParams.get("time");
      if (timeArg && Number.isInteger(timeArg)) {
        let time: number = Number(timeArg);
        if (time > 0) {
          // Convert time to milliseconds and clamp to the game duration
          time = Math.min(time * 1000, replayData.gameDuration);
          progressBar.value = time.toString();
        }
      }
    }
  }).catch((error) => {
    showError(error);
  });
}

// Function to fetch the data of the match with given id
function fetchMatchData(token: string, matchId: string): Promise<ReplayData> {
  return new Promise(async (resolve, reject) => {
    try {
      const res: Response = await fetch(`/api/replay/${matchId}`, {
        method: "GET",
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 400) {
          return reject("No match found with this ID");
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth_token");
        }
        return reject(`An error occured when fetching match data (code ${res.status})`);
      }

      const data: any = await res.json();
      if (isRawReplayData(data)) {
        return resolve(convertRawReplayData(data));
      }

      return reject("Receive invalid data");
    } catch (error) {
      console.error("An error occured when fetching match data :", error);
      return reject("An error occured when fetching match data");
    }
  });
}

function updateTimeDisplay(event: Event) {
  const target: HTMLInputElement = event.target as HTMLInputElement;
  const timeText: HTMLElement | null = document.getElementById("current-time")
  if (timeText) {
    timeText.innerText = formatTime(parseInt(target.value));
  }

  const filledProgress: HTMLElement | null = document.getElementById("filled-progress");
  const progressBar: HTMLInputElement = document.getElementById("progress-bar") as HTMLInputElement;
  if (filledProgress && progressBar) {
    const percentage: number = (parseInt(target.value, 10) / parseInt(progressBar.max)) * 100;
    filledProgress.style.width = `${percentage}%`;
  }
}

function showTooltip(event: MouseEvent) {
  const progressBar: HTMLInputElement = document.getElementById("progress-bar") as HTMLInputElement;
  const tooltip: HTMLElement | null = document.getElementById("tooltip");

  if (tooltip && progressBar) {
    const rect: DOMRect = progressBar.getBoundingClientRect(); // Get progress bar rect

    // Get mouse position relative to the progress bar
    let mouseX: number = event.clientX - rect.left;

    // Clamp mouseX to ensure it stays inside valid bounds
    mouseX = Math.max(0, Math.min(mouseX, rect.width));

    // Calculate the predicted value
    const predictedValue: number = Math.ceil((mouseX / rect.width) * parseInt(progressBar.max));

    tooltip.style.left = `${rect.left + mouseX}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.innerText = formatTime(predictedValue);
    tooltip.style.display = "block";
  }
}

function hideTooltip() {
  const tooltip: HTMLElement | null = document.getElementById("tooltip");
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function formatTime(milliseconds: number) {
  let seconds: number = Math.floor(milliseconds / 1000);
  let mins: number = Math.floor(seconds / 60);
  let secs: number = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function showError(message: string) {
  const errorMessage: HTMLElement | null = document.getElementById("error-message");
  const errorText: HTMLElement | null = document.getElementById("error-text");

  if (errorMessage && errorText) {
    errorText.innerText = message; // Set the error text
    errorMessage.classList.remove("hidden"); // Show the error message
  }
}
