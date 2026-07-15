/* ============================================================
   Bryan Mejia; Portfolio v4.2 "SUNSET OVER NEW YORK"
   4K video hero (1080p fallback chain), light scroll handler
   (nav + scrollspy only), reveals, counters, skill bars,
   accordions, quick menu, NYC clock.
   ============================================================ */

(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- toast ---------- */
  const toastEl = document.getElementById("toast");
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2800);
  }

  /* ---------- hero video: 1080p default, 720p on small/data-saver ---------- */
  const hero = document.getElementById("hero");
  const video = document.getElementById("hero-video");
  const videoToggle = document.getElementById("video-toggle");

  // markup default is the 1.4MB 1080p loop; a poster paints instantly while it
  // buffers. Downgrade to the 0.6MB 720p file on small screens or data saver.
  const saveData = navigator.connection && navigator.connection.saveData;
  if (window.innerWidth < 1100 || saveData) {
    video.src = "assets/nyc-sunset-720.mp4";
  }

  video.addEventListener("error", () => {
    // fall back down the quality chain before giving up on the video
    if (video.currentSrc && video.currentSrc.includes("1080")) {
      video.src = "assets/nyc-sunset-720.mp4";
      tryPlay();
    } else {
      hero.classList.add("no-video");
    }
  });

  // Label follows real playback state, so the button can never contradict the
  // video: a rejected play() used to leave it reading "pause" while paused,
  // which made the first click a no-op.
  const syncToggle = () => {
    const playing = !video.paused;
    videoToggle.textContent = playing ? "⏸" : "▶";
    videoToggle.setAttribute("aria-label", playing ? "Pause background video" : "Play background video");
  };
  video.addEventListener("play", syncToggle);
  video.addEventListener("pause", syncToggle);

  // Browsers exempt muted inline video from the autoplay block, but still
  // refuse while the tab is hidden or the device is in low-power mode. Those
  // conditions lift later, so retry on the events that lift them instead of
  // treating the first rejection as final.
  let userPaused = false;
  function tryPlay() {
    if (userPaused) return;
    const p = video.play();
    if (p) p.catch(() => {});
  }

  video.muted = true;       // both re-asserted because swapping .src above
  video.playsInline = true; // reloads the element
  tryPlay();
  video.addEventListener("canplay", tryPlay);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tryPlay();
  });
  // Last resort: any gesture satisfies even the strictest autoplay policy.
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((evt) =>
    window.addEventListener(evt, tryPlay, { once: true, passive: true })
  );

  videoToggle.addEventListener("click", () => {
    userPaused = !video.paused;
    if (video.paused) tryPlay();
    else video.pause();
  });
  syncToggle();

  /* ---------- light scroll handler: nav, scrollspy, coverflows ---------- */
  const cfUpdaters = []; // scroll-driven coverflow updaters register here
  const nav = document.getElementById("nav");
  const clockIcon = document.getElementById("clock-icon");
  const nlinks = document.querySelectorAll(".nlink");
  // scrollspy targets come from the nav itself (mailto links are skipped)
  const sections = [...nlinks]
    .filter((l) => (l.getAttribute("href") || "").startsWith("#"))
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter((el) => el && el.id);
  let currentSection = "";
  let ticking = false;

  function onScrollFrame() {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > innerHeight * 0.7);
    for (const u of cfUpdaters) u();

    let cur = "";
    for (const s of sections) if (y >= s.offsetTop - 240) cur = s.id;
    if (cur !== currentSection) {
      currentSection = cur;
      nlinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${cur}`));
    }
    ticking = false;
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });
  onScrollFrame();

  /* ---------- NYC clock (icon follows actual New York time) ---------- */
  const clockTime = document.getElementById("clock-time");
  function tickClock() {
    const now = new Date();
    clockTime.textContent = now.toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "America/New_York",
    });
    const h = parseInt(now.toLocaleTimeString("en-US", {
      hour: "2-digit", hour12: false, timeZone: "America/New_York",
    }), 10);
    clockIcon.textContent = h >= 6 && h < 17 ? "☀️" : h < 20 ? "🌇" : "🌙";
  }
  tickClock();
  setInterval(tickClock, 30000);

  /* ---------- hero: letters rise ---------- */
  (function splitName() {
    const el = document.getElementById("hero-name");
    const text = el.textContent.trim(); // "Bryan Mejia"
    el.textContent = "";
    const wordBreak = text.indexOf(" ");
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ch" + (ch === " " ? " sp" : "") + (i > wordBreak ? " w2" : "");
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--i", i);
      el.appendChild(s);
    });
  })();

  /* ---------- scroll reveals ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  const groupCounts = new Map();
  document.querySelectorAll(".reveal").forEach((el) => {
    const parent = el.parentElement;
    const idx = groupCounts.get(parent) || 0;
    groupCounts.set(parent, idx + 1);
    el.style.transitionDelay = `${idx * 80}ms`;
    revealObserver.observe(el);
  });



  /* ---------- scroll-driven 3D coverflows (Experience / Projects) ---------- */
  document.querySelectorAll(".cf-scrolly").forEach((band) => {
    const stage = band.querySelector(".cf-stage");
    const cards = [...band.querySelectorAll(".cf-card")];
    const N = cards.length;
    const idxEl = band.querySelector(".cf-idx");
    const prevB = band.querySelector(".cf-prev");
    const nextB = band.querySelector(".cf-next");
    let cardW = 680;
    let active = 0;
    let lastPos = -1;

    const sizeCard = () => { cardW = parseFloat(getComputedStyle(cards[0]).width); };

    function render(pos) {
      if (Math.abs(pos - lastPos) < 0.0005) return;
      lastPos = pos;
      const a = Math.round(clamp(pos, 0, N - 1));
      active = a;
      for (let i = 0; i < N; i++) {
        const d = i - pos;
        const ad = Math.abs(d);
        const s = d === 0 ? 1 : Math.sign(d);
        const spread = ad <= 1 ? ad * 0.58 : 0.58 + (ad - 1) * 0.36;
        const tx = s * spread * cardW;
        const ry = -s * (Math.min(ad, 1) * 38 + Math.min(Math.max(ad - 1, 0), 1) * 7);
        const tz = 150 - Math.min(ad, 1) * 240 - Math.max(ad - 1, 0) * 150;
        const op = Math.max(0.3, 1 - Math.max(ad - 0.55, 0) * 0.38);
        const c = cards[i];
        c.style.transform =
          `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        c.style.opacity = op.toFixed(3);
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.classList.toggle("front", i === a);
      }
      idxEl.textContent = String(a + 1).padStart(2, "0");
      prevB.classList.toggle("off", a <= 0);
      nextB.classList.toggle("off", a >= N - 1);
    }

    // scroll position inside the tall section drives the deck;
    // a small dwell at each end lets card 1 land and the last card rest
    const DWELL = 0.06;
    function update() {
      const r = band.getBoundingClientRect();
      if (r.bottom < -80 || r.top > innerHeight + 80) return;
      const total = r.height - innerHeight;
      const raw = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      const p = clamp((raw - DWELL) / (1 - 2 * DWELL), 0, 1);
      render(p * (N - 1));
    }

    // buttons and arrow keys scroll the page to the matching card
    function scrollToCard(i) {
      i = clamp(i, 0, N - 1);
      const r = band.getBoundingClientRect();
      const total = r.height - innerHeight;
      const raw = DWELL + (1 - 2 * DWELL) * (i / (N - 1));
      const top = window.scrollY + r.top + total * raw + 2;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
    prevB.addEventListener("click", () => scrollToCard(active - 1));
    nextB.addEventListener("click", () => scrollToCard(active + 1));
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollToCard(active + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollToCard(active - 1); }
    });

    sizeCard();
    render(0);
    cfUpdaters.push(update);
    window.addEventListener("resize", () => { sizeCard(); lastPos = -1; update(); }, { passive: true });
  });
  cfUpdaters.forEach((u) => u());

  /* ---------- skills: 3D rotating constellation ---------- */
  const globe = document.getElementById("globe-stage");
  if (globe) {
    const capEl = document.getElementById("sk-caption");
    const DEFAULT_CAP = "A slowly turning constellation of everything I build with; hover any skill to read it, or hover a group to focus it.";
    const SKILLS = [
      ["ai", "Agentic workflows", "Designing multi-step agent behavior; planning, acting, recovering; not just single prompts."],
      ["ai", "Harness integration", "Plugging into agent harnesses like Claude Code to capture trajectories across sessions."],
      ["ai", "Tool calling", "Giving models real capabilities through structured tool and function interfaces."],
      ["ai", "MCP", "Model Context Protocol; the open standard for connecting agents to tools and data."],
      ["ai", "Lifecycle hooks", "Lifecycle-hook context injection; reusing shared context across users, agents, and sessions."],
      ["ai", "Context & memory", "Managing what an agent knows: what to store, what to retrieve, what to inject at each moment."],
      ["ai", "RAG", "Retrieval-augmented generation, including multi-agent RAG for grounding at scale."],
      ["ai", "Prompt engineering", "Prompts written like interfaces; versioned, tested, and deliberate."],
      ["ai", "Evals", "Evaluation frameworks that measure whether a change actually made the model better."],
      ["ai", "Claude API", "Anthropic's Claude API; my primary model platform in production."],
      ["ai", "Claude Agent SDK", "Building complete agents on Anthropic's agent stack."],
      ["ai", "Google Gemini", "Multimodal generation; powered the feedback engine in Polly Debate AI."],
      ["ai", "OpenAI Codex", "Code-generation workflows; I build across all three major providers."],
      ["lang", "Python", "My data and services language; ML pipelines, analysis, FastAPI backends."],
      ["lang", "TypeScript", "Type-safe code across the stack; the language of my agent tooling."],
      ["lang", "JavaScript", "From browser interactions to Node services; the web's lingua franca."],
      ["lang", "Java / Spring Boot", "Structured backends; HeartScope's prediction API runs on Spring."],
      ["lang", "C++", "Where performance and memory control matter most."],
      ["lang", "FastAPI", "Fast Python APIs where the type hints do the validation work."],
      ["lang", "Node & Express", "Lightweight services and real-time backends in JavaScript."],
      ["lang", "React", "Component-driven UIs for the front of the stack."],
      ["lang", "Pandas / NumPy", "The data-wrangling backbone of my ML and analysis work."],
      ["cloud", "Microsoft Azure", "My production cloud; home of the contextual memory platform."],
      ["cloud", "AKS", "Azure Kubernetes Service; managed clusters running platform workloads."],
      ["cloud", "Event Hubs", "The producer/consumer stream that buffers agent telemetry."],
      ["cloud", "Cosmos DB", "Globally distributed document storage for contextual data."],
      ["cloud", "Blob Storage", "Object storage for artifacts and large payloads."],
      ["cloud", "Container Apps", "Serverless containers for the lighter services."],
      ["cloud", "Kubernetes", "Orchestration; deployments, scaling, and self-healing services."],
      ["cloud", "Docker", "Everything ships in a container; reproducible from laptop to prod."],
      ["cloud", "Helm", "Charts that make Kubernetes deployments repeatable."],
      ["cloud", "OpenTelemetry", "The telemetry standard I use to stream agent trajectories."],
      ["cloud", "CI/CD", "Pipelines that carry code from commit to production automatically."],
      ["cloud", "Git & GitHub", "Version control and collaboration; where all of it lives."],
      ["cloud", "PostgreSQL", "The relational workhorse for structured data."],
      ["cloud", "Firebase", "Rapid app backends; auth, storage, and realtime data."],
      ["cloud", "Google Cloud", "My second cloud; GCP services and the fellowship's home turf."],
      ["cloud", "Cloudflare Workers", "Edge compute for low-latency serverless endpoints."],
    ];

    // build word elements + Fibonacci sphere points
    const M = SKILLS.length;
    const GA = Math.PI * (3 - Math.sqrt(5)); // golden angle
    const items = SKILLS.map(([g, label, desc], k) => {
      const el = document.createElement("span");
      el.className = `globe-word gw-${g}`;
      el.textContent = label;
      el.dataset.i = k;
      el.title = desc;
      globe.appendChild(el);
      const t = (k + 0.5) / M;
      const y = 1 - 2 * t;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const phi = k * GA;
      return { el, g, desc, p: { x: r * Math.cos(phi), y, z: r * Math.sin(phi) } };
    });

    const TILT = 0.32, COS_T = Math.cos(TILT), SIN_T = Math.sin(TILT);
    let theta = 0.6;
    let spin = 1;
    let hoverItem = null;
    let activeGroup = null;
    let visible = false;

    function renderGlobe() {
      const w = globe.clientWidth, h = globe.clientHeight;
      const RX = w * 0.4, RY = h * 0.42;
      const ct = Math.cos(theta), st = Math.sin(theta);
      for (const it of items) {
        const xr = it.p.x * ct + it.p.z * st;
        const zr = -it.p.x * st + it.p.z * ct;
        const yr = it.p.y * COS_T - zr * SIN_T;
        const z2 = it.p.y * SIN_T + zr * COS_T;
        const depth = (z2 + 1) / 2; // 0 back, 1 front
        let s = 0.6 + depth * 0.55;
        let o = 0.16 + depth * 0.84;
        if (activeGroup && it.g !== activeGroup) o *= 0.15;
        if (hoverItem === it) { s *= 1.25; o = 1; }
        it.el.style.transform =
          `translate(-50%, -50%) translate3d(${(xr * RX).toFixed(1)}px, ${(yr * RY).toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
        it.el.style.opacity = o.toFixed(3);
        it.el.style.zIndex = String(100 + Math.round(z2 * 100));
      }
    }

    if (reducedMotion) {
      renderGlobe();
      window.addEventListener("resize", renderGlobe, { passive: true });
    } else {
      let last = performance.now();
      (function loop(now) {
        requestAnimationFrame(loop);
        const dt = Math.min((now - last) / 1000, 0.08);
        last = now;
        if (!visible || document.hidden) return;
        theta += dt * 0.13 * spin;
        renderGlobe();
      })(last);
      new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(globe);
    }

    globe.addEventListener("pointerover", (e) => {
      const el = e.target.closest(".globe-word");
      if (!el) return;
      hoverItem = items[+el.dataset.i];
      spin = 0.12;
      el.classList.add("hot");
      capEl.textContent = hoverItem.desc;
      if (reducedMotion) renderGlobe();
    });
    globe.addEventListener("pointerout", (e) => {
      const el = e.target.closest(".globe-word");
      if (!el) return;
      el.classList.remove("hot");
      hoverItem = null;
      spin = 1;
      capEl.textContent = DEFAULT_CAP;
      if (reducedMotion) renderGlobe();
    });
    document.querySelectorAll(".sk-legend li").forEach((li) => {
      li.addEventListener("mouseenter", () => { activeGroup = li.dataset.g; if (reducedMotion) renderGlobe(); });
      li.addEventListener("mouseleave", () => { activeGroup = null; if (reducedMotion) renderGlobe(); });
    });
  }

  /* ---------- about: places map ---------- */
  const mapStage = document.getElementById("map-stage");
  if (mapStage) {
    // x/y are percentages of the map image (0 0 = top-left corner).
    // The map is equirectangular, latitude 85 to -60, so for a place at
    // (lat, lon): x = (lon + 180) / 360 * 100, y = (85 - lat) / 145 * 100.
    // images: photo paths for the carousel; themed placeholders show while empty.
    const MAP_POINTS = [
      {
        x: 29.4, y: 30.5,
        title: "New York City",
        subtitle: "Home base · New York, NY",
        desc: "Born and raised; where I studied, trained clients, and now build agentic AI systems. Participated in NYC tech week 2026, did GTM for Augenta AI, and participated in a Google-backed software engineering fellowship in the city.",
        images: ["media/web/ny_1.jpg", "media/web/ny_2.jpg", "media/web/ny_3.jpg"],
      },
      {
        x: 30.3, y: 29.4,
        title: "Boston, Massachusetts",
        subtitle: "HackHarvard 2024, 2025",
        desc: "Participated in HackHarvard 2024 and 2025, where I worked on various projects and collaborated with other talented developers. Created Polly AI and other projects during these hackathons.",
        images: ["media/web/boston_1.jpg", "media/web/boston_2.jpg", "media/web/boston_3.jpg"],
      },
      {
        x: 18.9, y: 33.8,
        title: "Nevada, USA",
        subtitle: "Hiked the Grand Canyon!",
        desc: "Decided to take a break from the city and explore the natural wonders of Nevada. Hiked the Grand Canyon and enjoyed the breathtaking views.",
        images: ["media/web/nevada_1.jpg", "media/web/nevada_2.jpg", "media/web/nevada_3.jpg"],
      },
      {
        x: 28.2, y: 58.7,
        title: "Guayaquil, Ecuador",
        subtitle: "Visiting family and exploring",
        desc: "Being born and raised in the USA, I never got the chance to explore my roots. So I decided to take a trip to Ecuador to visit my family and explore the beautiful country. It was an amazing experience, and I got to see a different side of my heritage.",
        images: ["media/web/ecuador_1.jpg", "media/web/ecuador_2.jpg", "media/web/ecuador_3.jpg"],
      },
      {
        x: 53.5, y: 29.7,
        title: "Rome, Italy",
        subtitle: "Visiting Europe For the First Time",
        desc: "I've always been fascinated my Roman history and in love with Italian food, so I decided to take a trip to Rome, Italy. It was my first time in Europe, and I was blown away by the history, architecture, and culture of the city. I visited the Colosseum, the Vatican, and many other famous landmarks. It was an unforgettable experience.",
        images: ["media/web/rome_1.jpg", "media/web/rome_2.jpg", "media/web/rome_3.jpg"],
      },
      {
        x: 52.9, y: 31.2,
        title: "Sardinia, Italy",
        subtitle: "Exploring the Coast",
        desc: "After visiting Rome, I decided to take a trip to Sardinia, Italy. I wanted to explore the beautiful coast and enjoy the Mediterranean climate. I spent my days relaxing on the beaches, exploring the local towns, and enjoying the delicious seafood. It was a perfect way to unwind and enjoy the beauty of Italy.",
        images: ["media/web/sardinia_1.jpg", "media/web/sardinia_2.jpg", "media/videos/sardinia/IMG_4922.mov"],
      },
      {
        x: 50.0, y: 23.1,
        title: "London, England",
        subtitle: "Exploring the City",
        desc: "I've always wanted to visit London, so I decided to take a trip there. I explored the famous landmarks like the Tower of London, Big Ben, and the British Museum. The city was bustling with life, and I enjoyed the vibrant culture and history.",
        images: ["media/web/london_1.jpg", "media/web/london_2.jpg", "media/web/london_3.jpg"],
      },
      {
        x: 88.8, y: 34.0,
        title: "Tokyo, Japan",
        subtitle: "Visiting Japan",
        desc: "I've always been interested in Japanese culture, so I decided to take a trip to Tokyo. I explored the city's unique blend of traditional and modern attractions, from temples to skyscrapers. It was an incredible experience. I visited Osaka, Kyoto, and Nara as well, and I was amazed by the beauty and history of Japan. The food was also incredible, and I enjoyed trying new dishes and experiencing the local cuisine.",
        images: ["media/web/japan_1.jpg", "media/web/japan_2.jpg", "media/videos/japan/IMG_8292.mov"],
      },
    ];

    // the card is a large centered panel that flips into view over the map;
    // it lives in .about-map (not the stage) so the stage's overflow
    // clipping never cuts it off
    const card = document.createElement("div");
    card.className = "map-card";
    card.hidden = true;
    card.setAttribute("role", "dialog");
    card.innerHTML =
      '<div class="mc-frame">' +
        '<div class="mc-slides"></div>' +
        '<button type="button" class="mc-back" aria-label="Close card">← Back</button>' +
        '<button type="button" class="mc-btn mc-prev" aria-label="Previous photo">←</button>' +
        '<button type="button" class="mc-btn mc-next" aria-label="Next photo">→</button>' +
        '<div class="mc-dots" aria-hidden="true"></div>' +
      '</div>' +
      '<div class="mc-body">' +
        '<h3 class="mc-title"></h3>' +
        '<p class="mc-sub"></p>' +
        '<p class="mc-desc"></p>' +
      '</div>';
    (mapStage.closest(".about-map") || mapStage).appendChild(card);

    const canvas = document.getElementById("map-canvas");
    const slidesEl = card.querySelector(".mc-slides");
    const dotsEl = card.querySelector(".mc-dots");
    const VIDEO_RE = /\.(mov|mp4|webm)$/i;
    let slide = 0, slideCount = 0, hideTimer = null, openPt = null;

    function renderSlides() {
      [...slidesEl.children].forEach((s, i) => {
        const on = i === slide;
        s.classList.toggle("on", on);
        const v = s.querySelector("video");
        if (v) {
          if (on) { const p = v.play(); if (p) p.catch(() => {}); }
          else v.pause();
        }
      });
      [...dotsEl.children].forEach((d, i) => d.classList.toggle("on", i === slide));
    }

    function reallyOpen(pt, btn) {
      clearTimeout(hideTimer);
      openPt = pt;
      // the card grows out of the hovered pin: remember the pin's offset
      // from the card's resting center (see --dx/--dy in the stylesheet)
      const wrect = card.parentElement.getBoundingClientRect();
      const brect = btn.getBoundingClientRect();
      const ox = brect.left + brect.width / 2 - wrect.left;
      const oy = brect.top + brect.height / 2 - wrect.top;
      card.style.setProperty("--dx", `${(ox - wrect.width / 2).toFixed(1)}px`);
      card.style.setProperty("--dy", `${(oy - (wrect.height / 2 + 26)).toFixed(1)}px`);
      card.setAttribute("aria-label", pt.title);
      card.querySelector(".mc-title").textContent = pt.title;
      card.querySelector(".mc-sub").textContent = pt.subtitle;
      card.querySelector(".mc-desc").textContent = pt.desc;
      slidesEl.innerHTML = "";
      dotsEl.innerHTML = "";
      const items = pt.images && pt.images.length ? pt.images : null;
      slideCount = items ? items.length : 3;
      for (let i = 0; i < slideCount; i++) {
        const s = document.createElement("div");
        s.className = "mc-slide";
        if (items) {
          if (VIDEO_RE.test(items[i])) {
            const v = document.createElement("video");
            v.src = items[i];
            v.muted = true;
            v.loop = true;
            v.playsInline = true;
            v.preload = "metadata";
            v.setAttribute("muted", "");
            v.setAttribute("playsinline", "");
            s.appendChild(v);
          } else {
            const im = document.createElement("img");
            im.src = items[i];
            im.alt = `${pt.title} photo ${i + 1}`;
            im.loading = "lazy";
            s.appendChild(im);
          }
        } else {
          s.classList.add(`mc-ph-${(i % 3) + 1}`);
          s.innerHTML = `<span>photo ${i + 1} · coming soon</span>`;
        }
        slidesEl.appendChild(s);
        dotsEl.appendChild(document.createElement("i"));
      }
      slide = 0;
      renderSlides();
      card.hidden = false;
      // snap (invisibly; the card is faded out while closed) to the new
      // pin's closed state so the grow animation starts from that pin
      card.classList.remove("open");
      card.style.transition = "none";
      void card.offsetWidth;
      card.style.transition = "";
      requestAnimationFrame(() => card.classList.add("open"));
    }

    // only one card at a time: hovering another pin folds the current card
    // back into its pin, then opens the new one from the pin being hovered
    let pendingOpen = null;
    function openCard(pt, btn) {
      clearTimeout(pendingOpen);
      if (openPt === pt && !card.hidden) return;
      if (openPt && !card.hidden) {
        closeCard();
        pendingOpen = setTimeout(() => reallyOpen(pt, btn), 280);
      } else {
        reallyOpen(pt, btn);
      }
    }

    function closeCard() {
      clearTimeout(pendingOpen);
      if (card.hidden && !card.classList.contains("open")) return;
      openPt = null;
      card.classList.remove("open"); // flips back out
      slidesEl.querySelectorAll("video").forEach((v) => v.pause());
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => { card.hidden = true; }, 500);
    }

    MAP_POINTS.forEach((pt) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "map-point";
      b.style.left = `${pt.x}%`;
      b.style.top = `${pt.y}%`;
      b.setAttribute("aria-label", `${pt.title}; ${pt.subtitle}`);
      b.innerHTML = "<i></i>";
      b.addEventListener("pointerenter", () => openCard(pt, b));
      b.addEventListener("focus", () => openCard(pt, b));
      b.addEventListener("click", () => openCard(pt, b)); // touch fallback
      canvas.appendChild(b);
    });

    card.querySelector(".mc-back").addEventListener("click", closeCard);
    card.querySelector(".mc-prev").addEventListener("click", () => {
      slide = (slide - 1 + slideCount) % slideCount; renderSlides();
    });
    card.querySelector(".mc-next").addEventListener("click", () => {
      slide = (slide + 1) % slideCount; renderSlides();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && openPt) closeCard();
    });
    // clicking the bare map (not a pin) also dismisses the card
    mapStage.addEventListener("click", (e) => {
      if (e.target.closest(".map-point, .map-zoom")) return;
      if (suppressClick) { suppressClick = false; return; }
      closeCard();
    });

    /* ---- zoom & pan ---- */
    const zoomIn = document.getElementById("mz-in");
    const zoomOut = document.getElementById("mz-out");
    const ZMIN = 1, ZMAX = 4, ZSTEP = 1.6;
    let zoom = 1, panX = 0, panY = 0;
    var suppressClick = false; // set after a pan so the release click doesn't close the card

    function applyView() {
      const w = mapStage.clientWidth, h = mapStage.clientHeight;
      panX = clamp(panX, w - w * zoom, 0);
      panY = clamp(panY, h - h * zoom, 0);
      canvas.style.transform = `translate(${panX.toFixed(1)}px, ${panY.toFixed(1)}px) scale(${zoom.toFixed(3)})`;
      mapStage.style.setProperty("--mz", zoom);
      mapStage.classList.toggle("zoomed", zoom > 1);
      mapStage.style.touchAction = zoom > 1 ? "none" : "";
      zoomIn.classList.toggle("off", zoom >= ZMAX - 0.01);
      zoomOut.classList.toggle("off", zoom <= ZMIN + 0.01);
      closeCard();
    }

    function setZoom(z) {
      z = clamp(z, ZMIN, ZMAX);
      if (Math.abs(z - zoom) < 0.001) return;
      // zoom around the center of the viewport
      const cx = mapStage.clientWidth / 2, cy = mapStage.clientHeight / 2;
      panX = cx - (cx - panX) * (z / zoom);
      panY = cy - (cy - panY) * (z / zoom);
      zoom = z;
      applyView();
    }
    zoomIn.addEventListener("click", () => setZoom(zoom * ZSTEP));
    zoomOut.addEventListener("click", () => setZoom(zoom / ZSTEP));

    // drag to pan while zoomed in; drags may start anywhere on the map
    // (including pins) and only engage after a small movement threshold,
    // so pin hovers, clicks, and taps keep working
    let dragging = false, downId = null, downX = 0, downY = 0, panX0 = 0, panY0 = 0;
    mapStage.addEventListener("dragstart", (e) => e.preventDefault());
    mapStage.addEventListener("pointerdown", (e) => {
      if (zoom <= 1) return;
      if (e.target.closest(".map-card, .map-zoom")) return;
      e.preventDefault(); // no native image drag or text selection
      downId = e.pointerId;
      downX = e.clientX; downY = e.clientY;
      panX0 = panX; panY0 = panY;
    });
    mapStage.addEventListener("pointermove", (e) => {
      if (downId === null || e.pointerId !== downId) return;
      const dx = e.clientX - downX, dy = e.clientY - downY;
      if (!dragging) {
        if (Math.abs(dx) + Math.abs(dy) < 5) return;
        dragging = true;
        mapStage.classList.add("dragging");
        mapStage.setPointerCapture(e.pointerId);
      }
      panX = panX0 + dx;
      panY = panY0 + dy;
      applyView();
    });
    const endDrag = () => {
      downId = null;
      if (dragging) suppressClick = true;
      dragging = false;
      mapStage.classList.remove("dragging");
    };
    mapStage.addEventListener("pointerup", endDrag);
    mapStage.addEventListener("pointercancel", endDrag);
  }

  /* ---------- ride to the night (gentle auto-scroll) ---------- */
  let sunsetRAF = null;
  const CANCEL_EVENTS = ["wheel", "touchstart", "mousedown", "keydown"];
  function cancelSunset() {
    if (sunsetRAF) cancelAnimationFrame(sunsetRAF);
    sunsetRAF = null;
    CANCEL_EVENTS.forEach((ev) => window.removeEventListener(ev, cancelSunset));
  }
  function playSunset() {
    cancelSunset();
    const docH = document.documentElement.scrollHeight - innerHeight;
    const startY = window.scrollY;
    const dist = docH - startY;
    if (dist <= 10) return;
    if (reducedMotion) { window.scrollTo(0, docH); return; }
    const dur = clamp(dist * 3.5, 8000, 20000);
    const t0 = performance.now();
    CANCEL_EVENTS.forEach((ev) => window.addEventListener(ev, cancelSunset, { passive: true }));
    const frame = (now) => {
      const t = Math.min((now - t0) / dur, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      window.scrollTo(0, startY + dist * e);
      if (t < 1) sunsetRAF = requestAnimationFrame(frame);
      else cancelSunset();
    };
    sunsetRAF = requestAnimationFrame(frame);
    toast("Gliding down ✨ scroll anytime to take over");
  }

  /* ---------- copy email ---------- */
  const EMAIL = "bryan.mejia3923@gmail.com";
  function copyEmail() {
    navigator.clipboard.writeText(EMAIL).then(
      () => toast(`Copied ✨ ${EMAIL}`),
      () => toast(EMAIL)
    );
  }
  const copyBtn = document.getElementById("copy-email");
  if (copyBtn) copyBtn.addEventListener("click", copyEmail);

  /* ---------- quick menu (⌘K) ---------- */
  const overlay = document.getElementById("palette-overlay");
  const input = document.getElementById("palette-input");
  const list = document.getElementById("palette-list");
  let selIdx = 0;
  let filtered = [];

  function go(id) {
    document.getElementById(id).scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }

  const COMMANDS = [
    { name: "Go to About",        hint: "hello",     run: () => go("about") },
    { name: "Go to Skills",       hint: "toolkit",   run: () => go("skills") },
    { name: "Go to Experience",   hint: "the road",  run: () => go("experience") },
    { name: "Go to Projects",     hint: "the work",  run: () => go("projects") },
    { name: "Go to Contact",      hint: "say hi",    run: () => go("contact") },
    { name: "Back to the top",    hint: "sunrise",   run: () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }) },
    { name: "Glide down the page", hint: "auto-scroll", run: playSunset },
    { name: "Open GitHub",        hint: "new tab",   run: () => window.open("https://github.com/bryan3342", "_blank", "noopener") },
    { name: "Open LinkedIn",      hint: "new tab",   run: () => window.open("https://linkedin.com/in/bryanmejia15", "_blank", "noopener") },
    { name: "Email me",           hint: "mailto",    run: () => { location.href = "mailto:" + EMAIL; } },
    { name: "Copy my email",      hint: "clipboard", run: copyEmail },
    { name: "Hire Bryan",         hint: "great idea", run: () => { toast("Great choice ☀️ opening your email"); setTimeout(() => { location.href = "mailto:" + EMAIL; }, 600); } },
  ];

  function renderList() {
    const q = input.value.trim().toLowerCase();
    filtered = COMMANDS.filter((c) => c.name.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q));
    selIdx = clamp(selIdx, 0, Math.max(0, filtered.length - 1));
    list.innerHTML = filtered.length
      ? filtered.map((c, i) =>
          `<li class="${i === selIdx ? "sel" : ""}" data-i="${i}"><span>${c.name}</span><span class="p-hint">${c.hint}</span></li>`
        ).join("")
      : `<li class="empty">Nothing here; try “projects” or “email”.</li>`;
  }

  function openPalette() {
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    input.value = "";
    selIdx = 0;
    renderList();
    setTimeout(() => input.focus(), 30);
  }
  function closePalette() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    input.blur();
  }
  function runSelected() {
    const cmd = filtered[selIdx];
    if (!cmd) return;
    closePalette();
    cmd.run();
  }

  const paletteBtn = document.getElementById("palette-btn");
  if (paletteBtn) paletteBtn.addEventListener("click", openPalette);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePalette(); });
  input.addEventListener("input", () => { selIdx = 0; renderList(); });
  list.addEventListener("click", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    selIdx = parseInt(li.dataset.i, 10);
    runSelected();
  });

  document.addEventListener("keydown", (e) => {
    const isOpen = overlay.classList.contains("open");
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      isOpen ? closePalette() : openPalette();
      return;
    }
    if (!isOpen) return;
    if (e.key === "Escape") closePalette();
    else if (e.key === "ArrowDown") { e.preventDefault(); selIdx = Math.min(selIdx + 1, filtered.length - 1); renderList(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); selIdx = Math.max(selIdx - 1, 0); renderList(); }
    else if (e.key === "Enter") runSelected();
  });

  /* ---------- footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
