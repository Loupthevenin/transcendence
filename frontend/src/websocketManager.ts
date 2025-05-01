import ERROR_TYPE, { ERROR_MSG } from "@shared/errorType";
import { isErrorMessage, ChatMessageData, isChatMessage, GameMessageData, isGameMessage, TournamentMessageData, isTournamentMessage } from "@shared/messageType"

// Define a mapping between event types and their corresponding data types
type MessageEventMap = {
  "onConnected": undefined;
  "onDisconnected": undefined;
  "game": GameMessageData;
  "chat": ChatMessageData;
  "tournament": TournamentMessageData;
};

// Create a type that includes only keys where the mapped type is NOT undefined
type SendableMessageTypes = {
  [K in keyof MessageEventMap]: MessageEventMap[K] extends undefined ? never : K
}[keyof MessageEventMap];

// Callback function type that uses the event map
type CallbackFunction<T extends keyof MessageEventMap> = (data: MessageEventMap[T]) => void;

// A mapping of event types to their callbacks
const callbacks: { [K in keyof MessageEventMap]?: Array<CallbackFunction<K>>; } = {};

// Subscribe function
export function subscribeTo<K extends keyof MessageEventMap>(msgEventType: K, callback: CallbackFunction<K>): void {
  if (!callbacks[msgEventType]) {
    callbacks[msgEventType] = [];
  }
  callbacks[msgEventType]!.push(callback);
}

// Unsubscribe function
export function unsubscribeTo<K extends keyof MessageEventMap>(msgEventType: K, callback: CallbackFunction<K>): void {
  if (callbacks[msgEventType]) {
    // Find the index of the callback and remove it in place
    const index: number = callbacks[msgEventType].indexOf(callback);
    if (index > -1) {
      callbacks[msgEventType].splice(index, 1); // Removes the callback at the specified index
    }
  }
}

// Notify function
function notifySubscribers<K extends keyof MessageEventMap>(msgEventType: K, data: MessageEventMap[K]): void {
  if (callbacks[msgEventType]) {
    callbacks[msgEventType]!.forEach((callback) => callback(data));
  }
}

// subscribe("a", () => {}); // should not work (wrong key)
// subscribe("game ", (a) => {}); // should not work (wrong key)
// subscribe("game", (data: GameMessageData) => {}); // should work
// subscribe("game", (data: ChatMessageData) => {}); // should not work (wrong prototype)
// subscribe("chat", (data: GameMessageData) => {}); // should not work (wrong prototype)
// subscribe("chat", (data: ChatMessageData) => {}); // should work

let socket: WebSocket | null = null;
let reconnectInterval: NodeJS.Timeout | null = null;

export function isConnected(): boolean {
  return socket !== null && socket.readyState === WebSocket.OPEN;
}

export function sendMessage<K extends SendableMessageTypes>(msgEventType: K, data: MessageEventMap[K]): void {
  if (!isConnected()) {
    return;
  }
  const message: { type: K; data: MessageEventMap[K]; } = {
    type: msgEventType,
    data: data
  };
  socket!.send(JSON.stringify(message));
}

// Connect the WebSocket to the server
export function connectToServer(): void {
  const token: string | null = localStorage.getItem("auth_token");
  if (!token) {
    console.error("no JWT token available");
    return; // Cannot connect to the server without a JWT token
  }

  if (isConnected() || (socket && socket.readyState === WebSocket.CONNECTING)) {
    return; // Avoid reconnecting if the WebSocket is already active
  }

  try {
    // Dynamically construct the WebSocket URL to avoid hardcoding
    const wsProtocol: string = window.location.protocol === "https:" ? "wss://" : "ws://"; // Use 'wss' for secure, 'ws' for non-secure
    const wsHost: string = window.location.host; // Get the domain and port (e.g., "example.com:443" or "localhost:8080")
    const wsPath: string = "/api/"; // The WebSocket endpoint path on the server
    const wsParams: string = `?token=${token}`; // The WebSocket parameters for the connection to the server

    const wsUrl: string = `${wsProtocol}${wsHost}${wsPath}${wsParams}`;

    socket = new WebSocket(wsUrl);

    let autoReconnectEnabled: boolean = true;

    // Handle connection open
    socket.onopen = () => {
      console.log("[WebSocket] Connected to ", wsUrl);
      notifySubscribers("onConnected", undefined);

      // Stop reconnection attempts once connected
      if (reconnectInterval !== null) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    // Handle incoming messages
    socket.onmessage = (event: MessageEvent) => {
      //console.log("Received:", JSON.parse(event.data));
      try {
        const data: any = JSON.parse(event.data);

        if (isGameMessage(data)) {
          notifySubscribers("game", data.data);
        } else if (isChatMessage(data)) {
          notifySubscribers("chat", data.data);
        } else if (isTournamentMessage(data)) {
          notifySubscribers("tournament", data.data);
        } else if (isErrorMessage(data)) {
          if (data.errorType) {
            console.error(`[WebSocket] Received an error (${data.errorType}):`, data.msg);
            if (data.errorType === ERROR_TYPE.CONNECTION_REFUSED) {
              if (data.msg == ERROR_MSG.TOKEN_MISSING_OR_INVALID) {
                localStorage.removeItem("auth_token");
              }
              autoReconnectEnabled = false;
            }
          } else {
            console.error("[WebSocket] Received an error:", data.msg);
          }
        } else {
          console.warn("[WebSocket] Unrecognized data type:", data);
        }
      }
      catch (error: any) {
        console.error("[WebSocket] An Error occured:", error);
      }
    };

    // Handle close
    socket.onclose = () => {
      socket = null;
      console.log("[WebSocket] connection closed.");
      notifySubscribers("onDisconnected", undefined);

      if (autoReconnectEnabled) {
        reconnect();
      }
    };

    // Handle errors
    socket.onerror = (error: Event) => {
      console.error("[WebSocket] error:", error);
    };
  } catch (error: any) {
    console.error("[WebSocket] Error during connection setup:", error);
  }
}

function reconnect(): void {
  console.log("[WebSocket] reconnecting in 5s ...");
  if (reconnectInterval !== null) {
    return; // Prevent multiple reconnect loops from running
  }

  reconnectInterval = setInterval(() => {
    connectToServer(); // Try to reconnect every 5s
  }, 5000);
}

connectToServer();