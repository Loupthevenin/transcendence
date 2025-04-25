export function ReplayView(): HTMLElement {
  const container: HTMLDivElement = document.createElement("div");
  container.id = "replay-ui";
  container.className = "flex justify-center items-end w-screen pointer-events-none z-100";
  container.innerHTML = `
    <div class="relative w-3/4 mb-8">
      <div id="tooltip" class="fixed text-center text-white"></div>

      <div class="flex items-center w-full">
        <div id="current-time" class="text-white w-16 text-right pr-2">0:00</div>

        <div class="relative flex-grow h-2 bg-gray-700 rounded-lg">
          <div id="filled-progress" class="absolute top-0 left-0 h-full bg-blue-500 rounded-lg"></div>
          <input type="range" id="progress-bar" min="0" max="0" value="0"
            class="absolute top-0 left-0 w-full h-full appearance-none cursor-pointer pointer-events-auto">
        </div>

        <div id="total-time" class="text-white w-16 text-left pl-2">0:00</div>
      </div>

      <div class="flex justify-center items-center mt-2 text-white">
        <div class="relative ml-4">
          <select id="speed-control" 
            class="bg-gray-800 text-white rounded-lg pl-2 pr-8 py-1 pointer-events-auto appearance-none cursor-pointer border border-gray-600 focus:outline-none">
            <option value="0.5">0.5x</option>
            <option value="1" selected>1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>

          <div class="absolute top-1/2 right-2 transform -translate-y-1/2 pointer-events-none text-white">
            ▼
          </div>
        </div>
      </div>
    </div>

    <div id="error-message" class="hidden fixed inset-0 flex items-center justify-center">
      <div class="bg-red-600 text-white p-4 rounded-lg shadow-lg text-xl">
          <span id="error-text"></span>
      </div>
    </div>
`;
  return container;
}
