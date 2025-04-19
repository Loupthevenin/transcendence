export function ButtonMode(mode: string): HTMLElement {
  const container: HTMLElement = document.createElement("div");
  container.className = `
    inline-block 
    px-6 py-4 
    rounded-full 
    bg-indigo-700 
    text-white 
    text-lg 
    font-semibold 
    shadow 
    hover:bg-indigo-800 
    transition 
    cursor-pointer 
	select-none 
	text-center 
	capitalize
  `;
  container.id = `${mode}`;
  container.textContent = mode;
  return container;
}
