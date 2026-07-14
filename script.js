/* JDE Performante — Engineering showcase runtime (mobile-first performance) */

(() => {
  "use strict";

  const RED = "#e10600";
  const WHITE = "rgba(245,245,245,";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;
  // Lite mode: touch / small screens — fewer particles, lower FPS, gated loops
  const perfLite = reduceMotion || isCoarse || isNarrow || navigator.maxTouchPoints > 2;
  const sessionStart = performance.now();

  if (perfLite) document.documentElement.classList.add("perf-lite");

  const maxDpr = perfLite ? 1 : Math.min(window.devicePixelRatio || 1, 2);

  // ─── Shared animation runner (visibility + tab + FPS cap) ─
  const runners = [];

  function createRunner(el, tick, fps, eager) {
    const targetFps = fps || (perfLite ? 30 : 60);
    const minDelta = 1000 / targetFps;
    let raf = 0;
    let visible = false;
    let last = 0;
    let lastDraw = 0;

    const state = {
      el,
      tick,
      get running() {
        return !!raf;
      },
      start() {
        if (raf || !visible || document.hidden) return;
        last = performance.now();
        lastDraw = 0;
        const loop = (now) => {
          if (!visible || document.hidden) {
            raf = 0;
            return;
          }
          raf = requestAnimationFrame(loop);
          if (now - lastDraw < minDelta) return;
          const dt = Math.min(32, now - last) / 16.67;
          last = now;
          lastDraw = now;
          tick(now, dt);
        };
        raf = requestAnimationFrame(loop);
      },
      stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      },
      setVisible(v) {
        visible = v;
        if (v) state.start();
        else state.stop();
      },
    };

    runners.push(state);

    if (el && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        ([entry]) =>
          state.setVisible(!!entry.isIntersecting && entry.intersectionRatio > 0.01),
        { rootMargin: "60px 0px", threshold: [0, 0.01, 0.1] }
      );
      io.observe(el);
      // Eager: start immediately for above-the-fold (hero/scope)
      if (eager) state.setVisible(true);
    } else {
      state.setVisible(true);
    }

    return state;
  }

  document.addEventListener("visibilitychange", () => {
    runners.forEach((r) => {
      if (document.hidden) r.stop();
      else r.start();
    });
  });

  // Debounced resize bus
  const resizeFns = [];
  let resizeT = 0;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => resizeFns.forEach((fn) => fn()), perfLite ? 150 : 80);
    },
    { passive: true }
  );
  function onResize(fn) {
    resizeFns.push(fn);
  }

  // ─── Year ───────────────────────────────────────────────
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ─── Boot (skip / fast on mobile) ───────────────────────
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
    if (!boot || reduceMotion || perfLite) {
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
        if (p < 100) setTimeout(tick, 40 + Math.random() * 50);
        else {
          if (bootStatus) bootStatus.textContent = bootMsgs[bootMsgs.length - 1];
          setTimeout(() => {
            boot.classList.add("done");
            resolve();
          }, 200);
        }
      };
      setTimeout(tick, 80);
    });
  }

  // ─── Cursor (desktop only — never on touch) ─────────────
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  if (isFine && !perfLite && cursor && ring) {
    document.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      },
      { passive: true }
    );

    createRunner(document.documentElement, () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    }, 60, true);

    document.querySelectorAll("a, button, [data-magnetic], .lab-canvas, .partner-card").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  } else {
    cursor?.remove();
    ring?.remove();
  }

  // Magnetic (desktop only)
  if (isFine && !perfLite) {
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
  let navScheduled = false;
  window.addEventListener(
    "scroll",
    () => {
      if (navScheduled) return;
      navScheduled = true;
      requestAnimationFrame(() => {
        nav?.classList.toggle("scrolled", window.scrollY > 30);
        navScheduled = false;
      });
    },
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
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  // ─── Ticker ─────────────────────────────────────────────
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
    }, perfLite ? 4000 : 3200);
    typeStatus.style.transition = "opacity 0.2s";
  }

  // ─── Hero word rotator ──────────────────────────────────
  function initTitleRotator() {
    const root = document.getElementById("titleRotator");
    if (!root || reduceMotion) return;
    const words = Array.from(root.querySelectorAll(".rotator-word"));
    if (words.length < 2) return;
    let i = 0;
    setInterval(() => {
      const current = words[i];
      const next = words[(i + 1) % words.length];
      current.classList.remove("is-active");
      current.classList.add("is-exit");
      next.classList.add("is-active");
      next.classList.remove("is-exit");
      setTimeout(() => current.classList.remove("is-exit"), 560);
      i = (i + 1) % words.length;
    }, 3200);
  }

  // ─── 3D scene parallax (desktop only) ───────────────────
  function initScene3d() {
    const stage = document.querySelector(".hero-3d");
    if (!stage || reduceMotion || perfLite || !isFine) return;

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

    createRunner(stage, () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      stage.style.setProperty("--par-x", cx.toFixed(2) + "deg");
      stage.style.setProperty("--par-y", cy.toFixed(2) + "deg");
    }, 30, true);
  }

  // ─── Count metrics ──────────────────────────────────────
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const run = () => {
      if (perfLite) {
        el.textContent = String(target);
        return;
      }
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
  // HERO field
  // ═══════════════════════════════════════════════════════
  function initHeroField() {
    const canvas = document.getElementById("field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const hudCoords = document.getElementById("hudCoords");
    const hudFps = document.getElementById("hudFps");
    const hudNodes = document.getElementById("hudNodes");

    let w = 0;
    let h = 0;
    let dpr = 1;
    let nodes = [];
    let pointer = { x: 0, y: 0, active: false };
    let frames = 0;
    let fpsT = 0;

    const spawn = (edge) => {
      let x = Math.random() * w;
      let y = Math.random() * h;
      if (edge === "right") x = w + 10;
      if (edge === "left") x = -10;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.5,
        pulse: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      dpr = maxDpr;
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const density = perfLite ? 28000 : 14000;
      const minN = perfLite ? 18 : 40;
      const maxN = perfLite ? 36 : 100;
      const count = Math.floor((w * h) / density);
      nodes = Array.from({ length: Math.max(minN, Math.min(count, maxN)) }, () => spawn());
      if (hudNodes) hudNodes.textContent = `NODES ${nodes.length}`;
    };
    onResize(resize);
    resize();

    const hero = canvas.parentElement;
    if (isFine) {
      hero?.addEventListener(
        "mousemove",
        (e) => {
          const rect = canvas.getBoundingClientRect();
          pointer.x = e.clientX - rect.left;
          pointer.y = e.clientY - rect.top;
          pointer.active = true;
          if (hudCoords && !perfLite) {
            hudCoords.textContent = `X ${((pointer.x / w) * 2 - 1).toFixed(3)} · Y ${((pointer.y / h) * 2 - 1).toFixed(3)}`;
          }
        },
        { passive: true }
      );
      hero?.addEventListener("mouseleave", () => (pointer.active = false), { passive: true });
    }
    // Touch: brief influence only (no continuous touchmove work during scroll)
    let touchClear = 0;
    hero?.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        const rect = canvas.getBoundingClientRect();
        pointer.x = t.clientX - rect.left;
        pointer.y = t.clientY - rect.top;
        pointer.active = true;
        clearTimeout(touchClear);
        touchClear = setTimeout(() => (pointer.active = false), 600);
      },
      { passive: true }
    );

    createRunner(
      canvas,
      (now, dt) => {
        frames++;
        if (now - fpsT > 600) {
          if (hudFps) hudFps.textContent = `${Math.round((frames * 1000) / (now - fpsT))} FPS`;
          frames = 0;
          fpsT = now;
        }

        ctx.clearRect(0, 0, w, h);

        if (pointer.active && !perfLite) {
          const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 180);
          g.addColorStop(0, "rgba(225,6,0,0.1)");
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }

        for (const n of nodes) {
          if (pointer.active) {
            const dx = pointer.x - n.x;
            const dy = pointer.y - n.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < 180) {
              const f = (1 - dist / 180) * 0.08;
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

        // Connections — lighter on mobile (skip every other pair / shorter range)
        const linkDist = perfLite ? Math.min(90, w * 0.1) : Math.min(140, w * 0.12);
        const stepJ = perfLite ? 2 : 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j += stepJ) {
            const a = nodes[i];
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            const lim = linkDist * linkDist;
            if (d2 < lim) {
              const d = Math.sqrt(d2);
              const alpha = (1 - d / linkDist) * (perfLite ? 0.28 : 0.35);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        for (const n of nodes) {
          const glow = 0.45 + Math.sin(n.pulse) * 0.25;
          const near = pointer.active && Math.hypot(n.x - pointer.x, n.y - pointer.y) < 90;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * (near ? 1.6 : 1), 0, Math.PI * 2);
          ctx.fillStyle = near ? `rgba(225,6,0,${glow})` : `${WHITE}${glow})`;
          ctx.fill();
        }

        if (pointer.active && isFine) {
          ctx.strokeStyle = "rgba(225,6,0,0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pointer.x - 12, pointer.y);
          ctx.lineTo(pointer.x + 12, pointer.y);
          ctx.moveTo(pointer.x, pointer.y - 12);
          ctx.lineTo(pointer.x, pointer.y + 12);
          ctx.stroke();
        }
      },
      perfLite ? 28 : 60,
      true
    );
  }

  // ═══════════════════════════════════════════════════════
  // Oscilloscope
  // ═══════════════════════════════════════════════════════
  function initScope() {
    const canvas = document.getElementById("scope");
    const hzEl = document.getElementById("scopeHz");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    let w = 0;
    let h = 72;
    let t = 0;
    let phase = 0;

    const resize = () => {
      const dpr = maxDpr;
      w = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
      h = perfLite ? 56 : 72;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize(resize);
    resize();

    createRunner(
      canvas,
      () => {
        t += 0.04;
        phase += 0.02;
        const baseHz = 440 + Math.sin(t * 0.3) * 40;
        if (hzEl) hzEl.textContent = baseHz.toFixed(1) + " Hz";

        ctx.fillStyle = "#070707";
        ctx.fillRect(0, 0, w, h);

        if (!perfLite) {
          ctx.strokeStyle = "rgba(255,255,255,0.04)";
          ctx.lineWidth = 1;
          for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.stroke();

        // Main wave — fewer samples on mobile
        const step = perfLite ? 3 : 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          const n = x / w;
          const y =
            h / 2 +
            Math.sin(n * Math.PI * 8 + phase) * (perfLite ? 14 : 18) * Math.sin(t * 0.5 + n * 2) +
            Math.sin(n * Math.PI * 22 + phase * 2.3) * (perfLite ? 4 : 6);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1.5;
        if (!perfLite) {
          ctx.shadowColor = "rgba(225,6,0,0.5)";
          ctx.shadowBlur = 6;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      },
      perfLite ? 24 : 50,
      true
    );
  }

  // ═══════════════════════════════════════════════════════
  // Vector field
  // ═══════════════════════════════════════════════════════
  function initVectors() {
    const canvas = document.getElementById("vectors");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    let w = 0;
    let h = 0;
    let ptr = { x: 0, y: 0, on: false };
    const particles = [];

    const resize = () => {
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;
      const dens = perfLite ? 16000 : 8000;
      const n = Math.floor((w * h) / dens);
      const maxP = perfLite ? 28 : 70;
      for (let i = 0; i < Math.max(12, Math.min(n, maxP)); i++) {
        particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 });
      }
    };
    onResize(resize);
    if (canvas.clientWidth) resize();
    else requestAnimationFrame(resize);
    new ResizeObserver(resize).observe(canvas);

    if (isFine) {
      canvas.addEventListener("mousemove", (e) => {
        const r = canvas.getBoundingClientRect();
        ptr.x = e.clientX - r.left;
        ptr.y = e.clientY - r.top;
        ptr.on = true;
      });
      canvas.addEventListener("mouseleave", () => (ptr.on = false));
    }
    canvas.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        const r = canvas.getBoundingClientRect();
        ptr.x = t.clientX - r.left;
        ptr.y = t.clientY - r.top;
        ptr.on = true;
        setTimeout(() => (ptr.on = false), 800);
      },
      { passive: true }
    );

    createRunner(
      canvas,
      () => {
        ctx.fillStyle = perfLite ? "#000" : "rgba(0,0,0,0.22)";
        ctx.fillRect(0, 0, w, h);

        const t = performance.now() * 0.0004;
        const cell = perfLite ? 40 : 28;
        const cols = Math.floor(w / cell);
        const rows = Math.floor(h / cell);

        for (let i = 0; i <= cols; i++) {
          for (let j = 0; j <= rows; j++) {
            const x = (i / cols) * w;
            const y = (j / rows) * h;
            let angle = Math.sin(x * 0.01 + t) * Math.cos(y * 0.012 - t) * Math.PI;
            if (ptr.on) {
              const dx = ptr.x - x;
              const dy = ptr.y - y;
              const d = Math.hypot(dx, dy) || 1;
              if (d < 140) angle = Math.atan2(dy, dx);
            }
            const len = 7;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.strokeStyle = "rgba(255,255,255,0.12)";
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }

        for (const p of particles) {
          let angle = Math.sin(p.x * 0.01 + t) * Math.cos(p.y * 0.012 - t) * Math.PI;
          if (ptr.on) {
            const dx = ptr.x - p.x;
            const dy = ptr.y - p.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 160) {
              p.vx += (dx / d) * 0.3;
              p.vy += (dy / d) * 0.3;
            }
          }
          p.vx += Math.cos(angle) * 0.08;
          p.vy += Math.sin(angle) * 0.08;
          p.vx *= 0.92;
          p.vy *= 0.92;
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
            p.vx = p.vy = 0;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = Math.hypot(p.vx, p.vy) > 1.5 ? RED : "rgba(255,255,255,0.7)";
          ctx.fill();
        }
      },
      perfLite ? 24 : 50
    );
  }

  // ═══════════════════════════════════════════════════════
  // Wireframe polyhedron
  // ═══════════════════════════════════════════════════════
  function initWireframe() {
    const canvas = document.getElementById("wireframe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
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

    // Faces only on desktop (extra fill cost)
    const faces = [];
    if (!perfLite) {
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
    }

    const resize = () => {
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize(resize);
    new ResizeObserver(resize).observe(canvas);
    resize();

    const setTarget = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      targetRot.y = ((cx - r.left) / r.width - 0.5) * Math.PI;
      targetRot.x = ((cy - r.top) / r.height - 0.5) * Math.PI;
      auto = false;
    };
    if (isFine) {
      canvas.addEventListener("mousemove", (e) => setTarget(e.clientX, e.clientY));
      canvas.addEventListener("mouseleave", () => (auto = true));
    }
    canvas.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (t) {
          setTarget(t.clientX, t.clientY);
          setTimeout(() => (auto = true), 1200);
        }
      },
      { passive: true }
    );

    function project(v) {
      let [x, y, z] = v;
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = y1;
      z = z1;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      x = x1;
      z = z1;
      const fov = 2.8;
      const s = (Math.min(w, h) * 0.32) / (fov + z);
      return { x: w / 2 + x * s, y: h / 2 + y * s, z };
    }

    createRunner(
      canvas,
      () => {
        if (auto) {
          rotY += perfLite ? 0.012 : 0.01;
          rotX += perfLite ? 0.005 : 0.004;
        } else {
          rotX += (targetRot.x - rotX) * 0.08;
          rotY += (targetRot.y - rotY) * 0.08;
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        const projected = verts.map(project);

        if (faces.length) {
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
          ctx.lineWidth = depth < 0.2 ? 1.3 : 0.85;
          ctx.stroke();
        }

        for (const p of projected) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.z < 0.15 ? 2.4 : 1.4, 0, Math.PI * 2);
          ctx.fillStyle = p.z < 0.15 ? RED : "rgba(255,255,255,0.8)";
          ctx.fill();
        }
      },
      perfLite ? 28 : 50
    );
  }

  // ═══════════════════════════════════════════════════════
  // 3D Lattice
  // ═══════════════════════════════════════════════════════
  function initLattice() {
    const canvas = document.getElementById("lattice");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    let w = 0;
    let h = 0;
    let rotX = 0.5;
    let rotY = 0.3;
    let auto = true;
    let target = { x: 0.5, y: 0.3 };

    const N = perfLite ? 4 : 5;
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
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize(resize);
    new ResizeObserver(resize).observe(canvas);
    resize();

    const aim = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      target.y = ((cx - r.left) / r.width - 0.5) * Math.PI * 1.2;
      target.x = ((cy - r.top) / r.height - 0.5) * Math.PI * 0.9;
      auto = false;
    };
    if (isFine) {
      canvas.addEventListener("mousemove", (e) => aim(e.clientX, e.clientY));
      canvas.addEventListener("mouseleave", () => (auto = true));
    }
    canvas.addEventListener(
      "touchstart",
      (e) => {
        const t = e.touches[0];
        if (t) {
          aim(t.clientX, t.clientY);
          setTimeout(() => (auto = true), 1200);
        }
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
      return { x: w / 2 + x * s, y: h / 2 + y * s, z };
    }

    createRunner(
      canvas,
      () => {
        if (auto) {
          rotY += 0.008;
          rotX = 0.45 + Math.sin(performance.now() * 0.0004) * 0.2;
        } else {
          rotX += (target.x - rotX) * 0.07;
          rotY += (target.y - rotY) * 0.07;
        }

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        const projected = points.map(project).sort((a, b) => b.z - a.z);
        const linkMax = perfLite ? 32 : 38;

        // Sparse links on mobile
        const stride = perfLite ? 2 : 1;
        for (let i = 0; i < projected.length; i += stride) {
          for (let j = i + 1; j < projected.length; j += stride) {
            const a = projected[i];
            const b = projected[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < linkMax) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              const depth = (a.z + b.z) / 2;
              ctx.strokeStyle =
                depth < 0
                  ? `rgba(225,6,0,${0.12 + (1 - d / linkMax) * 0.3})`
                  : `rgba(255,255,255,${0.04 + (1 - d / linkMax) * 0.1})`;
              ctx.lineWidth = 0.7;
              ctx.stroke();
            }
          }
        }

        for (const p of projected) {
          const r = Math.max(1.2, 3 - p.z * 1.1);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = p.z < 0 ? RED : "rgba(255,255,255,0.85)";
          ctx.fill();
        }
      },
      perfLite ? 24 : 50
    );
  }

  // ═══════════════════════════════════════════════════════
  // Kinetic type
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
        if (perfLite) {
          display.textContent = words[i];
          display.classList.remove("flash");
          return;
        }
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
      }, 100);
    };

    setInterval(cycle, perfLite ? 3200 : 2800);
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
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    const size = 280;
    let lastFrame = performance.now();

    // Scale canvas for mobile retina once
    const dpr = maxDpr;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + "px";
    canvas.style.height = size + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createRunner(
      canvas,
      () => {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds() + ms / 1000;
        const m = now.getMinutes() + s / 60;
        const h = (now.getHours() % 12) + m / 60;
        const cx = size / 2;
        const cy = size / 2;
        const r = 120;

        ctx.clearRect(0, 0, size, size);

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (s / 60) * Math.PI * 2);
        ctx.strokeStyle = RED;
        ctx.lineWidth = 2;
        ctx.stroke();

        const tickStep = perfLite ? 5 : 1;
        for (let i = 0; i < 60; i += tickStep) {
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

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#000";
        ctx.fill();

        if (utcEl) utcEl.textContent = now.toISOString().slice(11, 23);
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
      },
      perfLite ? 15 : 30
    );
  }

  // ─── Start ──────────────────────────────────────────────
  initTitleRotator();
  initScene3d();

  runBoot().then(() => {
    initHeroField();
    initScope();
    // Defer below-fold engines slightly on mobile so first paint stays snappy
    const startLabs = () => {
      initVectors();
      initWireframe();
      initLattice();
      initTypeMachine();
      initChrono();
    };
    if (perfLite && "requestIdleCallback" in window) {
      requestIdleCallback(startLabs, { timeout: 900 });
    } else if (perfLite) {
      setTimeout(startLabs, 200);
    } else {
      startLabs();
    }
  });
})();
