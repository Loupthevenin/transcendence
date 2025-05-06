import { maxScoreToWin } from "@shared/game/constants";

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
        <button id="create-tournament" class="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg shadow-md">
          + Créer un tournoi
        </button>
<!-- Formulaire de création de tournoi -->
<form id="tournament-form" class="max-w-xl mx-auto bg-[#2a255c] p-6 rounded-lg shadow-md text-white space-y-6 hidden">
  <div>
    <label for="tournament-name" class="block text-sm font-medium mb-2">Nom du tournoi</label>
    <input
      type="text"
      id="tournament-name"
      name="tournamentName"
      class="w-full px-4 py-2 rounded-lg bg-[#1e1b4b] text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>


  <div>
    <label for="points-to-win" class="block text-sm font-medium mb-2">Points pour gagner</label>
    <input
      type="number"
      id="points-to-win"
      name="pointsToWin"
      min="1"
      max="${maxScoreToWin}"
      value="5"
      class="w-full px-4 py-2 rounded-lg bg-[#1e1b4b] text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      required
    />
  </div>

  <div>
    <label for="players-count" class="block text-sm font-medium mb-2">Nombre de joueurs</label>
    <select
      id="players-count"
      name="playersCount"
      class="w-full px-4 py-2 rounded-lg bg-[#1e1b4b] text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
      required
    >
      <option value="4">4 joueurs</option>
      <option value="8">8 joueurs</option>
      <option value="16">16 joueurs</option>
      <option value="32">32 joueurs</option>
    </select>
  </div>

  <div class="flex justify-end">
    <button
      type="submit"
      class="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg"
    >
      Lancer le tournoi
    </button>
<button type="reset" class="ml-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg">
  Annuler
</button>
  </div>
</form>
      </div>
      <!-- Tournois -->
      <div id="tournaments-container" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
		<!-- insertion dynamique -->
      </div>
    </div>`;
  return container;
}

export function TournamentProgressView(): HTMLElement {
  const container: HTMLElement = document.createElement("div");
  container.className = "flex-1 flex items-center justify-center text-white";
  container.id = "bracket";
  container.innerHTML = ``;
  return container;
}
