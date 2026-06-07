(() => {
  'use strict';

  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const modeTitle = document.getElementById('game-mode-title');
  const uiScore = document.getElementById('ui-score');
  const uiWave = document.getElementById('ui-wave');
  const uiLives = document.getElementById('ui-lives');
  const uiBest = document.getElementById('ui-best');
  const uiEngine = document.getElementById('ui-engine');
  const uiObjective = document.getElementById('ui-objective');
  const tabs = [...document.querySelectorAll('.arcade-tab')];

  const keys = Object.create(null);
  const pressed = new Set();
  const pointer = { x: W / 2, y: H / 2, down: false };
  const order = ['godot', 'panda', 'solar', 'stride'];
  let current = 'godot';
  let paused = false;
  let last = 0;

  const COLORS = {
    godot: '#00f5ff',
    panda: '#00ff88',
    solar: '#ffee00',
    stride: '#ff00aa',
    red: '#ff3355',
    white: '#f8fbff',
    dim: '#5a5f70'
  };

  const INFO = {
    godot: {
      title: 'GODOT: SKYHOOK GROVE',
      engine: 'Godot / GDScript',
      objective: 'Platform through a neon grove, collect all cores, dodge patrols, then enter the open gate.',
      accent: COLORS.godot
    },
    panda: {
      title: 'PANDA3D: ORBIT RELIC',
      engine: 'Panda3D / Python',
      objective: 'Pilot a probe through a faux-3D relic field, scan shards, stun sentries, and survive deeper orbits.',
      accent: COLORS.panda
    },
    solar: {
      title: 'SOLAR2D: COMET COURIER',
      engine: 'Solar2D / Lua',
      objective: 'Run, double-jump, duck, grab gems, and chain shield pickups through a fast mobile-style obstacle course.',
      accent: COLORS.solar
    },
    stride: {
      title: 'STRIDE: NEON MECH ARENA',
      engine: 'Stride / C#',
      objective: 'Strafe through a 3D-style arena, manage heat, shoot drones, and clear escalating enemy waves.',
      accent: COLORS.stride
    }
  };

  const best = {};
  for (const k of order) best[k] = Number(localStorage.getItem('engineLabBest_' + k) || 0);

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rectHit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const left = () => keys.ArrowLeft || keys.KeyA;
  const right = () => keys.ArrowRight || keys.KeyD;
  const up = () => keys.ArrowUp || keys.KeyW;
  const down = () => keys.ArrowDown || keys.KeyS;
  const action = () => pressed.has('Space') || pointer.down;

  function saveBest(key, score) {
    if (score > best[key]) {
      best[key] = score;
      localStorage.setItem('engineLabBest_' + key, String(score));
    }
  }

  function setHud(score, wave, lives) {
    uiScore.textContent = Math.max(0, Math.floor(score));
    uiWave.textContent = wave;
    uiLives.textContent = typeof lives === 'number' ? ('♥ '.repeat(Math.max(0, lives)).trim() || '-') : lives;
    uiBest.textContent = best[current] ? best[current] : '---';
  }

  function setMode(key) {
    current = key;
    paused = false;
    const info = INFO[key];
    document.documentElement.style.setProperty('--mode-accent', info.accent);
    modeTitle.textContent = info.title;
    uiEngine.textContent = info.engine;
    uiObjective.textContent = info.objective;
    tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === key));
    games[key].reset();
  }

  function drawBackdrop(accent) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#050711');
    g.addColorStop(0.55, '#080d1d');
    g.addColorStop(1, '#020306');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = accent + '18';
    ctx.lineWidth = 1;
    for (let x = -40; x < W + 80; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 80, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function text(str, x, y, size, color, align = 'center', glow = false) {
    ctx.save();
    ctx.font = `${size}px "Share Tech Mono", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function particles(list, x, y, color, count, power = 120) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(20, power);
      list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.35, 0.9), color, r: rand(1.5, 4) });
    }
  }

  function updateParticles(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.1, dt);
      p.vy *= Math.pow(0.1, dt);
      if (p.life <= 0) list.splice(i, 1);
    }
  }

  function drawParticles(list) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of list) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  const games = {
    godot: {
      reset() {
        this.accent = COLORS.godot;
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.msg = 'COLLECT ALL CORES';
        this.fx = [];
        this.buildLevel();
      },
      buildLevel() {
        this.player = { x: 50, y: 320, w: 18, h: 28, vx: 0, vy: 0, grounded: false, dash: 0, inv: 0 };
        this.platforms = [
          { x: 0, y: 408, w: 600, h: 26 },
          { x: 74, y: 334, w: 112, h: 14 },
          { x: 236, y: 286, w: 94, h: 14 },
          { x: 390, y: 240, w: 130, h: 14 },
          { x: 112, y: 188, w: 116, h: 14 },
          { x: 300, y: 146, w: 96, h: 14 }
        ];
        this.cores = this.platforms.slice(1).map((p, i) => ({ x: p.x + p.w / 2, y: p.y - 24, r: 8, got: false, bob: i }));
        this.spikes = [{ x: 208, y: 391, w: 74, h: 17 }, { x: 455, y: 223, w: 42, h: 17 }];
        this.drones = [
          { x: 130, y: 300, vx: 58, min: 80, max: 180, r: 12 },
          { x: 430, y: 204, vx: 70, min: 388, max: 520, r: 12 }
        ];
        this.gate = { x: 522, y: 348, w: 34, h: 60, open: false };
      },
      loseLife() {
        this.lives--;
        this.player.x = 50;
        this.player.y = 320;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.inv = 1.2;
        particles(this.fx, 70, 330, COLORS.red, 18, 180);
        if (this.lives <= 0) {
          saveBest('godot', this.score);
          this.msg = 'GAME OVER - R TO RESTART';
        }
      },
      update(dt) {
        if (this.lives <= 0) return;
        const p = this.player;
        const speed = p.dash > 0 ? 260 : 160;
        p.vx = (right() ? speed : 0) - (left() ? speed : 0);
        if ((pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW')) && p.grounded) {
          p.vy = -335;
          p.grounded = false;
          particles(this.fx, p.x + p.w / 2, p.y + p.h, this.accent, 8, 90);
        }
        if (pressed.has('ShiftLeft') || pressed.has('ShiftRight')) p.dash = 0.18;
        p.dash = Math.max(0, p.dash - dt);
        p.inv = Math.max(0, p.inv - dt);
        p.vy += 760 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = clamp(p.x, 0, W - p.w);
        p.grounded = false;
        for (const plat of this.platforms) {
          if (rectHit(p, plat) && p.vy >= 0 && p.y + p.h - p.vy * dt <= plat.y + 4) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;
          }
        }
        if (p.y > H + 30) this.loseLife();
        for (const c of this.cores) {
          if (!c.got && Math.hypot(p.x + p.w / 2 - c.x, p.y + p.h / 2 - c.y) < 22) {
            c.got = true;
            this.score += 180 + this.level * 25;
            particles(this.fx, c.x, c.y, this.accent, 18, 160);
          }
        }
        this.gate.open = this.cores.every(c => c.got);
        for (const d of this.drones) {
          d.x += d.vx * dt;
          if (d.x < d.min || d.x > d.max) d.vx *= -1;
          if (p.inv <= 0 && Math.hypot(p.x + p.w / 2 - d.x, p.y + p.h / 2 - d.y) < d.r + 13) this.loseLife();
        }
        for (const s of this.spikes) if (p.inv <= 0 && rectHit(p, s)) this.loseLife();
        if (this.gate.open && rectHit(p, this.gate)) {
          this.level++;
          this.score += 650;
          this.msg = 'LEVEL ' + this.level;
          this.buildLevel();
          this.player.x = 48;
          this.player.y = 320;
        }
        updateParticles(this.fx, dt);
        setHud(this.score, this.level, this.lives);
      },
      draw() {
        drawBackdrop(this.accent);
        ctx.fillStyle = '#071018';
        ctx.fillRect(0, 408, W, 42);
        for (const plat of this.platforms) {
          ctx.fillStyle = '#0c2637';
          ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
          ctx.strokeStyle = this.accent;
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
        }
        for (const s of this.spikes) {
          ctx.fillStyle = COLORS.red;
          for (let x = s.x; x < s.x + s.w; x += 14) {
            ctx.beginPath();
            ctx.moveTo(x, s.y + s.h);
            ctx.lineTo(x + 7, s.y);
            ctx.lineTo(x + 14, s.y + s.h);
            ctx.fill();
          }
        }
        for (const c of this.cores) {
          if (c.got) continue;
          const y = c.y + Math.sin(performance.now() / 250 + c.bob) * 4;
          ctx.save();
          ctx.shadowColor = this.accent;
          ctx.shadowBlur = 14;
          ctx.fillStyle = this.accent;
          ctx.beginPath();
          ctx.arc(c.x, y, c.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        for (const d of this.drones) {
          ctx.strokeStyle = COLORS.red;
          ctx.shadowColor = COLORS.red;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = this.gate.open ? COLORS.green : COLORS.dim;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.gate.x, this.gate.y, this.gate.w, this.gate.h);
        text(this.gate.open ? 'OPEN' : 'LOCK', this.gate.x + 17, this.gate.y - 10, 10, this.gate.open ? COLORS.green : COLORS.dim);
        const p = this.player;
        ctx.save();
        ctx.globalAlpha = p.inv > 0 && Math.floor(performance.now() / 80) % 2 ? 0.45 : 1;
        ctx.fillStyle = this.accent;
        ctx.shadowColor = this.accent;
        ctx.shadowBlur = 14;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#001018';
        ctx.fillRect(p.x + 4, p.y + 8, 10, 4);
        ctx.restore();
        drawParticles(this.fx);
        text('GODOT PLATFORMER: CORES ' + this.cores.filter(c => c.got).length + '/' + this.cores.length, 18, 22, 12, this.accent, 'left', true);
        if (this.lives <= 0) text('GAME OVER - PRESS R', W / 2, H / 2, 26, COLORS.red, 'center', true);
      }
    },

    panda: {
      reset() {
        this.accent = COLORS.panda;
        this.score = 0;
        this.depth = 1;
        this.lives = 3;
        this.fx = [];
        this.scan = 0;
        this.player = { x: W / 2, y: H / 2, r: 12, inv: 0 };
        this.spawnField();
      },
      spawnField() {
        this.shards = [];
        this.sentries = [];
        for (let i = 0; i < 7 + this.depth; i++) this.shards.push({ x: rand(55, W - 55), y: rand(65, H - 65), r: 7, phase: rand(0, 9) });
        for (let i = 0; i < 2 + Math.floor(this.depth / 2); i++) this.sentries.push({ x: rand(70, W - 70), y: rand(80, H - 80), r: 13, stun: 0, speed: rand(36, 54) + this.depth * 3 });
      },
      update(dt) {
        const p = this.player;
        const sp = 145;
        if (left()) p.x -= sp * dt;
        if (right()) p.x += sp * dt;
        if (up()) p.y -= sp * dt;
        if (down()) p.y += sp * dt;
        p.x = clamp(p.x, 25, W - 25);
        p.y = clamp(p.y, 42, H - 30);
        p.inv = Math.max(0, p.inv - dt);
        if (action() && this.scan <= 0) {
          this.scan = 0.8;
          particles(this.fx, p.x, p.y, this.accent, 34, 230);
        }
        this.scan = Math.max(0, this.scan - dt);
        const scanRadius = this.scan > 0 ? 155 * (this.scan / 0.8) : 0;
        for (let i = this.shards.length - 1; i >= 0; i--) {
          const s = this.shards[i];
          if (Math.hypot(p.x - s.x, p.y - s.y) < p.r + s.r || (scanRadius && Math.hypot(p.x - s.x, p.y - s.y) < scanRadius)) {
            this.score += scanRadius ? 90 : 130;
            particles(this.fx, s.x, s.y, this.accent, 18, 150);
            this.shards.splice(i, 1);
          }
        }
        for (const e of this.sentries) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          if (scanRadius && d < scanRadius) e.stun = 1.4;
          if (e.stun > 0) e.stun -= dt;
          else {
            e.x += dx / d * e.speed * dt;
            e.y += dy / d * e.speed * dt;
          }
          if (p.inv <= 0 && d < p.r + e.r) {
            this.lives--;
            p.inv = 1.1;
            particles(this.fx, p.x, p.y, COLORS.red, 24, 190);
            if (this.lives <= 0) saveBest('panda', this.score);
          }
        }
        if (this.shards.length === 0) {
          this.depth++;
          this.score += 500;
          this.spawnField();
        }
        updateParticles(this.fx, dt);
        setHud(this.score, this.depth, this.lives);
      },
      draw() {
        drawBackdrop(this.accent);
        const t = performance.now() / 900;
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.rotate(Math.sin(t) * 0.2);
        for (let r = 60; r < 270; r += 44) {
          ctx.strokeStyle = this.accent + '28';
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        if (this.scan > 0) {
          ctx.strokeStyle = this.accent;
          ctx.globalAlpha = this.scan / 0.8;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.player.x, this.player.y, 155 * (this.scan / 0.8), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        for (const s of this.shards) {
          const bob = Math.sin(performance.now() / 260 + s.phase) * 4;
          ctx.fillStyle = this.accent;
          ctx.shadowColor = this.accent;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(s.x, s.y + bob, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const e of this.sentries) {
          ctx.strokeStyle = e.stun > 0 ? COLORS.yellow : COLORS.red;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(e.x - 6, e.y);
          ctx.lineTo(e.x + 6, e.y);
          ctx.stroke();
        }
        ctx.fillStyle = this.accent;
        ctx.shadowColor = this.accent;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.white;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.r + 8, 0, Math.PI * 2);
        ctx.stroke();
        drawParticles(this.fx);
        text('PANDA3D ORBIT SCAN: SHARDS ' + this.shards.length, 18, 22, 12, this.accent, 'left', true);
        if (this.lives <= 0) text('PROBE LOST - PRESS R', W / 2, H / 2, 24, COLORS.red, 'center', true);
      }
    },

    solar: {
      reset() {
        this.accent = COLORS.solar;
        this.score = 0;
        this.zone = 1;
        this.lives = 3;
        this.speed = 210;
        this.spawn = 0;
        this.fx = [];
        this.items = [];
        this.player = { x: 92, y: 330, w: 24, h: 38, vy: 0, jumps: 0, duck: false, shield: 0 };
      },
      spawnItem() {
        const type = Math.random() < 0.55 ? 'gem' : (Math.random() < 0.72 ? 'block' : 'shield');
        const ground = 366;
        if (type === 'gem') this.items.push({ type, x: W + 30, y: rand(185, 320), r: 8 });
        if (type === 'shield') this.items.push({ type, x: W + 30, y: rand(220, 310), r: 10 });
        if (type === 'block') this.items.push({ type, x: W + 30, y: ground - rand(28, 76), w: rand(22, 36), h: rand(30, 76) });
      },
      update(dt) {
        if (this.lives <= 0) return;
        const p = this.player;
        this.speed += dt * 4;
        this.score += dt * this.speed * 0.32;
        this.zone = 1 + Math.floor(this.score / 1400);
        const groundY = 368;
        p.duck = down() && p.jumps === 0;
        if ((pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW')) && p.jumps < 2) {
          p.vy = -330;
          p.jumps++;
          particles(this.fx, p.x, p.y + p.h, this.accent, 10, 110);
        }
        p.h = p.duck ? 24 : 38;
        p.vy += 820 * dt;
        p.y += p.vy * dt;
        if (p.y + p.h > groundY) {
          p.y = groundY - p.h;
          p.vy = 0;
          p.jumps = 0;
        }
        p.shield = Math.max(0, p.shield - dt);
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawnItem();
          this.spawn = rand(0.55, 1.0) * Math.max(0.55, 1.1 - this.zone * 0.05);
        }
        for (let i = this.items.length - 1; i >= 0; i--) {
          const it = this.items[i];
          it.x -= this.speed * dt;
          if (it.type === 'gem' || it.type === 'shield') {
            if (Math.hypot(p.x + p.w / 2 - it.x, p.y + p.h / 2 - it.y) < it.r + 20) {
              if (it.type === 'gem') this.score += 160;
              else p.shield = 4;
              particles(this.fx, it.x, it.y, it.type === 'gem' ? this.accent : COLORS.green, 16, 140);
              this.items.splice(i, 1);
            }
          } else if (rectHit({ x: p.x, y: p.y, w: p.w, h: p.h }, it)) {
            if (p.shield > 0) {
              p.shield = 0;
              particles(this.fx, it.x, it.y, COLORS.green, 20, 160);
            } else {
              this.lives--;
              particles(this.fx, p.x, p.y, COLORS.red, 24, 190);
              if (this.lives <= 0) saveBest('solar', this.score);
            }
            this.items.splice(i, 1);
          } else if (it.x < -80) this.items.splice(i, 1);
        }
        updateParticles(this.fx, dt);
        setHud(this.score, this.zone, this.lives);
      },
      draw() {
        drawBackdrop(this.accent);
        for (let i = 0; i < 12; i++) {
          const x = (i * 90 - (this.score * 0.28) % 90);
          ctx.strokeStyle = this.accent + '20';
          ctx.beginPath();
          ctx.moveTo(x, 368);
          ctx.lineTo(x + 42, H);
          ctx.stroke();
        }
        ctx.fillStyle = '#171204';
        ctx.fillRect(0, 368, W, 82);
        ctx.strokeStyle = this.accent;
        ctx.strokeRect(0, 368, W, 1);
        for (const it of this.items) {
          if (it.type === 'block') {
            ctx.fillStyle = COLORS.red;
            ctx.shadowColor = COLORS.red;
            ctx.shadowBlur = 12;
            ctx.fillRect(it.x, it.y, it.w, it.h);
          } else {
            const color = it.type === 'gem' ? this.accent : COLORS.green;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const p = this.player;
        ctx.fillStyle = p.shield > 0 ? COLORS.green : this.accent;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 16;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.fillStyle = '#140900';
        ctx.fillRect(p.x + 6, p.y + 8, 12, 5);
        if (p.shield > 0) {
          ctx.strokeStyle = COLORS.green;
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 32, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawParticles(this.fx);
        text('SOLAR2D RUNNER: SPEED ' + Math.floor(this.speed), 18, 22, 12, this.accent, 'left', true);
        if (this.lives <= 0) text('CRASHED - PRESS R', W / 2, H / 2, 26, COLORS.red, 'center', true);
      }
    },

    stride: {
      reset() {
        this.accent = COLORS.stride;
        this.score = 0;
        this.wave = 1;
        this.lives = 3;
        this.spawn = 0;
        this.heat = 0;
        this.fx = [];
        this.bullets = [];
        this.enemies = [];
        this.player = { x: W / 2, y: H / 2, r: 14, cool: 0, inv: 0 };
      },
      spawnEnemy() {
        const edge = Math.floor(rand(0, 4));
        const e = { x: edge === 0 ? -20 : edge === 1 ? W + 20 : rand(0, W), y: edge === 2 ? -20 : edge === 3 ? H + 20 : rand(0, H), r: 12, hp: 1 + Math.floor(this.wave / 3), speed: rand(42, 70) + this.wave * 3 };
        if (Math.random() < 0.25) {
          e.r = 18;
          e.hp += 2;
          e.speed *= 0.72;
        }
        this.enemies.push(e);
      },
      shoot() {
        if (this.player.cool > 0 || this.heat > 92) return;
        let tx = pointer.x;
        let ty = pointer.y;
        if (!pointer.down && this.enemies.length) {
          let bestE = this.enemies[0];
          let bestD = dist(this.player, bestE);
          for (const e of this.enemies) {
            const d = dist(this.player, e);
            if (d < bestD) {
              bestD = d;
              bestE = e;
            }
          }
          tx = bestE.x;
          ty = bestE.y;
        }
        const a = Math.atan2(ty - this.player.y, tx - this.player.x);
        this.bullets.push({ x: this.player.x, y: this.player.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: 1.1 });
        this.player.cool = 0.14;
        this.heat += 7;
      },
      update(dt) {
        if (this.lives <= 0) return;
        const p = this.player;
        const sp = 170;
        if (left()) p.x -= sp * dt;
        if (right()) p.x += sp * dt;
        if (up()) p.y -= sp * dt;
        if (down()) p.y += sp * dt;
        p.x = clamp(p.x, 24, W - 24);
        p.y = clamp(p.y, 42, H - 28);
        p.cool = Math.max(0, p.cool - dt);
        p.inv = Math.max(0, p.inv - dt);
        this.heat = Math.max(0, this.heat - dt * 20);
        if (keys.Space || pointer.down) this.shoot();
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawnEnemy();
          this.spawn = Math.max(0.28, 0.95 - this.wave * 0.045);
        }
        for (const e of this.enemies) {
          const dx = p.x - e.x;
          const dy = p.y - e.y;
          const d = Math.hypot(dx, dy) || 1;
          e.x += dx / d * e.speed * dt;
          e.y += dy / d * e.speed * dt;
          if (p.inv <= 0 && d < p.r + e.r) {
            this.lives--;
            p.inv = 1.1;
            particles(this.fx, p.x, p.y, COLORS.red, 24, 190);
            if (this.lives <= 0) saveBest('stride', this.score);
          }
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          b.life -= dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          let remove = b.life <= 0 || b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30;
          for (const e of this.enemies) {
            if (!remove && Math.hypot(b.x - e.x, b.y - e.y) < e.r + 4) {
              e.hp--;
              remove = true;
              particles(this.fx, b.x, b.y, this.accent, 8, 150);
              if (e.hp <= 0) {
                e.dead = true;
                this.score += 160 + this.wave * 30;
                particles(this.fx, e.x, e.y, this.accent, 20, 220);
              }
            }
          }
          if (remove) this.bullets.splice(i, 1);
        }
        this.enemies = this.enemies.filter(e => !e.dead);
        this.wave = 1 + Math.floor(this.score / 1250);
        updateParticles(this.fx, dt);
        setHud(this.score, this.wave, this.lives);
      },
      draw() {
        drawBackdrop(this.accent);
        ctx.save();
        ctx.translate(W / 2, H / 2);
        ctx.strokeStyle = this.accent + '22';
        for (let r = 50; r < 340; r += 44) {
          ctx.beginPath();
          ctx.rect(-r, -r * 0.65, r * 2, r * 1.3);
          ctx.stroke();
        }
        ctx.restore();
        for (const b of this.bullets) {
          ctx.fillStyle = this.accent;
          ctx.shadowColor = this.accent;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        for (const e of this.enemies) {
          ctx.strokeStyle = e.hp > 2 ? COLORS.yellow : COLORS.red;
          ctx.shadowColor = ctx.strokeStyle;
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2;
          ctx.strokeRect(e.x - e.r, e.y - e.r, e.r * 2, e.r * 2);
          ctx.beginPath();
          ctx.moveTo(e.x - e.r, e.y);
          ctx.lineTo(e.x + e.r, e.y);
          ctx.moveTo(e.x, e.y - e.r);
          ctx.lineTo(e.x, e.y + e.r);
          ctx.stroke();
        }
        const p = this.player;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(pointer.y - p.y, pointer.x - p.x));
        ctx.strokeStyle = this.accent;
        ctx.fillStyle = this.accent + '33';
        ctx.shadowColor = this.accent;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-12, -13);
        ctx.lineTo(-6, 0);
        ctx.lineTo(-12, 13);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = '#190018';
        ctx.fillRect(18, H - 22, 120, 8);
        ctx.fillStyle = this.heat > 80 ? COLORS.red : this.accent;
        ctx.fillRect(18, H - 22, this.heat * 1.2, 8);
        text('HEAT', 148, H - 18, 10, COLORS.dim, 'left');
        drawParticles(this.fx);
        text('STRIDE ARENA: ENEMIES ' + this.enemies.length, 18, 22, 12, this.accent, 'left', true);
        if (this.lives <= 0) text('MECH DOWN - PRESS R', W / 2, H / 2, 24, COLORS.red, 'center', true);
      }
    }
  };

  function drawPaused() {
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, W, H);
    text('PAUSED', W / 2, H / 2 - 12, 30, COLORS.yellow, 'center', true);
    text('PRESS P TO RESUME', W / 2, H / 2 + 28, 13, COLORS.dim);
  }

  window.addEventListener('keydown', e => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys[e.code] = true;
  });

  window.addEventListener('keyup', e => {
    keys[e.code] = false;
  });

  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * (W / r.width);
    pointer.y = (e.clientY - r.top) * (H / r.height);
  });

  canvas.addEventListener('pointerdown', e => {
    pointer.down = true;
    canvas.focus();
    e.preventDefault();
  });

  window.addEventListener('pointerup', () => {
    pointer.down = false;
  });

  tabs.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));

  function handleGlobalPressed() {
    if (pressed.has('Digit1')) setMode('godot');
    if (pressed.has('Digit2')) setMode('panda');
    if (pressed.has('Digit3')) setMode('solar');
    if (pressed.has('Digit4')) setMode('stride');
    if (pressed.has('KeyR')) games[current].reset();
    if (pressed.has('KeyP')) paused = !paused;
  }

  function frame(t) {
    const dt = Math.min(0.033, (t - last) / 1000 || 0.016);
    last = t;
    handleGlobalPressed();
    if (!paused) games[current].update(dt);
    games[current].draw();
    if (paused) drawPaused();
    pressed.clear();
    requestAnimationFrame(frame);
  }

  setMode(current);
  requestAnimationFrame(frame);
})();
