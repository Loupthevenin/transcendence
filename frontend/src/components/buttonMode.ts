export function ButtonMode(mode: string): HTMLElement {
  const container: HTMLElement = document.createElement("div");
  container.className = `
    inline-block 
    px-4 py-2 
    rounded-full 
    bg-indigo-700 
    text-white 
    text-sm 
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
