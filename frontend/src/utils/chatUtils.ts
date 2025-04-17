// import { createGameCanvas, initGameEnvironment } from "../game/game";

// export function loadGameCanvasOnce(): void {
//   if (!document.getElementById("renderCanvas")) {
//     const canvas = createGameCanvas();
//     document.body.appendChild(canvas);
//     initGameEnvironment();
//   }

//   const chatInterface = document.getElementById("chat-interface");
//   if (chatInterface) chatInterface.style.display = "none";
// }

// export function restoreChatInterface(): void {
//   const chatInterface = document.getElementById("chat-interface");
//   if (chatInterface) chatInterface.style.display = "flex";

//   const canvas = document.getElementById("renderCanvas");
//   if (canvas) canvas.remove();
// }
