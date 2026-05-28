"""
The Engine Lab — Desktop Launcher
Opens a styled tkinter window with buttons to launch each engine demo.
Run: python launcher.py
"""

import tkinter as tk
from tkinter import messagebox
import subprocess
import webbrowser
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))

BG       = "#0a0a0f"
BG2      = "#0d0d18"
CARD_BG  = "#0f0f1c"
CYAN     = "#00f5ff"
MAGENTA  = "#ff00aa"
GREEN    = "#00ff88"
YELLOW   = "#ffee00"
DIM      = "#5a5f70"
WHITE    = "#e8eaf0"

ENGINES = [
    {
        "name":     "Panda3D Demo",
        "sub":      "Python · spinning 3D scene",
        "color":    GREEN,
        "action":   "panda",
        "badge":    "pip install Panda3D  →  python demos/panda3d/spinning_scene.py",
    },
    {
        "name":     "Godot Platformer",
        "sub":      "GDScript · 2D platformer project",
        "color":    CYAN,
        "action":   "godot",
        "badge":    "Open demos/godot/project.godot in Godot 4.x",
    },
    {
        "name":     "Solar2D Runner",
        "sub":      "Lua · mobile endless runner",
        "color":    YELLOW,
        "action":   "solar",
        "badge":    "Open demos/solar2d/ in Solar2D Simulator",
    },
    {
        "name":     "Stride Scene",
        "sub":      "C# · spinning 3D scene script",
        "color":    MAGENTA,
        "action":   "stride",
        "badge":    "Attach demos/stride/SpinningScene.cs in Stride editor",
    },
    {
        "name":     "Web Hub",
        "sub":      "HTML/CSS/JS · full portfolio site",
        "color":    WHITE,
        "action":   "web",
        "badge":    "Opens index.html in your default browser",
    },
]


def launch(action):
    if action == "panda":
        script = os.path.join(BASE, "demos", "panda3d", "spinning_scene.py")
        if not os.path.exists(script):
            messagebox.showerror("Not found", f"Could not find:\n{script}")
            return
        try:
            subprocess.Popen([sys.executable, script])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to launch Panda3D demo:\n{e}\n\nMake sure Panda3D is installed:\npip install Panda3D")

    elif action == "godot":
        folder = os.path.join(BASE, "demos", "godot")
        messagebox.showinfo(
            "Godot — Open in Editor",
            f"Launch Godot 4.x and open:\n\n{folder}\n\nThen press F5 to run the project."
        )

    elif action == "solar":
        folder = os.path.join(BASE, "demos", "solar2d")
        messagebox.showinfo(
            "Solar2D — Open in Simulator",
            f"Launch the Solar2D Simulator and open:\n\n{folder}\n\nmain.lua is your entry point."
        )

    elif action == "stride":
        folder = os.path.join(BASE, "demos", "stride")
        messagebox.showinfo(
            "Stride — Open in Editor",
            f"Create a new Stride project, then add SpinningScene.cs:\n\n{folder}\n\nAttach it as a Script Component on any Entity."
        )

    elif action == "web":
        html = os.path.join(BASE, "index.html")
        webbrowser.open(f"file:///{html.replace(os.sep, '/')}")


def build_ui():
    root = tk.Tk()
    root.title("The Engine Lab — Launcher")
    root.configure(bg=BG)
    root.resizable(False, False)

    # Title bar
    title_frame = tk.Frame(root, bg=BG2, pady=16)
    title_frame.pack(fill=tk.X)

    tk.Label(
        title_frame, text="THE ENGINE LAB",
        font=("Courier New", 20, "bold"),
        bg=BG2, fg=CYAN
    ).pack()
    tk.Label(
        title_frame, text="// GAME ENGINE PORTFOLIO LAUNCHER //",
        font=("Courier New", 9),
        bg=BG2, fg=DIM
    ).pack(pady=(2, 0))

    tk.Frame(root, bg=CYAN, height=1).pack(fill=tk.X)

    # Cards
    cards_frame = tk.Frame(root, bg=BG, padx=24, pady=20)
    cards_frame.pack(fill=tk.BOTH, expand=True)

    for eng in ENGINES:
        card = tk.Frame(cards_frame, bg=CARD_BG, padx=16, pady=14,
                        highlightbackground=eng["color"],
                        highlightthickness=1)
        card.pack(fill=tk.X, pady=6)

        left = tk.Frame(card, bg=CARD_BG)
        left.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        tk.Label(
            left, text=eng["name"],
            font=("Courier New", 13, "bold"),
            bg=CARD_BG, fg=eng["color"], anchor="w"
        ).pack(fill=tk.X)

        tk.Label(
            left, text=eng["sub"],
            font=("Courier New", 9),
            bg=CARD_BG, fg=DIM, anchor="w"
        ).pack(fill=tk.X)

        tk.Label(
            left, text=eng["badge"],
            font=("Courier New", 8),
            bg=CARD_BG, fg="#333355", anchor="w", wraplength=380, justify="left"
        ).pack(fill=tk.X, pady=(4, 0))

        btn = tk.Button(
            card,
            text="LAUNCH",
            font=("Courier New", 9, "bold"),
            bg=CARD_BG, fg=eng["color"],
            activebackground=eng["color"], activeforeground=BG,
            relief=tk.FLAT,
            bd=1, highlightbackground=eng["color"], highlightthickness=1,
            padx=16, pady=8,
            cursor="hand2",
            command=lambda a=eng["action"]: launch(a)
        )
        btn.pack(side=tk.RIGHT, padx=(12, 0))

    # Footer
    tk.Frame(root, bg=MAGENTA, height=1).pack(fill=tk.X)
    tk.Label(
        root, text="Angela Hudson  ·  The Engine Lab  ·  2026",
        font=("Courier New", 8),
        bg=BG2, fg=DIM, pady=8
    ).pack(fill=tk.X)

    # Center window
    root.update_idletasks()
    w, h = root.winfo_width(), root.winfo_height()
    x = (root.winfo_screenwidth()  - w) // 2
    y = (root.winfo_screenheight() - h) // 2
    root.geometry(f"+{x}+{y}")

    root.mainloop()


if __name__ == "__main__":
    build_ui()
