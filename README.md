# ft_transcendence

## 🕹️ Description

For this project, I developed a fully interactive Pong web platform with real-time multiplayer capabilities. This project pushed me to explore new technologies across web development, authentication, game design, blockchain, accessibility, and more. It challenged my ability to adapt, design, and ship a complete and complex product, both frontend and backend.

The app is deployed using Docker and runs as a single-page application. It includes a full authentication system, live gameplay, user management, chat, and even stores tournament scores on a test blockchain.

---

## 🌐 Tech Stack

- **Backend**: Node.js + Fastify
- **Frontend**: TypeScript + Tailwind CSS
- **Database**: SQLite
- **Blockchain**: Avalanche (testnet) + Solidity Smart Contracts
- **Auth**: JWT + 2FA + Google OAuth
- **Dockerized**: Full multi-container app with a single launch command

---

## ✅ Features Implemented

### 🧱 Core Functionality

- Real-time Pong gameplay (keyboard + remote players)
- Multiplayer matchmaking
- User registration, login, and profile management
- Tournament system with live scoreboards
- Single-page responsive web app
- HTTPS and security validations (XSS, SQLi protection, input validation)
- Dockerized with one-liner startup

---

## 🧩 Modules Implemented

### 🕸️ Web

- ✅ **Major**: Backend built using Fastify (Node.js)
- ✅ **Minor**: Frontend using Tailwind CSS
- ✅ **Minor**: SQLite for persistent backend storage
- ✅ **Major**: Tournament scores stored in **Avalanche Blockchain** via Solidity contracts

### 👥 User Management

- ✅ **Major**: Full user management (signup/login, avatars, match history, friend system, etc.)
- ✅ **Major**: Google OAuth for remote authentication

### 🧑‍💻 Gameplay & UX

- ✅ **Major**: Remote players support (real-time sync)
- ✅ **Minor**: Game customization (power-ups, visual themes)
- ✅ **Major**: Integrated live chat (DMs, blocking, game invites, tournament notifications)

### 📊 AI / Algo

- ✅ **Minor**: Game & user statistics dashboard with dynamic graphs

### 🔐 Cybersecurity

- ✅ **Major**: Implemented **JWT** and **2FA** (email and authenticator app support)

### 🧠 Graphics

- ✅ **Major**: Developed 3D-enhanced Pong using **Babylon.js**

### ♿ Accessibility

- ✅ **Minor**: Cross-device support (desktop, tablet, mobile)
- ✅ **Minor**: Browser compatibility extended (tested on Chrome, Firefox, Safari)
- ✅ **Minor**: Basic screen reader support and high-contrast themes
- ✅ **Minor**: Server-Side Rendering (SSR) for faster initial load and SEO

---

## 🧪 Testing & Deployment

- All services run inside Docker containers
- Deployment tested locally with Docker Compose
- Authenticated and unauthenticated routes tested using Postman
- Multiplayer gameplay stress-tested with simultaneous connections
- Blockchain contract tested in Avalanche Fuji testnet

---

## 🚀 How to Run

```bash
# Clone the repo and prepare .env
cp .env.example .env
# Edit .env with secrets, DB config, etc.

# Launch full stack
make
```
