const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const navLinks = [...document.querySelectorAll(".main-nav a[href^='#']:not(.search-link)")];
const hero = document.querySelector(".hero");
const heroTitle = document.querySelector("[data-hero-title]");
const heroForeground = document.querySelector("[data-hero-foreground]");
const ctaImage = document.querySelector("[data-cta-image]");
const aboutGalleryImages = [...document.querySelectorAll("[data-about-gallery]")];
const animatedItems = document.querySelectorAll("[data-animate]");
const counters = document.querySelectorAll("[data-count]");
const cursorFollower = document.querySelector(".cursor-follower");
const coachTrack = document.querySelector("[data-coach-track]");
const coachDots = [...document.querySelectorAll("[data-coach-dot]")];
const coachCards = [...document.querySelectorAll(".coach-card")];
const profileActions = [...document.querySelectorAll(".profile-action")];
const testimonialTrack = document.querySelector("[data-testimonial-track]");
const testimonialDots = [...document.querySelectorAll("[data-testimonial-dot]")];
const courseToggles = [...document.querySelectorAll("[data-course-toggle]")];
const contactForm = document.querySelector("[data-contact-form]");
const root = document.documentElement;

let cursorFrame = null;
let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let followerFrame = null;
let followerX = cursorX;
let followerY = cursorY;
let coachPressedCard = null;
let coachPressX = 0;
let coachPressY = 0;

aboutGalleryImages.forEach((image) => {
  const images = [...image.querySelectorAll("img")];
  let index = 0;
  let timer = null;

  const setImage = (nextIndex) => {
    images[index].classList.remove("is-active");
    index = nextIndex;
    images[index].classList.add("is-active");
  };

  const stopGallery = () => {
    clearInterval(timer);
    timer = null;
    images[index]?.classList.remove("is-active");
    index = 0;
    images[index]?.classList.add("is-active");
  };

  image.addEventListener("pointerenter", () => {
    if (images.length < 2 || timer) return;

    timer = setInterval(() => {
      setImage((index + 1) % images.length);
    }, 2400);
  });

  image.addEventListener("pointerleave", stopGallery);
  image.addEventListener("blur", stopGallery);
});

const toggleCoachCard = (card) => {
  if (!card) return;

  card.classList.toggle("is-flipped");
  coachCarousel?.setPaused(coachCards.some((coachCard) => coachCard.classList.contains("is-flipped")));
};

const toggleProfileAction = (button) => {
  const isFollowing = button.classList.toggle("is-following");
  button.textContent = isFollowing ? "siguiendo" : "seguir";
  button.setAttribute("aria-pressed", String(isFollowing));
};

const setHeaderState = () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
};

const setActiveNavLink = () => {
  const currentPosition = window.scrollY + window.innerHeight * 0.38;
  let activeId = "home";

  navLinks.forEach((link) => {
    const targetId = link.getAttribute("href").slice(1);
    const target = document.getElementById(targetId);

    if (target && target.getBoundingClientRect().top + window.scrollY <= currentPosition) {
      activeId = targetId;
    }
  });

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
  });
};

const setHeroDepth = () => {
  if (!hero || !heroTitle || !heroForeground) return;

  const heroRect = hero.getBoundingClientRect();
  const progress = Math.min(Math.max(-heroRect.top / (hero.offsetHeight * 0.62), 0), 1);
  const titleShift = progress * 330;
  const foregroundShift = progress * 4;
  const foregroundScale = 1.015 + progress * 0.003;

  heroTitle.style.setProperty("--hero-title-shift", `${titleShift}px`);
  heroForeground.style.transform = `translate3d(0, ${foregroundShift}px, 0) scale(${foregroundScale})`;
};

const setCtaDepth = () => {
  if (!ctaImage) return;

  const rect = ctaImage.parentElement.getBoundingClientRect();
  const start = window.innerHeight;
  const end = Math.max(window.innerHeight * 0.15, rect.height * 0.25);
  const progress = Math.min(Math.max((start - rect.top) / (start - end), 0), 1);
  const imageY = 8 + progress * 48;

  ctaImage.style.setProperty("--cta-image-y", `${imageY}%`);
};

const setCursorLight = () => {
  cursorFrame = null;
  root.style.setProperty("--cursor-x", `${cursorX}px`);
  root.style.setProperty("--cursor-y", `${cursorY}px`);
};

const moveCursorLight = (event) => {
  if (!window.matchMedia("(pointer: fine)").matches) return;

  cursorX = event.clientX;
  cursorY = event.clientY;
  document.body.classList.add("has-cursor-light");
  cursorFollower?.classList.add("is-visible");

  if (!cursorFrame) {
    cursorFrame = requestAnimationFrame(setCursorLight);
  }

  if (!followerFrame) {
    followerFrame = requestAnimationFrame(moveCursorFollower);
  }
};

const moveCursorFollower = () => {
  if (!cursorFollower) return;

  followerX += (cursorX - followerX) * 0.32;
  followerY += (cursorY - followerY) * 0.32;
  cursorFollower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0) translate(-50%, -50%)`;

  if (Math.abs(cursorX - followerX) > 0.1 || Math.abs(cursorY - followerY) > 0.1) {
    followerFrame = requestAnimationFrame(moveCursorFollower);
  } else {
    followerFrame = null;
  }
};

const setCursorTarget = (event) => {
  const target = event.target.closest("a, button, .coach-card, .course-marker, .testimonial, .benefit");
  cursorFollower?.classList.toggle("is-active", Boolean(target));
};

const createCarousel = ({ track, dots, shiftProperty, dragProperty, interval = 4200 }) => {
  if (!track || !dots.length) return null;

  let page = 0;
  let timer = null;
  let startX = 0;
  let dragX = 0;
  let dragging = false;
  let dragged = false;
  let paused = false;

  const setPage = (nextPage) => {
    const pageCount = track.children.length;
    const pageWidth = track.parentElement.clientWidth;

    page = (nextPage + pageCount) % pageCount;
    track.style.setProperty(shiftProperty, `${page * pageWidth}px`);
    track.style.setProperty(dragProperty, "0px");
    dots.forEach((dot, index) => {
      dot.hidden = index >= pageCount;
      dot.classList.toggle("on", index === page);
    });
  };

  const start = () => {
    clearInterval(timer);
    if (paused) return;
    timer = setInterval(() => setPage(page + 1), interval);
  };

  const stop = () => {
    clearInterval(timer);
    timer = null;
  };

  const dragStart = (event) => {
    if (event.target.closest(".profile-action")) return;

    dragging = true;
    dragged = false;
    startX = event.clientX;
    dragX = 0;
    clearInterval(timer);
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  };

  const dragMove = (event) => {
    if (!dragging) return;

    dragX = event.clientX - startX;
    dragged = Math.abs(dragX) > 8;
    track.style.setProperty(dragProperty, `${dragX}px`);
  };

  const dragEnd = () => {
    if (!dragging) return;

    const pageWidth = track.parentElement.clientWidth;
    const shouldSlide = Math.abs(dragX) > Math.min(pageWidth * 0.22, 120);
    const direction = dragX < 0 ? 1 : -1;

    dragging = false;
    track.classList.remove("is-dragging");
    track.dataset.wasDragged = dragged ? "true" : "false";
    window.setTimeout(() => {
      track.dataset.wasDragged = "false";
    }, 0);
    setPage(shouldSlide ? page + direction : page);
    start();
  };

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      setPage(index);
      start();
    });
  });

  track.addEventListener("pointerdown", dragStart);
  track.addEventListener("pointermove", dragMove);
  track.addEventListener("pointerup", dragEnd);
  track.addEventListener("pointercancel", dragEnd);
  track.addEventListener("lostpointercapture", dragEnd);

  setPage(0);
  start();

  return {
    refresh: () => setPage(page),
    setPaused: (isPaused) => {
      paused = isPaused;
      if (isPaused) {
        stop();
      } else {
        start();
      }
    }
  };
};

const coachCarousel = createCarousel({
  track: coachTrack,
  dots: coachDots,
  shiftProperty: "--coach-shift",
  dragProperty: "--coach-drag"
});

const testimonialCarousel = createCarousel({
  track: testimonialTrack,
  dots: testimonialDots,
  shiftProperty: "--testimonial-shift",
  dragProperty: "--testimonial-drag",
  interval: 4600
});

coachTrack?.addEventListener(
  "pointerdown",
  (event) => {
    if (event.target.closest(".profile-action")) {
      coachPressedCard = null;
      return;
    }

    coachPressedCard = event.target.closest(".coach-card");
    coachPressX = event.clientX;
    coachPressY = event.clientY;
  },
  true
);

window.addEventListener(
  "pointerup",
  (event) => {
    if (event.target.closest(".profile-action")) {
      coachPressedCard = null;
      return;
    }

    if (!coachPressedCard) return;

    const moved = Math.hypot(event.clientX - coachPressX, event.clientY - coachPressY);
    const card = coachPressedCard;
    coachPressedCard = null;

    if (moved <= 10) {
      toggleCoachCard(card);
    }
  },
  true
);

window.addEventListener("pointercancel", () => {
  coachPressedCard = null;
});

profileActions.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    coachPressedCard = null;
  });

  button.addEventListener("pointerup", (event) => {
    event.stopPropagation();
    coachPressedCard = null;
    toggleProfileAction(button);
  });

  button.addEventListener("click", (event) => {
    event.stopPropagation();
  });
});

setHeaderState();
setActiveNavLink();
setHeroDepth();
setCtaDepth();
window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("scroll", setActiveNavLink, { passive: true });
window.addEventListener("scroll", setHeroDepth, { passive: true });
window.addEventListener("scroll", setCtaDepth, { passive: true });
window.addEventListener("resize", setHeroDepth);
window.addEventListener("resize", setCtaDepth);
window.addEventListener("resize", setActiveNavLink);
window.addEventListener("resize", () => {
  coachCarousel?.refresh();
  testimonialCarousel?.refresh();
});
window.addEventListener("pointermove", moveCursorLight, { passive: true });
window.addEventListener("pointerover", setCursorTarget);
window.addEventListener("pointerout", setCursorTarget);
window.addEventListener("pointerleave", () => {
  document.body.classList.remove("has-cursor-light");
  cursorFollower?.classList.remove("is-visible", "is-active");
});

menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

courseToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const point = toggle.closest(".course-point");
    const isOpen = point.classList.toggle("is-open");

    toggle.setAttribute("aria-expanded", String(isOpen));
  });
});

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const button = contactForm.querySelector("button");
  if (!button) return;

  button.textContent = "Mensaje enviado";
  setTimeout(() => {
    button.textContent = "Enviar";
  }, 2200);
});

const runCounter = (counter) => {
  if (counter.dataset.done) return;
  counter.dataset.done = "true";

  const target = Number(counter.dataset.count);
  const duration = 1200;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `+${Math.round(target * eased)}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      entry.target.querySelectorAll("[data-count]").forEach(runCounter);
      if (entry.target.matches("[data-count]")) runCounter(entry.target);
      observer.unobserve(entry.target);
    });
  },
  {
    rootMargin: "0px 0px -18% 0px",
    threshold: 0.35
  }
);

animatedItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index % 5, 4) * 80}ms`;
  observer.observe(item);
});

counters.forEach((counter) => observer.observe(counter));
