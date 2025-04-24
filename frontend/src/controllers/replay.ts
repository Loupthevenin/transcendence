import {
  PositionData, ScoreData,
  ReplayData,
  isRawReplayData,
  convertRawReplayData,
  getReplayDataAtTime, getScoreAtTime
} from "@shared/game/replayData";
import { createGameCanvas, initGameEnvironment, ReplayMode, SetReplayGameData } from "../game/game";
import nodeRemovalObserver from "../utils/nodeRemovalObserver";

let progressBar: HTMLInputElement | null = null;
let tooltip: HTMLElement | null = null;
let timeText: HTMLElement | null = null
let filledProgress: HTMLElement | null = null;

let timeMultiplier: number = 1; // TODO: add a button to modify it (0.5, 1, 1.5, 2)
let mainLoopInterval: NodeJS.Timeout | null = null;

// Track if the user is adjusting the progress bar
let isUserInteracting: boolean = false;

let replayData: ReplayData | null = null;

export function setupReplay(root: HTMLElement): void {
  // Reset global variable
  timeMultiplier = 1;
  replayData = null;

  // Get and cache HTML elements
  progressBar = document.getElementById("progress-bar") as HTMLInputElement | null;
  tooltip = document.getElementById("tooltip");
  timeText = document.getElementById("current-time")
  filledProgress = document.getElementById("filled-progress");

  // Setup the default progress bar
  if (progressBar) {
    progressBar.min = "0";
    progressBar.max = "0";

    progressBar.oninput = updateView;
    progressBar.onmousemove = showTooltip;
    progressBar.onmouseleave = hideTooltip;
    progressBar.onmousedown = () => { isUserInteracting = true; };
    progressBar.onmouseup = () => { isUserInteracting = false; };
  }

  // Verify if a token is available
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

  fetchMatchData(token, matchId).then((data: ReplayData) => {
    replayData = data;
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

    // Setup game canvas and environment
    root.appendChild(createGameCanvas());
    initGameEnvironment();

    // Use replay mode
    ReplayMode(replayData.p1Skin, replayData.p2Skin);

    mainLoop();

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
        if (res.status === 400 || res.status === 404) {
          return reject("No match found with this ID");
        }
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("auth_token");
        }
        return reject(`An error occured when fetching match data (status ${res.status})`);
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

function mainLoop(): void {
  // Add an observer to clear the interval when quitting the page
  const container: HTMLElement | null = document.getElementById("replay-ui");
  if (container) {
    nodeRemovalObserver(container, () => {
      if (mainLoopInterval) {
        clearInterval(mainLoopInterval);
        mainLoopInterval = null;
      }
      replayData = null;
    });
  }

  let previousTime: number = performance.now();

  mainLoopInterval = setInterval(() => {
    const currentTime: number = performance.now(); // Get the current time
    // Get time elapsed in milliseconds according to timeMultiplier
    const deltaTime: number = (currentTime - previousTime) * timeMultiplier;
    previousTime = currentTime; // Update the previous time

    if (!isUserInteracting && progressBar && replayData) {
      const currentValue: number = parseFloat(progressBar.value);
      progressBar.value = Math.min(currentValue + deltaTime, replayData.gameDuration).toString();
      updateView();
    }
  }, 16.67); // 60 FPS
}

function updateView(): void {
  if (progressBar) {
    const progressBarValue: number = parseInt(progressBar.value);
    if (timeText) {
      timeText.innerText = formatTime(progressBarValue);
    }

    if (filledProgress) {
      const percentage: number = (progressBarValue / parseInt(progressBar.max)) * 100;
      filledProgress.style.width = `${percentage}%`;
    }

    if (replayData) {
      const positionData: PositionData | undefined = getReplayDataAtTime(replayData, progressBarValue);
      const scoreData: ScoreData | undefined = getScoreAtTime(replayData, progressBarValue);
      SetReplayGameData(positionData, scoreData);
    }
  }
}

function showTooltip(event: MouseEvent): void {
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

function hideTooltip(): void {
  if (tooltip) {
    tooltip.style.display = "none";
  }
}

function formatTime(milliseconds: number): string {
  let seconds: number = Math.floor(milliseconds / 1000);
  let mins: number = Math.floor(seconds / 60);
  let secs: number = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function showError(message: string): void {
  const errorText: HTMLElement | null = document.getElementById("error-text");
  if (errorText) {
    errorText.innerText = message; // Set the error text
  }

  const errorMessage: HTMLElement | null = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.classList.remove("hidden"); // Show the error message
  }
}
