import { sendMessage, subscribeTo, unsubscribeTo } from "../websocketManager";
import { OnlineGame } from "../game/game";
import { ReadyToPlayMessage } from "@shared/game/gameMessageTypes";
import { GameMessageData } from "@shared/messageType";
import { createGameCanvas, initGameEnvironment } from "../game/game";
import { navigateTo } from "../router";
import { hasSentReadyToPlay, setReadyToPlaySent } from "../utils/chatUtils";
import { AcceptGameInviteMessage } from "@shared/chat/chatMessageTypes";

let gameAlreadyStarted = false;
let gameCallback: ((data: GameMessageData) => void) | null = null;

export function setGameAlreadyStarted(value: boolean): void {
  gameAlreadyStarted = value;
}

export function isGameAlreadyStarted(): boolean {
  return gameAlreadyStarted;
}

export function openInviteToGameModal(fromName: string, userId: string): void {
  const backdrop = document.createElement("div");
  backdrop.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
  backdrop.id = "invite-game-backdrop";

  const modal = document.createElement("div");
  modal.className = "bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 w-80 text-black";
  modal.innerHTML = `
    <h2 class="text-xl font-bold">🎮 Invitation au jeu</h2>
    <p class="text-center" id="invite-message"></p>
    <div class="flex gap-4 w-full">
      <button id="accept-invite-btn" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
        Accepter
      </button>
      <button id="decline-invite-btn" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
        Refuser
      </button>
    </div>
  `;

  const messageElement: HTMLParagraphElement | null = modal.querySelector("#invite-message");
  if (messageElement) {
    messageElement.textContent = `${fromName} t'invite à un match !`;
  }

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const acceptButton = modal.querySelector("#accept-invite-btn") as HTMLButtonElement;
  const declineButton = modal.querySelector("#decline-invite-btn") as HTMLButtonElement;

  acceptButton.addEventListener("click", () => {
    sendMessage("chat", {
      type: "gameInviteAccepted",
      from: fromName,
      userId,
    } as AcceptGameInviteMessage);
    localStorage.setItem("opponentUuid", userId);
    localStorage.setItem("returnTo", window.location.pathname);
  
    navigateTo("/game");
  
    backdrop.remove();
  });

  declineButton.addEventListener("click", () => {
    backdrop.remove();
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
}

export function initOnlineGameSession(opponentUuid: string): void {
  if (!hasSentReadyToPlay()){
    setReadyToPlaySent(true);

    const readyMessage: ReadyToPlayMessage = {
      type: "readyToPlay",
      opponentId: opponentUuid,
    };
    sendMessage("game", readyMessage);
    console.log("[GAME] Envoi message readyToPlay", readyMessage);
  }

  if (gameCallback) {
    unsubscribeTo("game", gameCallback);
    console.log("[WS] Unsubscribed previous game callback");
  }

   gameCallback = async (data: GameMessageData) =>{
    if (data.type === "gameStarted" && !gameAlreadyStarted) {
      gameAlreadyStarted = true;
      console.log("[GAME] gameStarted reçu, lancement du jeu...");

      await prepareGameAndStart(); 
      OnlineGame(false);           
    }

    if (data.type === "gameResult") {
      console.log("[GAME] Fin du match reçue, reset des états");
      gameAlreadyStarted = false;
        const returnTo = localStorage.getItem("returnTo");
        if (returnTo) {
          localStorage.removeItem("returnTo");
          navigateTo(returnTo);
        } else {
          navigateTo("/chat");
        }
    }
  };
  subscribeTo("game", gameCallback);
  console.log("[WS] Subscribed new game callback");
}


export async function prepareGameAndStart(): Promise<void> {
  if (!document.getElementById("renderCanvas")) {
    const canvas = createGameCanvas();
    document.body.appendChild(canvas);
  }

  initGameEnvironment();
}
