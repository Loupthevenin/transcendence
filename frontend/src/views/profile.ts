export function ProfileView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "space-y-8 overflow-auto p-6 max-w-3xl mx-auto";
  container.innerHTML = `
<!-- Profil Utilisateur -->
    <div class="bg-[#1e1b4b] p-6 rounded-xl shadow-lg text-white">
      <h3 class="text-xl font-semibold text-indigo-300 mb-4">Profil</h3>
      <div class="flex items-center space-x-10">
        <div class="relative group">
          <img src="/api/textures/avatar-default.svg" alt="Avatar"
               class="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md cursor-pointer hover:opacity-80 transition"
               id="user-avatar">
          <input type="file" accept="image/*" id="avatar-upload" class="sr-only" />
          <div class="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm text-white">
            Changer
          </div>
        </div>
        <div>
          <p class="text-sm text-purple-300 mb-1">Nom d’utilisateur</p>
          <div id="display-name-container" class="mb-4">
            <span id="display-name" class="text-lg font-bold cursor-pointer hover:underline">Nom d'utilisateur</span>
          </div>

          <p class="text-sm text-purple-300 mb-1">Email</p>
          <div id="user-email-container">
            <span id="user-email" class="text-lg font-bold cursor-pointer hover:underline">email@exemple.com</span>
          </div>
        </div>
      </div>
    </div>

<!-- Win Rate -->
<div class="bg-[#1e1b4b] p-6 rounded-xl shadow-lg text-white">
  <h3 class="text-xl font-semibold text-indigo-300 mb-4">Statistiques</h3>
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm text-purple-300 mb-1">Win Rate</p>
      <div id="win-rate-container" class="text-2xl font-bold text-green-400"></div>
    </div>
    <div class="flex-shrink-0 ml-6">
      <div id="pie-chart" class="pie-chart"></div>
    </div>
  </div>
</div>

<!-- Historique des matchs -->
    <div class="bg-[#1e1b4b] p-6 rounded-xl shadow-lg text-white">
      <h3 class="text-xl font-semibold text-indigo-300 mb-4">Historique des matchs</h3>
      <ul id="match-history" class="space-y-3">
        <!-- Matchs insérés dynamiquement -->
	  </ul>
	</div>

	<!-- 2FA -->
<div class="mt-8 bg-[#1e1b4b] p-6 rounded-xl shadow-lg">
  <h3 class="text-xl font-semibold text-indigo-300 mb-4">Sécurisez votre compte</h3>
  <p class="text-sm text-purple-300 mb-4">
    Activez l'authentification à deux facteurs pour renforcer la sécurité de votre compte.
  </p>
  <button
    class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition"
    id="activate-2fa"
  >
    Activer l'authentification à deux facteurs
  </button>
	<div id="qr-code-container"></div>
</div>
<!-- Bouton de déconnexion -->
<div class="mt-8 bg-[#1e1b4b] p-6 rounded-xl shadow-lg flex justify-center">
  <button
    class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
    id="logout-button"
  >
    Déconnexion
  </button>
</div>
`;
  return container;
}
