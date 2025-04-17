export function ChatView(): HTMLElement {
    const container: HTMLDivElement = document.createElement("div");
    container.className = "flex justify-center items-center w-screen h-screen bg-[#0f0e26] p-0 m-0";
    container.innerHTML = `
 <div class="w-[90vw] max-w-[1800px] h-[90vh] rounded-xl shadow-xl overflow-hidden flex">
    <section class="flex flex-1 bg-[#0f0e26] text-white">
      <!-- Colonne gauche : liste des amis -->
      <aside class="w-1/3 bg-[#1e1b4b] flex flex-col border-r border-indigo-500">
        <!-- Barre de recherche -->
        <div class="p-4 border-b border-indigo-500">
          <input
            type="text"
            id="search-friends"
            name="search"
            type="text"
            placeholder="Rechercher un ami..."
            class="w-full px-4 py-2 rounded-lg bg-[#2a255c] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Liste des amis -->
        <ul id="friends-list" class="flex-1 overflow-y-auto p-4 space-y-4">
        </ul>
      </aside>

      <!-- Colonne droite : chat -->
      <section id="chat-section" class="flex-1 flex flex-col bg-[#1e1b4b]">
        <ul id="chat-messages" class="flex-1 overflow-y-auto px-6 py-4 space-y-3"></ul>
        <form id="chat-form" class="flex gap-2 px-4 py-3 border-t border-indigo-500 bg-[#2a255c]">
          <input
            id="chat-input"
            class="flex-grow bg-[#1e1b4b] text-white border border-indigo-400 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Tapez votre message..."
          />
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition">
            Envoyer
          </button>
        </form>
      </section>
    </section>
  </div>
`;

  return container;
}
