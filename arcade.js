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
  const pointer = { x: W / 2, y: H / 2, down: false, justDown: false };
  const order = ['godot', 'panda', 'solar', 'stride'];
  let current = 'godot';
  let paused = false;
  let last = 0;

  const COLORS = {
    godot: '#00f5ff',
    panda: '#00ff88',
    solar: '#ffee00',
    stride: '#ff00aa',
    cyan: '#00f5ff',
    green: '#00ff88',
    yellow: '#ffee00',
    magenta: '#ff00aa',
    red: '#ff3355',
    white: '#f8fbff',
    dim: '#5a5f70'
  };

  const INFO = {
    godot: {
      title: 'GODOT: SKYHOOK GROVE',
      engine: 'Godot / GDScript',
      objective: 'Grapple neon anchors, ride moving platforms, dodge lasers and drone fire, collect all cores, then break through the gate.',
      accent: COLORS.godot
    },
    panda: {
      title: 'PANDA3D: ORBIT RELIC',
      engine: 'Panda3D / Python',
      objective: 'Dash through a faux-3D relic field, spend scan energy, avoid decoy mines and sentry bolts, then enter the wormhole.',
      accent: COLORS.panda
    },
    solar: {
      title: 'SOLAR2D: COMET COURIER',
      engine: 'Solar2D / Lua',
      objective: 'Double-jump, duck low gates, dash through hazards, chain rings and magnets, and keep the courier combo alive.',
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
        this.time = 0;
        this.player = { x: 50, y: 320, w: 18, h: 28, vx: 0, vy: 0, grounded: false, dash: 0, inv: 0, hook: null, hookPower: 1 };
        this.platforms = [
          { x: 0, y: 408, w: 600, h: 26 },
          { x: 74, y: 334, w: 112, h: 14 },
          { x: 236, y: 286, w: 94, h: 14 },
          { x: 390, y: 240, w: 130, h: 14 },
          { x: 112, y: 188, w: 116, h: 14 },
          { x: 300, y: 146, w: 96, h: 14 },
          { x: 248, y: 354, w: 86, h: 12, moving: true, baseX: 248, baseY: 354, range: 78, speed: 1.15 + this.level * 0.08, phase: this.level }
        ];
        this.cores = this.platforms.slice(1).map((p, i) => ({ x: p.x + p.w / 2, y: p.y - 24, r: 8, got: false, bob: i }));
        this.spikes = [{ x: 208, y: 391, w: 74, h: 17 }, { x: 455, y: 223, w: 42, h: 17 }];
        this.anchors = [
          { x: 168, y: 252, r: 10 },
          { x: 350, y: 204, r: 10 },
          { x: 512, y: 144, r: 10 }
        ];
        this.lasers = [
          { x: 356, y: 308, w: 10, h: 96, phase: 0.15, period: 2.2 },
          { x: 86, y: 214, w: 118, h: 8, phase: 1.1, period: 2.7 }
        ];
        this.bullets = [];
        this.drones = [
          { x: 130, y: 300, vx: 58, min: 80, max: 180, r: 12, cool: 1.2 },
          { x: 430, y: 204, vx: 70, min: 388, max: 520, r: 12, cool: 0.5 }
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
        this.time += dt;
        const p = this.player;
        const speed = p.dash > 0 ? 260 : 160;
        p.vx = (right() ? speed : 0) - (left() ? speed : 0);
        if ((pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW')) && p.grounded) {
          p.vy = -335;
          p.grounded = false;
          particles(this.fx, p.x + p.w / 2, p.y + p.h, this.accent, 8, 90);
        }
        if (pressed.has('ShiftLeft') || pressed.has('ShiftRight')) p.dash = 0.18;
        if (!pointer.down) p.hook = null;
        if (pointer.down && !p.hook) {
          let chosen = null;
          let chosenD = 220;
          for (const a of this.anchors) {
            const d = Math.hypot(a.x - p.x, a.y - p.y);
            if (d < chosenD) {
              chosen = a;
              chosenD = d;
            }
          }
          p.hook = chosen;
        }
        if (p.hook) {
          const cx = p.x + p.w / 2;
          const cy = p.y + p.h / 2;
          const dx = p.hook.x - cx;
          const dy = p.hook.y - cy;
          const d = Math.hypot(dx, dy) || 1;
          p.vx += dx / d * 880 * dt;
          p.vy += dy / d * 880 * dt - 260 * dt;
          p.vx = clamp(p.vx, -330, 330);
          p.vy = clamp(p.vy, -410, 410);
          particles(this.fx, cx, cy, this.accent, 1, 42);
        }
        p.dash = Math.max(0, p.dash - dt);
        p.inv = Math.max(0, p.inv - dt);
        p.vy += 760 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.x = clamp(p.x, 0, W - p.w);
        p.grounded = false;
        for (const plat of this.platforms) {
          if (plat.moving) {
            const oldX = plat.x;
            plat.x = plat.baseX + Math.sin(this.time * plat.speed + plat.phase) * plat.range;
            plat.dx = plat.x - oldX;
          }
        }
        for (const plat of this.platforms) {
          if (rectHit(p, plat) && p.vy >= 0 && p.y + p.h - p.vy * dt <= plat.y + 4) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.grounded = true;
            if (plat.moving) p.x += plat.dx || 0;
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
          d.cool -= dt;
          if (d.cool <= 0) {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            const a = Math.atan2(cy - d.y, cx - d.x);
            this.bullets.push({ x: d.x, y: d.y, vx: Math.cos(a) * 155, vy: Math.sin(a) * 155, life: 2.8 });
            d.cool = rand(1.1, 1.9) - Math.min(0.45, this.level * 0.05);
          }
          if (p.inv <= 0 && Math.hypot(p.x + p.w / 2 - d.x, p.y + p.h / 2 - d.y) < d.r + 13) this.loseLife();
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          b.life -= dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (p.inv <= 0 && rectHit(p, { x: b.x - 4, y: b.y - 4, w: 8, h: 8 })) {
            this.bullets.splice(i, 1);
            this.loseLife();
          } else if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
            this.bullets.splice(i, 1);
          }
        }
        for (const s of this.spikes) if (p.inv <= 0 && rectHit(p, s)) this.loseLife();
        for (const l of this.lasers) {
          const on = Math.sin((this.time + l.phase) * Math.PI * 2 / l.period) > -0.25;
          l.on = on;
          if (on && p.inv <= 0 && rectHit(p, l)) this.loseLife();
        }
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
          if (plat.moving) {
            ctx.strokeStyle = COLORS.green;
            ctx.beginPath();
            ctx.moveTo(plat.baseX - plat.range, plat.y + 22);
            ctx.lineTo(plat.baseX + plat.range + plat.w, plat.y + 22);
            ctx.stroke();
          }
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
        for (const a of this.anchors) {
          ctx.strokeStyle = COLORS.green;
          ctx.shadowColor = COLORS.green;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(a.x - 15, a.y);
          ctx.lineTo(a.x + 15, a.y);
          ctx.moveTo(a.x, a.y - 15);
          ctx.lineTo(a.x, a.y + 15);
          ctx.stroke();
        }
        for (const l of this.lasers) {
          ctx.globalAlpha = l.on ? 1 : 0.18;
          ctx.fillStyle = l.on ? COLORS.red : COLORS.dim;
          ctx.shadowColor = l.on ? COLORS.red : 'transparent';
          ctx.shadowBlur = 16;
          ctx.fillRect(l.x, l.y, l.w, l.h);
          ctx.globalAlpha = 1;
        }
        for (const d of this.drones) {
          ctx.strokeStyle = COLORS.red;
          ctx.shadowColor = COLORS.red;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.stroke();
        }
        for (const b of this.bullets) {
          ctx.fillStyle = COLORS.red;
          ctx.shadowColor = COLORS.red;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = this.gate.open ? COLORS.green : COLORS.dim;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.gate.x, this.gate.y, this.gate.w, this.gate.h);
        text(this.gate.open ? 'OPEN' : 'LOCK', this.gate.x + 17, this.gate.y - 10, 10, this.gate.open ? COLORS.green : COLORS.dim);
        const p = this.player;
        if (p.hook) {
          ctx.strokeStyle = COLORS.green;
          ctx.shadowColor = COLORS.green;
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2, p.y + p.h / 2);
          ctx.lineTo(p.hook.x, p.hook.y);
          ctx.stroke();
        }
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
        this.scanEnergy = 100;
        this.bolts = [];
        this.player = { x: W / 2, y: H / 2, r: 12, inv: 0, dash: 0, dashCd: 0, shield: 0 };
        this.spawnField();
      },
      spawnField() {
        this.shards = [];
        this.sentries = [];
        this.batteries = [];
        this.echoes = [];
        this.portal = { x: W - 72, y: H / 2, r: 22, open: false, pulse: 0 };
        for (let i = 0; i < 7 + this.depth; i++) this.shards.push({ x: rand(55, W - 55), y: rand(65, H - 65), r: 7, phase: rand(0, 9) });
        for (let i = 0; i < 2 + Math.floor(this.depth / 2); i++) this.sentries.push({ x: rand(70, W - 70), y: rand(80, H - 80), r: 13, stun: 0, cool: rand(0.4, 1.5), speed: rand(36, 54) + this.depth * 3 });
        for (let i = 0; i < 2; i++) this.batteries.push({ x: rand(55, W - 55), y: rand(65, H - 65), r: 9, phase: rand(0, 6) });
        for (let i = 0; i < 2 + Math.floor(this.depth / 2); i++) this.echoes.push({ x: rand(65, W - 65), y: rand(70, H - 70), r: 11, arm: rand(0.6, 1.6), phase: rand(0, 7) });
      },
      update(dt) {
        const p = this.player;
        if (this.lives <= 0) return;
        const sp = p.dash > 0 ? 330 : 145;
        if (left()) p.x -= sp * dt;
        if (right()) p.x += sp * dt;
        if (up()) p.y -= sp * dt;
        if (down()) p.y += sp * dt;
        if (pointer.justDown && p.dashCd <= 0) {
          const a = Math.atan2(pointer.y - p.y, pointer.x - p.x);
          p.x += Math.cos(a) * 78;
          p.y += Math.sin(a) * 78;
          p.dash = 0.18;
          p.dashCd = 0.7;
          particles(this.fx, p.x, p.y, this.accent, 18, 190);
        }
        p.x = clamp(p.x, 25, W - 25);
        p.y = clamp(p.y, 42, H - 30);
        p.inv = Math.max(0, p.inv - dt);
        p.dash = Math.max(0, p.dash - dt);
        p.dashCd = Math.max(0, p.dashCd - dt);
        p.shield = Math.max(0, p.shield - dt);
        this.scanEnergy = Math.min(100, this.scanEnergy + dt * (7 + this.depth));
        if ((pressed.has('Space') || pressed.has('KeyE')) && this.scan <= 0 && this.scanEnergy >= 24) {
          this.scan = 0.8;
          this.scanEnergy -= 24;
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
        for (let i = this.batteries.length - 1; i >= 0; i--) {
          const b = this.batteries[i];
          if (Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r || (scanRadius && Math.hypot(p.x - b.x, p.y - b.y) < scanRadius * 0.7)) {
            this.scanEnergy = Math.min(100, this.scanEnergy + 42);
            p.shield = Math.max(p.shield, 2.2);
            this.score += 140;
            particles(this.fx, b.x, b.y, COLORS.green, 18, 160);
            this.batteries.splice(i, 1);
          }
        }
        for (let i = this.echoes.length - 1; i >= 0; i--) {
          const m = this.echoes[i];
          m.arm -= dt;
          const d = Math.hypot(p.x - m.x, p.y - m.y);
          if (scanRadius && d < scanRadius * 0.75) {
            particles(this.fx, m.x, m.y, COLORS.red, 22, 210);
            this.echoes.splice(i, 1);
            if (p.shield <= 0) {
              this.lives--;
              p.inv = 1.0;
            } else p.shield = 0;
          } else if (m.arm <= 0 && p.inv <= 0 && d < p.r + m.r + 4) {
            particles(this.fx, p.x, p.y, COLORS.red, 20, 190);
            this.echoes.splice(i, 1);
            if (p.shield <= 0) this.lives--;
            else p.shield = 0;
            p.inv = 1.0;
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
            e.cool -= dt;
            if (e.cool <= 0) {
              this.bolts.push({ x: e.x, y: e.y, vx: dx / d * 185, vy: dy / d * 185, life: 2.2 });
              e.cool = rand(1.0, 1.8) - Math.min(0.45, this.depth * 0.04);
            }
          }
          if (p.inv <= 0 && d < p.r + e.r) {
            if (p.shield <= 0) this.lives--;
            else p.shield = 0;
            p.inv = 1.1;
            particles(this.fx, p.x, p.y, COLORS.red, 24, 190);
            if (this.lives <= 0) saveBest('panda', this.score);
          }
        }
        for (let i = this.bolts.length - 1; i >= 0; i--) {
          const b = this.bolts[i];
          b.life -= dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (p.inv <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < p.r + 5) {
            particles(this.fx, p.x, p.y, COLORS.red, 20, 170);
            if (p.shield <= 0) this.lives--;
            else p.shield = 0;
            p.inv = 1.1;
            this.bolts.splice(i, 1);
          } else if (b.life <= 0 || b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) this.bolts.splice(i, 1);
        }
        this.portal.open = this.shards.length === 0;
        this.portal.pulse += dt;
        if (this.portal.open && Math.hypot(p.x - this.portal.x, p.y - this.portal.y) < p.r + this.portal.r) {
          this.depth++;
          this.score += 650 + this.depth * 75;
          this.spawnField();
        }
        if (this.lives <= 0) saveBest('panda', this.score);
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
        ctx.fillStyle = '#06120c';
        ctx.fillRect(18, H - 24, 126, 7);
        ctx.fillStyle = this.scanEnergy > 28 ? this.accent : COLORS.red;
        ctx.fillRect(18, H - 24, this.scanEnergy * 1.26, 7);
        text('SCAN', 152, H - 20, 10, COLORS.dim, 'left');
        if (this.portal.open) {
          const r = this.portal.r + Math.sin(this.portal.pulse * 8) * 5;
          ctx.strokeStyle = COLORS.green;
          ctx.shadowColor = COLORS.green;
          ctx.shadowBlur = 22;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.portal.x, this.portal.y, r, 0, Math.PI * 2);
          ctx.stroke();
          text('EXIT', this.portal.x, this.portal.y, 10, COLORS.green);
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
        for (const b of this.batteries) {
          const bob = Math.sin(performance.now() / 260 + b.phase) * 4;
          ctx.strokeStyle = COLORS.green;
          ctx.shadowColor = COLORS.green;
          ctx.shadowBlur = 14;
          ctx.strokeRect(b.x - 8, b.y + bob - 8, 16, 16);
          ctx.fillStyle = COLORS.green + '44';
          ctx.fillRect(b.x - 4, b.y + bob - 4, 8, 8);
        }
        for (const m of this.echoes) {
          const bob = Math.sin(performance.now() / 210 + m.phase) * 3;
          ctx.strokeStyle = COLORS.red;
          ctx.globalAlpha = m.arm > 0 ? 0.45 : 1;
          ctx.shadowColor = COLORS.red;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(m.x, m.y + bob - m.r);
          ctx.lineTo(m.x + m.r, m.y + bob);
          ctx.lineTo(m.x, m.y + bob + m.r);
          ctx.lineTo(m.x - m.r, m.y + bob);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha = 1;
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
        for (const b of this.bolts) {
          ctx.fillStyle = COLORS.red;
          ctx.shadowColor = COLORS.red;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fill();
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
        if (this.player.shield > 0) {
          ctx.strokeStyle = COLORS.green;
          ctx.shadowColor = COLORS.green;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(this.player.x, this.player.y, this.player.r + 18, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawParticles(this.fx);
        text('PANDA3D ORBIT: SHARDS ' + this.shards.length + '  ENERGY ' + Math.floor(this.scanEnergy), 18, 22, 12, this.accent, 'left', true);
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
        this.combo = 1;
        this.comboTimer = 0;
        this.dashCd = 0;
        this.fx = [];
        this.items = [];
        this.trails = [];
        this.player = { x: 92, y: 330, w: 24, h: 38, vy: 0, jumps: 0, duck: false, shield: 0, magnet: 0, boost: 0, dash: 0 };
      },
      spawnItem() {
        const roll = Math.random();
        const type = roll < 0.38 ? 'gem' : roll < 0.52 ? 'ring' : roll < 0.64 ? 'low' : roll < 0.78 ? 'block' : roll < 0.88 ? 'drone' : roll < 0.94 ? 'magnet' : 'shield';
        const ground = 366;
        if (type === 'gem') this.items.push({ type, x: W + 30, y: rand(185, 320), r: 8, wobble: rand(0, 6) });
        if (type === 'ring') this.items.push({ type, x: W + 30, y: rand(195, 285), r: 22, passed: false });
        if (type === 'magnet') this.items.push({ type, x: W + 30, y: rand(210, 300), r: 10 });
        if (type === 'shield') this.items.push({ type, x: W + 30, y: rand(220, 310), r: 10 });
        if (type === 'drone') this.items.push({ type, x: W + 30, y: rand(210, 285), w: 38, h: 22, phase: rand(0, 6) });
        if (type === 'low') this.items.push({ type, x: W + 30, y: ground - 50, w: rand(42, 64), h: 24 });
        if (type === 'block') this.items.push({ type, x: W + 30, y: ground - rand(28, 76), w: rand(22, 36), h: rand(30, 76) });
      },
      update(dt) {
        if (this.lives <= 0) return;
        const p = this.player;
        const speedMult = p.boost > 0 ? 1.32 : 1;
        this.speed += dt * 5.5;
        this.score += dt * this.speed * 0.26 * this.combo;
        this.zone = 1 + Math.floor(this.score / 1400);
        const groundY = 368;
        this.comboTimer = Math.max(0, this.comboTimer - dt);
        if (this.comboTimer <= 0) this.combo = Math.max(1, this.combo - dt * 1.8);
        this.dashCd = Math.max(0, this.dashCd - dt);
        p.duck = down() && p.jumps === 0;
        if ((pressed.has('Space') || pressed.has('ArrowUp') || pressed.has('KeyW')) && p.jumps < 2) {
          p.vy = -330;
          p.jumps++;
          particles(this.fx, p.x, p.y + p.h, this.accent, 10, 110);
        }
        if ((pointer.justDown || pressed.has('ShiftLeft') || pressed.has('ShiftRight')) && this.dashCd <= 0) {
          p.dash = 0.22;
          this.dashCd = 1.15;
          this.trails.push({ x: p.x, y: p.y, w: p.w, h: p.h, life: 0.24 });
          particles(this.fx, p.x + p.w, p.y + p.h / 2, this.accent, 16, 170);
        }
        p.h = p.duck ? 24 : 38;
        if (p.jumps === 0 && p.vy === 0) p.y = groundY - p.h;
        p.boost = Math.max(0, p.boost - dt);
        p.magnet = Math.max(0, p.magnet - dt);
        p.dash = Math.max(0, p.dash - dt);
        p.vy += 820 * dt;
        p.y += p.vy * dt;
        if (p.y + p.h > groundY) {
          p.y = groundY - p.h;
          p.vy = 0;
          p.jumps = 0;
        }
        p.shield = Math.max(0, p.shield - dt);
        for (let i = this.trails.length - 1; i >= 0; i--) {
          this.trails[i].life -= dt;
          if (this.trails[i].life <= 0) this.trails.splice(i, 1);
        }
        this.spawn -= dt;
        if (this.spawn <= 0) {
          this.spawnItem();
          this.spawn = rand(0.55, 1.0) * Math.max(0.55, 1.1 - this.zone * 0.05);
        }
        for (let i = this.items.length - 1; i >= 0; i--) {
          const it = this.items[i];
          it.x -= this.speed * speedMult * dt;
          if (it.type === 'drone') it.y += Math.sin(performance.now() / 180 + it.phase) * 28 * dt;
          if (p.magnet > 0 && (it.type === 'gem' || it.type === 'shield' || it.type === 'magnet')) {
            const dx = p.x + p.w / 2 - it.x;
            const dy = p.y + p.h / 2 - it.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 150) {
              it.x += dx / d * 220 * dt;
              it.y += dy / d * 220 * dt;
            }
          }
          if (it.type === 'gem' || it.type === 'shield' || it.type === 'magnet') {
            if (Math.hypot(p.x + p.w / 2 - it.x, p.y + p.h / 2 - it.y) < it.r + 20) {
              if (it.type === 'gem') {
                this.combo = Math.min(6, this.combo + 0.35);
                this.comboTimer = 2.2;
                this.score += 160 * this.combo;
              } else if (it.type === 'magnet') {
                p.magnet = 5;
                this.score += 120;
              } else p.shield = 4;
              particles(this.fx, it.x, it.y, it.type === 'gem' ? this.accent : COLORS.green, 16, 140);
              this.items.splice(i, 1);
            }
          } else if (it.type === 'ring') {
            const d = Math.hypot(p.x + p.w / 2 - it.x, p.y + p.h / 2 - it.y);
            if (!it.passed && d < it.r * 0.72) {
              it.passed = true;
              p.boost = 1.2;
              this.combo = Math.min(7, this.combo + 0.8);
              this.comboTimer = 2.6;
              this.score += 260 * this.combo;
              particles(this.fx, it.x, it.y, this.accent, 22, 190);
            } else if (it.x < p.x && !it.passed) {
              this.combo = 1;
              this.items.splice(i, 1);
            }
          } else if (rectHit({ x: p.x, y: p.y, w: p.w, h: p.h }, it)) {
            const canPhase = p.dash > 0 && it.type !== 'low';
            const duckedLow = it.type === 'low' && p.duck;
            if (canPhase || duckedLow) {
              this.combo = Math.min(6, this.combo + 0.45);
              this.comboTimer = 2.0;
              this.score += 110 * this.combo;
              particles(this.fx, it.x, it.y, this.accent, 14, 130);
              this.items.splice(i, 1);
            } else if (p.shield > 0) {
              p.shield = 0;
              this.combo = 1;
              particles(this.fx, it.x, it.y, COLORS.green, 20, 160);
              this.items.splice(i, 1);
            } else {
              this.lives--;
              this.combo = 1;
              particles(this.fx, p.x, p.y, COLORS.red, 24, 190);
              if (this.lives <= 0) saveBest('solar', this.score);
              this.items.splice(i, 1);
            }
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
        for (const t of this.trails) {
          ctx.globalAlpha = t.life / 0.24;
          ctx.fillStyle = this.accent + '66';
          ctx.fillRect(t.x, t.y, t.w, t.h);
          ctx.globalAlpha = 1;
        }
        for (const it of this.items) {
          if (it.type === 'block' || it.type === 'low' || it.type === 'drone') {
            ctx.fillStyle = it.type === 'low' ? COLORS.magenta : COLORS.red;
            ctx.shadowColor = COLORS.red;
            ctx.shadowBlur = 12;
            if (it.type === 'drone') {
              ctx.strokeStyle = COLORS.red;
              ctx.strokeRect(it.x, it.y, it.w, it.h);
              ctx.beginPath();
              ctx.moveTo(it.x, it.y + it.h / 2);
              ctx.lineTo(it.x + it.w, it.y + it.h / 2);
              ctx.stroke();
            } else ctx.fillRect(it.x, it.y, it.w, it.h);
          } else if (it.type === 'ring') {
            ctx.strokeStyle = it.passed ? COLORS.green : this.accent;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            const color = it.type === 'gem' ? this.accent : it.type === 'magnet' ? COLORS.magenta : COLORS.green;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const p = this.player;
        ctx.fillStyle = p.shield > 0 ? COLORS.green : p.dash > 0 ? COLORS.white : this.accent;
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
        if (p.magnet > 0) {
          ctx.strokeStyle = COLORS.magenta;
          ctx.beginPath();
          ctx.arc(p.x + p.w / 2, p.y + p.h / 2, 48, 0, Math.PI * 2);
          ctx.stroke();
        }
        drawParticles(this.fx);
        text('SOLAR2D COURIER: SPEED ' + Math.floor(this.speed) + '  COMBO x' + this.combo.toFixed(1), 18, 22, 12, this.accent, 'left', true);
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
    pointer.justDown = true;
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
    pointer.justDown = false;
    requestAnimationFrame(frame);
  }

  setMode(current);
  requestAnimationFrame(frame);
})();
