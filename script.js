/* JDE Performante — Engineering showcase (high-FPS + touch solid) */

(() => {
  "use strict";

  const RED = "#e10600";
  const WHITE = "rgba(245,245,245,";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFine = window.matchMedia("(pointer: fine)").matches;
  const isCoarse = window.matchMedia("(pointer: coarse)").matches;
  const isNarrow = window.matchMedia("(max-width: 768px)").matches;
  // Mobile only — do not couple reduceMotion into canvas quality (breaks desktop)
  const isMobile = isCoarse || isNarrow;
  const perfLite = isMobile;
  const sessionStart = performance.now();

  if (perfLite) document.documentElement.classList.add("perf-lite");

  // Failsafe: ensure hero type is visible even if CSS intro stalls
  setTimeout(() => {
    document.querySelectorAll(".char").forEach((c) => {
      c.style.opacity = "1";
      c.style.transform = "none";
    });
    document.querySelectorAll(".hero-lede, .hero-actions").forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "none";
    });
  }, 2200);

  const maxDpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2);

  // ─── High-FPS runner (uncapped = match 60/120Hz display) ─
  const runners = [];

  function createRunner(el, tick, fps, eager) {
    const minDelta = fps > 0 ? 1000 / fps : 0;
    let raf = 0;
    let visible = !!eager;
    let last = 0;
    let lastDraw = 0;
    let laidOut = false;

    const state = {
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
          if (minDelta && now - lastDraw < minDelta - 0.5) return;
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

    // Eager (hero/scope) starts immediately — never die on a zero-size first paint
    if (eager) state.setVisible(true);

    if (el && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        ([entry]) => {
          const rect = entry.boundingClientRect;
          // Skip pre-layout zero-size callbacks (common on desktop)
          if (rect.width < 4 || rect.height < 4) return;
          laidOut = true;
          state.setVisible(!!entry.isIntersecting);
        },
        { rootMargin: "120px 0px", threshold: 0 }
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            io.observe(el);
          } catch (_) {
            state.setVisible(true);
          }
          if (eager && !laidOut) state.setVisible(true);
        });
      });
    } else if (!eager) {
      state.setVisible(true);
    }
    return state;
  }

  document.addEventListener("visibilitychange", () => {
    runners.forEach((r) => (document.hidden ? r.stop() : r.start()));
  });

  const resizeFns = [];
  let resizeT = 0;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => resizeFns.forEach((fn) => fn()), 100);
    },
    { passive: true }
  );
  function onResize(fn) {
    resizeFns.push(fn);
  }

  // ─── Year ───────────────────────────────────────────────
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ─── Boot ───────────────────────────────────────────────
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
        p = Math.min(100, p + Math.random() * 16 + 6);
        if (bootFill) bootFill.style.width = p + "%";
        const nextMsg = Math.floor((p / 100) * (bootMsgs.length - 1));
        if (nextMsg !== msgI && bootStatus) {
          msgI = nextMsg;
          bootStatus.textContent = bootMsgs[msgI];
        }
        if (p < 100) setTimeout(tick, 35);
        else {
          bootStatus && (bootStatus.textContent = bootMsgs[bootMsgs.length - 1]);
          setTimeout(() => {
            boot.classList.add("done");
            resolve();
          }, 160);
        }
      };
      setTimeout(tick, 60);
    });
  }

  // ─── Cursor (desktop only) ──────────────────────────────
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;

  if (isFine && !isCoarse && cursor && ring) {
    document.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        cursor.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;
      },
      { passive: true }
    );
    createRunner(
      document.documentElement,
      () => {
        rx += (mx - rx) * 0.22;
        ry += (my - ry) * 0.22;
        ring.style.transform = `translate3d(${rx}px,${ry}px,0) translate(-50%,-50%)`;
      },
      0,
      true
    );
    document.querySelectorAll("a, button, [data-magnetic], .lab-canvas, .partner-card").forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
    });
  } else {
    cursor?.remove();
    ring?.remove();
  }

  if (isFine && !isCoarse) {
    document.querySelectorAll("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate3d(${(e.clientX - r.left - r.width / 2) * 0.16}px,${(e.clientY - r.top - r.height / 2) * 0.16}px,0)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  // ─── Nav ────────────────────────────────────────────────
  const nav = document.getElementById("nav");
  let navQueued = false;
  window.addEventListener(
    "scroll",
    () => {
      if (navQueued) return;
      navQueued = true;
      requestAnimationFrame(() => {
        nav?.classList.toggle("scrolled", window.scrollY > 30);
        navQueued = false;
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
  document.querySelectorAll(".reveal").forEach((el) => {
    if (!("IntersectionObserver" in window)) {
      el.classList.add("visible");
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      },
      { threshold: 0.01, rootMargin: "40px 0px" }
    );
    io.observe(el);
  });
  // Paint anything already on screen without waiting
  requestAnimationFrame(() => {
    document.querySelectorAll(".reveal").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add("visible");
    });
  });

  // ─── Ticker ─────────────────────────────────────────────
  const ticker = document.getElementById("tickerTrack");
  if (ticker) {
    const items = [
      "ENGINEERING",
      "BEAUTY",
      "PRECISION",
      "SYSTEMS",
      "MOTION",
      "DNA",
      "INTERFACES",
      "CRAFT",
      "VELOCITY",
      "SIGNAL",
    ];
    const html = items.map((t) => `<span>${t}</span><span class="sep">◆</span>`).join("");
    ticker.innerHTML = html + html;
  }

  // ─── Status ─────────────────────────────────────────────
  const typeStatus = document.getElementById("typeStatus");
  const statusLines = ["SYSTEM ARMED", "FIELD ACTIVE", "RENDER LOCKED", "JDE ONLINE"];
  let statusI = 0;
  if (typeStatus && !reduceMotion) {
    typeStatus.style.transition = "opacity 0.2s";
    setInterval(() => {
      statusI = (statusI + 1) % statusLines.length;
      typeStatus.style.opacity = "0";
      setTimeout(() => {
        typeStatus.textContent = statusLines[statusI];
        typeStatus.style.opacity = "1";
      }, 180);
    }, 3600);
  }

  // ─── Title rotator ──────────────────────────────────────
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

  // ─── 3D parallax desktop ────────────────────────────────
  function initScene3d() {
    const stage = document.querySelector(".hero-3d");
    if (!stage || reduceMotion || isCoarse || !isFine) return;
    let tx = 0,
      ty = 0,
      cx = 0,
      cy = 0;
    window.addEventListener(
      "mousemove",
      (e) => {
        tx = (e.clientY / window.innerHeight - 0.5) * -28;
        ty = (e.clientX / window.innerWidth - 0.5) * 40;
      },
      { passive: true }
    );
    createRunner(
      stage,
      () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        stage.style.setProperty("--par-x", cx.toFixed(2) + "deg");
        stage.style.setProperty("--par-y", cy.toFixed(2) + "deg");
      },
      0,
      true
    );
  }

  // ─── Metrics ────────────────────────────────────────────
  document.querySelectorAll("[data-count]").forEach((el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const run = () => {
      if (perfLite) {
        el.textContent = String(target);
        return;
      }
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / 1200);
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
  // HERO field — free drift idle; mouse/touch influence only
  // when intentional (scroll on mobile does NOT attract)
  // ═══════════════════════════════════════════════════════
  function initHeroField() {
    const canvas = document.getElementById("field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    const hudCoords = document.getElementById("hudCoords");
    const hudFps = document.getElementById("hudFps");
    const hudNodes = document.getElementById("hudNodes");
    const hero = canvas.parentElement;
    if (!hero) return;

    let w = 0,
      h = 0,
      dpr = 1,
      nodes = [];
    let frames = 0,
      fpsT = 0;

    // Influence is OFF unless mouse is hovering OR finger is in "play" mode
    const ptr = {
      x: 0,
      y: 0,
      active: false, // drives physics + red accent
      // touch session state
      down: false,
      id: null,
      startX: 0,
      startY: 0,
      startScroll: 0,
      playing: false, // true once we know it's a field drag, not a page scroll
      cancelled: false,
    };

    const spawn = (edge) => {
      let x = Math.random() * w;
      let y = Math.random() * h;
      if (edge === "right") x = w + 8;
      if (edge === "left") x = -8;
      if (edge === "top") y = -8;
      if (edge === "bottom") y = h + 8;
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.4 + 0.55,
        pulse: Math.random() * Math.PI * 2,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(hero.clientWidth || window.innerWidth));
      h = Math.max(1, Math.round(hero.clientHeight || window.innerHeight));
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Same density logic — only rebuild if empty or huge size change
      const density = 3200;
      const count = Math.max(120, Math.min(isMobile ? 200 : 320, ((w * h) / density) | 0));
      if (!nodes.length) {
        nodes = Array.from({ length: count }, () => spawn());
      } else if (Math.abs(nodes.length - count) > 40) {
        // resize existing set without full clump-respawn
        while (nodes.length < count) nodes.push(spawn());
        while (nodes.length > count) nodes.pop();
      }
      if (hudNodes) hudNodes.textContent = `NODES ${nodes.length}`;
    };
    onResize(resize);
    resize();
    requestAnimationFrame(() => requestAnimationFrame(resize));

    const toField = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((clientX - rect.left) / Math.max(1, rect.width)) * w,
        y: ((clientY - rect.top) / Math.max(1, rect.height)) * h,
      };
    };

    const setActiveAt = (clientX, clientY, on) => {
      if (on) {
        const p = toField(clientX, clientY);
        ptr.x = p.x;
        ptr.y = p.y;
        ptr.active = true;
        if (hudCoords) {
          hudCoords.textContent = `X ${((ptr.x / w) * 2 - 1).toFixed(3)} · Y ${((ptr.y / h) * 2 - 1).toFixed(3)}`;
        }
      } else {
        ptr.active = false;
      }
    };

    // ── Mouse = classic desktop hover ─────────────────────
    hero.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse") return;
        setActiveAt(e.clientX, e.clientY, true);
      },
      { passive: true }
    );
    hero.addEventListener(
      "pointerleave",
      (e) => {
        if (e.pointerType === "mouse") ptr.active = false;
      },
      { passive: true }
    );

    // ── Touch / pen: ONLY engage if NOT scrolling the page ─
    // This was the mobile "auto clump" bug: every scroll-touch
    // pulled the whole field to the finger.
    hero.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse") return;
        ptr.down = true;
        ptr.id = e.pointerId;
        ptr.startX = e.clientX;
        ptr.startY = e.clientY;
        ptr.startScroll = window.scrollY || window.pageYOffset || 0;
        ptr.playing = false;
        ptr.cancelled = false;
        ptr.active = false; // stay idle until we know it's a field gesture
      },
      { passive: true }
    );

    hero.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "mouse") return;
        if (!ptr.down || e.pointerId !== ptr.id || ptr.cancelled) return;

        const scrollNow = window.scrollY || window.pageYOffset || 0;
        const scrolled = Math.abs(scrollNow - ptr.startScroll) > 6;
        const dx = e.clientX - ptr.startX;
        const dy = e.clientY - ptr.startY;
        const moved = Math.hypot(dx, dy);

        // Page is scrolling → kill influence immediately (let them scroll)
        if (scrolled) {
          ptr.cancelled = true;
          ptr.playing = false;
          ptr.active = false;
          return;
        }

        // Mostly vertical finger move without scroll yet → treat as scroll intent
        if (!ptr.playing && moved > 10 && Math.abs(dy) > Math.abs(dx) * 1.4) {
          ptr.cancelled = true;
          ptr.active = false;
          return;
        }

        // Horizontal-ish drag, or a held press with small movement → play field
        if (!ptr.playing && moved > 8) {
          ptr.playing = true;
        }
        // Long press in place (no scroll) also plays
        if (!ptr.playing && moved < 8) {
          // activate after brief hold via timestamp check in frame — arm on move anyway for small moves after 120ms
        }

        if (ptr.playing) {
          setActiveAt(e.clientX, e.clientY, true);
        }
      },
      { passive: true }
    );

    // Hold-in-place arming (tap-hold without scroll = interact)
    let holdTimer = 0;
    hero.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse") return;
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => {
          if (ptr.down && !ptr.cancelled && !ptr.playing) {
            const scrollNow = window.scrollY || window.pageYOffset || 0;
            if (Math.abs(scrollNow - ptr.startScroll) <= 6) {
              ptr.playing = true;
              setActiveAt(ptr.startX, ptr.startY, true);
            }
          }
        }, 140);
      },
      { passive: true }
    );

    const endPointer = (e) => {
      if (e.pointerType === "mouse") return;
      if (ptr.id != null && e.pointerId !== ptr.id) return;
      clearTimeout(holdTimer);
      ptr.down = false;
      ptr.id = null;
      ptr.playing = false;
      ptr.cancelled = false;
      ptr.active = false;
    };
    hero.addEventListener("pointerup", endPointer, { passive: true });
    hero.addEventListener("pointercancel", endPointer, { passive: true });

    // If user scrolls the page by any means while finger is down, kill influence
    window.addEventListener(
      "scroll",
      () => {
        if (ptr.down) {
          ptr.cancelled = true;
          ptr.playing = false;
          ptr.active = false;
        }
      },
      { passive: true }
    );

    createRunner(
      canvas,
      (now, dt) => {
        if (w < 2 || h < 2) {
          resize();
          return;
        }

        // Clamp dt so a tab-switch / jank frame never flings nodes into a clump
        const step = Math.min(dt, 1.5);

        frames++;
        if (now - fpsT > 400) {
          if (hudFps) hudFps.textContent = `${Math.round((frames * 1000) / (now - fpsT))} FPS`;
          frames = 0;
          fpsT = now;
        }

        ctx.clearRect(0, 0, w, h);

        const nLen = nodes.length;
        const attractR = 185;
        const linkDist = Math.max(100, Math.min(w, h) * 0.13);
        const redR = 165;
        const redLim = redR * redR;
        const lim = linkDist * linkDist;

        if (ptr.active) {
          const g = ctx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, 190);
          g.addColorStop(0, "rgba(225,6,0,0.14)");
          g.addColorStop(0.5, "rgba(225,6,0,0.04)");
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }

        // ── Physics: free drift unless ptr.active ─────────
        for (let i = 0; i < nLen; i++) {
          const n = nodes[i];

          if (ptr.active) {
            const dx = ptr.x - n.x;
            const dy = ptr.y - n.y;
            const dist = Math.hypot(dx, dy) || 1;
            if (dist < attractR) {
              // Same force curve as classic desktop field
              const f = (1 - dist / attractR) * 0.095;
              n.vx += (dx / dist) * f * step;
              n.vy += (dy / dist) * f * step;
            }
          }

          // Stronger damping when idle so the field settles open (no residual swirl)
          n.vx *= ptr.active ? 0.99 : 0.985;
          n.vy *= ptr.active ? 0.99 : 0.985;

          // Cap speed — prevents orbital clumping after a strong pull
          const sp = Math.hypot(n.vx, n.vy);
          const maxSp = ptr.active ? 2.8 : 1.2;
          if (sp > maxSp) {
            n.vx = (n.vx / sp) * maxSp;
            n.vy = (n.vy / sp) * maxSp;
          }

          n.x += n.vx * step * 1.2;
          n.y += n.vy * step * 1.2;
          n.pulse += 0.03 * step;

          // Edge bounce (not wrap, not center-pull) — keeps distribution open
          if (n.x < 0) {
            n.x = 0;
            n.vx = Math.abs(n.vx) * 0.8;
          } else if (n.x > w) {
            n.x = w;
            n.vx = -Math.abs(n.vx) * 0.8;
          }
          if (n.y < 0) {
            n.y = 0;
            n.vy = Math.abs(n.vy) * 0.8;
          } else if (n.y > h) {
            n.y = h;
            n.vy = -Math.abs(n.vy) * 0.8;
          }
        }

        // ── Links ─────────────────────────────────────────
        const cell = linkDist;
        const grid = new Map();
        const key = (cx, cy) => cx + "," + cy;
        for (let i = 0; i < nLen; i++) {
          const n = nodes[i];
          const k = key((n.x / cell) | 0, (n.y / cell) | 0);
          let b = grid.get(k);
          if (!b) {
            b = [];
            grid.set(k, b);
          }
          b.push(i);
        }

        ctx.lineCap = "round";
        for (let i = 0; i < nLen; i++) {
          const a = nodes[i];
          const cxi = (a.x / cell) | 0;
          const cyi = (a.y / cell) | 0;
          for (let ox = -1; ox <= 1; ox++) {
            for (let oy = -1; oy <= 1; oy++) {
              const bucket = grid.get(key(cxi + ox, cyi + oy));
              if (!bucket) continue;
              for (let bi = 0; bi < bucket.length; bi++) {
                const j = bucket[bi];
                if (j <= i) continue;
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d2 = dx * dx + dy * dy;
                if (d2 >= lim || d2 < 0.5) continue;
                const d = Math.sqrt(d2);
                const alpha = (1 - d / linkDist) * 0.36;

                let hot = false;
                if (ptr.active) {
                  const mx = (a.x + b.x) * 0.5 - ptr.x;
                  const my = (a.y + b.y) * 0.5 - ptr.y;
                  const da = a.x - ptr.x;
                  const db = a.y - ptr.y;
                  const dc = b.x - ptr.x;
                  const dd = b.y - ptr.y;
                  hot =
                    mx * mx + my * my < redLim ||
                    da * da + db * db < redLim * 0.65 ||
                    dc * dc + dd * dd < redLim * 0.65;
                }

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                if (hot) {
                  ctx.strokeStyle = `rgba(225,6,0,${Math.min(0.95, alpha * 2.4)})`;
                  ctx.lineWidth = 1.2;
                } else {
                  ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
                  ctx.lineWidth = 0.65;
                }
                ctx.stroke();
              }
            }
          }
        }

        // ── Nodes ─────────────────────────────────────────
        for (let i = 0; i < nLen; i++) {
          const n = nodes[i];
          const glow = 0.48 + Math.sin(n.pulse) * 0.22;
          const near = ptr.active && Math.hypot(n.x - ptr.x, n.y - ptr.y) < 95;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r * (near ? 1.9 : 1), 0, Math.PI * 2);
          ctx.fillStyle = near ? `rgba(225,6,0,${glow})` : `${WHITE}${glow})`;
          ctx.fill();
          if (near) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, n.r * 3.4, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(225,6,0,0.12)";
            ctx.fill();
          }
        }

        if (ptr.active) {
          ctx.strokeStyle = "rgba(225,6,0,0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ptr.x - 14, ptr.y);
          ctx.lineTo(ptr.x + 14, ptr.y);
          ctx.moveTo(ptr.x, ptr.y - 14);
          ctx.lineTo(ptr.x, ptr.y + 14);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(ptr.x, ptr.y, 24, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(225,6,0,0.28)";
          ctx.stroke();
        }
      },
      0,
      true
    );
  }

  // ═══════════════════════════════════════════════════════
  // Oscilloscope + wave mode buttons
  // ═══════════════════════════════════════════════════════
  function initScope() {
    const canvas = document.getElementById("scope");
    const hzEl = document.getElementById("scopeHz");
    const modeLabel = document.getElementById("scopeModeLabel");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    let w = 0,
      h = 80,
      bufW = 0,
      bufH = 0;
    let t0 = performance.now();
    let waveMode = "sine";
    let targetHz = 440;
    let displayHz = 440;

    const setMode = (mode, hz) => {
      waveMode = mode;
      targetHz = hz;
      document.querySelectorAll(".wave-btn").forEach((btn) => {
        const active =
          btn.dataset.wave === mode && String(btn.dataset.hz) === String(hz);
        btn.classList.toggle("is-active", active);
      });
      if (modeLabel) {
        if (mode === "heartbeat") modeLabel.textContent = "ECG · HEARTBEAT";
        else if (mode === "pulse") modeLabel.textContent = "PULSE TRAIN";
        else modeLabel.textContent = `SINE · ${hz}`;
      }
    };

    document.querySelectorAll(".wave-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        setMode(btn.dataset.wave || "sine", parseFloat(btn.dataset.hz) || 440);
      });
    });
    setMode("sine", 440);

    const resize = () => {
      // Integer CSS size + integer buffer — kills subpixel shimmer
      const cssW = Math.max(
        1,
        Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth)
      );
      const cssH = isMobile ? 64 : 80;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.max(1, Math.round(cssW * dpr));
      const nextH = Math.max(1, Math.round(cssH * dpr));
      if (nextW === bufW && nextH === bufH && w === cssW) return;
      bufW = nextW;
      bufH = nextH;
      w = cssW;
      h = cssH;
      canvas.width = bufW;
      canvas.height = bufH;
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
    };
    onResize(resize);
    resize();

    function heartbeatY(phase) {
      const p = ((phase % 1) + 1) % 1;
      if (p < 0.12) return Math.sin((p / 0.12) * Math.PI) * 0.18;
      if (p < 0.16) return -0.15 * ((p - 0.12) / 0.04);
      if (p < 0.2) return -0.15 + 1.15 * ((p - 0.16) / 0.04);
      if (p < 0.24) return 1.0 - 1.35 * ((p - 0.2) / 0.04);
      if (p < 0.32) return -0.2 * (1 - (p - 0.24) / 0.08);
      if (p < 0.48) return Math.sin(((p - 0.32) / 0.16) * Math.PI) * 0.28;
      return 0;
    }

    function sample(n, time, hz) {
      if (waveMode === "heartbeat") {
        const beatsPerSec = hz / 60;
        return heartbeatY(time * beatsPerSec + n * 0.15) * 0.95;
      }
      if (waveMode === "pulse") {
        const phase = (time * (hz / 60) + n * 4) % 1;
        if (phase < 0.12) return 0.9;
        if (phase < 0.18) return -0.25;
        return 0;
      }
      const cycles = 2 + (hz / 440) * 4;
      return Math.sin(n * Math.PI * 2 * cycles + time * (2 + hz / 200));
    }

    createRunner(
      canvas,
      (now) => {
        if (w < 2) resize();
        // Clock-stable phase — no dt jitter shimmer
        const t = (now - t0) * 0.001;
        displayHz += (targetHz - displayHz) * 0.1;
        if (hzEl) {
          if (waveMode === "heartbeat") hzEl.textContent = `${Math.round(displayHz)} BPM`;
          else if (waveMode === "pulse") hzEl.textContent = `${Math.round(displayHz)} PPM`;
          else hzEl.textContent = `${displayHz.toFixed(1)} Hz`;
        }

        ctx.fillStyle = "#070707";
        ctx.fillRect(0, 0, w, h);

        // Pixel-aligned baseline
        const mid = Math.floor(h / 2) + 0.5;
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(w, mid);
        ctx.stroke();

        // Dense samples, no shadowBlur (shadow was the main glow glitch)
        const amp = h * 0.3;
        const step = 1;
        ctx.beginPath();
        for (let x = 0; x <= w; x += step) {
          const n = x / Math.max(1, w);
          const y = mid - sample(n, t, displayHz) * amp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = waveMode === "heartbeat" ? "#ff4d6d" : RED;
        ctx.lineWidth = 1.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.shadowBlur = 0;
        ctx.stroke();
      },
      0,
      true
    );
  }

  // ═══════════════════════════════════════════════════════
  // Vector field
  // ═══════════════════════════════════════════════════════
  function initVectors() {
    const canvas = document.getElementById("vectors");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, });
    let w = 0,
      h = 0;
    let ptr = { x: 0, y: 0, on: false };
    const particles = [];

    const resize = () => {
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = (w * dpr) | 0;
      canvas.height = (h * dpr) | 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;
      const dens = perfLite ? 14000 : 7500;
      const maxP = perfLite ? 32 : 75;
      const n = Math.max(14, Math.min(maxP, ((w * h) / dens) | 0));
      for (let i = 0; i < n; i++) {
        particles.push({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 });
      }
    };
    onResize(resize);
    new ResizeObserver(resize).observe(canvas);
    resize();

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
        setTimeout(() => (ptr.on = false), 700);
      },
      { passive: true }
    );

    createRunner(canvas, () => {
      ctx.fillStyle = perfLite ? "#000" : "rgba(0,0,0,0.2)";
      ctx.fillRect(0, 0, w, h);
      const t = performance.now() * 0.0004;
      const cell = perfLite ? 36 : 28;
      const cols = (w / cell) | 0;
      const rows = (h / cell) | 0;

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
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(angle) * 7, y + Math.sin(angle) * 7);
          ctx.strokeStyle = "rgba(255,255,255,0.12)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      for (const p of particles) {
        const angle = Math.sin(p.x * 0.01 + t) * Math.cos(p.y * 0.012 - t) * Math.PI;
        if (ptr.on) {
          const dx = ptr.x - p.x;
          const dy = ptr.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 160) {
            p.vx += (dx / d) * 0.32;
            p.vy += (dy / d) * 0.32;
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
    }, 0);
  }

  // ═══════════════════════════════════════════════════════
  // Wireframe
  // ═══════════════════════════════════════════════════════
  function initWireframe() {
    const canvas = document.getElementById("wireframe");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, });
    let w = 0,
      h = 0,
      rotX = 0.4,
      rotY = 0.3,
      auto = true;
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
    const sc = 1 / Math.hypot(...raw[0]);
    const verts = raw.map((v) => v.map((n) => n * sc));
    const edges = [];
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        if (
          Math.hypot(
            verts[i][0] - verts[j][0],
            verts[i][1] - verts[j][1],
            verts[i][2] - verts[j][2]
          ) < 1.1
        )
          edges.push([i, j]);
      }
    }

    const resize = () => {
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = (w * dpr) | 0;
      canvas.height = (h * dpr) | 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize(resize);
    new ResizeObserver(resize).observe(canvas);
    resize();

    const aim = (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      targetRot.y = ((cx - r.left) / r.width - 0.5) * Math.PI;
      targetRot.x = ((cy - r.top) / r.height - 0.5) * Math.PI;
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
          setTimeout(() => (auto = true), 1400);
        }
      },
      { passive: true }
    );

    // Drag rotate
    let dragging = false;
    let lastX = 0,
      lastY = 0;
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      auto = false;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      rotY += (e.clientX - lastX) * 0.01;
      rotX += (e.clientY - lastY) * 0.01;
      lastX = e.clientX;
      lastY = e.clientY;
    });
    canvas.addEventListener("pointerup", () => {
      dragging = false;
      setTimeout(() => (auto = true), 800);
    });

    function project(v) {
      let [x, y, z] = v;
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = y1;
      z = z1;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      const s = (Math.min(w, h) * 0.32) / (2.8 + z1);
      return { x: w / 2 + x1 * s, y: h / 2 + y * s, z: z1 };
    }

    createRunner(canvas, () => {
      if (auto) {
        rotY += 0.01;
        rotX += 0.004;
      } else if (!dragging) {
        rotX += (targetRot.x - rotX) * 0.08;
        rotY += (targetRot.y - rotY) * 0.08;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const projected = verts.map(project);
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
        ctx.fillStyle = p.z < 0.15 ? RED : "rgba(255,255,255,0.85)";
        ctx.fill();
      }
    }, 0);
  }

  // ═══════════════════════════════════════════════════════
  // Lattice
  // ═══════════════════════════════════════════════════════
  function initLattice() {
    const canvas = document.getElementById("lattice");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false, });
    let w = 0,
      h = 0,
      rotX = 0.5,
      rotY = 0.3,
      auto = true;
    let target = { x: 0.5, y: 0.3 };
    const N = perfLite ? 4 : 5;
    const points = [];
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N; y++)
        for (let z = 0; z < N; z++)
          points.push({
            x: (x / (N - 1) - 0.5) * 2,
            y: (y / (N - 1) - 0.5) * 2,
            z: (z / (N - 1) - 0.5) * 2,
          });

    const resize = () => {
      const dpr = maxDpr;
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height || 240;
      canvas.width = (w * dpr) | 0;
      canvas.height = (h * dpr) | 0;
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
      const s = (Math.min(w, h) * 0.38) / (3.2 + z1);
      return { x: w / 2 + x1 * s, y: h / 2 + y * s, z: z1 };
    }

    createRunner(canvas, () => {
      if (auto) {
        rotY += 0.008;
        rotX = 0.45 + Math.sin(performance.now() * 0.0004) * 0.2;
      } else {
        rotX += (target.x - rotX) * 0.08;
        rotY += (target.y - rotY) * 0.08;
      }
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      const projected = points.map(project).sort((a, b) => b.z - a.z);
      const linkMax = perfLite ? 30 : 38;
      const stride = perfLite ? 2 : 1;
      for (let i = 0; i < projected.length; i += stride) {
        for (let j = i + 1; j < projected.length; j += stride) {
          const a = projected[i],
            b = projected[j];
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
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.2, 3 - p.z * 1.1), 0, Math.PI * 2);
        ctx.fillStyle = p.z < 0 ? RED : "rgba(255,255,255,0.85)";
        ctx.fill();
      }
    }, 0);
  }

  // ═══════════════════════════════════════════════════════
  // DNA double helix (interactive 3D)
  // ═══════════════════════════════════════════════════════
  function initDNA() {
    const canvas = document.getElementById("dna");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    let w = 0,
      h = 0,
      bufW = 0,
      bufH = 0;
    let rotY = 0.4;
    let rotX = 0.25;
    let auto = true;
    let dragging = false;
    let lastPX = 0,
      lastPY = 0;
    let target = { x: 0.25, y: 0.4 };
    let spinT0 = performance.now();

    const pairs = isMobile ? 20 : 28;
    const radius = 1.0;
    const height = 4.2;
    const twist = Math.PI * 2.4;

    const pairColors = [
      ["#e10600", "#f0f0f0"],
      ["#c084fc", "#4ade80"],
      ["#60a5fa", "#fbbf24"],
      ["#fb7185", "#a3e635"],
    ];

    // Half-pixel snap reduces crawl/shimmer on rotating lines
    const snap = (v) => Math.round(v * 2) / 2;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height || 280));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.max(1, Math.round(cssW * dpr));
      const nextH = Math.max(1, Math.round(cssH * dpr));
      // Only reallocate when size actually changes (ResizeObserver thrash = flicker)
      if (nextW === bufW && nextH === bufH && w === cssW && h === cssH) return;
      bufW = nextW;
      bufH = nextH;
      w = cssW;
      h = cssH;
      canvas.width = bufW;
      canvas.height = bufH;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };
    onResize(resize);
    let roT = 0;
    new ResizeObserver(() => {
      clearTimeout(roT);
      roT = setTimeout(resize, 50);
    }).observe(canvas);
    resize();

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", (e) => {
      dragging = true;
      auto = false;
      lastPX = e.clientX;
      lastPY = e.clientY;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) {
        if (isFine) {
          const r = canvas.getBoundingClientRect();
          target.y = ((e.clientX - r.left) / r.width - 0.5) * 1.2;
          target.x = ((e.clientY - r.top) / r.height - 0.5) * 0.8;
          auto = false;
        }
        return;
      }
      rotY += (e.clientX - lastPX) * 0.012;
      rotX += (e.clientY - lastPY) * 0.01;
      rotX = Math.max(-1.1, Math.min(1.1, rotX));
      lastPX = e.clientX;
      lastPY = e.clientY;
    });
    const endDrag = () => {
      dragging = false;
      spinT0 = performance.now();
      setTimeout(() => {
        if (!dragging) auto = true;
      }, 900);
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", () => {
      if (!dragging) auto = true;
    });

    function rotProject(x, y, z) {
      let y1 = y * Math.cos(rotX) - z * Math.sin(rotX);
      let z1 = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = y1;
      z = z1;
      let x1 = x * Math.cos(rotY) + z * Math.sin(rotY);
      z1 = -x * Math.sin(rotY) + z * Math.cos(rotY);
      const s = (Math.min(w, h) * 0.42) / (3.4 + z1);
      return {
        x: snap(w / 2 + x1 * s),
        y: snap(h / 2 + y * s),
        z: z1,
      };
    }

    createRunner(canvas, (now) => {
      if (w < 2) resize();

      if (auto) {
        // Time-based spin — stable, no per-frame float crawl from dt noise
        const elapsed = (now - spinT0) * 0.001;
        rotY = 0.4 + elapsed * 0.55;
        rotX = 0.22 + Math.sin(elapsed * 0.45) * 0.1;
      } else if (!dragging) {
        rotX += (target.x - rotX) * 0.06;
        rotY += (target.y - rotY) * 0.06;
      }

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      const backboneA = [];
      const backboneB = [];
      const rungs = [];

      for (let i = 0; i < pairs; i++) {
        const u = i / (pairs - 1);
        // Twist only — no extra rotY on angle (that double-rotated and shimmered)
        const angle = u * twist;
        const y = (u - 0.5) * height;
        const ax = Math.cos(angle) * radius;
        const az = Math.sin(angle) * radius;
        const bx = Math.cos(angle + Math.PI) * radius;
        const bz = Math.sin(angle + Math.PI) * radius;
        const pa = rotProject(ax, y, az);
        const pb = rotProject(bx, y, bz);
        backboneA.push(pa);
        backboneB.push(pb);
        rungs.push({ a: pa, b: pb, colors: pairColors[i % pairColors.length], z: (pa.z + pb.z) * 0.5 });
      }

      rungs.sort((u, v) => u.z - v.z);

      // Backbones first (stable solid strokes, no per-vertex alpha)
      const drawBackbone = (pts, color, width) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke();
      };
      drawBackbone(backboneA, "rgba(225,6,0,0.9)", isMobile ? 2.2 : 2.6);
      drawBackbone(backboneB, "rgba(240,240,240,0.82)", isMobile ? 2.2 : 2.6);

      // Rungs — fixed alpha bands instead of globalAlpha thrash
      for (const r of rungs) {
        const near = r.z < 0.15;
        const midX = snap((r.a.x + r.b.x) * 0.5);
        const midY = snap((r.a.y + r.b.y) * 0.5);
        ctx.lineWidth = near ? 2.2 : 1.6;
        ctx.globalAlpha = near ? 1 : 0.72;
        ctx.beginPath();
        ctx.moveTo(r.a.x, r.a.y);
        ctx.lineTo(midX, midY);
        ctx.strokeStyle = r.colors[0];
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(r.b.x, r.b.y);
        ctx.strokeStyle = r.colors[1];
        ctx.stroke();
        const br = near ? 2.4 : 2;
        ctx.beginPath();
        ctx.arc(r.a.x, r.a.y, br, 0, Math.PI * 2);
        ctx.fillStyle = r.colors[0];
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r.b.x, r.b.y, br, 0, Math.PI * 2);
        ctx.fillStyle = r.colors[1];
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = "10px IBM Plex Mono, monospace";
      ctx.fillStyle = "rgba(245,245,245,0.3)";
      ctx.fillText(dragging ? "ROTATING" : "DRAG TO ROTATE", 12, h - 12);
    }, 0);
  }

  // ═══════════════════════════════════════════════════════
  // Chronograph
  // ═══════════════════════════════════════════════════════
  function initChrono() {
    const canvas = document.getElementById("clock");
    const utcEl = document.getElementById("utcTime");
    const deltaEl = document.getElementById("frameDelta");
    const sessionEl = document.getElementById("sessionTime");
    const renderEl = document.getElementById("renderPath");
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, });
    const size = 280;
    let lastFrame = performance.now();
    const dpr = maxDpr;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = "min(280px, 70vw)";
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (renderEl) renderEl.textContent = "RAF · UNCAPPED";

    createRunner(
      canvas,
      () => {
        const now = new Date();
        const ms = now.getMilliseconds();
        const s = now.getSeconds() + ms / 1000;
        const m = now.getMinutes() + s / 60;
        const hr = (now.getHours() % 12) + m / 60;
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
        hand((hr / 12) * Math.PI * 2, 55, 2.5, "#f5f5f5");
        hand((m / 60) * Math.PI * 2, 80, 1.8, "#f5f5f5");
        hand((s / 60) * Math.PI * 2, 95, 1, RED);

        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = RED;
        ctx.fill();

        if (utcEl) utcEl.textContent = now.toISOString().slice(11, 23);
        const frameNow = performance.now();
        if (deltaEl) deltaEl.textContent = (frameNow - lastFrame).toFixed(2) + " ms";
        lastFrame = frameNow;
        if (sessionEl) {
          const sec = (frameNow - sessionStart) / 1000 | 0;
          const hh = String((sec / 3600) | 0).padStart(2, "0");
          const mm = String(((sec % 3600) / 60) | 0).padStart(2, "0");
          const ss = String(sec % 60).padStart(2, "0");
          sessionEl.textContent = `${hh}:${mm}:${ss}`;
        }
      },
      0
    );
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
    initDNA();
    initChrono();
  });
})();
