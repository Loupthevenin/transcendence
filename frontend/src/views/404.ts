// This function generate the 404 page
export function Generate404Page(): void {
  const container: HTMLDivElement = document.createElement("div");
  container.className = "relative w-screen h-screen overflow-hidden"; // This prevent scrollbar to appear when 404 bounce on the right and bottom

  const logo404: HTMLDivElement = document.createElement("div");
  logo404.id = "logo404";
  logo404.className = "absolute text-8xl font-extrabold text-pink-500 drop-shadow-lg pointer-events-none";
  logo404.textContent = "404";
  container.appendChild(logo404);

  // Add inline script for the animation logic
  const script: HTMLScriptElement = document.createElement("script");
  script.type = "text/javascript";
  script.textContent = `
    const logo404 = document.getElementById("logo404");
    if (logo404) {
      let vw = window.innerWidth;
      let vh = window.innerHeight;

      let posX = Math.random() * vw;
      let posY = Math.random() * vh;

      const dir = Math.random() * Math.PI * 2;
      let speedX = Math.cos(dir) * 3.5;
      let speedY = Math.sin(dir) * 3.5;

      const updatePosition = () => {
        posX += speedX;
        posY += speedY;

        if (posX <= 0 || posX + logo404.offsetWidth >= vw) {
          speedX *= -1;
          posX = Math.max(0, Math.min(posX, vw - logo404.offsetWidth));
        }
        if (posY <= 0 || posY + logo404.offsetHeight >= vh) {
          speedY *= -1;
          posY = Math.max(0, Math.min(posY, vh - logo404.offsetHeight));
        }

        logo404.style.transform = \`translate(\${posX}px, \${posY}px)\`;
        requestAnimationFrame(updatePosition);
      };

      window.addEventListener("resize", () => {
        vw = window.innerWidth;
        vh = window.innerHeight;
      });

      updatePosition();
    }
  `;

  // Append the script and attach the container to the body
  container.appendChild(script);
  document.body.appendChild(container);
}
