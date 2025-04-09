export function SignupView(): HTMLElement {
  const container = document.createElement("div");
  container.className = "flex justify-center items-center min-h-screen";
  container.innerHTML = `
	<div class="bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full">
      <h2 class="text-3xl text-center font-bold text-indigo-400 mb-6">
        Créer un compte
      </h2>

      <form id="signupForm" action="#" method="POST">
        <div class="mb-4">
          <label for="name" class="block text-sm font-medium text-purple-300"
            >Nom</label
          >
          <input
            type="text"
            id="name"
            name="name"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Votre nom"
            required
          />
        </div>

        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-purple-300"
            >Email</label
          >
          <input
            type="email"
            id="email"
            name="email"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Votre email"
            required
          />
        </div>

        <div class="mb-4">
          <label
            for="password"
            class="block text-sm font-medium text-purple-300"
            >Mot de passe</label
          >
          <input
            type="password"
            id="password"
            name="password"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Votre mot de passe"
            required
          />
        </div>

        <div class="mb-4">
          <label
            for="confirm_password"
            class="block text-sm font-medium text-purple-300"
            >Confirmer le mot de passe</label
          >
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Conrirmez votre mot de passe"
            required
          />
        </div>

        <button
          type="submit"
          class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          S'inscrire
        </button>
      </form>

      <div class="mt-4 text-center">
        <p class="text-sm text-purple-300">
          Vous avez déjà un compte ?
          <a href="auth/login" data-link class="text-indigo-400 hover:underline"
            >Se connecter</a
          >
        </p>
      </div>
	</div>
`;
  return container;
}
