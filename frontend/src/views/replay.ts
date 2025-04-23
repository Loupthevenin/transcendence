export function ReplayView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "flex justify-center items-end w-screen bg-gray-900 text-white";
  container.innerHTML = `
    <div class="relative w-3/4 mb-8">
      <div id="tooltip" class="fixed"></div>
      <div class="relative w-full h-2 bg-gray-700 rounded-lg">
        <div id="filled-progress" class="absolute top-0 left-0 h-full bg-blue-500 rounded-lg"></div>
        <input type="range" id="progress-bar" min="0" max="0" value="0"
          class="absolute top-0 left-0 w-full h-full appearance-none cursor-pointer">
      </div>
      <div id="current-time" class="text-center mt-2">0:00</div>
    </div>
    <div id="error-message" class="hidden fixed inset-0 flex items-center justify-center">
      <div class="bg-red-600 text-white p-4 rounded-lg shadow-lg text-xl">
          <span id="error-text"></span>
      </div>
    </div>

`;
  return container;
}
