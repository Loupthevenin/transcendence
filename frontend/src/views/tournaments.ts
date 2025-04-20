export function TournamentView(): HTMLElement {
  const container: HTMLElement = document.createElement("div");
  container.className = "bg-gray-900 text-white min-h-screen py-10 px-6 flex-1";
  container.innerHTML = `<div class="max-w-7xl mx-auto">

      <!-- Titre -->
      <h1 class="text-4xl font-bold text-indigo-400 text-center mb-12">
        Tournois
      </h1>

      <!-- Créer un tournoi -->
      <div class="flex justify-center mb-10">
        <button class="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md">
          + Créer un tournoi
        </button>
      </div>

      <!-- Tournois -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
		<!-- insertion dynamique -->
        <div class="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">Tournoi #1</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : 8/8</p>
            <p class="text-purple-200">Statut : En cours</p>
          </div>
          <button class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all">
            Rejoindre
          </button>
        </div>

        <div class="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">Tournoi #2</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : 6/8</p>
            <p class="text-purple-200">Statut : En attente</p>
          </div>
          <button class="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-all">
            Rejoindre
          </button>
        </div>

        <div class="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between">
          <div>
            <h2 class="text-2xl font-semibold text-indigo-300 mb-2">Tournoi #3</h2>
            <p class="text-purple-200 mb-1">Joueurs inscrits : 4/8</p>
            <p class="text-purple-200">Statut : En attente</p>
          </div>
          <button class="mt-6 bg-gray-600 text-white py-2 rounded-md cursor-not-allowed" disabled>
            Déjà inscrit
          </button>
        </div>

      </div>
    </div>`;
  return container;
}
