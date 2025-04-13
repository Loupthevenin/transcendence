// function isAuthenticated(): boolean {
//   return !!localStorage.getItem("auth_token");
// }

interface SidebarItem {
  label: string;
  route: string;
}

function getSidebarItems(): SidebarItem[] {
  const items: SidebarItem[] = [
    { label: "Accueil", route: "/" },
    { label: "Pong", route: "/pong" },
    { label: "Chat", route: "/chat" },
    { label: "Connexion", route: "/auth/login" },
    { label: "Inscription", route: "/auth/signup" },
    { label: "Profil", route: "/profile" },
  ];

  // if (isAuthenticated()) {
  //   items = [
  // { label: "Accueil", route: "/" },
  //     { label: "Pong", route: "/pong" },
  //     { label: "Chat", route: "/chat" },
  //     { label: "Profil", route: "/profile" },
  //   ];
  // } else {
  //   items = [
  // { label: "Accueil", route: "/" },
  //     { label: "Pong", route: "/pong" },
  //     { label: "Connexion", route: "/auth/login" },
  //     { label: "Inscription", route: "/auth/signup" },
  //   ];
  // }
  return items;
}

function ToggleMenu(): HTMLElement {
  const toggle: HTMLDivElement = document.createElement("div");
  toggle.id = "sidebarToggle";
  toggle.className = "sidebar-toggle";

  toggle.innerHTML = `
    <span class="bracket">[</span>
    <span class="menu-text">MENU</span>
    <span class="bracket">]</span>
  `;
  return toggle;
}

export function Sidebar(): HTMLElement {
  const wrapper: HTMLDivElement = document.createElement("div");
  wrapper.className =
    "flex h-screen font-['Inter'] bg-[#0f172a] text-gray-200 relative";

  const toggle: HTMLElement = ToggleMenu();

  const sidebar: HTMLElement = document.createElement("div");
  sidebar.className = "sidebar";
  sidebar.id = "sidebar";

  const items: SidebarItem[] = getSidebarItems();

  sidebar.innerHTML = `
        <nav >
          <ul id="nav">
			${items
        .map(
          (item: SidebarItem) => `
				<li>
					<a data-target="${item.route}" class="nav-link">${item.label}</a>
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
