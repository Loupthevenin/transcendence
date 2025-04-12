export function TwoFAView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "flex justify-center items-center min-h-screen";
  container.innerHTML = `
<div class="bg-gray-800 p-8 rounded-lg shadow-xl max-w-sm w-full">
       <h2 class="text-3xl text-center font-bold text-indigo-400 mb-6">
         Vérification 2FA
       </h2>
 
       <form id="2FAForm" action="#" method="POST">
         <div class="mb-4">
           <label for="code" class="block text-sm font-medium text-purple-300"
             >Code de vérification</label
           >
           <input
             type="text"
             id="code"
             name="code"
             class="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
             placeholder="Entrez votre code 2FA"
             required
           />
         </div>
 
         <button
           type="submit"
           class="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
         >
           Valider
         </button>
       </form>
     </div>
`;
  return container;
}
