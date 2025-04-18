
export function setupChat(container: HTMLElement) {
  loadChatList();
  const button = container.querySelector<HTMLButtonElement>("#new-chat-button");
  if (!button) {
    console.error("New Chat button not found");
    return;
  }

  // Créer dynamiquement un input pour entrer receiverId
  const input = document.createElement("input");
  input.type = "number";
  input.placeholder = "Enter receiver ID...";
  input.className = "mt-2 p-2 rounded w-full border bg-[#2a255c] text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 hidden";

  // Le mettre juste après le bouton
  button.parentElement?.appendChild(input);

  button.addEventListener("click", () => {
    input.classList.toggle("hidden");
    input.focus();
  });

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const receiverId = parseInt(input.value.trim(), 10);
      if (isNaN(receiverId)) {
        alert("Invalid ID");
        return;
      }

      try {
        const { roomId, otherUserName, otherUserAvatar } = await createOrGetChatRoom(receiverId);
        openChatWindow(roomId, otherUserName);
        const list = document.getElementById("chat-list");
        if (list) {
          const existingItem = list.querySelector(`li[data-room-id="${roomId}"]`);
          
          if (existingItem) {
            // 🚀 Si existe déjà ➔ on le remonte en haut
            list.prepend(existingItem);
          } else {
            // 🚀 Sinon ➔ on le crée
            const li = document.createElement("li");
            li.className = "flex items-center gap-4 p-2 rounded-lg hover:bg-[#2a255c] cursor-pointer transition";
            li.setAttribute("data-room-id", roomId.toString());
        
            li.innerHTML = `
              <img src="${otherUserAvatar ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" 
                   class="w-10 h-10 rounded-full object-cover" 
                   alt="Avatar">
              <div class="flex flex-col">
                <span class="font-semibold">${otherUserName}</span>
                <span class="text-xs text-gray-400">now</span>
              </div>
            `;
        
            li.addEventListener("click", () => {
              openChatWindow(roomId, otherUserName);
            });
        
            list.prepend(li);
          }
        }
      
      } catch (err) {
        console.error("Failed to create or join chatroom", err);
        alert("Unable to create or join chatroom.");
      }

      input.value = "";
      input.classList.add("hidden");
    }
  });
}


// Fonction qui ouvre une "fenêtre" de chat dans le DOM
function openChatWindow(roomId: number, otherUserName: string) {
  const chatsContainer = document.getElementById("chats");

  if (!chatsContainer) {
    console.error("Chats container not found");
    return;
  }

  // 🚨 Avant d'ouvrir ➔ on vide le contenu
  chatsContainer.innerHTML = "";

  const chatBox = document.createElement("div");
  chatBox.className = "border p-4 rounded mb-4 bg-indigo-600";
  chatBox.innerHTML = `
    <h3 class="font-bold mb-2">Chat Room with ${otherUserName}</h3>
    <ul id="chat-messages-${roomId}" class="mb-2 h-80 overflow-y-auto bg-white text-black p-2 rounded"></ul>
    <form id="chat-form-${roomId}" class="flex gap-2 mt-2">
      <input type="text" class="flex-1 border rounded p-2" placeholder="Message..." />
      <button type="submit" class="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded">Send</button>
    </form>
  `;

  chatsContainer.appendChild(chatBox);

  const form = chatBox.querySelector(`#chat-form-${roomId}`) as HTMLFormElement;
  const input = form.querySelector("input") as HTMLInputElement;
  const list = chatBox.querySelector(`#chat-messages-${roomId}`) as HTMLUListElement;

  loadChatRoomMessages(roomId, list);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;
  
    try {
      const res = await fetch("/api/chatroom/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ roomId, content: msg }),
      });
  
      if (!res.ok) {
        throw new Error("Failed to send message");
      }
  
      const li = document.createElement("li");
      li.textContent = msg;
      list.appendChild(li);
  
      input.value = "";
  
    } catch (err) {
      console.error("Error sending message", err);
      alert("Error sending message");
    }
  });
}


export async function createOrGetChatRoom(receiverId: number): Promise<{ roomId: number; otherUserName: string; otherUserAvatar: string | null }> {
  const res = await fetch("/api/chatroom", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("auth_token")}`, 
    },
    body: JSON.stringify({ receiverId }),
  });

  if (!res.ok) {
    throw new Error("Failed to create or get chatroom");
  }

  return res.json();
}


type ChatRoom = {
  roomId: number;
  otherUserId: number;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessageAt: string;
};

export async function loadChatList() {
  const list = document.getElementById("chat-list");
  if (!list) {
    console.error("Chat list container not found");
    return;
  }

  try {
    const res = await fetch("/api/chatrooms", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to load chatrooms");
    }

    const chatrooms = await res.json() as ChatRoom[];

    list.innerHTML = ""; // Clean existing

    chatrooms.forEach(room => {
      const li = document.createElement("li");
      li.className = "flex items-center gap-4 p-2 rounded-lg hover:bg-[#2a255c] cursor-pointer transition";
      li.setAttribute("data-room-id", room.roomId.toString());

      li.innerHTML = `
        <img src="${room.otherUserAvatar ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" 
             class="w-10 h-10 rounded-full object-cover" 
             alt="Avatar">
        <div class="flex flex-col">
          <span class="font-semibold">${room.otherUserName}</span>
          <span class="text-xs text-gray-400">${new Date(room.lastMessageAt).toLocaleString()}</span>
        </div>
      `;

      li.addEventListener("click", () => {
        openChatWindow(room.roomId, room.otherUserName); // 👉 Ouvre la bonne room
      });

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading chatrooms", err);
  }
}

async function loadChatRoomMessages(roomId: number, listElement: HTMLUListElement) {
  try {
    const res = await fetch(`/api/chatroom/${roomId}/messages`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch messages");
    }

    const messages = await res.json() as {
      id: number;
      sender_id: number;
      content: string;
      created_at: string;
    }[];

    // Injecter chaque message dans la liste
    messages.forEach(msg => {
      const li = document.createElement("li");
      li.textContent = msg.content; // Tu peux aussi afficher le sender si besoin
      listElement.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading messages", err);
  }
}
