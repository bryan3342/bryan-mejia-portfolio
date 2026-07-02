/* Bryan Mejia — portfolio interactions
   All dynamism is client-side: neural-network hero canvas, typed role
   rotation, scroll reveals, count-up stats, cursor-tracked card glow. */

(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- neural network canvas ---------- */
  const canvas = document.getElementById("net");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const LINK_DIST = 130;
    const POINTER_DIST = 200;
    let nodes = [];
    let w = 0, h = 0;
    let pointer = { x: -9999, y: -9999 };
    let raf = null;

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const target = Math.min(90, Math.floor((w * h) / 16000));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.6,
      }));
    };

    const step = () => {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.strokeStyle = `rgba(255, 180, 84, ${0.14 * (1 - d / LINK_DIST)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (pd < POINTER_DIST) {
          ctx.strokeStyle = `rgba(255, 180, 84, ${0.3 * (1 - pd / POINTER_DIST)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(233, 236, 241, 0.55)";
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(step);
    };

    const hero = canvas.parentElement;
    hero.addEventListener("pointermove", (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    });
    hero.addEventListener("pointerleave", () => {
      pointer.x = pointer.y = -9999;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        raf = requestAnimationFrame(step);
      }
    });

    window.addEventListener("resize", resize);
    resize();
    raf = requestAnimationFrame(step);
  }

  /* ---------- typed role rotation ---------- */
  const typedEl = document.getElementById("typed");
  if (typedEl) {
    const phrases = [
      "memory for AI agents.",
      "agentic infrastructure.",
      "multi-agent systems.",
      "cloud-native platforms.",
      "systems that remember.",
    ];
    if (reducedMotion) {
      typedEl.textContent = phrases[0];
    } else {
      let pi = 0, ci = phrases[0].length, deleting = false;
      const tick = () => {
        const phrase = phrases[pi];
        if (deleting) {
          ci--;
          if (ci === 0) {
            deleting = false;
            pi = (pi + 1) % phrases.length;
          }
        } else {
          ci++;
          if (ci === phrase.length) {
            deleting = true;
            typedEl.textContent = phrase;
            setTimeout(tick, 2200);
            return;
          }
        }
        typedEl.textContent = (deleting ? phrase : phrases[pi]).slice(0, ci);
        setTimeout(tick, deleting ? 32 : 58);
      };
      setTimeout(tick, 2200);
    }
  }

  /* ---------- scroll reveals (staggered per section) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if (reducedMotion) {
    reveals.forEach((el) => el.classList.add("in"));
  } else {
    const groups = new Map();
    reveals.forEach((el) => {
      const key = el.closest("section") || document.body;
      if (!groups.has(key)) groups.set(key, 0);
      el.style.setProperty("--d", `${groups.get(key) * 0.08}s`);
      groups.set(key, groups.get(key) + 1);
    });
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- count-up stats ---------- */
  const stats = document.querySelectorAll(".stat-num");
  const runCount = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    if (reducedMotion) {
      el.textContent = `${prefix}${target}${suffix}`;
      return;
    }
    const dur = 1400;
    const t0 = performance.now();
    const frame = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };
  const statIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          runCount(e.target);
          statIO.unobserve(e.target);
        }
      }
    },
    { threshold: 0.4 }
  );
  stats.forEach((el) => statIO.observe(el));

  /* ---------- cursor-tracked card glow + tilt ---------- */
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      if (reducedMotion) return;
      const rx = ((y / rect.height) - 0.5) * -4;
      const ry = ((x / rect.width) - 0.5) * 4;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });

  /* ---------- nav: scrolled state, active section, mobile menu ---------- */
  const nav = document.getElementById("nav");
  const progress = document.getElementById("progress");
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 24);
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const navLinks = document.querySelectorAll(".nav-links a[data-section]");
  const sectionIO = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.dataset.section === e.target.id)
          );
        }
      }
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => sectionIO.observe(s));

  const toggle = document.getElementById("navToggle");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
