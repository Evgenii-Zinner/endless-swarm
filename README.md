<div align="center">
<img width="1200" height="475" alt="Google AI Studio Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# 🌀 Endless Swarm

An endless hole.io-style game built with React, TypeScript, Tailwind CSS, and HTML5 Canvas. Swallow smaller objects, grow your swarming black hole, and consume procedurally generated objects infinitely.

> [!IMPORTANT]
> **AI Generation Credit:** This project is fully AI-generated using Google AI Studio. All core game loop mechanics, rendering, structure, and configuration were created through agentic prompting in AI Studio. **Jules will be developing this project further.**

---

## 🎮 Play the Game
The application is deployed on Firebase Hosting:
👉 **[Play Endless Swarm Live](https://endless-swarm-ezinner.web.app)**

---

## ✨ Features

- **Procedural Swarms**: Dynamic, endless world generation with various obstacles, shapes, and colors.
- **Infinite Scaling**: Consume items smaller than your swarm radius to grow larger. Consuming larger items triggers particle explosions.
- **Smooth Mechanics**: Fluid inertia, boundary collision, and optimized HTML5 Canvas loop.
- **Micro-Animations**: Clean menus, responsive buttons, and beautiful state transitions.
- **Fully Automated CI/CD**: Seamless PR previews and merge-to-production pipelines via GitHub Actions.

---

## 🚀 Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) or [Bun](https://bun.sh/) installed.

### 1. Install Dependencies
Using **Bun** (recommended):
```bash
bun install
```
Or using **npm**:
```bash
npm install
```

### 2. Start Development Server
Using **Bun**:
```bash
bun run dev
```
Or using **npm**:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ CI/CD & Deployments

This project is deployed to Google Cloud Firebase Hosting:
- **Testing Routes (PR Previews)**: Every time a Pull Request is opened, GitHub Actions spins up a temporary preview instance of the app. This creates a dedicated testing URL for verifying features before they are merged.
- **Production Pipeline**: Merges to `master` automatically trigger a production build and deployment to the main URL.

