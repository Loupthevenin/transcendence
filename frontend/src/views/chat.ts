export function ChatView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "flex w-screen h-screen bg-[#0f0e26] text-white";

  container.innerHTML = `
    <div id="chat-interface" class="flex w-full h-full">
      <!-- Sidebar -->
      <div class="w-80 bg-[#1e1b4b] rounded-2xl mt-20 ml-4 mr-4 mb-4 p-4 flex flex-col shadow-lg" id="chat-sidebar">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Messages</h2>
          <div class="relative">
             <button id="menu-sidebar" class="text-white text-xl" aria-label="Menu">⋮</button>
              <div id="sidebar-menu-placeholder"></div>
          </div>
        </div>
        <input
          id="user-search-input"
          type="text"
          placeholder="Recherche par nom ou ID..."
          class="rounded-xl p-2 text-white text-sm border border-gray-300 mb-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <ul id="search-results" class="mb-2 text-sm text-white max-h-40 overflow-y-auto flex flex-col gap-1"></ul>
        <ul id="chat-list" class="flex flex-col gap-3 overflow-y-auto flex-1"></ul>
      </div>

      <!-- Chat area -->
      <div class="flex-1 flex flex-col h-full min-h-0 relative" id="chat-app">
        <div id="chats" class="flex-1 flex flex-col overflow-y-auto min-h-0"></div>
      </div>

      <!-- Not connected screen à l’extérieur -->
      <div id="not-connected-screen" class="hidden absolute inset-0 flex items-center justify-center bg-[#0f0e26] bg-opacity-90 z-10">
        <div class="bg-[#1e1b4b] p-10 rounded-2xl shadow-lg flex flex-col items-center gap-4">
          <p class="text-lg text-white">Connectez-vous pour envoyer des messages</p>
          <button id="login-btn" class="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Se connecter</button>
        </div>
      </div>
    </div>
  `;

  return container;
}

export function createChatBox(userName: string, avatar_url: string | null): HTMLDivElement {
  const box = document.createElement("div");
  box.className = "flex flex-col flex-1 h-full min-h-0 bg-[#1e1b4b] rounded-2xl m-4 p-4 shadow-lg";

  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <img id="chat-avatar" class="w-10 h-10 rounded-full object-cover cursor-pointer" src="${avatar_url ?? "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"}" alt="Avatar">
        <h2 id="chat-username" class="text-lg font-semibold">${userName}</h2>
      </div>
      <div class="relative">
        <button id="chat-menu-btn" class="text-xl">⋮</button>
        <div id="chat-menu-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#1e1b4b] text-white rounded shadow-lg z-50">
          <button id="view-profile-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">👤 Voir le profil</button>
          <button id="block-user-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">Chargement...</button>
          <button id="invite-to-game-btn" class="w-full text-left px-4 py-2 hover:bg-gray-200">🎮 Inviter à un match</button>
        </div>
      </div>
    </div>
    <ul id="chat-messages" class="flex flex-col flex-grow overflow-y-auto bg-[#2e2c60] rounded-xl p-4 mb-4 text-white"></ul>
    <form id="chat-form" class="flex gap-2">
      <input type="text" class="flex-1 border border-gray-300 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Message..." />
      <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">Send</button>
    </form>
  `;

  while (wrapper.firstChild) box.appendChild(wrapper.firstChild);
  return box;
}
