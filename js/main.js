/* =========================================
   CLÍNICA SML — main.js
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. NAV scroll shadow ────────────────── */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('sc', scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ── 2. Mobile drawer ────────────────────── */
  const burger    = document.getElementById('burger');
  const drawer    = document.getElementById('drawer');
  const drawerBg  = document.getElementById('drawerBg');

  function toggleDrawer(open) {
    drawer.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggleDrawer(!drawer.classList.contains('open')));
  drawerBg.addEventListener('click', () => toggleDrawer(false));
  drawer.querySelectorAll('.dl').forEach(l => l.addEventListener('click', () => toggleDrawer(false)));

  /* ── 3. Scroll reveal ────────────────────── */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  document.querySelectorAll('.rv').forEach(el => revealObs.observe(el));

  /* ── 4. Specialties slider ───────────────── */
  const track  = document.querySelector('.spec-track');
  const cards  = Array.from(document.querySelectorAll('.spec-card'));
  const dotsWrap  = document.querySelector('.slider-dots');
  const btnPrev   = document.getElementById('sliderPrev');
  const btnNext   = document.getElementById('sliderNext');

  if (track && cards.length) {
    let current    = 0;
    let perView    = getPerView();
    let total      = Math.ceil(cards.length / perView);
    let startX     = 0;
    let isDragging = false;

    function getPerView() {
      if (window.innerWidth <= 640)  return 1;
      if (window.innerWidth <= 1040) return 2;
      return 4;
    }

    function getCardWidth() {
      if (!cards[0]) return 0;
      return cards[0].getBoundingClientRect().width + 16; // 16 = gap
    }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      total = Math.ceil(cards.length / perView);
      for (let i = 0; i < total; i++) {
        const d = document.createElement('button');
        d.className = 'slider-dot' + (i === current ? ' active' : '');
        d.setAttribute('aria-label', `Ir para slide ${i + 1}`);
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      }
    }

    function updateDots() {
      if (!dotsWrap) return;
      dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function goTo(idx) {
      total   = Math.ceil(cards.length / perView);
      current = Math.max(0, Math.min(idx, total - 1));
      const offset = current * perView * getCardWidth();
      track.style.transform = `translateX(-${offset}px)`;
      updateDots();
      if (btnPrev) btnPrev.disabled = current === 0;
      if (btnNext) btnNext.disabled = current === total - 1;
    }

    if (btnPrev) btnPrev.addEventListener('click', () => goTo(current - 1));
    if (btnNext) btnNext.addEventListener('click', () => goTo(current + 1));

    // Touch / drag support
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (!isDragging) return;
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
      isDragging = false;
    });
    track.addEventListener('mousedown', e => { startX = e.clientX; isDragging = true; });
    window.addEventListener('mouseup', e => {
      if (!isDragging) return;
      const diff = startX - e.clientX;
      if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
      isDragging = false;
    });

    // Recalc on resize
    window.addEventListener('resize', () => {
      const newPV = getPerView();
      if (newPV !== perView) {
        perView = newPV;
        current = 0;
        buildDots();
        goTo(0);
      }
    });

    buildDots();
    goTo(0);
  }

  /* ── 5. Animated counters ────────────────── */
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-quart
      const eased    = 1 - Math.pow(1 - progress, 4);
      const val      = Math.round(eased * target);
      el.textContent = prefix + val.toLocaleString('pt-BR') + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

  /* ── 6. Hero parallax (subtle) ───────────── */
  const heroImg = document.querySelector('.hero-img-wrap img');
  if (heroImg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < 600) heroImg.style.transform = `translateY(${y * 0.12}px)`;
    }, { passive: true });
  }

  /* ── 7. Active nav link highlight ───────── */
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');

  const activeObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => {
          a.style.color = '';
          a.style.background = '';
          if (a.getAttribute('href') === `#${e.target.id}`) {
            a.style.color = 'var(--blue)';
            a.style.background = 'var(--blue-ghost)';
          }
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => activeObs.observe(s));

  /* ── 8. Attend cards hover tilt ─────────── */
  document.querySelectorAll('.attend-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── 9. Floating cards entrance delay ────── */
  const floatCards = document.querySelectorAll('.hero-float, .hero-float2, .about-badge, .about-badge2');
  floatCards.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity .55s var(--ease), transform .55s var(--ease)';
    el.style.transitionDelay = `${0.6 + i * 0.12}s`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = '';
    }, 100);
  });

  /* ── 10. Smooth anchor scrolling with offset ─ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id  = a.getAttribute('href').slice(1);
      const tgt = document.getElementById(id);
      if (!tgt) return;
      e.preventDefault();
      const top = tgt.getBoundingClientRect().top + scrollY - 74;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
