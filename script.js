/* JDE Performante — Engineering showcase runtime */

(() => {
  "use strict";

  const RED = "#e10600";
  const WHITE = "rgba(245,245,245,";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  const sessionStart = performance.now();

  // ─── Year ───────────────────────────────────────────────
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ─── Boot sequence ──────────────────────────────────────
  const boot = document.getElementById("boot");
  const bootFill = document.getElementById("bootFill");
  const bootStatus = document.getElementById("bootStatus");
  const bootMsgs = [
    "INITIALIZING SYSTEMS",
    "LOADING VECTOR FIELD",
    "CALIBRATING RENDER LOOP",
    "ARMING INTERACTIONS",
    "SYSTEM ONLINE",
  ];

  function runBoot() {
    if (!boot || reduceMotion) {
      boot?.classList.add("done");
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let p = 0;
      let msgI = 0;
      const tick = () => {
        p += Math.random() * 14 + 6;
        if (p >= 100) p = 100;
        if (bootFill) bootFill.style.width = p + "%";
        const nextMsg = Math.floor((p / 100) * (bootMsgs.length - 1));
        if (nextMsg !== msgI && bootStatus) {
          msgI = nextMsg;
          bootStatus.textContent = bootMsgs[msgI];
        }
        if (p < 100) {
          setTimeout(tick, 40 + Math.random() * 50);
        } else {
          if (bootStatus) bootStatus.textContent = bootMsgs[bootMsgs.length - 1];
          setTimeout(() => {
            boot.classList.add("done");
            resolve();
          }, 280);
        }
      };
      setTimeout(tick, 120);
    });
  }

  // ─── Cursor ─────────────────────────────────────────────
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  if (isFine && cursor && ring) {
    document.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      },
      { passive: true }
    );

    (function loopRing() {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loopRing);
    })();

    document.querySelectorAll("a, button, [data-magnetic], .lab-canvas, .partner-card").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  }

  // Magnetic
  if (isFine) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
        el.style.transition = "transform 0.4s cubic-bezier(0.22,1,0.36,1)";
        setTimeout(() => (el.style.transition = ""), 400);
      });
    });
  }

  // ─── Nav ────────────────────────────────────────────────
  const nav = document.getElementById("nav");
  window.addEventListener(
    "scroll",
    () => nav?.classList.toggle("scrolled", window.scrollY > 30),
    { passive: true }
  );

  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      menu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  }

  // ─── Reveal ─────────────────────────────────────────────
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // ─── Ticker content ─────────────────────────────────────
  const ticker = document.getElementById("tickerTrack");
  if (ticker) {
    const items = [
      "ENGINEERING",
      "BEAUTY",
      "PRECISION",
      "SYSTEMS",
      "MOTION",
      "INTERFACES",
      "ARCHITECTURE",
      "CRAFT",
      "VELOCITY",
      "SIGNAL",
    ];
    const html = items.map((t) => `<span>${t}</span><span class="sep">◆</span>`).join("");
    ticker.innerHTML = html + html;
  }

  // ─── Typewriter status ──────────────────────────────────
  const typeStatus = document.getElementById("typeStatus");
  const statusLines = ["SYSTEM ARMED", "FIELD ACTIVE", "RENDER LOCKED", "JDE ONLINE"];
  let statusI = 0;
  if (typeStatus && !reduceMotion) {
    setInterval(() => {
      statusI = (statusI + 1) % statusLines.length;
      typeStatus.style.opacity = "0";
      setTimeout(() => {
        typeStatus.textContent = statusLines[statusI];
        typeStatus.style.opacity = "1";
      }, 200);
    }, 3200);
    typeStatus.style.transition = "opacity 0.2s";
  }

  // ─── Hero word rotator (no clipping) ────────────────────
  function initTitleRotator() {
    const root = document.getElementById("titleRotator");
    if (!root) return;
    const words = Array.from(root.querySelectorAll(".rotator-word"));
    if (words.length < 2) return;
    let i = 0;

    if (reduceMotion) return;

    setInterval(() => {
      const current = words[i];
      const next = words[(i + 1) % words.length];
      current.classList.remove("is-active");
      current.classList.add("is-exit");
      next.classList.add("is-active");
      next.classList.remove("is-exit");

      setTimeout(() => {
        current.classList.remove("is-exit");
      }, 560);

      i = (i + 1) % words.length;
    }, 3200);
  }

  // ─── 3D scene pointer parallax ──────────────────────────
  function initScene3d() {
    const stage = document.querySelector(".hero-3d");
    if (!stage || reduceMotion || !isFine) return;

    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    window.addEventListener(
      "mousemove",
      (e) => {
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        tx = ny * -14;
        ty = nx * 20;
      },
      { passive: true }
    );

    (function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      stage.style.setProperty("--par-x", cx.toFixed(2) + "deg");
      stage.style.setProperty("--par-y", cy.toFixed(2) + "deg");
      requestAnimationFrame(loop);
    })();
  }

  // ─── Count metrics ──────────────────────────────────────
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const run = () => {
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const t = Math.min(1, (now - start) / dur);
        el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          run();
          io.disconnect();
        }
      });
      io.observe(el);
    } else run();
  });

  // ═══════════════════════════════════════════════════════
  // HERO: Neural / particle field (engineering magic)
  // ═══════════════════════════════════════════════════════
  function initHeroField() {
    const canvas = document.getElementById("field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const hudCoords = document.getElementById("hudCoords");
    const hudFps = document.getElementById("hudFps");
    const hudNodes = document.getElementById("hudNodes");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes = [];
    let pointer = { x: 0, y: 0, active: false };
    let last = performance.now();
    let frames = 0;
    let fps = 60;
    let fpsT = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.floor((w * h) / 14000);
      nodes = Array.from({ length: Math.max(40, Math.min(count, 110)) }, () => spawn());
      if (hudNodes) hudNodes.textContent = `NODES ${nodes.length}`;
    };

    function spawn(edge) {
      let x = Math.random() * w;
      let y = Math.random() * h;
      if (edge === "right") x = w + 10;
      if (edge === "left") x = -10;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        pulse: Math.random() * Math.PI * 2,
      };
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
      if (hudCoords) {
        const nx = ((pointer.x / w) * 2 - 1).toFixed(3);
        const ny = ((pointer.y / h) * 2 - 1).toFixed(3);
        hudCoords.textContent = `X ${nx} · Y ${ny}`;
      }
    };

    canvas.parentElement?.addEventListener("mousemove", onMove, { passive: true });
    canvas.parentElement?.addEventListener(
      "mouseleave",
      () => {
        pointer.active = false;
      },
      { passive: true }
    );

    // Touch
    canvas.parentElement?.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = t.clientX - rect.left;
        pointer.y = t.clientY - rect.top;
        pointer.active = true;
      },
      { passive: true }
    );

    window.addEventListener("resize", resize);
    resize();

    function frame(now) {
      const dt = Math.min(32, now - last) / 16.67;
      last = now;
      frames++;
      if (now - fpsT > 500) {
        fps = Math.round((frames * 1000) / (now - fpsT));
        frames = 0;
        fpsT = now;
        if (hudFps) hudFps.textContent = `${fps} FPS`;
      }

      ctx.clearRect(0, 0, w, h);

      // Soft red radial under pointer
      if (pointer.active) {
        const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
        g.addColorStop(0, "rgba(225,6,0,0.12)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      // Update nodes
      for (const n of nodes) {
        if (pointer.active) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 220) {
            const f = (1 - dist / 220) * 0.08;
            n.vx += (dx / dist) * f * dt;
            n.vy += (dy / dist) * f * dt;
          }
        }
        n.vx *= 0.99;
        n.vy *= 0.99;
        n.x += n.vx * dt * 1.2;
        n.y += n.vy * dt * 1.2;
        n.pulse += 0.03 * dt;

        if (n.x < -20 || n.x > w + 20 || n.y < -20 || n.y > h + 20) {
          Object.assign(n, spawn(Math.random() > 0.5 ? "left" : "right"));
        }
      }

      // Connections
      const linkDist = Math.min(140, w * 0.12);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const alpha = (1 - d / linkDist) * 0.35;
            const nearPointer =
              pointer.active &&
              Math.hypot((a.x + b.x) / 2 - pointer.x, (a.y + b.y) / 2 - pointer.y) < 160;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = nearPointer
              ? `rgba(225,6,0,${alpha * 1.4})`
              : `rgba(255,255,255,${alpha * 0.5})`;
            ctx.lineWidth = nearPointer ? 1.1 : 0.6;
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        const glow = 0.45 + Math.sin(n.pulse) * 0.25;
        const near =
          pointer.active && Math.hypot(n.x - pointer.x, n.y - pointer.y) < 100;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (near ? 1.8 : 1), 0, Math.PI * 2);
        ctx.fillStyle = near ? `rgba(225,6,0,${glow})` : `${WHITE}${glow})`;
        ctx.fill();
        if (near) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(225,6,0,0.12)";
          ctx.fill();
        }
      }

      // Crosshair at pointer
      if (pointer.active) {
        ctx.strokeStyle = "rgba(225,6,0,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pointer.x - 14, pointer.y);
        ctx.lineTo(pointer.x + 14, pointer.y);
        ctx.moveTo(pointer.x, pointer.y - 14);
        ctx.lineTo(pointer.x, pointer.y + 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 22, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(225,6,0,0.25)";
        ctx.stroke();
      }

      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  // ═══════════════════════════════════════════════════════
  // Oscilloscope signal strip
  // ═══════════════════════════════════════════════════════
  function initScope() {
    const canvas = document.getElementById("scope");
    const hzEl = document.getElementById("scopeHz");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let t = 0;
    let phase = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth || canvas.parentElement.clientWidth;
      h = 72;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    function draw() {
      t += 0.04;
      phase += 0.02;
      const baseHz = 440 + Math.sin(t * 0.3) * 40 + Math.sin(t * 1.1) * 12;
      if (hzEl) hzEl.textContent = baseHz.toFixed(1) + " Hz";

      ctx.fillStyle = "#070707";
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.stroke();

      // Wave
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const n = x / w;
        const y =
          h / 2 +
          Math.sin(n * Math.PI * 8 + phase) * 18 * Math.sin(t * 0.5 + n * 2) +
          Math.sin(n * Math.PI * 22 + phase * 2.3) * 6 +
          Math.sin(n * Math.PI * 3 - t) * 8;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(225,6,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Ghost secondary wave
      ctx.beginPath();
      for (let x = 0; x <= w; x++) {
        const n = x / w;
        const y =
          h / 2 +
          Math.sin(n * Math.PI * 6 - phase * 0.7) * 10 +
          Math.cos(n * Math.PI * 14 + t) * 4;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      ctx.stroke();

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ═══════════════════════════════════════════════════════
  // Vector field module
  // ═══════════════════════════════════════════════════════
  function initVectors() {
    const canvas = document.getElementById("vectors");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let ptr = { x: 0, y: 0, on: false };
    const particles = [];

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 260;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;
      const n = Math.floor((w * h) / 8000);
      for (let i = 0; i < Math.max(30, Math.min(n, 80)); i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: 0,
          vy: 0,
          life: Math.random(),
        });
      }
    };

    canvas.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.on = true;
    });
    canvas.addEventListener("mouseleave", () => (ptr.on = false));

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Flow field arrows
    function draw() {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, w, h);

      const cols = Math.floor(w / 28);
      const rows = Math.floor(h / 28);
      const t = performance.now() * 0.0004;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = (i / cols) * w;
          const y = (j / rows) * h;
          let angle = Math.sin(x * 0.01 + t) * Math.cos(y * 0.012 - t) * Math.PI;
          if (ptr.on) {
            const dx = ptr.x - x;
            const dy = ptr.y - y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 150) {
              angle = Math.atan2(dy, dx) + (1 - d / 150) * 0.8;
            }
          }
          const len = 8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
          const near = ptr.on && Math.hypot(ptr.x - x, ptr.y - y) < 120;
          ctx.strokeStyle = near ? "rgba(225,6,0,0.55)" : "rgba(255,255,255,0.12)";
          ctx.lineWidth = near ? 1.2 : 0.7;
          ctx.stroke();
        }
      }

      for (const p of particles) {
        let angle = Math.sin(p.x * 0.01 + t) * Math.cos(p.y * 0.012 - t) * Math.PI;
        if (ptr.on) {
          const dx = ptr.x - p.x;
          const dy = ptr.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 180) {
            p.vx += (dx / d) * 0.35;
            p.vy += (dy / d) * 0.35;
          }
        }
        p.vx += Math.cos(angle) * 0.08;
        p.vy += Math.sin(angle) * 0.08;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;
        if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
          p.x = Math.random() * w;
          p.y = Math.random() * h;
          p.vx = p.vy = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = Math.hypot(p.vx, p.vy) > 1.5 ? RED : "rgba(255,255,255,0.7)";
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ═══════════════════════════════════════════════════════
  // Wireframe polyhedron (3D with depth-sorted faces)
  // ═══════════════════════════════════════════════════════
  function initWireframe() {
    const canvas = document.getElementById("wireframe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let rotX = 0.4;
    let rotY = 0.3;
    let auto = true;
    let targetRot = { x: 0.4, y: 0.3 };

    const φ = (1 + Math.sqrt(5)) / 2;
    const raw = [
      [-1, φ, 0],
      [1, φ, 0],
      [-1, -φ, 0],
      [1, -φ, 0],
      [0, -1, φ],
      [0, 1, φ],
      [0, -1, -φ],
      [0, 1, -φ],
      [φ, 0, -1],
      [φ, 0, 1],
      [-φ, 0, -1],
      [-φ, 0, 1],
    ];
    const scale = 1 / Math.hypot(...raw[0]);
    const verts = raw.map((v) => v.map((n) => n * scale));

    const edges = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        const d = Math.hypot(
          verts[i][0] - verts[j][0],
          verts[i][1] - verts[j][1],
          verts[i][2] - verts[j][2]
        );
        if (d < 1.1) edges.push([i, j]);
      }
    }

    // Approximate triangular faces from near triples
    const faces = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        for (let k = j + 1; k < verts.length; k++) {
          const dij = Math.hypot(
            verts[i][0] - verts[j][0],
            verts[i][1] - verts[j][1],
            verts[i][2] - verts[j][2]
          );
          const djk = Math.hypot(
            verts[j][0] - verts[k][0],
            verts[j][1] - verts[k][1],
            verts[j][2] - verts[k][2]
          );
          const dik = Math.hypot(
            verts[i][0] - verts[k][0],
            verts[i][1] - verts[k][1],
            verts[i][2] - verts[k][2]
          );
          if (dij < 1.1 && djk < 1.1 && dik < 1.1) faces.push([i, j, k]);
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 260;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(resize).observe(canvas);
    resize();

    const setTarget = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const nx = (clientX - r.left) / r.width - 0.5;
      const ny = (clientY - r.top) / r.height - 0.5;
      targetRot.y = nx * Math.PI;
      targetRot.x = ny * Math.PI;
      auto = false;
    };

    canvas.addEventListener("mousemove", (e) => setTarget(e.clientX, e.clientY));
    canvas.addEventListener("mouseleave", () => (auto = true));
    canvas.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (t) setTarget(t.clientX, t.clientY);
      },
      { passive: true }
    );

    function rotatePoint(v) {
      let [x, y, z] = v;
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = y1;
      z = z1;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      return [x1, y, z1];
    }

    function project(v) {
      const [x, y, z] = rotatePoint(v);
      const fov = 2.8;
      const s = (Math.min(w, h) * 0.32) / (fov + z);
      return { x: w / 2 + x * s, y: h / 2 + y * s, z };
    }

    function draw() {
      if (auto) {
        rotY += 0.01;
        rotX += 0.004;
      } else {
        rotX += (targetRot.x - rotX) * 0.08;
        rotY += (targetRot.y - rotY) * 0.08;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.beginPath();
      ctx.moveTo(w / 2, 20);
      ctx.lineTo(w / 2, h - 20);
      ctx.moveTo(20, h / 2);
      ctx.lineTo(w - 20, h / 2);
      ctx.stroke();

      const projected = verts.map(project);

      // Depth-sorted faces
      const faceData = faces.map((f) => {
        const pts = f.map((i) => projected[i]);
        const z = (pts[0].z + pts[1].z + pts[2].z) / 3;
        return { pts, z };
      });
      faceData.sort((a, b) => b.z - a.z);

      for (const { pts, z } of faceData) {
        const alpha = 0.04 + Math.max(0, 0.12 - z * 0.08);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fillStyle = z < 0.1 ? `rgba(225,6,0,${alpha * 1.6})` : `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }

      for (const [i, j] of edges) {
        const a = projected[i];
        const b = projected[j];
        const depth = (a.z + b.z) / 2;
        const alpha = 0.25 + (1 - (depth + 1) / 2) * 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle =
          depth < 0.2 ? `rgba(225,6,0,${alpha})` : `rgba(255,255,255,${alpha * 0.7})`;
        ctx.lineWidth = depth < 0.2 ? 1.4 : 0.9;
        ctx.stroke();
      }

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.z < 0.15 ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fillStyle = p.z < 0.15 ? RED : "rgba(255,255,255,0.8)";
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ═══════════════════════════════════════════════════════
  // 3D Lattice point cloud
  // ═══════════════════════════════════════════════════════
  function initLattice() {
    const canvas = document.getElementById("lattice");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let rotX = 0.5;
    let rotY = 0.3;
    let auto = true;
    let target = { x: 0.5, y: 0.3 };

    const N = 5;
    const points = [];
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        for (let z = 0; z < N; z++) {
          points.push({
            x: (x / (N - 1) - 0.5) * 2,
            y: (y / (N - 1) - 0.5) * 2,
            z: (z / (N - 1) - 0.5) * 2,
          });
        }
      }
    }

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 260;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    new ResizeObserver(resize).observe(canvas);
    resize();

    const aim = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      target.y = ((cx - r.left) / r.width - 0.5) * Math.PI * 1.2;
      target.x = ((cy - r.top) / r.height - 0.5) * Math.PI * 0.9;
      auto = false;
    };
    canvas.addEventListener("mousemove", (e) => aim(e.clientX, e.clientY));
    canvas.addEventListener("mouseleave", () => (auto = true));
    canvas.addEventListener(
      "touchmove",
      (e) => {
        const t = e.touches[0];
        if (t) aim(t.clientX, t.clientY);
      },
      { passive: true }
    );

    function project(p) {
      let { x, y, z } = p;
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = y1;
      z = z1;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      x = x1;
      z = z1;
      const fov = 3.2;
      const s = (Math.min(w, h) * 0.38) / (fov + z);
      return { x: w / 2 + x * s, y: h / 2 + y * s, z, s };
    }

    function draw() {
      if (auto) {
        rotY += 0.007;
        rotX = 0.45 + Math.sin(performance.now() * 0.0004) * 0.2;
      } else {
        rotX += (target.x - rotX) * 0.07;
        rotY += (target.y - rotY) * 0.07;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      const projected = points.map(project).sort((a, b) => b.z - a.z);

      // Connect near neighbors in screen space for lattice feel
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const a = projected[i];
          const b = projected[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 38) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            const depth = (a.z + b.z) / 2;
            ctx.strokeStyle =
              depth < 0
                ? `rgba(225,6,0,${0.15 + (1 - d / 38) * 0.35})`
                : `rgba(255,255,255,${0.04 + (1 - d / 38) * 0.12})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      for (const p of projected) {
        const r = Math.max(1.2, 3.2 - p.z * 1.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.z < 0 ? RED : "rgba(255,255,255,0.85)";
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  // ═══════════════════════════════════════════════════════
  // Kinetic type machine
  // ═══════════════════════════════════════════════════════
  function initTypeMachine() {
    const display = document.getElementById("typeDisplay");
    if (!display) return;
    const words = ["BEAUTY", "SYSTEM", "CRAFT", "SIGNAL", "JDE", "FORCE", "FORM"];
    let i = 0;

    const cycle = () => {
      display.classList.add("flash");
      setTimeout(() => {
        i = (i + 1) % words.length;
        // Scramble effect
        let frame = 0;
        const target = words[i];
        const scramble = () => {
          frame++;
          if (frame < 8) {
            display.textContent = Array.from(target)
              .map((c, idx) =>
                frame > idx + 2
                  ? c
                  : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
              )
              .join("");
            requestAnimationFrame(scramble);
          } else {
            display.textContent = target;
            display.classList.remove("flash");
          }
        };
        scramble();
      }, 120);
    };

    setInterval(cycle, 2800);
  }

  // ═══════════════════════════════════════════════════════
  // Chronograph
  // ═══════════════════════════════════════════════════════
  function initChrono() {
    const canvas = document.getElementById("clock");
    const utcEl = document.getElementById("utcTime");
    const deltaEl = document.getElementById("frameDelta");
    const sessionEl = document.getElementById("sessionTime");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = 280;
    let lastFrame = performance.now();

    function drawClock() {
      const now = new Date();
      const ms = now.getMilliseconds();
      const s = now.getSeconds() + ms / 1000;
      const m = now.getMinutes() + s / 60;
      const h = (now.getHours() % 12) + m / 60;

      const cx = size / 2;
      const cy = size / 2;
      const r = 120;

      ctx.clearRect(0, 0, size, size);

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Red arc progress (seconds)
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (s / 60) * Math.PI * 2);
      ctx.strokeStyle = RED;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ticks
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
        const major = i % 5 === 0;
        const r1 = r - (major ? 12 : 6);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
        ctx.strokeStyle = major ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)";
        ctx.lineWidth = major ? 1.5 : 1;
        ctx.stroke();
      }

      const hand = (angle, len, width, color) => {
        const a = angle - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx - Math.cos(a) * 12, cy - Math.sin(a) * 12);
        ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.stroke();
      };

      hand((h / 12) * Math.PI * 2, 55, 2.5, "#f5f5f5");
      hand((m / 60) * Math.PI * 2, 80, 1.8, "#f5f5f5");
      hand((s / 60) * Math.PI * 2, 95, 1, RED);

      // Center
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = RED;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      // Readouts
      if (utcEl) {
        const iso = now.toISOString();
        utcEl.textContent = iso.slice(11, 23);
      }
      const frameNow = performance.now();
      if (deltaEl) deltaEl.textContent = (frameNow - lastFrame).toFixed(2) + " ms";
      lastFrame = frameNow;
      if (sessionEl) {
        const sec = Math.floor((frameNow - sessionStart) / 1000);
        const hh = String(Math.floor(sec / 3600)).padStart(2, "0");
        const mm = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
        const ss = String(sec % 60).padStart(2, "0");
        sessionEl.textContent = `${hh}:${mm}:${ss}`;
      }

      requestAnimationFrame(drawClock);
    }
    requestAnimationFrame(drawClock);
  }

  // ─── Start ──────────────────────────────────────────────
  initTitleRotator();
  initScene3d();

  runBoot().then(() => {
    initHeroField();
    initScope();
    initVectors();
    initWireframe();
    initLattice();
    initTypeMachine();
    initChrono();
  });
})();
