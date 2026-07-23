<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:F97316,50:EA580C,100:DC2626&height=180&section=header&text=🎮%20Pixel%20Engine&fontSize=42&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Lightweight%202D%20Physics%20Game%20Engine&descSize=18&descAlignY=55" width="100%" />

<br/>

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-Visit%20Site-F97316?style=for-the-badge)](https://pixel-engine-mu.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/rudra3132p-glitch/pixel-engine)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Canvas](https://img.shields.io/badge/Canvas%20API-FF9A00?style=for-the-badge&logo=html5&logoColor=white)

</div>

<br/>

## 🎮 About

**Pixel Engine** is a lightweight, performant 2D physics game engine built with TypeScript and Canvas API. It features a visual level editor, real-time physics simulation with collision detection, and an entity component system — everything you need to create 2D games in the browser.

> Build, test, and play 2D games entirely in your browser.

<br/>

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| ⚙️ **Physics Engine** | Rigid body dynamics with gravity, friction, and restitution |
| 💥 **Collision Detection** | AABB and circle collision detection with spatial hashing |
| 🏗️ **Level Editor** | Visual drag-and-drop level editor with entity placement |
| 🧩 **Entity Component System** | Modular ECS architecture for game objects |
| 🎨 **Sprite Rendering** | Efficient Canvas-based rendering with sprite support |
| 🎯 **Input System** | Keyboard and mouse input handling with event mapping |
| 🔄 **Game Loop** | Fixed timestep game loop with delta time management |
| 📐 **Transform System** | Position, rotation, and scale transformations |

<br/>

## 🛠️ Tech Stack

- **TypeScript** — Type-safe game engine architecture
- **Canvas API** — 2D rendering pipeline
- **Vite** — Lightning-fast development and build tooling
- **React** — Level editor UI components
- **HTML5** — Game canvas container

<br/>

## 📂 Project Structure

```
pixel-engine/
├── public/               # Static assets
├── src/
│   ├── engine/           # Core engine modules
│   │   ├── physics.ts    # Physics simulation
│   │   ├── collision.ts  # Collision detection
│   │   ├── renderer.ts   # Canvas rendering
│   │   └── input.ts      # Input handling
│   ├── editor/           # Level editor
│   ├── entities/         # Game entity definitions
│   ├── components/       # ECS components
│   └── main.ts           # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

<br/>

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/rudra3132p-glitch/pixel-engine.git
   cd pixel-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser** at `http://localhost:5173` and start building levels!

<br/>

## 🏗️ Engine Architecture

```
┌─────────────────────────────────────────┐
│              Game Loop                   │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │  Input   │ │ Physics │ │ Renderer │  │
│  │ System   │ │ Engine  │ │ (Canvas) │  │
│  └────┬─────┘ └────┬────┘ └────┬─────┘  │
│       │            │           │         │
│  ┌────▼────────────▼───────────▼──────┐  │
│  │     Entity Component System        │  │
│  │  ┌──────┐ ┌────────┐ ┌─────────┐  │  │
│  │  │Transform│ RigidBody│ │ Sprite  │  │  │
│  │  └──────┘ └────────┘ └─────────┘  │  │
│  └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

<br/>

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

<br/>

---

<div align="center">

**Built with 🎮 by [Rudra Prajapati](https://github.com/rudra3132p-glitch)**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:F97316,50:EA580C,100:DC2626&height=100&section=footer" width="100%" />

</div>
