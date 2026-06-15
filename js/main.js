/* =========================================
   CLÍNICA SML — main.js  v4
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════
     LOGO ANIMATION — Web Animations API
     element.animate() é compositado pelo browser
     (GPU), muito mais fluido que @keyframes com
     várias animações simultâneas + sem flash de
     classe toggling.
  ══════════════════════════════════════ */
  const EASE_IN  = 'cubic-bezier(.16,.84,.24,1)';   // entrada suave e longa
  const EASE_OUT = 'cubic-bezier(.6,0,.8,.3)';      // saída suave e longa

  function animateLogo(root, { loop = false } = {}) {
    if (!root) return null;
    const pre  = root.querySelector('.pre');
    const mono = root.querySelector('.mono');
    const rule = root.querySelector('.rule');
    const sub  = root.querySelector('.sub');
    const parts = [pre, mono, rule, sub].filter(Boolean);

    // cancela animações anteriores
    parts.forEach(el => el.getAnimations().forEach(a => a.cancel()));

    const enterDur = 1500;  // duração da entrada de cada elemento — mais lenta
    const stagger  = 260;   // intervalo entre cada elemento começar — mais espaçado

    const fillMode = 'forwards';

    const anims = [];

    if (pre) anims.push(pre.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: enterDur, delay: 0,            easing: EASE_IN, fill: fillMode }
    ));

    if (mono) anims.push(mono.animate(
      [
        { opacity: 0, letterSpacing: '.3em', transform: 'scale(.96)' },
        { opacity: 1, letterSpacing: '.08em', transform: 'scale(1)' }
      ],
      { duration: enterDur + 300, delay: stagger,     easing: EASE_IN, fill: fillMode }
    ));

    if (rule) anims.push(rule.animate(
      [
        { opacity: 0, transform: 'scaleX(0)' },
        { opacity: 1, transform: 'scaleX(1)' }
      ],
      { duration: enterDur, delay: stagger * 2.4, easing: 'cubic-bezier(.4,0,.2,1)', fill: fillMode }
    ));

    if (sub) anims.push(sub.animate(
      [
        { opacity: 0, transform: 'translateY(10px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ],
      { duration: enterDur, delay: stagger * 3.2, easing: EASE_IN, fill: fillMode }
    ));

    if (!loop) return anims;

    // ─ Loop: após ficar visível por holdMs, faz fade-out lento
    //   e reinicia a entrada — sempre via WAAPI, sem remover classes.
    const totalEnter = stagger * 3.2 + enterDur; // tempo até tudo visível
    const holdMs      = 14000;                    // tempo visível — bem mais longo
    const exitDur     = 1400;                     // saída mais lenta

    setTimeout(function cycle() {
      const exitAnims = parts.map((el, i) => el.animate(
        [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-8px)' }
        ],
        { duration: exitDur, delay: i * 90, easing: EASE_OUT, fill: 'forwards' }
      ));

      Promise.all(exitAnims.map(a => a.finished)).then(() => {
        animateLogo(root, { loop: true });
      });
    }, totalEnter + holdMs);

    return anims;
  }

  /* ══════════════════════════════════════
     SPLASH — aparece, anima uma vez, sai
  ══════════════════════════════════════ */
  const splash     = document.getElementById('splash');
  const splashLogo = document.getElementById('splashLogo');

  if (splash) {
    document.body.classList.add('splashing');
    animateLogo(splashLogo, { loop: false });
    setTimeout(() => {
      splash.classList.add('hide');
      document.body.classList.remove('splashing');
    }, 3200);
  }

  // Nav e footer: loop contínuo, fases distintas para não sincronizar
  const navLogo    = document.getElementById('navLogo');
  const footerLogo = document.getElementById('footerLogo');
  if (navLogo)    animateLogo(navLogo,    { loop: true });
  if (footerLogo) setTimeout(() => animateLogo(footerLogo, { loop: true }), 1800);

  /* ══════════════════════════════════════
     NAV scroll shadow
  ══════════════════════════════════════ */
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('sc', scrollY > 8), { passive: true });

  /* ══════════════════════════════════════
     MOBILE DRAWER
  ══════════════════════════════════════ */
  const burger   = document.getElementById('burger');
  const drawer   = document.getElementById('drawer');
  const drawerBg = document.getElementById('drawerBg');

  function openDrawer()  { drawer.classList.add('open');    burger.classList.add('open');    document.body.style.overflow='hidden'; }
  function closeDrawer() { drawer.classList.remove('open'); burger.classList.remove('open'); document.body.style.overflow=''; }

  if (burger && drawer) {
    burger.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
    drawerBg?.addEventListener('click', closeDrawer);
    drawer.querySelectorAll('.dl').forEach(l => l.addEventListener('click', closeDrawer));
    document.addEventListener('keydown', e => { if (e.key==='Escape') closeDrawer(); });
  }

  /* ══════════════════════════════════════
     SCROLL REVEAL
  ══════════════════════════════════════ */
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); ro.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
  document.querySelectorAll('.rv').forEach(el => ro.observe(el));

  /* ══════════════════════════════════════
     SPECIALTIES SLIDER
  ══════════════════════════════════════ */
  const track    = document.querySelector('.spec-track');
  const cards    = Array.from(document.querySelectorAll('.spec-card'));
  const dotsWrap = document.querySelector('.slider-dots');
  const btnPrev  = document.getElementById('sliderPrev');
  const btnNext  = document.getElementById('sliderNext');

  if (track && cards.length) {
    let current = 0, perView = getPV(), startX = 0, drag = false;

    function getPV() {
      return window.innerWidth <= 640 ? 1 : window.innerWidth <= 1040 ? 2 : 4;
    }
    function cw() { return (cards[0]?.getBoundingClientRect().width || 0) + 16; }

    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      const tot = Math.ceil(cards.length / perView);
      for (let i = 0; i < tot; i++) {
        const d = document.createElement('button');
        d.className = 'slider-dot' + (i === current ? ' active' : '');
        d.setAttribute('aria-label', `Slide ${i+1}`);
        d.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(d);
      }
    }
    function goTo(idx) {
      const tot = Math.ceil(cards.length / perView);
      current = Math.max(0, Math.min(idx, tot - 1));
      track.style.transform = `translateX(-${current * perView * cw()}px)`;
      dotsWrap?.querySelectorAll('.slider-dot').forEach((d,i) => d.classList.toggle('active', i===current));
      if (btnPrev) btnPrev.disabled = current === 0;
      if (btnNext) btnNext.disabled = current >= tot - 1;
    }
    btnPrev?.addEventListener('click', () => goTo(current - 1));
    btnNext?.addEventListener('click', () => goTo(current + 1));
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; drag = true; }, { passive: true });
    track.addEventListener('touchend',   e => {
      if (!drag) return;
      const d = startX - e.changedTouches[0].clientX;
      if (Math.abs(d) > 50) goTo(d > 0 ? current+1 : current-1);
      drag = false;
    });
    window.addEventListener('resize', () => {
      const nv = getPV();
      if (nv !== perView) { perView = nv; current = 0; buildDots(); goTo(0); }
    });
    buildDots(); goTo(0);
  }

  /* ══════════════════════════════════════
     ANIMATED COUNTERS
  ══════════════════════════════════════ */
  function animCounter(el) {
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / 1800, 1);
      el.textContent = Math.round((1 - Math.pow(1-p, 4)) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  const co = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { animCounter(e.target); co.unobserve(e.target); } });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => co.observe(el));

  /* ══════════════════════════════════════
     ATTEND CARDS 3D TILT
  ══════════════════════════════════════ */
  document.querySelectorAll('.attend-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x*5}deg) rotateX(${-y*5}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ══════════════════════════════════════
     ACTIVE NAV LINK
  ══════════════════════════════════════ */
  const navLinks = document.querySelectorAll('.nav-links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => {
        const on = a.getAttribute('href') === `#${e.target.id}`;
        a.style.color = on ? 'var(--blue)' : '';
        a.style.background = on ? 'var(--blue-ghost)' : '';
      });
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('section[id],header[id]').forEach(s => secObs.observe(s));

  /* ══════════════════════════════════════
     SMOOTH ANCHOR SCROLL
  ══════════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const tgt = document.getElementById(id);
      if (!tgt) return;
      e.preventDefault();
      window.scrollTo({ top: tgt.getBoundingClientRect().top + scrollY - 72, behavior: 'smooth' });
    });
  });

  /* ══════════════════════════════════════
     BADGE ENTRANCE ANIMATION
  ══════════════════════════════════════ */
  document.querySelectorAll('.about-badge,.about-badge2').forEach((el, i) => {
    el.style.cssText += `opacity:0;transform:translateY(14px);transition:opacity .55s var(--ease),transform .55s var(--ease);transition-delay:${0.5+i*.14}s`;
    setTimeout(() => { el.style.opacity='1'; el.style.transform=''; }, 50);
  });

  /* ══════════════════════════════════════
     CONTACT FORM → WHATSAPP
  ══════════════════════════════════════ */
  const contactForm   = document.getElementById('contactForm');
  const emailFallback = document.getElementById('emailFallback');

  function buildMsg(data) {
    return [
      'Olá, Dr. Sandro. Gostaria de agendar uma consulta na Clínica SML.',
      '',
      `Nome: ${data.get('nome') || ''}`,
      `Telefone: ${data.get('telefone') || ''}`,
      `Tipo de atendimento: ${data.get('tipo') || ''}`,
      `Mensagem: ${data.get('mensagem') || 'Não informado'}`
    ].join('\n');
  }

  if (contactForm) {
    contactForm.addEventListener('input', () => {
      if (!emailFallback) return;
      const d = new FormData(contactForm);
      emailFallback.href = `mailto:sandromiguel201@outlook.com?subject=${
        encodeURIComponent('Contato pelo site - Clínica SML')
      }&body=${encodeURIComponent(buildMsg(d))}`;
    });
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const d = new FormData(contactForm);
      window.open(`https://wa.me/5562982592599?text=${encodeURIComponent(buildMsg(d))}`, '_blank', 'noopener');
    });
  }

  /* ══════════════════════════════════════
     DOCTOR FAB WIDGET
  ══════════════════════════════════════ */
  const doctorWidget = document.getElementById('doctorWidget');
  const doctorFab    = document.getElementById('doctorFab');
  if (doctorWidget && doctorFab) {
    doctorFab.addEventListener('click', e => { e.stopPropagation(); doctorWidget.classList.toggle('open'); });
    document.addEventListener('click', e => { if (!doctorWidget.contains(e.target)) doctorWidget.classList.remove('open'); });
  }

});
