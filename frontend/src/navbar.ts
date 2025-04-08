const navLinks: NodeListOf<HTMLButtonElement> =
  document.querySelectorAll(".nav-link");

function handleNavClick(event: MouseEvent): void {
  const target = event.currentTarget as HTMLButtonElement;
  const section = target.dataset.target;

  if (section) {
    console.log(`Navigation vers : ${section}`);
    sidebar?.classList.add("-translate-x-full");
    sidebar?.classList.remove("translate-x-0");
  }
}

navLinks.forEach((button) => {
  button.addEventListener("click", handleNavClick);
});

const toggleButton = document.getElementById(
  "sidebarToggle",
) as HTMLButtonElement;
const sidebar = document.getElementById("sidebar");

if (toggleButton && sidebar) {
  toggleButton.addEventListener("click", () => {
    sidebar.classList.toggle("translate-x-0");
    sidebar.classList.toggle("-translate-x-full");
  });
}
