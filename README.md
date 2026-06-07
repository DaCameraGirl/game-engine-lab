# 🎮✨ The Engine Lab

**The Engine Lab** is a multi-engine game dev showcase with a playable browser arcade plus native-style demos for **Godot, Panda3D, Solar2D, and Stride**.

🌐 **Play it live:** https://dacameragirl.github.io/game-engine-lab/

![HTML](https://img.shields.io/badge/HTML-Live%20Site-ff6b6b?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-Engine%20Arcade-f7df1e?style=for-the-badge)
![GDScript](https://img.shields.io/badge/GDScript-Godot-478cbf?style=for-the-badge)
![Python](https://img.shields.io/badge/Python-Panda3D-3776ab?style=for-the-badge)
![Lua](https://img.shields.io/badge/Lua-Solar2D-2c2d72?style=for-the-badge)
![CSharp](https://img.shields.io/badge/C%23-Stride-ff00aa?style=for-the-badge)

## 🕹️ Live Browser Arcade

The GitHub Pages site includes a four-mode arcade cabinet in the browser. Each mode is inspired by one engine and has its own mechanics instead of being a tiny MVP.

| Mode | Engine Theme | What You Play |
| --- | --- | --- |
| 💎 **Skyhook Grove** | **Godot / GDScript** | Neon platformer with jumps, collectibles, enemy patrols, spikes, and a locked exit gate |
| 🐼 **Orbit Relic** | **Panda3D / Python** | Faux-3D relic hunt with scan pulses, collectible shards, orbit rings, and sentry hazards |
| ☀️ **Comet Courier** | **Solar2D / Lua** | Mobile-style runner with double jumps, ducking, gems, shields, and speed ramping |
| ⚡ **Neon Mech Arena** | **Stride / C#** | Arena shooter with enemy waves, heat management, projectiles, and pointer aiming |

### 🎛️ Arcade Controls

- ⌨️ **WASD / Arrow keys:** move
- 🔥 **Space:** jump, scan, shoot, or use the current mode action
- 🖱️ **Mouse / touch:** aim or activate in supported modes
- 🔢 **1-4:** switch between engine games
- ⏸️ **P:** pause
- 🔁 **R:** restart the active game

## 🧪 Languages Used

| Language | Where | What It Does |
| --- | --- | --- |
| 🌐 **HTML** | `index.html` | Site layout, engine cards, arcade cabinet shell, setup modals |
| 🎨 **CSS** | embedded in `index.html` | Neon cyber styling, responsive cards, modal UI, arcade cabinet visuals |
| 🟨 **JavaScript** | `arcade.js`, inline hero script | Four playable browser games, Canvas rendering, input, physics, collision, scoring |
| 🔷 **GDScript** | `demos/godot/` | Godot platformer source demo |
| 🐍 **Python** | `demos/panda3d/`, `launcher.py` | Panda3D scene demo and desktop launcher |
| 🌙 **Lua** | `demos/solar2d/` | Solar2D endless runner source demo |
| 💠 **C#** | `demos/stride/` | Stride component script source demo |
| 📝 **Markdown** | `README.md` | Project documentation |

## 🚀 Native Engine Demos

### 🔷 Godot Platformer

`demos/godot/`

- 2D platformer structure
- Coins, lives, score HUD, and procedural platform setup
- Open `project.godot` in **Godot 4.x**, then press **F5**

### 🐼 Panda3D Scene

`demos/panda3d/spinning_scene.py`

- Python-powered 3D scene
- Spinning model, camera setup, lights, and keyboard controls

```bash
pip install Panda3D
python demos/panda3d/spinning_scene.py
```

### ☀️ Solar2D Runner

`demos/solar2d/main.lua`

- Lua runner demo
- Physics, double jump, obstacles, gems, and score loop
- Open `demos/solar2d/` in the **Solar2D Simulator**

### ⚡ Stride Script

`demos/stride/SpinningScene.cs`

- C# script component demo
- Spinning, bobbing, emissive color pulsing, and keyboard-adjustable motion
- Attach it to an entity in a **Stride** project

## 🧭 Desktop Launcher

`launcher.py` opens a small Python/Tkinter control panel for launching or locating the engine demos.

```bash
python launcher.py
```

## 📁 Project Structure

```text
.
├── index.html              # GitHub Pages site and engine cards
├── arcade.js               # Four playable browser arcade modes
├── launcher.py             # Python desktop launcher
├── demos/
│   ├── godot/              # Godot / GDScript platformer demo
│   ├── panda3d/            # Panda3D / Python scene demo
│   ├── solar2d/            # Solar2D / Lua runner demo
│   └── stride/             # Stride / C# script demo
├── README.md
└── LICENSE
```

---

**Built by Angela Hudson — 2026** ✨
