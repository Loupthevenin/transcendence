import { sendMessage, subscribeTo } from "../websocketManager";
import { OnlineGame, handleGameMessages } from "../game/game";
import { isGameResultMessage, isGameStartedMessage, ReadyToPlayMessage } from "@shared/game/gameMessageTypes";
import { GameMessageData } from "@shared/messageType";
import { createGameCanvas, initGameEnvironment } from "../game/game";
import { navigateTo } from "../router";
import { hasSentReadyToPlay, setReadyToPlaySent } from "../utils/chatUtils";
import { AcceptGameInviteMessage } from "@shared/chat/chatMessageTypes";

let gameAlreadyStarted = false;

export function openInviteToGameModal(fromName: string, userId: string): void {
  const backdrop = document.createElement("div");
    backdrop.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    backdrop.id = "invite-game-backdrop";
  
    const modal = document.createElement("div");
    modal.className = "bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-6 w-80 text-black";
  
    const title = document.createElement("h2");
    title.className = "text-xl font-bold";
    title.textContent = "🎮 Invitation au jeu";
  
    const message = document.createElement("p");
    message.className = "text-center";
    message.textContent = `${fromName} t'invite à un match !`;
  
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "flex gap-4 w-full";
  
    const acceptButton = document.createElement("button");
    acceptButton.id = "accept-invite-btn";
    acceptButton.className = "flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg";
    acceptButton.textContent = "Accepter";
  
    const declineButton = document.createElement("button");
    declineButton.id = "decline-invite-btn";
    declineButton.className = "flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg";
    declineButton.textContent = "Refuser";
  
    buttonContainer.appendChild(acceptButton);
    buttonContainer.appendChild(declineButton);
  
    modal.appendChild(title);
    modal.appendChild(message);
    modal.appendChild(buttonContainer);
  
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

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
      opponentUuid,
    };
    sendMessage("game", readyMessage);
    // console.log("[GAME] Envoi message readyToPlay", readyMessage);
  }
  subscribeTo("game", async (data: GameMessageData) => {
    if (isGameStartedMessage(data) && !gameAlreadyStarted) {
      gameAlreadyStarted = true;
      // console.log("[GAME] gameStarted reçu, lancement du jeu...");
      await prepareGameAndStart(); 
      OnlineGame(false);  
      handleGameMessages(data);  
    }
    if (isGameResultMessage(data)) {
      // console.log("[GAME] Fin du match reçue, reset des états");
      gameAlreadyStarted = false;

      const returnTo = localStorage.getItem("returnTo");
      if (returnTo) {
        localStorage.removeItem("returnTo");
        navigateTo(returnTo);
      } else {
        navigateTo("/chat");
      }
    }
  });

}

export async function prepareGameAndStart(): Promise<void> {

  if (!document.getElementById("renderCanvas")) {
    const canvas = createGameCanvas();
    document.body.appendChild(canvas);
  }
  initGameEnvironment();
}