/* KINUMITS — shared site behaviour. Vanilla JS, no dependencies. */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = !links.classList.contains("open");
      links.classList.toggle("open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  /* ---------- Active nav link (in case a page forgets to mark it) ---------- */
  var current = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === current || (current === "" && href === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Scroll reveal ----------
     Elements start fully visible (see CSS). Only once we're sure we can animate
     them do we opt them into the hidden "pending" state — and a timeout guarantees
     every element is force-shown even if something goes wrong. Nothing the person
     needs to read can ever get stuck invisible. */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && !reduceMotion && "IntersectionObserver" in window) {
    revealEls.forEach(function (el, i) {
      el.classList.add("reveal-pending");
      el.dataset.revealIndex = i % 6;
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var el = entry.target;
            var delay = Math.min(parseInt(el.dataset.revealIndex || 0, 10) * 60, 300);
            setTimeout(function () { el.classList.add("in"); }, delay);
            io.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });

    // Safety net: force-reveal anything still pending after 2.5s (e.g. odd layouts
    // where an element never technically "intersects").
    setTimeout(function () {
      document.querySelectorAll(".reveal-pending:not(.in)").forEach(function (el) {
        el.classList.add("in");
      });
    }, 2500);
  }

  /* ---------- Vitals / stat readouts (count up once, on view) ---------- */
  var stats = document.querySelectorAll("[data-count]");
  if (stats.length) {
    function runCount(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      if (reduceMotion) { el.textContent = target.toFixed(dec); return; }
      var t0 = null, dur = 1100;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { runCount(entry.target); statIo.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      stats.forEach(function (el) { statIo.observe(el); });
    } else {
      stats.forEach(runCount);
    }
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
