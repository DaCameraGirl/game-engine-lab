# 🎮✨ Game Engine Lab

<p align="center">
  <strong>A neon multi-engine game dev lab by Angela Hudson.</strong><br>
  Four engine-inspired browser games, plus source demos for Godot, Panda3D, Solar2D, and Stride.
</p>

<p align="center">
  <a href="https://dacameragirl.github.io/game-engine-lab/">🌐 Play the Live Arcade</a>
  ·
  <a href="https://github.com/DaCameraGirl/game-engine-lab">💾 View the Code</a>
</p>

<p align="center">
  <img alt="HTML" src="https://img.shields.io/badge/HTML-GitHub%20Pages-ff5c8a?style=for-the-badge">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-Canvas%20Arcade-f7df1e?style=for-the-badge">
  <img alt="GDScript" src="https://img.shields.io/badge/GDScript-Godot-478cbf?style=for-the-badge">
  <img alt="Python" src="https://img.shields.io/badge/Python-Panda3D-3776ab?style=for-the-badge">
  <img alt="Lua" src="https://img.shields.io/badge/Lua-Solar2D-2c2d72?style=for-the-badge">
  <img alt="CSharp" src="https://img.shields.io/badge/C%23-Stride-bb39ff?style=for-the-badge">
</p>

---

## 🌈 What This Is

**Game Engine Lab** is a colorful portfolio project for learning and showing off game-loop skills across multiple engines and languages.

The live GitHub Pages site includes a playable browser arcade, while the repo also keeps native-style demo code for four real game engines:

| Engine | Language | Demo Style |
| --- | --- | --- |
| 💎 **Godot 4** | **GDScript** | 2D platformer logic |
| 🐼 **Panda3D** | **Python** | 3D scene and camera demo |
| ☀️ **Solar2D** | **Lua** | Mobile-style endless runner |
| ⚡ **Stride** | **C#** | 3D entity script demo |

---

## 🕹️ Live Browser Arcade

The browser arcade runs directly on GitHub Pages with **HTML, CSS, and JavaScript Canvas**. No backend. No install. Just open the page and play.

🌐 **Live demo:** https://dacameragirl.github.io/game-engine-lab/

### 🎲 Arcade Modes

| Mode | Inspired By | Gameplay |
| --- | --- | --- |
| 💎 **Skyhook Grove** | **Godot 4** | Skyhook grappling, moving platforms, collectible cores, lasers, drone fire, spikes, and locked exit gates |
| 🐼 **Orbit Relic** | **Panda3D** | Faux-3D relic scanning, dash movement, scan energy, batteries, decoy mines, sentry bolts, and wormhole exits |
| ☀️ **Comet Courier** | **Solar2D** | Fast runner action with double jumps, ducking, dash timing, rings, magnets, shields, combos, and rising speed |
| ⚡ **Neon Mech Arena** | **Stride** | Arena shooting, enemy waves, pointer aiming, projectiles, and heat management |

### 🎮 Controls

| Input | Action |
| --- | --- |
| ⌨️ **WASD / Arrow Keys** | Move |
| 🔥 **Space** | Jump, scan, shoot, or activate the current mode action |
| 🖱️ **Mouse / Touch** | Grapple, dash, aim, or activate in supported modes |
| ⚡ **Shift** | Dash in supported modes |
| 🔢 **1 - 4** | Switch between engine arcade games |
| ⏸️ **P** | Pause |
| 🔁 **R** | Restart the active game |

---

## 🧪 Native Engine Demos

### 💎 Godot 4 / GDScript

📁 `demos/godot/`

- 2D platformer structure
- Procedural platforms and coins
- Player movement, jump physics, score, and lives
- Open `project.godot` in **Godot 4.x**, then press **F5**

### 🐼 Panda3D / Python

📁 `demos/panda3d/spinning_scene.py`

- Python-powered 3D scene
- Panda model, camera setup, ambient and colored lights
- Spin speed, tilt controls, bobbing animation, and HUD text

```bash
pip install -r demos/panda3d/requirements.txt
python demos/panda3d/spinning_scene.py
```

### ☀️ Solar2D / Lua

📁 `demos/solar2d/main.lua`

- Lua endless runner
- Physics, double jump, obstacles, gems, and score loop
- Open `demos/solar2d/` in the **Solar2D Simulator**

### ⚡ Stride / C#

📁 `demos/stride/SpinningScene.cs`

- C# `SyncScript` component
- Spin, bob, emissive color pulse, and keyboard-adjustable motion
- Attach the script to an entity inside a **Stride** project

---

## 🚀 Run Locally

### 🌐 Browser Arcade

Open `index.html` directly, or serve the folder locally:

```bash
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

### 🧭 Python Launcher

The repo includes a small desktop launcher for finding and opening the demos:

```bash
python launcher.py
```

---

## 🧰 Languages Used

| Language | Where | What It Does |
| --- | --- | --- |
| 🌐 **HTML** | `index.html` | GitHub Pages layout, engine cards, arcade shell, setup panels |
| 🎨 **CSS** | embedded in `index.html` | Neon styling, responsive layout, arcade cabinet, modals, glow effects |
| 🟨 **JavaScript** | `arcade.js`, inline page script | Four playable browser games, Canvas rendering, input, physics, collisions, scoring |
| 💎 **GDScript** | `demos/godot/` | Godot 4 platformer demo logic |
| 🐍 **Python** | `launcher.py`, `demos/panda3d/` | Desktop launcher and Panda3D scene demo |
| 🌙 **Lua** | `demos/solar2d/` | Solar2D mobile runner demo |
| 💠 **C#** | `demos/stride/` | Stride entity behavior script |
| 📝 **Markdown** | `README.md` | Project documentation |

---

## 📁 Project Map

```text
.
├── index.html              # GitHub Pages site and engine cards
├── arcade.js               # Four playable browser arcade modes
├── launcher.py             # Python desktop launcher
├── demos/
│   ├── godot/              # Godot 4 / GDScript platformer demo
│   ├── panda3d/            # Panda3D / Python scene demo
│   ├── solar2d/            # Solar2D / Lua runner demo
│   └── stride/             # Stride / C# script demo
├── README.md
└── LICENSE
```

---

## ✨ Why It Matters

This repo shows the same core game-development ideas across different tools:

- 🎯 player input
- 🧱 collision and physics
- 🧠 game state
- 🧮 scoring and progression
- 🌌 animation and visual feedback
- 🕹️ engine-specific setup patterns

It is built to be fun on the live page and useful as a reference for learning several game stacks.

---

## 🤝 Credits

Built by **Angela Hudson**.

Gameplay upgrade and implementation assistance: **OpenAI Codex**.

---

## 📜 License

See `LICENSE` for usage terms.

---

<p align="center">
  <strong>Built by Angela Hudson · 2026</strong><br>
  💎 🐼 ☀️ ⚡
</p>
