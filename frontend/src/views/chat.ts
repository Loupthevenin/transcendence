export function ChatView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "flex flex-col w-screen h-screen bg-[#0f0e26] text-white";

  container.innerHTML = `
    <!-- Top bar avec bouton New Chat -->
    <div class="flex items-center justify-between px-6 py-4 bg-[#1e1b4b] border-b border-indigo-500">
      <h1 class="text-xl font-bold">Chat</h1>
      <button id="new-chat-button" class="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition">
        ➕ New Chat
      </button>
    </div>

    <!-- Zone principale -->
    <div class="flex flex-1 overflow-hidden">
      
      <!-- Chat list -->
      <aside class="w-1/4 bg-[#1e1b4b] border-r border-indigo-500 overflow-y-auto">
        <ul id="chat-list" class="p-4 space-y-2">
          <!-- Les conversations viendront ici -->
        </ul>
      </aside>

      <!-- Fenêtres de chat -->
      <main id="chats" class="flex-1 bg-[#0f0e26] overflow-y-auto p-6 space-y-4">
        <!-- Les fenêtres de chat générées dynamiquement viendront ici -->
      </main>

    </div>
  `;

  return container;
}
