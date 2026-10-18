// =========================================================
// Sruthi — Portfolio (editorial edition) scripts
// =========================================================

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Top bar background once scrolled ----------
const topbar = document.querySelector(".topbar");
function updateTopbar() { topbar.classList.toggle("scrolled", window.scrollY > 40); }

// ---------- Highlight the nav link for the section in view ----------
const sideLinks = [...document.querySelectorAll(".side-nav a")];
const sections = sideLinks.map(link => document.querySelector(link.getAttribute("href")));

function updateActiveLink() {
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  let current = sections[0];
  if (atBottom) current = sections[sections.length - 1];
  else sections.forEach(sec => { if (sec.getBoundingClientRect().top <= window.innerHeight * 0.4) current = sec; });
  const hash = "#" + current.id;
  document.querySelectorAll(".side-nav a, .menu-links a").forEach(link => {
    const on = link.getAttribute("href") === hash;
    link.classList.toggle("active", on);
    if (on) link.setAttribute("aria-current", "true"); else link.removeAttribute("aria-current");
  });
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { ticking = false; updateTopbar(); updateActiveLink(); });
}, { passive: true });
updateTopbar();
updateActiveLink();

// ---------- Skill bars fill when visible ----------
const skillObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.querySelector(".progress-bar").style.width = entry.target.dataset.level + "%";
    skillObserver.unobserve(entry.target);
  });
}, { threshold: 0.5 });
document.querySelectorAll(".skill").forEach(el => skillObserver.observe(el));

// ---------- Counters ----------
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || "0", 10);
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) return;
  const start = performance.now();
  (function tick(now) {
    const p = Math.min(Math.max((now - start) / 1600, 0), 1);
    el.textContent = (target * (1 - Math.pow(1 - p, 3))).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    animateCount(entry.target);
    countObserver.unobserve(entry.target);
  });
}, { threshold: 0.6 });
document.querySelectorAll(".num").forEach(el => countObserver.observe(el));

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

  success.textContent = `Thank you, ${name}. Your email app is opening with this message ready to send.`;
  success.hidden = false;
  window.location.href = mailto;

  form.reset();
  charCount.textContent = "0 / 1000";
  Object.values(fields).forEach(f => f.classList.remove("is-valid"));
});

// =========================================================
// Smooth scroll + scroll animations (GSAP, ScrollTrigger, Lenis)
// =========================================================
const menuEl = document.getElementById("menu");
let lenis = null;

function scrollToTarget(id) {
  const target = document.querySelector(id);
  if (!target) return;
  const top = id === "#home" ? 0 : target;
  if (lenis) lenis.scrollTo(top, { offset: id === "#home" ? 0 : -40, duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
  else window.scrollTo({ top: id === "#home" ? 0 : target.getBoundingClientRect().top + window.scrollY - 40, behavior: reduceMotion ? "auto" : "smooth" });
  history.replaceState(null, "", id);
}

// In-page links: close the menu first if it's open, then glide to the section
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const id = link.getAttribute("href");
    if (id.length < 2 || !document.querySelector(id)) return;
    e.preventDefault();
    if (menuEl.classList.contains("show")) {
      menuEl.addEventListener("hidden.bs.offcanvas", () => scrollToTarget(id), { once: true });
      bootstrap.Offcanvas.getOrCreateInstance(menuEl).hide();
    } else {
      scrollToTarget(id);
    }
  });
});

// Split each title into lines (at <br>) wrapped in masks, so lines can rise into view
function splitLines(el) {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map(p => `<span class="ln"><span>${p.trim()}</span></span>`).join("");
  return el.querySelectorAll(".ln > span");
}

// Split text into individual characters for the hero name
function splitChars(el) {
  const text = el.textContent;
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text].map(c => `<span class="ch" aria-hidden="true">${c === " " ? "&nbsp;" : c}</span>`).join("");
  return el.querySelectorAll(".ch");
}

if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
  root.classList.remove("js-anim");
} else {
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.2, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    // pause smooth scroll while the full-screen menu is open
    menuEl.addEventListener("show.bs.offcanvas", () => lenis.stop());
    menuEl.addEventListener("hidden.bs.offcanvas", () => lenis.start());
  }

  // ---------- Hero intro ----------
  const nameChars = [...document.querySelectorAll(".hero-name .line")].map(splitChars);
  gsap.set(".hero-name", { autoAlpha: 1 });
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .fromTo(".hero-photo img", { scale: 1.25, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 2.2 }, 0)
    .fromTo(nameChars[0], { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: .05 }, .25)
    .fromTo(nameChars[1], { yPercent: 110 }, { yPercent: 0, duration: 1.3, stagger: .035 }, .4)
    .fromTo(".hero-label, .hero-intro, .hero-actions", { y: 24, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, stagger: .1 }, .9)
    .fromTo(".topbar, .side-nav", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2 }, 1.1);

  // Leaving the hero: photo drifts slower than the page, name lifts and fades
  gsap.to(".hero-photo img", {
    yPercent: 12, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });
  gsap.to(".hero-inner", {
    yPercent: -18, autoAlpha: 0, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "30% top", end: "bottom top", scrub: true },
  });

  // ---------- Section titles: lines rise out of a mask ----------
  document.querySelectorAll(".section-head").forEach(head => {
    const lines = splitLines(head.querySelector(".title"));
    gsap.timeline({ scrollTrigger: { trigger: head, start: "top 82%" } })
      .fromTo(head.querySelector(".label"), { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: .9, ease: "power3.out" })
      .fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: 1.3, stagger: .12, ease: "expo.out" }, "-=.6");
  });

  // ---------- Photos: wipe open from below, then drift ----------
  document.querySelectorAll(".photo").forEach(fig => {
    const frame = fig.querySelector(".photo-frame");
    const img = frame.querySelector("img");
    const caption = fig.querySelector("figcaption");
    gsap.timeline({ scrollTrigger: { trigger: fig, start: "top 85%" } })
      .fromTo(frame, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" })
      .fromTo(img, { scale: 1.35 }, { scale: 1.12, duration: 2, ease: "expo.out" }, 0)
      .fromTo(caption, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .8, ease: "power3.out" }, .9);
    gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 5, ease: "none",
      scrollTrigger: { trigger: fig, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  // ---------- Everything else: soft rise, row by row ----------
  const revealables = gsap.utils.toArray(
    ".prose, .facts .label, .details > div, .numbers > div, .entry, #skills .col-lg-6 > .label, .skill, .tag-group, " +
    ".work .col-md-6:not(:has(.photo)), .certs .label, .cert-row, .contact-form"
  ).filter(el => !el.closest(".section-head") && !el.closest(".hero"));
  revealables.forEach(el => el.setAttribute("data-reveal", ""));
  gsap.set(revealables, { autoAlpha: 0, y: 50 });
  ScrollTrigger.batch(revealables, {
    start: "top 88%",
    once: true,
    onEnter: batch => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, stagger: .08, ease: "expo.out", overwrite: "auto" }),
  });

  // Footer name slides in sideways as you reach the end
  gsap.fromTo(".footer-name", { yPercent: 35, autoAlpha: 0 }, {
    yPercent: 0, autoAlpha: 1, ease: "none",
    scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  // Thin progress line along the top
  gsap.to(".scroll-progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  root.classList.remove("js-anim");
  window.addEventListener("load", () => ScrollTrigger.refresh());
}
