// =========================================================
// Sruthi — Portfolio scripts
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Toast ----------
const toast = document.getElementById("toast");
let toastTimer;
function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------- Theme toggle ----------
const themeBtn = document.getElementById("themeToggle");
function syncThemeButton() {
  const dark = root.dataset.theme !== "light";
  themeBtn.innerHTML = dark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
}
themeBtn.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  syncThemeButton();
});
syncThemeButton();

// ---------- Navbar: close mobile menu after picking a link ----------
document.querySelectorAll("#navLinks .nav-link").forEach(link => {
  link.addEventListener("click", () => {
    const menu = document.getElementById("navLinks");
    if (menu.classList.contains("show")) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  });
});

// ---------- Highlight the nav link for the section in view ----------
const navLinks = [...document.querySelectorAll("#navLinks .nav-link")];
const navSections = navLinks.map(link => document.querySelector(link.getAttribute("href")));
let navTicking = false;

function updateActiveLink() {
  navTicking = false;
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = navSections[0];
  if (atBottom) current = navSections[navSections.length - 1];
  else navSections.forEach(sec => { if (sec.getBoundingClientRect().top <= window.innerHeight * 0.35) current = sec; });
  navLinks.forEach(link => link.classList.toggle("active", link.getAttribute("href") === "#" + current.id));
}
window.addEventListener("scroll", () => {
  if (!navTicking) { navTicking = true; requestAnimationFrame(updateActiveLink); }
}, { passive: true });
updateActiveLink();

// ---------- Cursor spotlight on tiles ----------
document.querySelectorAll(".tile").forEach(tile => {
  tile.addEventListener("pointermove", e => {
    const r = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", `${e.clientX - r.left}px`);
    tile.style.setProperty("--my", `${e.clientY - r.top}px`);
  });
});

// ---------- Marquee: duplicate items for a seamless loop ----------
document.querySelectorAll(".marquee-track").forEach(track => {
  track.querySelectorAll("span").forEach(item => {
    const copy = item.cloneNode(true);
    copy.setAttribute("aria-hidden", "true");
    track.appendChild(copy);
  });
});

// ---------- Skill bars fill when visible ----------
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelector(".progress-bar").style.width = entry.target.dataset.level + "%";
    skillObserver.unobserve(entry.target);
  });
}, { threshold: 0.4 });

document.querySelectorAll(".skill").forEach(el => skillObserver.observe(el));

// ---------- Animated counters ----------
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }

  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateCount(entry.target);
    countObserver.unobserve(entry.target);
  });
}, { threshold: 0.6 });

document.querySelectorAll(".stat-num").forEach(el => countObserver.observe(el));

// ---------- Statement: words light up as you scroll ----------
const statement = document.querySelector("[data-scroll-words]");
const words = [];
if (statement) {
  const text = statement.textContent.trim().replace(/\s+/g, " ");
  statement.textContent = "";
  text.split(" ").forEach((word, i, arr) => {
    const span = document.createElement("span");
    span.className = "w";
    span.textContent = word;
    statement.appendChild(span);
    if (i < arr.length - 1) statement.appendChild(document.createTextNode(" "));
    words.push(span);
  });
}

function lightWords(progress) {
  const litCount = Math.round(Math.max(0, Math.min(1, progress)) * words.length);
  words.forEach((w, i) => w.classList.toggle("lit", i < litCount));
}

// ---------- Project filters ----------
const filterButtons = document.querySelectorAll(".filter");
const projectCols = document.querySelectorAll(".project-col");

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    const filter = btn.dataset.filter;
    const shown = [];
    projectCols.forEach(col => {
      const show = filter === "all" || col.dataset.tags.split(" ").includes(filter);
      col.classList.toggle("hide", !show);
      if (show) shown.push(col);
    });
    if (window.gsap && !reduceMotion) {
      gsap.fromTo(shown,
        { autoAlpha: 0, y: 40, scale: .95 },
        { autoAlpha: 1, y: 0, scale: 1, duration: .7, stagger: .08, ease: "expo.out", clearProps: "transform", overwrite: true });
      ScrollTrigger.refresh();
    }
  });
});

// ---------- Copy email ----------
document.getElementById("copyEmail").addEventListener("click", async () => {
  const email = "chalamchala2005@gmail.com";
  try {
    await navigator.clipboard.writeText(email);
    showToast("Email address copied");
  } catch (e) {
    showToast(email);
  }
});

// ---------- Contact form validation ----------
const form = document.getElementById("contactForm");
const fields = {
  name: document.getElementById("name"),
  email: document.getElementById("email"),
  subject: document.getElementById("subject"),
  message: document.getElementById("message"),
};
const charCount = document.getElementById("charCount");
const success = document.getElementById("formSuccess");

const rules = {
  name(v) {
    if (!v) return "Enter your name.";
    if (v.length < 3) return "Name must be at least 3 characters.";
    if (!/^[A-Za-z][A-Za-z .'-]*$/.test(v)) return "Name can only contain letters, spaces, dots and hyphens.";
    return "";
  },
  email(v) {
    if (!v) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v)) return "Enter a valid email, like name@example.com.";
    return "";
  },
  subject(v) {
    if (!v) return "Enter a subject.";
    if (v.length < 5) return "Subject must be at least 5 characters.";
    return "";
  },
  message(v) {
    if (!v) return "Enter a message.";
    if (v.length < 20) return `Message must be at least 20 characters (${20 - v.length} more).`;
    return "";
  },
};

function feedbackFor(input) {
  return input.id === "message"
    ? input.parentElement.querySelector(".invalid-feedback")
    : input.nextElementSibling;
}

function validateField(key) {
  const input = fields[key];
  const error = rules[key](input.value.trim());
  input.classList.toggle("is-invalid", !!error);
  input.classList.toggle("is-valid", !error);
  input.setAttribute("aria-invalid", error ? "true" : "false");
  feedbackFor(input).textContent = error;
  return !error;
}

Object.keys(fields).forEach(key => {
  const input = fields[key];
  // Validate on leaving a field, then live once it has been flagged
  input.addEventListener("blur", () => { if (input.value.trim()) validateField(key); });
  input.addEventListener("input", () => {
    if (input.classList.contains("is-invalid")) validateField(key);
    success.hidden = true;
  });
});

fields.message.addEventListener("input", () => {
  charCount.textContent = `${fields.message.value.length} / 1000`;
});

form.addEventListener("submit", e => {
  e.preventDefault();
  const results = Object.keys(fields).map(validateField);
  if (results.includes(false)) {
    Object.values(fields).find(f => f.classList.contains("is-invalid")).focus();
    return;
  }

  const name = fields.name.value.trim();
  const body = `${fields.message.value.trim()}\n\n— ${name} (${fields.email.value.trim()})`;
  const mailto = `mailto:chalamchala2005@gmail.com?subject=${encodeURIComponent(fields.subject.value.trim())}&body=${encodeURIComponent(body)}`;

  success.textContent = `Thanks, ${name}. Your email app is opening with this message ready to send.`;
  success.hidden = false;
  window.location.href = mailto;

  form.reset();
  charCount.textContent = "0 / 1000";
  Object.values(fields).forEach(f => f.classList.remove("is-valid"));
});

// =========================================================
// Scroll animations — GSAP + ScrollTrigger, smooth scroll by Lenis
// =========================================================
function showEverything() {
  root.classList.remove("js-anim");
  lightWords(1);
}

// Wrap each word of a heading in a mask so it can slide up into view.
// Inline elements (like the gradient name) move as one word; <br>s are kept.
function wrapWord(content) {
  const mask = document.createElement("span");
  mask.className = "wm";
  const inner = document.createElement("span");
  inner.className = "wi";
  inner.appendChild(content);
  mask.appendChild(inner);
  return mask;
}

function splitWords(el) {
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        frag.appendChild(/^\s+$/.test(part) ? document.createTextNode(" ") : wrapWord(document.createTextNode(part)));
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== "BR") {
      const spot = document.createComment("");
      node.replaceWith(spot);
      spot.replaceWith(wrapWord(node));
    }
  });
  return el.querySelectorAll(".wi");
}

if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
  showEverything();
} else {
  gsap.registerPlugin(ScrollTrigger);

  // ---------- Smooth scroll ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // In-page links glide to their section instead of jumping
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", e => {
      const id = link.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const dest = id === "#home" ? 0 : target;
      if (lenis) lenis.scrollTo(dest, { offset: -90, duration: 1.6, easing: t => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: id === "#home" ? 0 : target.offsetTop - 90, behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  });

  // ---------- Initial hidden states ----------
  const tiles = gsap.utils.toArray(".reveal").filter(el =>
    !el.closest(".hero") && !el.classList.contains("section-head") && !el.classList.contains("gallery"));
  gsap.set(tiles, { autoAlpha: 0, y: 70, scale: .95, filter: "blur(10px)" });
  gsap.set(".section-head, .gallery", { autoAlpha: 1 });

  // ---------- Hero intro (on load) ----------
  const heroWords = splitWords(document.querySelector(".hero-title"));
  gsap.set(".hero-title", { autoAlpha: 1 });
  gsap.timeline({ defaults: { ease: "expo.out" } })
    .fromTo(".pill-nav", { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1, clearProps: "transform" })
    .fromTo(".hero .reveal",
      { autoAlpha: 0, y: 50, scale: .96, filter: "blur(10px)" },
      { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.2, stagger: .08, clearProps: "transform,filter" }, .1)
    .from(heroWords, { yPercent: 110, duration: 1.1, stagger: .045 }, .35)
    .fromTo(".tile-intro .status-pill, .hero-sub, .tile-intro .btn", { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .9, stagger: .06, clearProps: "transform" }, .7)
    .from(".tile-photo img", { scale: 1.3, duration: 1.8 }, .1);

  // Hero sinks back as the next section scrolls over it
  gsap.to(".hero .container", {
    scale: .92, y: 80, autoAlpha: .2, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // ---------- Statement: pinned while its words light up ----------
  gsap.from(".statement-text", {
    y: 100, scale: .9, autoAlpha: 0, ease: "none",
    scrollTrigger: { trigger: ".statement", start: "top 90%", end: "center center", scrub: true },
  });
  ScrollTrigger.create({
    trigger: ".statement", start: "center center", end: "+=100%", pin: true, scrub: true,
    onUpdate: self => lightWords(self.progress),
  });

  // ---------- Section headings: words rise out of a mask ----------
  document.querySelectorAll(".section-head, .tile-cta").forEach(head => {
    const title = head.querySelector(".section-title");
    const words = splitWords(title);
    const tl = gsap.timeline({ scrollTrigger: { trigger: head, start: "top 85%" } });
    const kicker = head.querySelector(".kicker");
    if (kicker) tl.fromTo(kicker, { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .6, ease: "power3.out" });
    tl.from(words, { yPercent: 110, duration: 1.1, stagger: .05, ease: "expo.out" }, "-=.35");
    const filters = head.querySelector(".filters");
    if (filters) tl.fromTo(filters, { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: "expo.out" }, "-=.8");
  });

  // ---------- Tiles: staggered blur-in, row by row ----------
  ScrollTrigger.batch(tiles, {
    start: "top 90%",
    once: true,
    onEnter: batch => gsap.to(batch, {
      autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)",
      duration: 1.1, stagger: .09, ease: "expo.out", clearProps: "transform,filter", overwrite: "auto",
    }),
  });

  // ---------- Photos: curtain wipes + parallax ----------
  gsap.fromTo(".tile-portrait",
    { clipPath: "inset(100% 0% 0% 0% round 24px)" },
    { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.4, ease: "expo.inOut",
      scrollTrigger: { trigger: ".tile-portrait", start: "top 85%" } });

  gsap.utils.toArray(".tile-photo img, .tile-portrait img").forEach(img => {
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  const figs = gsap.utils.toArray(".gallery figure");
  gsap.set(figs, { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0% round 20px)" });
  gsap.timeline({ scrollTrigger: { trigger: ".gallery", start: "top 85%" } })
    .to(figs, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.2, stagger: .1, ease: "expo.inOut" })
    .from(".gallery img", { scale: 1.35, duration: 1.8, stagger: .1, ease: "expo.out", clearProps: "transform" }, 0);

  gsap.utils.toArray(".project-media img").forEach(img => {
    gsap.from(img, { scale: 1.3, duration: 1.6, ease: "expo.out", clearProps: "transform",
      scrollTrigger: { trigger: img, start: "top 92%" } });
  });

  // ---------- Education: line draws, dots pop ----------
  gsap.fromTo(".timeline-line", { scaleY: 0 }, {
    scaleY: 1, ease: "none",
    scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: true },
  });
  gsap.utils.toArray(".timeline-dot").forEach(dot => {
    gsap.from(dot, { scale: 0, duration: .6, ease: "back.out(3)", scrollTrigger: { trigger: dot, start: "top 75%" } });
  });

  // ---------- Footer wordmark rises in ----------
  gsap.from(".wordmark", {
    yPercent: 50, autoAlpha: 0, ease: "none",
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  // ---------- Scroll progress bar ----------
  gsap.to(".scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  root.classList.remove("js-anim");
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
