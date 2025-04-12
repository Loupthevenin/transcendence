export function ProfileView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "";
  container.innerHTML = `
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
`;
  return container;
}
