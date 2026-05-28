# The Engine Lab

A multi-engine game dev portfolio. Each demo is a working project that covers a different engine and language category.

**Live site:** https://dacameragirl.github.io/game-engine-lab/

---

## What's Inside

### Playable Web Demo
`index.html` — Open in any browser. Includes **Star Drift**, a fully playable space shooter built with JavaScript Canvas.
- Arrow keys or WASD to move
- Space to shoot
- P to pause, R to restart

### Panda3D Demo — Python
`demos/panda3d/spinning_scene.py`
- 3D spinning model with orbiting colored lights
- Keyboard controls for spin speed and tilt
- **Language:** Python

```bash
pip install Panda3D
python demos/panda3d/spinning_scene.py
```

### Godot Platformer — GDScript
`demos/godot/`
- 2D platformer with procedural platforms, collectible coins, lives and score HUD
- GDScript reads almost exactly like Python
- **Language:** GDScript (Godot 4)

Open `demos/godot/project.godot` in Godot 4.x, then press F5 to run.

### Solar2D Endless Runner — Lua
`demos/solar2d/main.lua`
- Endless runner with physics, double jump, obstacles, and gems
- **Language:** Lua

Open `demos/solar2d/` in the Solar2D Simulator.

### Stride Script — C#
`demos/stride/SpinningScene.cs`
- Entity component that spins, bobs, and pulses emissive color
- Keyboard-adjustable speed controls
- **Language:** C# / .NET

Attach to any entity in a Stride project as a Script Component.

### Desktop Launcher
`launcher.py` — Python/Tkinter app that launches every demo from one window.

```bash
python launcher.py
```

---

## Engine Coverage

| Engine | Language | Bracket on Form |
|---|---|---|
| Godot 4 | GDScript | Godot / Unity / Unreal |
| Panda3D | Python | MonoGame / Pygame |
| Solar2D | Lua | Cocos2d-x / Love2D / Gilderos |
| Stride | C# | OGRE / Unreal |

---

Built by Angela Hudson · 2026
