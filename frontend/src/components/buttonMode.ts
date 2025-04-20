export function ButtonMode(mode: string): HTMLElement {
  const button: HTMLElement = document.createElement("div");
  button.className = `
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
  button.id = mode;
  button.textContent = mode;
  return button;
}
