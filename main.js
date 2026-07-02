/* Bryan Mejia — portfolio v2 interactions
   Kinetic Brutalist Editorial. All vanilla:
   - per-letter variable-font distortion (cursor proximity + scroll squeeze)
   - text scramble (hover + section-title reveal)
   - scroll-velocity-reactive marquee
   - cursor-following project peek card
   - custom difference-blend cursor + magnetic buttons
   - accordion rows, count-up stats, live NYC clock, staggered reveals */

(() => {
  "use strict";

  const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  let mx = -1000, my = -1000;
  window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  /* ---------- live NYC clock ---------- */
  const clockEls = [document.getElementById("clock"), document.getElementById("clock2")].filter(Boolean);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const tickClock = () => {
    const t = fmt.format(new Date());
    clockEls.forEach((el) => { el.textContent = `${t} NYC`; });
  };
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- custom cursor ---------- */
  const cursor = document.getElementById("cursor");
  const cursorLabel = document.getElementById("cursorLabel");
  if (fine && !rm && cursor) {
    document.body.classList.add("has-cursor");
    let cx = -100, cy = -100;
    const LABELS = { open: "OPEN +", view: "VIEW ↗", mail: "SAY HI", "": "" };
    const loop = () => {
      cx = lerp(cx, mx, 0.22);
      cy = lerp(cy, my, 0.22);
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.querySelectorAll("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => {
        cursor.classList.add("grow");
        cursorLabel.textContent = LABELS[el.dataset.cursor] || "";
      });
      el.addEventListener("pointerleave", () => {
        cursor.classList.remove("grow");
        cursorLabel.textContent = "";
      });
    });
  }

  /* ---------- kinetic hero letters ---------- */
  const letters = [...document.querySelectorAll("[data-kinetic] .k")].map((el) => ({
    el, wght: 800, wdth: 100,
  }));
  if (letters.length && !rm) {
    const hero = document.getElementById("hero");
    let heroVisible = true;
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
    const RADIUS = 260;
    const kLoop = () => {
      if (heroVisible) {
        const squeeze = Math.min(window.scrollY / Math.max(hero.offsetHeight, 1), 1);
        for (const l of letters) {
          const r = l.el.getBoundingClientRect();
          const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
          const f = Math.max(0, 1 - d / RADIUS);
          const tw = 500 + f * 400 - squeeze * 300;   // wght 500→900 near cursor, thins on scroll
          const tx = 78 + f * 47 - squeeze * 16;      // wdth 78→125 near cursor, narrows on scroll
          l.wght = lerp(l.wght, Math.max(100, Math.min(900, tw)), 0.14);
          l.wdth = lerp(l.wdth, Math.max(62, Math.min(125, tx)), 0.14);
          l.el.style.fontVariationSettings = `"wght" ${l.wght.toFixed(1)}, "wdth" ${l.wdth.toFixed(1)}`;
        }
      }
      requestAnimationFrame(kLoop);
    };
    requestAnimationFrame(kLoop);
  }

  /* ---------- text scramble ---------- */
  const GLYPHS = "█▓▒░<>/{}[]=+*#@%&";
  const scramble = (el, dur = 550) => {
    if (rm) return;
    if (!el.dataset.text) el.dataset.text = el.textContent;
    const text = el.dataset.text;
    if (el._scrambling) return;
    el._scrambling = true;
    const t0 = performance.now();
    const frame = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const solid = Math.floor(text.length * p);
      let out = text.slice(0, solid);
      for (let i = solid; i < text.length; i++) {
        out += text[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = text; el._scrambling = false; }
    };
    requestAnimationFrame(frame);
  };
  document.querySelectorAll("[data-scramble]").forEach((el) => {
    el.addEventListener("pointerenter", () => scramble(el));
  });

  /* ---------- marquee (scroll-velocity reactive) ---------- */
  const marquee = document.getElementById("marquee");
  if (marquee && !rm) {
    let x = 0, vel = 0, lastY = window.scrollY;
    const half = () => marquee.scrollWidth / 2;
    const mLoop = () => {
      const y = window.scrollY;
      vel = lerp(vel, (y - lastY) * 0.35, 0.1);
      lastY = y;
      x -= 1.0 + Math.abs(vel);            // base drift + scroll energy
      if (vel < -0.5) x += Math.abs(vel) * 2; // scrolling up reverses push
      const h = half();
      if (x <= -h) x += h;
      if (x > 0) x -= h;
      marquee.style.transform = `translateX(${x.toFixed(2)}px)`;
      requestAnimationFrame(mLoop);
    };
    requestAnimationFrame(mLoop);
  }

  /* ---------- magnetic elements ---------- */
  if (fine && !rm) {
    document.querySelectorAll("[data-magnet]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 400);
      });
    });
  }

  /* ---------- accordion rows (work + projects) ---------- */
  document.querySelectorAll(".xrow-head, .prow-head").forEach((head) => {
    head.addEventListener("click", () => {
      const open = head.getAttribute("aria-expanded") === "true";
      head.setAttribute("aria-expanded", String(!open));
    });
  });

  /* ---------- cursor-following peek card ---------- */
  const peek = document.getElementById("peek");
  if (peek && fine && !rm) {
    const title = document.getElementById("peekTitle");
    const desc = document.getElementById("peekDesc");
    const tags = document.getElementById("peekTags");
    let px = 0, py = 0, showing = false;
    const pLoop = () => {
      if (showing) {
        px = lerp(px, mx + 28, 0.16);
        py = lerp(py, my + 22, 0.16);
        const w = peek.offsetWidth, h = peek.offsetHeight;
        const fx = Math.min(px, window.innerWidth - w - 16);
        const fy = Math.min(py, window.innerHeight - h - 16);
        peek.style.transform = `translate(${fx}px, ${fy}px)`;
      }
      requestAnimationFrame(pLoop);
    };
    requestAnimationFrame(pLoop);
    document.querySelectorAll(".prow").forEach((row) => {
      row.addEventListener("pointerenter", () => {
        // suppress the card once the row is expanded — the detail is already on screen
        if (row.querySelector(".prow-head").getAttribute("aria-expanded") === "true") return;
        title.textContent = row.dataset.peekTitle;
        desc.textContent = row.dataset.peekDesc;
        tags.textContent = row.dataset.peekTags;
        px = mx + 28; py = my + 22;
        showing = true;
        peek.classList.add("show");
      });
      row.addEventListener("pointerleave", () => {
        showing = false;
        peek.classList.remove("show");
      });
      row.addEventListener("click", () => {
        showing = false;
        peek.classList.remove("show");
      });
    });
  }

  /* ---------- count-up stats ---------- */
  const stats = document.querySelectorAll(".stat-n");
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (rm) { el.textContent = `${prefix}${target}${suffix}`; return; }
    const dur = 1200, t0 = performance.now();
    const frame = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const statIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { runCount(e.target); statIO.unobserve(e.target); }
    }
  }, { threshold: 0.4 });
  stats.forEach((el) => statIO.observe(el));

  /* ---------- staggered reveals + scramble section titles ---------- */
  const reveals = document.querySelectorAll(".r");
  if (rm) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const groups = new Map();
    reveals.forEach((el) => {
      const key = el.closest("section") || document.body;
      const n = groups.get(key) || 0;
      el.style.setProperty("--d", `${n * 0.07}s`);
      groups.set(key, n + 1);
    });
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          const h = e.target.querySelector("[data-scramble-reveal]");
          if (h) scramble(h, 700);
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
