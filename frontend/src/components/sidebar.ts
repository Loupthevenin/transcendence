export function Sidebar(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "flex h-screen bg-[#0f172a] text-gray-200 relative";

  // Toggle button
  const toggle = document.createElement("button");
  toggle.id = "sidebarToggle";
  toggle.className =
    "absolute top-4 left-4 z-50 p-2 bg-[#1e293b] text-white shadow-md rounded-md hover:bg-[#334155]";
  toggle.innerText = " ☰";

  // Sidebar container
  const sidebar = document.createElement("aside");
  sidebar.className =
    "w-64 bg-[#1e1b4b] shadow-md flex flex-col transition-transform duration-300 transform -translate-x-full absolute top-0 left-0 z-40 h-full";
  sidebar.id = "sidebar";

  sidebar.innerHTML = `
        <nav class="flex-1 mt-15">
          <ul id="nav" class="space-y-2 p-4">
				${[
          { label: "Pong", route: "pong" },
          { label: "Chat", route: "chat" },
          { label: "Connexion", route: "auth/login" },
          { label: "Inscription", route: "auth/signup" },
          { label: "Profil", route: "profile" },
        ]
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
