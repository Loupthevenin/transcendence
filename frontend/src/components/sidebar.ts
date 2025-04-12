// function isAuthenticated(): boolean {
//   return !!localStorage.getItem("auth_token");
// }

function getSidebarItems(): { label: string; route: string }[] {
  let items;
  items = [
    { label: "Accueil", route: "/" },
    { label: "Pong", route: "pong" },
    { label: "Chat", route: "chat" },
    { label: "Connexion", route: "auth/login" },
    { label: "Inscription", route: "auth/signup" },
    { label: "Profil", route: "profile" },
  ];

  // if (isAuthenticated()) {
  //   items = [
  // { label: "Accueil", route: "/" },
  //     { label: "Pong", route: "pong" },
  //     { label: "Chat", route: "chat" },
  //     { label: "Profil", route: "profile" },
  //   ];
  // } else {
  //   items = [
  // { label: "Accueil", route: "/" },
  //     { label: "Pong", route: "pong" },
  //     { label: "Connexion", route: "auth/login" },
  //     { label: "Inscription", route: "auth/signup" },
  //   ];
  // }
  return items;
}

export function Sidebar(): HTMLElement {
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.className = "flex h-screen bg-[#0f172a] text-gray-200 relative";

  // Toggle button
  const toggle: HTMLButtonElement = document.createElement("button");
  toggle.id = "sidebarToggle";
  toggle.className =
    "absolute top-4 left-4 z-50 p-2 bg-[#1e293b] text-white shadow-md rounded-md hover:bg-[#334155]";
  toggle.innerText = " ☰";

  // Sidebar container
  const sidebar: HTMLElement = document.createElement("aside");
  sidebar.className =
    "w-64 bg-[#1e1b4b] shadow-md flex flex-col transition-transform duration-300 transform -translate-x-full absolute top-0 left-0 z-40 h-full";
  sidebar.id = "sidebar";

  const items = getSidebarItems();

  sidebar.innerHTML = `
        <nav class="flex-1 mt-15">
          <ul id="nav" class="space-y-2 p-4">
			${items
        .map(
          (item) => `
				<li>
					<button data-target="${item.route}" class="nav-link w-full text-left flex items-center p-2 rounded text-indigo-400 hover:bg-[#312e81] hover:text-white">${item.label}</button>
				</li>
				`,
        )
        .join("")}
          </ul>
        </nav>
`;

  wrapper.appendChild(toggle);
  wrapper.appendChild(sidebar);
  return wrapper;
}
