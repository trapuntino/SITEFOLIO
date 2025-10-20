let playSequence;

// -------------LOADER + BACKGROUND PARTICLES + MOUSE REPULSION --------------- //

window.addEventListener('load', () => {
  // Canvas permanenti e temporanei
  const backgroundCanvas = document.getElementById('background-canvas');
  const backgroundCtx = backgroundCanvas.getContext('2d');

  const loaderCanvas = document.getElementById('loader-canvas');
  const loaderCtx = loaderCanvas.getContext('2d');

  const loader = document.getElementById('loader');
  const logo = document.getElementById('logo-loader');
  const progressBar = document.getElementById('progress-bar');
  const loadingText = document.getElementById('loading-text');

  const texts = [
    "Lighting up pixels ...",
    "Starting balding.exe ...",
    "Stretching a little bit ...",
    "Almost done!"
  ];

  const formingPixels = [];
  const loaderFreePixels = [];
  const backgroundFreePixels = [];

  const mouse = { x: null, y: null }; // 👈 mouse position

  let percent = 0;
  let isLoaded = false;

  function resizeCanvas() {
    backgroundCanvas.width = window.innerWidth;
    backgroundCanvas.height = window.innerHeight;
    loaderCanvas.width = window.innerWidth;
    loaderCanvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // 👁️‍🗨️ Rileva movimento del mouse
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  // CREA PARTICELLE SFONDO (permanenti - responsive)
  const screenArea = window.innerWidth * window.innerHeight;
  const density = 8000;
  const freeCount = Math.min(500, Math.max(30, Math.floor(screenArea / density)));

  for (let i = 0; i < freeCount; i++) {
    backgroundFreePixels.push({
      x: Math.random() * backgroundCanvas.width,
      y: Math.random() * backgroundCanvas.height,
      size: 2 + Math.random() * 1.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4
    });
  }


  // CREA PARTICELLE DEL LOADER
  const logoImg = new Image();
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  const targetPoints = [];

  logoImg.src = logo.src;
  logoImg.onload = () => {
    tempCanvas.width = logoImg.width;
    tempCanvas.height = logoImg.height;
    tempCtx.drawImage(logoImg, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, logoImg.width, logoImg.height);

    for (let y = 0; y < logoImg.height; y += 1) {
      for (let x = 0; x < logoImg.width; x += 1) {
        const i = (y * logoImg.width + x) * 4;
        const alpha = imageData.data[i + 3];
        if (alpha > 128) {
          targetPoints.push({
            tx: loaderCanvas.width / 2 - logoImg.width / 2 + x,
            ty: loaderCanvas.height / 2 - logoImg.height / 2 - 80 + y
          });
        }
      }
    }

    for (let i = 0; i < targetPoints.length; i++) {
      const tp = targetPoints[i];
      const isMover = Math.random() < 0.5;

      if (isMover) {
        formingPixels.push({
          x: Math.random() * loaderCanvas.width,
          y: Math.random() * loaderCanvas.height,
          tx: tp.tx,
          ty: tp.ty,
          size: 2,
          vx: 0,
          vy: 0,
          type: 'mover'
        });
      } else {
        formingPixels.push({
          x: tp.tx,
          y: tp.ty,
          tx: tp.tx,
          ty: tp.ty,
          size: 2,
          vx: 0,
          vy: 0,
          type: 'static'
        });
      }
    }

    for (let i = 0; i < 150; i++) {
      loaderFreePixels.push({
        x: Math.random() * loaderCanvas.width,
        y: Math.random() * loaderCanvas.height,
        size: 2 + Math.random() * 1.5,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.4
      });
    }

    animateLoader();
    animateBackground();
  };

  function animateBackground() {
    backgroundCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    backgroundCtx.fillStyle = '#000000';

    backgroundFreePixels.forEach(p => {
      // calcola distanza dal mouse
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = 80;

      if (dist < minDist) {
        const angle = Math.atan2(dy, dx);
        const force = (minDist - dist) / minDist;
        const repel = force * 2;
        p.x += Math.cos(angle) * repel;
        p.y += Math.sin(angle) * repel;
      } else {
        p.x += p.speedX;
        p.y += p.speedY;
      }

      if (p.x < 0) p.x = backgroundCanvas.width;
      if (p.x > backgroundCanvas.width) p.x = 0;
      if (p.y < 0) p.y = backgroundCanvas.height;
      if (p.y > backgroundCanvas.height) p.y = 0;

      backgroundCtx.fillRect(p.x, p.y, p.size, p.size);
    });

    requestAnimationFrame(animateBackground);
  }

  function animateLoader() {
    loaderCtx.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);
    loaderCtx.fillStyle = '#000000';

    loaderFreePixels.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = loaderCanvas.width;
      if (p.x > loaderCanvas.width) p.x = 0;
      if (p.y < 0) p.y = loaderCanvas.height;
      if (p.y > loaderCanvas.height) p.y = 0;

      loaderCtx.fillRect(p.x, p.y, p.size, p.size);
    });

    formingPixels.forEach(p => {
      if (p.type === 'mover') {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const attraction = 0.01 + (percent / 100) * 0.04;
        const wander = (1 - percent / 100) * 0.5;

        p.vx += dx * attraction + (Math.random() - 0.5) * wander;
        p.vy += dy * attraction + (Math.random() - 0.5) * wander;

        p.vx *= 0.9;
        p.vy *= 0.9;

        p.x += p.vx;
        p.y += p.vy;

        loaderCtx.fillStyle = 'rgba(0,0,0,1)';
        loaderCtx.fillRect(p.x, p.y, p.size, p.size);

      } else if (p.type === 'static') {
        const alpha = percent / 100;
        loaderCtx.fillStyle = `rgba(0,0,0,${alpha})`;
        loaderCtx.fillRect(p.x, p.y, p.size, p.size);
      }
    });







    if (!isLoaded) requestAnimationFrame(animateLoader);
  }

  const loaderDuration = 4000; // ms
  let startTime = null;
  let rafId = null;

  function animateProgress(timestamp) {
    if (startTime === null) startTime = timestamp;

    const elapsed = timestamp - startTime;
    const rawProgress = Math.min(1, elapsed / loaderDuration);
    const eased = 1 - Math.pow(1 - rawProgress, 3); // ease-out

    percent = eased * 100;

    // UI progress
    if (progressBar) progressBar.style.width = percent + '%';
    if (percent < 25) loadingText.textContent = texts[0];
    else if (percent < 50) loadingText.textContent = texts[1];
    else if (percent < 75) loadingText.textContent = texts[2];
    else loadingText.textContent = texts[3];

    if (percent > 25 && logo && !logo.classList.contains('visible')) {
      logo.classList.add('visible');
    }

    if (rawProgress < 1) {
      // continua a richiamare il loop finché non abbiamo finito
      rafId = requestAnimationFrame(animateProgress);
      return;
    }

    // === FINE LOADER ===
    if (rafId) cancelAnimationFrame(rafId);
    isLoaded = true; // ferma animateLoader()

    // aspetta che i modelli/animazioni siano pronti, poi rimuovi il loader
    Promise.all([modelPromise, window.animationPreloadPromise])
      .catch(() => { }) // anche in caso di errore, proseguiamo
      .then(() => {
        setTimeout(() => {
          if (loader) {
            loader.style.transition = 'opacity 0.6s ease';
            loader.style.opacity = '0';
          }
          // rimuovi dopo il fade
          setTimeout(() => {
            logo?.remove();
            loader?.remove();

            showSection('home');
            typeWriter(
              "Hi! I'm Fabrizio, a communication designer blending clarity, visuals and just enough chaos.",
              'typewriter-text'
            );
            playSequence(['standing_up', 'stretch', 'point']);
          }, 600);
        }, 0);
      });
  }

  // avvio del loop di avanzamento
  rafId = requestAnimationFrame(animateProgress);


});



// -------------CORPO--------------- //

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const container = document.getElementById('viewport-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = null;
const clock = new THREE.Clock();


const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 4, 6);

const cameraTarget = new THREE.Vector3(0, 4, 6);
const lookTarget = new THREE.Vector3(0, 2, 0);
let fovTarget = 75;

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
scene.add(light);

let trackedModel;
let mixer;
let targetRotationX = 0;
let targetRotationY = 0;

let isInFightMode = false;
let hitCount = 0;
let isPlayingAnimation = false;


import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'); // usa i decoder ufficiali Google
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);


const modelPromise = new Promise((resolve, reject) => {
  loader.load('model.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(3, 3, 3);
    model.position.set(0, 0, 0);
    scene.add(model);
    trackedModel = model;

    mixer = new THREE.AnimationMixer(trackedModel);
    const animLoader = new GLTFLoader();
    animLoader.setDRACOLoader(dracoLoader);
    const animations = {};
    let currentAction;

    function loadClip(name) {
      return new Promise((resolve, reject) => {
        if (animations[name]) return resolve(animations[name]);
        animLoader.load(`${name}.glb`, gltf => {
          const clip = gltf.animations[0];
          animations[name] = clip;
          resolve(clip);
        }, undefined, reject);
      });
    }

    playSequence = function (names, onEnd) {
      if (!names.length) {
        isPlayingAnimation = false;
        if (onEnd) onEnd();
        return;
      }

      const [current, ...rest] = names;

      loadClip(current).then(clip => {
        animations[current] = clip;
        const newAction = mixer.clipAction(clip);

        if (currentAction && currentAction !== newAction) {
          currentAction.crossFadeTo(newAction, 0.4, false);
        } else {
          newAction.fadeIn(0.4);
        }


        newAction.reset();
        newAction.setLoop(THREE.LoopOnce);
        newAction.clampWhenFinished = true;
        isPlayingAnimation = true;
        newAction.play();
        currentAction = newAction;

        const onEndClip = (e) => {
          if (e.action !== newAction) return; // 🛡️ ignora eventi di altre animazioni
          mixer.removeEventListener('finished', onEndClip);

          if (rest.length > 0) {
            playSequence(rest, onEnd);
          } else {
            isPlayingAnimation = false;
            if (onEnd) onEnd();
          }
        };
        mixer.addEventListener('finished', onEndClip);

      });
    };

    const preloadAnimations = [
      'standing_up',
      'stretch',
      'point',
      'standing_to_fight',
      'fight_to_standing',
      'hit_1',
      'punch_1',
      'hit_2',
      'punch_2',
      'ko',
      'getting_up',
      'backflip',
      'uprock',
      'flair_in',
      'flair',
      'flair_out'
    ];

    window.animationPreloadPromise = Promise.all(
      preloadAnimations.map(name => loadClip(name))
    ).then(() => resolve());

    function enterFightMode() {
      if (isPlayingAnimation) return;
      isInFightMode = true;
      hitCount = 0;

      light.color.set(0xff6057);
      light.groundColor.set(0x000000);
      light.intensity = 5;

      playSequence(['standing_to_fight']);
    }

    function exitFightMode() {
      if (isPlayingAnimation) return;
      isInFightMode = false;

      light.color.set(0xffffff);
      light.groundColor.set(0x444444);
      light.intensity = 4;

      playSequence(['fight_to_standing']);
    }

    function toggleFightMode() {
      if (isInFightMode) {
        exitFightMode();
      } else {
        enterFightMode();
      }
    }

    function registerHit() {
      if (!isInFightMode || isPlayingAnimation) return;
      hitCount += 1;

      if (hitCount === 1) {
        playSequence(['hit_1', 'punch_1']);
      } else if (hitCount === 2) {
        playSequence(['hit_2', 'punch_2']);
      } else {
        playSequence(['ko'], () => {
          playSequence(['getting_up'], () => {
            toggleFightMode();
            playSequence(['point']);
          });
        });
      }
    }

    renderer.domElement.addEventListener('click', () => {
      if (isInFightMode) registerHit();
    });

    const fightBtn = document.getElementById('fight-mode-btn');
    if (fightBtn) {
      fightBtn.addEventListener('click', () => {
        toggleFightMode();
        fightBtn.classList.toggle('active', isInFightMode);
      });
    }

    const backflipBtn = document.getElementById('backflip-btn');
    if (backflipBtn) {
      backflipBtn.addEventListener('click', () => {
        if (isPlayingAnimation) return;
        playSequence(['backflip'
        ], () => {
          playSequence(['point']);
        });
      });
    }

    const danceBtn = document.getElementById('dance-btn');
    if (danceBtn) {
      danceBtn.addEventListener('click', () => {
        if (isPlayingAnimation) return;
        playSequence([
          'uprock',
          'flair_in',
          'flair',
          'flair_out'
        ], () => {
          playSequence(['point']);
        });

      });
    }

  }, undefined, reject);
});



function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);


  camera.position.lerp(cameraTarget, 0.05);
  camera.fov += (fovTarget - camera.fov) * 0.05;
  camera.updateProjectionMatrix();
  camera.lookAt(lookTarget);

  if (trackedModel) {
    trackedModel.rotation.y += (targetRotationY - trackedModel.rotation.y) * 0.1;
    trackedModel.rotation.x += (targetRotationX - trackedModel.rotation.x) * 0.1;
  }

  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});


// NAV BAR → click sui <button class="nav-item" data-nav="...">
document.querySelectorAll('#bottom-navbar .nav-item[data-nav]')
  .forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(btn.dataset.nav);
    });
  });

// stato iniziale: mostra subito la home (testo visibile)
document.addEventListener('DOMContentLoaded', () => {
  showSection('home');
});



function typeWriter(text, elementId, speed = 40) {
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`Elemento con id "${elementId}" non trovato.`);
    return;
  }

  el.textContent = '';
  let i = 0;

  function type() {
    if (i < text.length) {
      el.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }

  type();
}


// ===== SEZIONI — solo i contenuti, NON la navbar =====
const sections = Array.from(document.querySelectorAll('[data-section]'))
  .filter(el => !el.closest('#bottom-navbar')); // evita di includere la nav

const sectionByName = Object.fromEntries(sections.map(el => [el.dataset.section, el]));
let currentSection = null;

function showSection(name) {
  if (currentSection === name) return;

  const target = sectionByName[name];
  if (!target) return;

  // 1) Nascondi tutte le sezioni
  sections.forEach(el => {
    el.classList.remove('section-visible', 'active');
    el.classList.add('section-hidden');
    el.setAttribute('aria-hidden', 'true');
    el.inert = true;
  });

  window.hideHoverVideo?.();

  // 2) Mostra la sezione target
  target.classList.remove('section-hidden', 'hidden'); // rimuove eventuale legacy
  target.classList.add('section-visible', 'active');
  target.setAttribute('aria-hidden', 'false');
  target.inert = false;

  // 3) Stato globale (utile per CSS condizionale)
  document.body.dataset.section = name;
  currentSection = name;

  // 4) Viewport 3D: inquadra in base alla sezione
  if (name === 'cv') {
    fovTarget = 35;
    cameraTarget.set(0, 5, 2.6);
    lookTarget.set(0, 5, 0);
  } else {
    fovTarget = 75;
    cameraTarget.set(0, 4, 6);
    lookTarget.set(0, 2, 0);
  }

  // 5) Works: init on-demand + scroll al blocco dopo layout
  if (name === 'progetti') {
    document.documentElement.classList.add('is-locking-works'); // 🔒 blocco scroll
    initWorks?.();
    requestAnimationFrame(() => {
      const works = document.getElementById('works-section');
      if (!works) return;
      const y = works.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top: y, behavior: 'smooth' });
      window.reflowWorksScroller?.();
    });
  } else {
    // 🧹 sblocca scroll in uscita da Works (Chrome fix)
    const html = document.documentElement;
    html.classList.remove('is-locking-works');
    void html.offsetHeight; // forza reflow su Chrome
    html.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
  }
}

// FIX SCROLL
const _unlockWatcher = new MutationObserver(() => {
  const html = document.documentElement;
  if (!html.classList.contains('is-locking-works')) {
    html.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
  }
});
_unlockWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });



// opzionale: debug
window.showSection = showSection;

/* ================= Hover video su parole (.hotword) ================= */
(function setupHoverWordVideo() {
  // crea il contenitore popup (una sola volta)
  const pop = document.createElement('div');
  pop.id = 'hover-video-pop';
  pop.setAttribute('aria-hidden', 'true');
  pop.style.display = 'none';
  pop.innerHTML = `
    <video muted playsinline loop preload="auto"></video>
  `;
  document.body.appendChild(pop);

  const video = pop.querySelector('video');
  let activeWord = null;
  let hideTimer = null;

  // posiziona vicino al mouse, con clamp ai bordi
  function positionPop(pageX, pageY) {
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = pop.getBoundingClientRect();
    let x = pageX;
    let y = pageY - 20; // un filo sopra al cursore

    // clamp per non uscire dallo schermo
    x = Math.max(margin + rect.width / 2, Math.min(vw - margin - rect.width / 2, x));
    y = Math.max(margin + rect.height / 2, Math.min(vh - margin - rect.height / 2, y));

    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
  }

  async function showPop(wordEl, pageX, pageY) {
    if (!wordEl) return;
    const src = wordEl.getAttribute('data-video');
    if (!src) return;

    clearTimeout(hideTimer);

    if (activeWord !== wordEl || video.src !== src) {
      // cambia sorgente solo se necessario
      video.pause();
      video.src = src;
      try { await video.play(); } catch { /* safari/iOS ci riprova sotto */ }
      // doppio tentativo (alcuni browser richiedono un frame)
      requestAnimationFrame(() => video.play().catch(() => { }));
    }

    activeWord = wordEl;
    pop.style.display = 'block';
    positionPop(pageX, pageY);
    // fade-in
    requestAnimationFrame(() => { pop.style.opacity = '1'; });
  }

  function hidePop(immediate = false) {
    clearTimeout(hideTimer);
    const doHide = () => {
      pop.style.opacity = '0';
      // stop video e nascondi dopo la transizione
      setTimeout(() => {
        video.pause();
        video.currentTime = 0;
        pop.style.display = 'none';
        activeWord = null;
      }, 120);
    };
    if (immediate) doHide();
    else hideTimer = setTimeout(doHide, 40);
  }

  // Event delegation per hover
  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest('.hotword');
    if (el) {
      showPop(el, e.clientX, e.clientY);
    } else if (!pop.contains(e.target)) {
      hidePop();
    }
  }, { passive: true });

  // se il mouse si muove mentre è visibile, segui il cursore
  document.addEventListener('mousemove', (e) => {
    if (pop.style.display === 'block') positionPop(e.clientX, e.clientY);
  }, { passive: true });

  // touch support: tap per mostrare, tap fuori per chiudere
  let touchOpen = false;
  document.addEventListener('touchstart', (e) => {
    const el = e.target.closest('.hotword');
    if (el) {
      const t = e.touches[0];
      showPop(el, t.clientX, t.clientY);
      touchOpen = true;
    } else if (touchOpen) {
      hidePop(true);
      touchOpen = false;
    }
  }, { passive: true });

  // se apri un modal/section change, chiudi il popup
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePop(true); });
  // opzionale: se cambi sezione nel tuo showSection, puoi fare: window.hideHoverVideo?.();
  window.hideHoverVideo = () => hidePop(true);
})();





/* ===================== WORKS: dati, render, scroll orizzontale ===================== */

// opzionale ma consigliato con Vite/GH Pages
const BASE = (import.meta?.env?.BASE_URL) || '/';

const projects = [
  {
    id: "befest",
    titolo: "Befest",
    anno: 2024,
    ambito: "Events",
    ruoli: ["Art Director", "Graphic Designer", "Social Media Manager", "Communication Strategist", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/befest/cover.webp`, alt: "Befest" },
    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Event</div>
    <h1>Befest</h1>
    <div class="meta">2024 · Branding · Art Direction & Production</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Logo and mascot design
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Typographic and color system
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Event signage and illustrations
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Social content
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/befest/cover.webp" alt="BeFest cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Create a visual identity that could define the festival’s character: bold, playful, and instantly recognizable.
    </p>
    <p style="margin:0;line-height:1.6;">
      I was responsible for the visual direction, social media management, and all graphic outputs: logo, signage, 
      communication materials, and animated illustrations; while coordinating the video and photo production. 
      The visual identity was conceived as a lively, modular system capable of adapting to multiple formats 
      and maintaining a strong, consistent personality across platforms.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
    BeFest is an electronic music event that gathered around a thousand people for a day of sound and visuals. 
      As Purple Studio, we handled the entire communication — from social strategy and content production 
      to the brand identity and the visual setup of the event. The identity revolves around a mascot representing 
      the ironic and inclusive spirit of the festival, developed into a flexible and recognizable graphic system.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/befest/befest_hero.webp" alt="BeFest Hero Visual" style="width:100%;display:block;">
      <img src="portfolio/befest/befest_1.webp" alt="BeFest Visual 1" style="width:100%;display:block;">
      <video src="portfolio/befest/befest_bts_1.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/befest/befest_3.webp" alt="BeFest Visual 3" style="width:100%;display:block;">
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/befest/befest_2.webp" alt="BeFest Visual 2" style="width:100%;display:block;">
      <img src="portfolio/befest/befest_4.webp" alt="BeFest Visual 4" style="width:100%;display:block;">
      <video src="portfolio/befest/befest_bts_2.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/befest/befest_6.webp" alt="BeFest Visual 6" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/befest/befest_5.webp" alt="BeFest Visual 5" style="width:100%;display:block;">
      <img src="portfolio/befest/befest_7.webp" alt="BeFest Visual 7" style="width:100%;display:block;">
      <img src="portfolio/befest/befest_bts_3.webp" alt="BeFest Visual 6" style="width:100%;display:block;">
      <img src="portfolio/befest/befest_8.webp" alt="BeFest Visual 8" style="width:100%;display:block;">
    </div>
  </div>
</section>
`



  },

  {
    id: "retrogusto",
    titolo: "Retrogusto",
    anno: 2025,
    ambito: "3D & Motion Graphics",
    ruoli: ["Graphic Designer", "Art Director"],
    cover: { type: "video", src: `${BASE}portfolio/retrogusto/cover.mp4`, poster: `${BASE}portfolio/retrogusto/poster.webp` },
    pageHTML: `
    <section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Event format</div>
    <h1>Retrogusto</h1>
    <div class="meta">2025 · Event format · Visual Identity & Content production</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Naming - logo design - payoff
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        3D logo animation
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Social video production (9:16)
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <video src="portfolio/retrogusto/cover.mp4" autoplay loop muted playsinline style="width:100%;height:auto;display:block;"></video>
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Develop the visual identity for Retrogusto, a summer format hosted at Ostello Alpino in Bormio — open-air afternoons of music, drinks, and alpine garden vibes. 
      The goal was to craft a recognizable and adaptable identity that could grow across editions, translating the essence of summer leisure into a distinctive visual system.
    </p>
    <p style="margin:0;line-height:1.6;">
      I led naming and logo design, created a 3D animated mark, and produced final social video assets in 9:16 for distribution.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      Each release features a color variation of the logo matched to the drink of the day, turning the series into a playful, chromatic experience. 
      The identity captures the relaxed, sun-soaked mood of the 2025 summer at Ostello Alpino — casual, fresh, and effortlessly inviting — while keeping motion design central to its character.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/retrogusto/retrogusto_hero.webp" alt="Retrogusto Hero" style="width:100%;display:block;">
      <video src="portfolio/retrogusto/retrogusto_1.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/retrogusto/retrogusto_2.webp" alt="Retrogusto Visual 2" style="width:100%;display:block;">
      
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/retrogusto/retrogusto_3.webp" alt="Retrogusto Visual 3" style="width:100%;display:block;">
      <video src="portfolio/retrogusto/retrogusto_5.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/retrogusto/retrogusto_4.webp" alt="Retrogusto Visual 4" style="width:100%;display:block;">
      
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/retrogusto/retrogusto_7.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/retrogusto/retrogusto_bts_3.webp" alt="Retrogusto BTS 3" style="width:100%;display:block;">
      <img src="portfolio/retrogusto/retrogusto_bts_1.webp" alt="Retrogusto BTS 1" style="width:100%;display:block;">
      <img src="portfolio/retrogusto/retrogusto_bts_4.webp" alt="Retrogusto BTS 4" style="width:100%;display:block;">
    </div>
  </div>
</section>

    `
  },

  {
    id: "sugo2025",
    titolo: "Sūgo 2025",
    anno: 2025,
    ambito: "Events",
    ruoli: ["Art Director", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/sugo2025/cover.webp`, alt: "Sūgo 2025 – event identity" },
    pageHTML: `
    <section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Event</div>
    <h1>Sūgo 2025</h1>
    <div class="meta">2025 · Event · Visual Identity & Production</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Event identity
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Social visuals
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Production coordination
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Partnership management and on-site setup
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/sugo2025/cover.webp" alt="Sūgo 2025 cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Conceive and direct a new freestyle event from scratch: creating a brand that could merge sport, music, and culture under one shared identity.<br>
      The goal was to establish Sūgo as a recognizable annual happening in Bormio, translating the raw energy of freestyle into a playful, community-driven visual language.
    </p>
    <p style="margin:0;line-height:1.6;">
      I handled the full creative direction, event identity, communication strategy, and coordinated the production and partnerships.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      Sūgo 2025 was born as a new freestyle event at the Bormio Snowpark, combining snowboarding, freeski, and music into an immersive, high-energy experience.<br>  
      The event was developed in collaboration with <strong>Bormio Ski</strong> (infrastructure & logistics), <strong>Bewhite</strong> and <strong>BeClub</strong> (food & beverage), supported by <strong>Red Bull</strong>, <strong>ON3P Skis</strong>, <strong>Out Of</strong>, <strong>Level Gloves</strong>, <strong>Union Bindings</strong> and <strong>Rider Shop</strong>.<br>  
      With almost <strong>zero budget</strong>, the campaign reached over <strong>115.000 views</strong> and <strong>28.000 unique accounts</strong>, establishing Sūgo as a new reference within the local freestyle culture.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sugo2025/sugo_1.webp" alt="Sūgo Visual 1" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_1_1.webp" alt="Sūgo Visual 1.1" style="width:100%;display:block;">
      <video src="portfolio/sugo2025/sugo_bts_1.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/sugo2025/sugo_2.webp" alt="Sūgo Visual 2" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_3.webp" alt="Sūgo Visual 3" style="width:100%;display:block;">
    <img src="portfolio/sugo2025/sugo_bts_4.webp" alt="Sūgo BTS 4" style="width:100%;display:block;"> 
    <img src="portfolio/sugo2025/sugo_11.webp" alt="Sūgo Visual 11" style="width:100%;display:block;"> 
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sugo2025/sugo_4.webp" alt="Sūgo Visual 4" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_5.webp" alt="Sūgo Visual 5" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_bts_3.webp" alt="Sūgo BTS 3" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_6.webp" alt="Sūgo Visual 6" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_7.webp" alt="Sūgo Visual 7" style="width:100%;display:block;">
      <video src="portfolio/sugo2025/sugo_bts_2.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <img src="portfolio/sugo2025/sugo_12.webp" alt="Sūgo Visual 12" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_13.webp" alt="Sūgo Visual 13" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sugo2025/sugo_8.webp" alt="Sūgo Visual 8" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_8_1.webp" alt="Sūgo Visual 8.1" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_bts_5.webp" alt="Sūgo BTS 5" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_8_2.webp" alt="Sūgo Visual 8.2" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_9.webp" alt="Sūgo Visual 9" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_bts_6.webp" alt="Sūgo BTS 6" style="width:100%;display:block;">
      <img src="portfolio/sugo2025/sugo_10.webp" alt="Sūgo Visual 10" style="width:100%;display:block;">
    </div>
  </div>
</section>

  `
  },

  {
    id: "fiat322",
    titolo: "Fiat 322",
    anno: 2023,
    ambito: "Photography",
    ruoli: "Personal Project",
    cover: { type: "image", src: `${BASE}portfolio/fiat/cover.webp`, alt: "Fiat 322 — photographic experiment" },

    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Personal Project</div>
    <h1>Fiat 322</h1>
    <div class="meta">2023 · Photography</div>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/fiat/cover.webp" alt="Fiat 322 cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- SINGLE COLUMN -->
    <div style="width:100%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/fiat/fiat_1.webp" alt="Fiat 322 – Shot 1" style="width:100%;display:block;">
      <img src="portfolio/fiat/fiat_2.webp" alt="Fiat 322 – Shot 2" style="width:100%;display:block;">
      <img src="portfolio/fiat/fiat_3.webp" alt="Fiat 322 – Shot 3" style="width:100%;display:block;">
      <img src="portfolio/fiat/fiat_4.webp" alt="Fiat 322 – Shot 4" style="width:100%;display:block;">
      <img src="portfolio/fiat/fiat_5.webp" alt="Fiat 322 – Shot 5" style="width:100%;display:block;">
    </div>
  </div>
</section>
`
  }
  ,

  {
    id: "summershred",
    titolo: "Summer Shred",
    anno: 2022,
    ambito: "Branding",
    ruoli: "Graphic Designer",
    cover: { type: "image", src: `${BASE}portfolio/summer-shred/cover.webp`, alt: "Summer Shred - Illustrazione" },
    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Branding</div>
    <h1>Summer Shred</h1>
    <div class="meta">2022 · Graphic Design · Logo & Visual System</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Logo design
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Poster design
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Social media announcement graphics
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/summer-shred/cover.webp" alt="Summer Shred cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Design the visual identity for <strong>Summer Shred</strong>, Burton Italia’s summer snowboard camp held in Cervinia.<br> 
      The challenge was to create a logo and poster that matched Burton’s strong brand language while conveying the lighter, more playful spirit of a summer edition.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      I designed the logo, poster, and social announcement assets: developing a visual tone that balanced Burton’s bold, technical identity with a fresher and more spontaneous summer energy.  
      The outcome was a clean yet characterful design that felt both on-brand and seasonally distinctive.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/summer-shred/summer_1.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/summer-shred/summer_3.webp" alt="Summer Shred Visual 3" style="width:100%;display:block;">
      <img src="portfolio/summer-shred/summer_4.webp" alt="Summer Shred Visual 4" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/summer-shred/summer_5.webp" alt="Summer Shred Visual 5" style="width:100%;display:block;">
      <img src="portfolio/summer-shred/summer_2.webp" alt="Summer Shred Visual 2" style="width:100%;display:block;">
    </div>
  </div>
</section>
`

  },

  {
    id: "3D Tyre AD",
    titolo: "Carrozzeria Sosio – 3D",
    anno: 2025,
    ambito: "3D & Motion Graphics",
    ruoli: ["Personal Project"],
    cover: { type: "video", src: `${BASE}portfolio/gomme/cover.mp4`, poster: `${BASE}portfolio/gomme/poster.webp`, alt: "Carrozzeria Sosio 3D Tyre Campaign" },
    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">3D</div>
    <h1>Carrozzeria Sosio – 3D ad</h1>
    <div class="meta">2025 · Personal Project</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        3D scene build and animation
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Lighting and composition
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/gomme/poster.webp" alt="Carrozzeria Sosio 3D Tyre Campaign poster" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Design and animate a short 3D motion video for <strong>Carrozzeria Sosio’s</strong> tyre season-switch campaign.  
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      A personal exploration in 3D and motion graphics — blending industrial forms, studio lighting, and tactile surfaces 
      to give energy and character to everyday automotive communication.  
      Scene built entirely in Blender and finalized in After Effects.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/gomme/cover.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/gomme/gomme_1.webp" alt="3D visual 1 – Tyre Campaign" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/gomme/gomme_2.webp" alt="3D visual 2 – Tyre Campaign" style="width:100%;display:block;">
    </div>
  </div>
</section>
`
  },


  {
    id: "skibike",
    titolo: "Ski & Bike Bormio",
    anno: 2025,
    ambito: "3D & Motion Graphics",
    ruoli: ["Communication Strategist", "Social Media Manager", "Graphic Designer"],
    cover: { type: "video", src: `${BASE}portfolio/skibike/cover.mp4`, poster: `${BASE}portfolio/skibike/poster.webp`, alt: "Ski & Bike — End-of-Season Campaign" },

    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Social Media Campaign</div>
    <h1>Ski & Bike — End-of-Season</h1>
    <div class="meta">2025 · 3D & Motion Graphics · Social Media Strategy</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Campaign concept and visual strategy
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        3D motion graphics and content creation
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Social media and community management
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/skibike/poster.webp" alt="Ski & Bike Campaign Poster" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Develop and manage a two-phase social media campaign for <strong>Ski & Bike</strong>, a leading bike shop based in Bormio.  
      The objective was to promote the store’s end-of-season sales while maintaining brand consistency and maximizing engagement across both local and online audiences.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      The campaign was executed in two phases: mid-August and late September; featuring different visual moods yet connected through a unified strategy.  
      I designed the 3D motion visuals, product catalogue layouts, and managed the daily communication via Meta Business Suite.  
      The campaign reached <strong>over 565,000 views</strong> and <strong>92,000 accounts</strong>, with <strong>80% of the audience being non-followers</strong>, confirming its strong reach and community genuine interest.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/skibike/skibike_hero.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
      <video src="portfolio/skibike/cover.mp4" autoplay loop muted playsinline style="width:100%;display:block;"></video>
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/skibike/skibike_1.webp" alt="Ski & Bike Visual 1" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_2.webp" alt="Ski & Bike Visual 2" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_7.webp" alt="Ski & Bike Visual 7" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_6.webp" alt="Ski & Bike Visual 6" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_10.webp" alt="Ski & Bike Visual 10" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/skibike/skibike_3.webp" alt="Ski & Bike Visual 3" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_4.webp" alt="Ski & Bike Visual 4" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_5.webp" alt="Ski & Bike Visual 5" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_7.webp" alt="Ski & Bike Visual 7" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_8.webp" alt="Ski & Bike Visual 8" style="width:100%;display:block;">
      <img src="portfolio/skibike/skibike_9.webp" alt="Ski & Bike Visual 9" style="width:100%;display:block;">
      
    </div>
  </div>
</section>
`
  }
  ,

  {
    id: "levelgloves",
    titolo: "Level Gloves",
    anno: 2023,
    ambito: "Graphic Design",
    ruoli: "Graphic Designer",
    cover: {
      type: "video",
      src: `${BASE}portfolio/level-gloves/cover.mp4`,
      poster: `${BASE}portfolio/level-gloves/poster.webp`,
      alt: "Level Gloves – Social Motion Design"
    },

    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Graphic Design</div>
    <h1>Level Gloves</h1>
    <div class="meta">2023 · Graphic Design</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Graphic system for social videos
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Layout and typographic composition
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/level-gloves/poster.webp" alt="Level Gloves — social motion design poster" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Design graphic assets for a series of short video clips created for <strong>Level Gloves</strong>’s official Instagram channel.<br>  
      The goal was to enhance brand consistency across different motion contents while keeping the visuals dynamic and product-focused.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      I created a set of motion-ready layouts and visual elements adapted to three social videos, ensuring a clean, technical aesthetic consistent with Level’s brand phylosophy.
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/level-gloves/cover.mp4" autoplay loop muted playsinline style="width:100%;display:block;" title="Level Gloves Cover Video"></video>
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/level-gloves/level_1.mp4" autoplay loop muted playsinline style="width:100%;display:block;" title="Level Gloves Social Video 1"></video>
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <video src="portfolio/level-gloves/level_3.mp4" autoplay loop muted playsinline style="width:100%;display:block;" title="Level Gloves Social Video 3"></video>
    </div>
  </div>
</section>
`
  },

  {
    id: "sito-carr",
    titolo: "Carrozzeria Sosio — Website",
    anno: 2025,
    ambito: "Web Design",
    ruoli: ["UI Designer", "Front-End Developer"],
    cover: { type: "image", src: `${BASE}portfolio/sito-carr/cover.webp`, alt: "Carrozzeria Sosio Website cover" },
    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Web Design</div>
    <h1>Carrozzeria Sosio — Website</h1>
    <div class="meta">2025 · UI Design · Front-End Development</div>

    <ul style="list-style:none;padding:0;margin:1.25rem 0 0 0;line-height:1.6;">
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Front-end development
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        Responsive and modular layout
      </li>
      <li style="display:flex;align-items:center;gap:.5rem;">
        <span style="width:10px;height:10px;background:#ff4800;display:inline-block;"></span>
        <a href="https://www.carrozzeriasosio.com" target="_blank" rel="noopener noreferrer" style="color:#000;text-decoration:underline;">Visit the website</a>
      </li>
    </ul>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/sito-carr/cover.webp" alt="Carrozzeria Sosio website cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section style="display:flex;gap:2rem;flex-wrap:wrap;align-items:flex-start;">
  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Project Scope</h3>
    <p style="margin:0 0 1rem 0;line-height:1.6;">
      Design and develop the cfront-end for the new website of <strong>Carrozzeria Sosio</strong>, a body shop in Bormio.
    </p>
  </div>

  <div style="flex:1;min-width:280px;">
    <h3 style="color:#ff4800;margin-bottom:.5rem;">Description</h3>
    <p style="margin:0;line-height:1.6;">
      I designed and coded the website from scratch, managing the entire front-end process: structure, layout, and animations.  
    </p>
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- COL 1 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sito-carr/sito_hero.webp" alt="Carrozzeria Sosio Website Hero" style="width:100%;display:block;">
      <img src="portfolio/sito-carr/sito_1.webp" alt="Website layout preview 1" style="width:100%;display:block;">
    </div>

    <!-- COL 2 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sito-carr/sito_2.webp" alt="Website layout preview 2" style="width:100%;display:block;">
      <img src="portfolio/sito-carr/sito_3.webp" alt="Website layout preview 3" style="width:100%;display:block;">
    </div>

    <!-- COL 3 -->
    <div style="width:33.333%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/sito-carr/sito_4.webp" alt="Website layout preview 4" style="width:100%;display:block;">
      <img src="portfolio/sito-carr/sito_5.webp" alt="Website layout preview 5" style="width:100%;display:block;">
    </div>
  </div>
</section>
`
  },


  {
    id: "giulia2000",
    titolo: "Giulia 2000",
    anno: 2023,
    ambito: "Photography",
    ruoli: "Personal Project",
    cover: { type: "image", src: `${BASE}portfolio/alfaromeo/cover.webp`, alt: "Giulia 2000 — photographic experiment" },

    pageHTML: `
<section class="hero" style="display:flex;align-items:flex-start;gap:2rem;flex-wrap:wrap;">
  <div style="flex:1;min-width:250px;">
    <div class="eyebrow">Personal Project</div>
    <h1>Giulia 2000</h1>
    <div class="meta">2023 · Photography</div>
  </div>

  <div style="flex:0 0 220px;max-width:220px;">
    <img src="portfolio/alfaromeo/cover.webp" alt="Giulia 2000 cover" loading="lazy" decoding="async" style="width:100%;height:auto;display:block;">
  </div>
</section>

<section class="section moodboard" style="margin-top:2rem;">
  <div style="display:flex;gap:1rem;align-items:flex-start;">
    <!-- SINGLE COLUMN -->
    <div style="width:100%;display:flex;flex-direction:column;gap:1rem;">
      <img src="portfolio/alfaromeo/alfa_1.webp" alt="Giulia 2000 – Shot 1" style="width:100%;display:block;">
      <img src="portfolio/alfaromeo/alfa_2.webp" alt="Giulia 2000 – Shot 2" style="width:100%;display:block;">
      <img src="portfolio/alfaromeo/alfa_3.webp" alt="Giulia 2000 – Shot 3" style="width:100%;display:block;">
      <img src="portfolio/alfaromeo/alfa_4.webp" alt="Giulia 2000 – Shot 4" style="width:100%;display:block;">
    </div>
  </div>
</section>
`
  }
  ,


  {
    id: "stelviopaddock",
    titolo: "Stelvio Paddock",
    anno: 2025,
    ambito: "Graphic Design",
    ruoli: ["Art Director", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/stelvio-paddock/cover.jpg`, alt: "Stelvio Paddock" },
    descrizione: "Concept in progress...",
  },

  {
    id: "selfmade",
    titolo: "This Website",
    anno: 2025,
    ambito: "Web Design",
    ruoli: ["UI Designer", "Front-End Developer"],
    cover: { type: "color", color: "#ff4800" },
    pageHTML: "", 
    noModal: true
  },

];


// Elementi base
const worksSection = document.getElementById('works-section');
const worksTrack = document.getElementById('works-track');
const worksList = document.getElementById('works-list');

let worksInited = false;
function initWorks() {
  // Render sempre (così al rientro aggiorni eventuali cambi)
  renderWorksTrack(projects);
  renderWorksList(projects);

  if (!worksInited) {
    setupWorksPin();        // registra listener una sola volta
    worksInited = true;
  } else {
    // solo reflow quando rientri
    window.reflowWorksScroller?.();
  }
}


// Render card orizzontali (desktop)
function renderWorksTrack(list) {
  worksTrack.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.dataset.id = p.id;

    let mediaEl;

    // CARD SPECIALE (tipo colore / no modale)
    if (p.cover.type === 'color') {
      mediaEl = document.createElement('div');
      mediaEl.style.background = p.cover.color;
      mediaEl.style.width = "100%";
      mediaEl.style.height = "100%";
      mediaEl.style.display = "flex";
      mediaEl.style.alignItems = "center";
      mediaEl.style.justifyContent = "center";
      mediaEl.style.color = "#000";
      mediaEl.style.fontWeight = "600";
      mediaEl.style.fontFamily = "var(--font, 'KeyframeTest', monospace)";
      mediaEl.style.textAlign = "center";
      mediaEl.style.fontSize = "1.1rem";
      mediaEl.innerHTML = "<span>I built this one myself.</span>";
    }

    // VIDEO
    else if (p.cover.type === 'video') {
      mediaEl = document.createElement('video');
      mediaEl.src = p.cover.src;
      mediaEl.poster = p.cover.poster || '';
      mediaEl.muted = true;
      mediaEl.playsInline = true;
      mediaEl.loop = true;
      mediaEl.autoplay = true;
      mediaEl.preload = 'auto';
      mediaEl.controls = false;

      mediaEl.addEventListener('loadedmetadata', () => {
        const tryPlay = () => mediaEl.play().catch(() => { });
        tryPlay();
        requestAnimationFrame(tryPlay);
      });
    }

    // IMMAGINE
    else {
      mediaEl = document.createElement('img');
      mediaEl.src = p.cover.src;
      mediaEl.alt = p.cover.alt || p.titolo;
      mediaEl.loading = 'lazy';
    }

    const overlay = document.createElement('div');
    overlay.className = 'work-overlay';
    overlay.innerHTML = `<div class="title">${p.titolo}</div><div class="subtitle">${p.anno}</div>`;

    card.appendChild(mediaEl);
    card.appendChild(overlay);

    // Disabilita apertura modale se è la card "color"
    if (p.cover.type !== 'color') {
      card.addEventListener('click', () => openProjectModal(p.id));
    }

    worksTrack.appendChild(card);
  });
}

// Render lista mobile
function renderWorksList(list) {
  worksList.innerHTML = '';

  const isMobile = window.innerWidth < 768; // rileva mobile

  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'work-row';
    row.dataset.id = p.id;

    // Cover data
    const coverSrc = p.cover?.src || '';
    const coverPoster = p.cover?.poster || '';
    const coverType = p.cover?.type || 'image';
    const coverAlt = p.cover?.alt || p.titolo;

    // Se è una card colorata → crea div arancione
    const coverHTML =
      coverType === 'color'
        ? `<div style="background:${p.cover.color};width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#000;font-weight:600;font-family:var(--font, 'KeyframeTest', monospace);text-align:center;">I built this one myself.</div>`
        : coverType === 'video' && isMobile
          ? `<img src="${coverPoster}" alt="${coverAlt}" loading="lazy" decoding="async">`
          : coverType === 'video'
            ? `<video src="${coverSrc}" poster="${coverPoster}" muted playsinline preload="metadata"></video>`
            : `<img src="${coverSrc}" alt="${coverAlt}" loading="lazy" decoding="async">`;

    row.innerHTML = `
      <div class="row-text">
        <div class="row-title">${p.titolo}</div>
        <div class="row-sub">${p.anno} · ${p.ambito}</div>
      </div>
      <div class="row-thumb">
        ${coverHTML}
      </div>
    `;

    // Disabilita click se card colorata
    if (coverType !== 'color') {
      row.addEventListener('click', () => openProjectModal(p.id));
    }

    worksList.appendChild(row);
  });
}



// ======================= WORKS MODAL =======================

const modal = document.getElementById('project-modal');
const modalClose = document.getElementById('project-modal-close');
const modalBack = document.getElementById('project-modal-backdrop');
const modalPage = document.getElementById('project-modal-page');
const modalMedia = document.getElementById('project-modal-media');
const modalText = document.querySelector('.project-modal__content');

function openProjectModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;

  // Header
  document.getElementById('project-modal-title').textContent = p.titolo || '';
  document.getElementById('project-meta-year').textContent = p.anno ?? '';
  document.getElementById('project-meta-field').textContent = p.ambito || '';

  // Reset stato
  modal.classList.remove('is-page');
  modalPage.hidden = true;
  modalPage.setAttribute('aria-hidden', 'true');
  modalPage.innerHTML = '';
  modalMedia.innerHTML = '';
  modalText.querySelector('#project-modal-desc').innerHTML = '';
  modalMedia.setAttribute('aria-hidden', 'false');
  modalText.setAttribute('aria-hidden', 'false');

  // --- PAGE MODE: se il progetto fornisce HTML "proprio" ---
  if (p.pageHTML) {
    modal.classList.add('is-page');
    modalMedia.setAttribute('aria-hidden', 'true');
    modalText.setAttribute('aria-hidden', 'true');

    const css = p.pageCSS ? `<style>${p.pageCSS}</style>` : '';
    modalPage.innerHTML = `
      <div class="container">
        ${p.pageHTML}
      </div>
      ${css}
    `;
    modalPage.hidden = false;
    modalPage.setAttribute('aria-hidden', 'false');
  } else {
    // --- FALLBACK "colonne" (media + testo) ---
    const mediaWrap = modalMedia;

    if (p.cover?.type === 'video') {
      const v = document.createElement('video');
      v.src = p.cover.src;
      v.controls = true;
      v.muted = true;
      v.playsInline = true;
      mediaWrap.appendChild(v);
    } else {
      const img = document.createElement('img');
      img.src = p.cover?.src || '';
      img.alt = p.cover?.alt || p.titolo || '';
      img.style.maxWidth = '100%';
      mediaWrap.appendChild(img);
    }

    const descEl = document.getElementById('project-modal-desc');
    if (p.descrizioneHTML) {
      descEl.innerHTML = p.descrizioneHTML;
    } else {
      descEl.textContent = p.descrizione || '';
    }
  }

  modal.classList.add('open');
  document.getElementById('project-modal-close').focus({ preventScroll: true });
}

function closeProjectModal() { modal.classList.remove('open'); }
[modalClose, modalBack].forEach(el => el && el.addEventListener('click', closeProjectModal));

// ================== WORKS FILTERS (aggiornato con switch anno) ==================

const roleSel = document.getElementById('filter-role');
const fieldSel = document.getElementById('filter-field');
const yearToggle = document.getElementById('year-toggle');
const yearLabel = document.getElementById('year-label');

// Stato corrente
let sortDescending = true;

function applyFilters() {
  const role = roleSel?.value || '';
  const field = fieldSel?.value || '';

  // Filtra in base ai valori selezionati
  const filtered = projects.filter(p => {
    const matchRole = !role || p.ruoli.includes(role);
    const matchField = !field || p.ambito === field;
    return matchRole && matchField;
  });

  // Ordina in base all'anno
  filtered.sort((a, b) => {
    const yearA = parseInt(a.anno) || 0;
    const yearB = parseInt(b.anno) || 0;
    return sortDescending ? yearB - yearA : yearA - yearB;
  });

  // Render
  renderWorksTrack(filtered);
  renderWorksList(filtered);

  // Aggiorna layout senza riattaccare i listener
  window.reflowWorksScroller?.();
}

// Event listeners
[roleSel, fieldSel].forEach(sel => sel && sel.addEventListener('change', applyFilters));

yearToggle?.addEventListener('change', () => {
  sortDescending = yearToggle.checked;
  yearLabel.textContent = sortDescending ? 'Newest' : 'Oldest';
  applyFilters();
});

// Esegui filtro iniziale all'avvio
applyFilters();


// ====================== FIX HEIGHT WORKS ======================
const filtersEl = document.getElementById('works-filters');

function updateFiltersHeight() {
  if (!filtersEl) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const filtersHeightRem = filtersEl.offsetHeight / rem;
  document.documentElement.style.setProperty('--filtersH', `${filtersHeightRem}rem`);
}

window.addEventListener('load', updateFiltersHeight);
window.addEventListener('resize', updateFiltersHeight);



/* ===== WORKS: stessa larghezza (dalla più alta) + overflow a destra + pin ===== */
async function setUniformWorkWidth() {
  const section = document.getElementById('works-section');
  const pin = document.getElementById('works-pin');
  const track = document.getElementById('works-track');
  const navbar = document.getElementById('bottom-navbar');
  const filters = document.getElementById('works-filters');
  if (!section || !pin || !track) return;

  const viewportH = window.innerHeight;
  const navH = navbar ? navbar.offsetHeight : 0;
  const filH = filters ? filters.offsetHeight : 0;

  // Altezza pin e track
  const pinH = Math.max(320, viewportH - navH - filH - 16);
  pin.style.height = pinH + 'px';
  const trackH = Math.max(280, pinH - 16);
  track.style.height = trackH + 'px';

  // ---- PRELOAD media (evita “vuoti” fuori viewport) ----
  const imgs = Array.from(track.querySelectorAll('img'));
  const vids = Array.from(track.querySelectorAll('video'));

  const preloadImg = (img) => new Promise((resolve) => {
    try { img.loading = 'eager'; } catch { }
    try { img.decoding = 'sync'; } catch { }
    try { img.fetchPriority = 'low'; } catch { }
    const src = img.currentSrc || img.src;
    if (!src || (img.complete && img.naturalWidth)) return resolve();
    const ghost = new Image();
    ghost.decoding = 'async';
    ghost.src = src;
    if (ghost.decode) ghost.decode().then(resolve).catch(() => ghost.addEventListener('load', resolve, { once: true }));
    else {
      ghost.addEventListener('load', resolve, { once: true });
      ghost.addEventListener('error', resolve, { once: true });
    }
  });

  const preloadVideoMeta = (v) => new Promise((resolve) => {
    try { v.preload = 'metadata'; } catch { }
    if (v.readyState >= 1 && v.videoWidth) return resolve();
    const done = () => { v.removeEventListener('loadedmetadata', done); resolve(); };
    v.addEventListener('loadedmetadata', done, { once: true });
    try { v.load(); } catch { }
  });

  await Promise.all([...imgs.map(preloadImg), ...vids.map(preloadVideoMeta)]);
  // ---- FINE PRELOAD ----

  // Rapporto h/w massimo (la più "alta")
  let maxHW = 0;
  imgs.forEach(img => {
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;
    maxHW = Math.max(maxHW, h / w);
  });
  vids.forEach(v => {
    const w = v.videoWidth || v.clientWidth || 1;
    const h = v.videoHeight || v.clientHeight || 1;
    maxHW = Math.max(maxHW, h / w);
  });
  if (!maxHW || !isFinite(maxHW)) maxHW = 16 / 9;

  // Larghezza card comune
  const cardW = Math.floor(trackH / maxHW);
  document.documentElement.style.setProperty('--workW', cardW + 'px');

  // Altezza sezione in base all’overflow orizzontale reale
  const totalWidth = track.scrollWidth;
  const overflowX = Math.max(0, totalWidth - window.innerWidth);
  section.style.height = Math.ceil(pinH + overflowX) + 'px';
}


/* ===== WORKS: gestione scroll — Desktop blocco Y in sezione, Mobile libero ===== */
function setupWorksPin() {
  const section = document.getElementById('works-section');
  const pin = document.getElementById('works-pin');
  const track = document.getElementById('works-track');
  if (!section || !pin || !track) return;

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const mqMobile = window.matchMedia('(max-width: 768px)');

  let lockActive = false; // true quando (desktop) siamo in sezione e Y è bloccata
  let progress01 = 0;     // 0..1 posizione orizzontale
  let lastTouchY = 0;
  const EPS = 1e-4;
  const RELEASE_DELTA = 8;
  let unlockCooldownUntil = 0;

  const ranges = () => {
    const pinH = pin.clientHeight;
    const totalWidth = track.scrollWidth;
    const overflowX = Math.max(0, totalWidth - window.innerWidth);
    const secTop = section.offsetTop;
    const secEnd = secTop + section.offsetHeight - pinH;
    const totalY = Math.max(1, secEnd - secTop);
    return { pinH, overflowX, secTop, secEnd, totalY };
  };

  const getScrollableAncestorY = (node) => {
    while (node && node !== document && node !== document.documentElement) {
      const s = window.getComputedStyle(node);
      const canScroll = /(auto|scroll|overlay)/.test(s.overflowY);
      if (canScroll && node.scrollHeight > node.clientHeight) return node;
      node = node.parentNode;
    }
    return null;
  };

  const applyProgress = (ox = ranges().overflowX) => {
    progress01 = clamp(progress01, 0, 1);
    const x = -Math.round(progress01 * ox);
    track.style.transform = `translate3d(${x}px,0,0)`;
    // notifica l'effetto bordo che il contenuto si è mosso
    window.__edgeFx_markHoverDirty?.();
  };

  const enableLock = () => {
    if (lockActive || mqMobile.matches) return;
    lockActive = true;

    document.documentElement.classList.add('is-locking-works');
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';

    const { secTop, totalY } = ranges();
    const y = clamp(window.scrollY, secTop, secTop + totalY);
    progress01 = (y - secTop) / totalY;

    window.scrollTo(0, secTop);
    applyProgress();
  };

  const disableLock = () => {
    if (!lockActive) return;
    const { secTop, totalY } = ranges();
    lockActive = false;

    document.documentElement.classList.remove('is-locking-works');
    document.documentElement.style.overflowY = '';
    document.body.style.overflowY = '';

    unlockCooldownUntil = Date.now() + 250;
    const y = secTop + progress01 * totalY;
    window.scrollTo(0, y);
  };

  const onWheel = (e) => {
    const scroller = getScrollableAncestorY(e.target);
    if (scroller) return;
    if (!lockActive) return;
    const { overflowX } = ranges();
    if (!overflowX) return;
    e.preventDefault();
    const delta = e.deltaY || e.wheelDelta || 0;
    progress01 = clamp(progress01 + (delta / overflowX), 0, 1);
    applyProgress(overflowX);
  };

  // Touch (tablet/desktop touch)
  let touchScrollTarget = null;

  const onTouchStart = (e) => {
    touchScrollTarget = getScrollableAncestorY(e.target);
    if (touchScrollTarget) return;
    if (!lockActive || mqMobile.matches) return;
    lastTouchY = e.touches[0].clientY;
    window.__edgeFx_markHoverDirty?.();
  };

  const onTouchMove = (e) => {
    if (touchScrollTarget) return;
    if (!lockActive || mqMobile.matches) return;
    const { overflowX } = ranges();
    if (!overflowX) return;
    e.preventDefault();
    const y = e.touches[0].clientY;
    const dy = lastTouchY - y;
    lastTouchY = y;
    progress01 = clamp(progress01 + (dy / overflowX), 0, 1);
    applyProgress(overflowX);
  };

  const onTouchEnd = () => { touchScrollTarget = null; };

  const onKeydown = (e) => {
    if (!lockActive) return;
    const { overflowX } = ranges();
    if (!overflowX) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const step = 40 / overflowX;
      progress01 = clamp(progress01 + (e.key === 'ArrowRight' ? step : -step), 0, 1);
      applyProgress(overflowX);
    }
    if (e.key === 'Escape') disableLock();
  };

  const updateLockByScroll = () => {
    if (mqMobile.matches) { disableLock(); return; }
    if (Date.now() < unlockCooldownUntil) return;
    const { secTop, secEnd } = ranges();
    const y = window.scrollY;
    const inSection = y >= (secTop - 1) && y <= (secEnd + 1);
    if (inSection) enableLock(); else disableLock();
  };

  async function recalc() {
    await setUniformWorkWidth();
    if (mqMobile.matches) {
      disableLock();
      return;
    }
    if (lockActive) applyProgress();
    updateLockByScroll();
  }

  // Eventi
  window.addEventListener('resize', recalc);
  window.addEventListener('orientationchange', recalc);
  window.addEventListener('scroll', updateLockByScroll, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeydown);
  mqMobile.addEventListener?.('change', recalc);

  // Prima misura
  recalc();

  // Espone utility globali per showSection()/applyFilters()
  window.reflowWorksScroller = recalc;
  window.disableWorksLock = disableLock;
}


// =============== EDGE PIXEL EFFERVESCENTI ================= //
(() => {
  // ---- Canvas setup
  const cvs = document.createElement('canvas');
  cvs.id = 'edge-fx-canvas';
  document.body.appendChild(cvs);
  const ctx = cvs.getContext('2d');
  let DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  const resize = () => {
    const { innerWidth: w, innerHeight: h } = window;
    cvs.width = Math.ceil(w * DPR);
    cvs.height = Math.ceil(h * DPR);
    cvs.style.width = w + 'px';
    cvs.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  // ---- Particelle
  const THEME_COLORS = ['#000000']; // palette
  const EDGE_FX_DENSITY = 3.0;
  const particles = [];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  function spawnPixel(x, y, nx, ny, opts) {
    const speed = rand(opts.vMin, opts.vMax);
    particles.push({
      x, y,
      vx: nx * speed + rand(-opts.jitter, opts.jitter),
      vy: ny * speed + rand(-opts.jitter, opts.jitter),
      life: rand(opts.lifeMin, opts.lifeMax),
      age: 0,
      size: rand(opts.sizeMin, opts.sizeMax),
      color: pick(opts.colors),
      gravity: opts.gravity || 0
    });
  }

  // ---- Emitter sui bordi
  function makeEdgeEmitter(getRect, options = {}) {
    const opts = {
      rate: 1500,              // densità
      pulseBoost: 3.0,
      sizeMin: 5, sizeMax: 10,
      vMin: 80, vMax: 160,
      lifeMin: 0.5, lifeMax: 0.9,
      jitter: 20,
      colors: THEME_COLORS,
      gravity: 0,
      active: true,
      ...options
    };
    opts.rate *= EDGE_FX_DENSITY;
    let boost = 1.0;

    return {
      boostUp() { boost = opts.pulseBoost; setTimeout(() => (boost = 1), 150); },
      setActive(v) { opts.active = !!v; },
      tick(dt) {
        if (!opts.active) return;
        const r = getRect();
        if (!r) return;

        const P = 2 * (r.width + r.height);
        const want = (opts.rate * boost) * dt;
        for (let i = 0; i < want; i += 1) {
          const p = Math.random() * P;
          let x, y, nx, ny;
          if (p < r.width) {                           // top
            x = r.left + p; y = r.top; nx = 0; ny = -1;
          } else if (p < r.width + r.height) {         // right
            x = r.right; y = r.top + (p - r.width); nx = 1; ny = 0;
          } else if (p < r.width * 2 + r.height) {     // bottom
            x = r.right - (p - (r.width + r.height)); y = r.bottom; nx = 0; ny = 1;
          } else {                                      // left
            x = r.left; y = r.bottom - (p - (r.width * 2 + r.height)); nx = -1; ny = 0;
          }
          const OUT = 2; x += nx * OUT; y += ny * OUT; // verso l’esterno
          spawnPixel(x, y, nx, ny, opts);
        }
      }
    };
  }

  // ---- Utility rect (in viewport)
  const rectOfEl = (el) => {
    if (!el || !el.isConnected) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
  };

  // ---- Emitter: hover sulle card
  const cardEmitters = new Map();

  function attachCardHoverEmitters() {
    const cards = document.querySelectorAll('.work-card');
    cards.forEach(card => {
      if (cardEmitters.has(card)) return;
      const em = makeEdgeEmitter(() => rectOfEl(card), { rate: 180, sizeMin: 2, sizeMax: 3 });
      cardEmitters.set(card, em);
      card.addEventListener('mouseenter', () => em.setActive(true));
      card.addEventListener('mouseleave', () => em.setActive(false));
      em.setActive(false); // on-hover only
    });
  }

  // --- Hover robusto con hit-test (quando il nastro si muove)
  let mouseX = 0, mouseY = 0, activeCard = null, hoverDirty = true;
  window.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; hoverDirty = true; });

  function ensureCardEmitter(card) {
    if (!cardEmitters.has(card)) {
      const em = makeEdgeEmitter(() => rectOfEl(card), { rate: 180, sizeMin: 2, sizeMax: 3 });
      cardEmitters.set(card, em);
      em.setActive(false);
    }
  }

  function setActiveCard(card) {
    if (card === activeCard) return;
    const prev = activeCard;
    if (prev) {
      cardEmitters.get(prev)?.setActive(false);
      prev.classList.remove('is-hover');
    }
    activeCard = card || null;
    if (activeCard) {
      ensureCardEmitter(activeCard);
      cardEmitters.get(activeCard)?.setActive(true);
      activeCard.classList.add('is-hover');
    }
  }

  function syncHoverByHitTest() {
    const el = document.elementFromPoint(mouseX, mouseY);
    const card = el && el.closest ? el.closest('.work-card') : null;
    setActiveCard(card);
  }

  // Inizializza una volta e aggiorna solo se il track cambia
  attachCardHoverEmitters();
  const worksTrack = document.getElementById('works-track');
  if (worksTrack) {
    const mo = new MutationObserver(() => attachCardHoverEmitters());
    mo.observe(worksTrack, { childList: true, subtree: true });
  }

  // ---- Emitter: perimetro del modale (attivo quando aperto)
  const modalDlg = document.querySelector('#project-modal .project-modal__dialog');
  const modalEm = modalDlg ? makeEdgeEmitter(() => rectOfEl(modalDlg), {
    rate: 120, sizeMin: 2, sizeMax: 4, vMin: 70, vMax: 140, colors: ['#000000']
  }) : null;

  // Attiva/disattiva in base allo stato del modale
  const modalRoot = document.getElementById('project-modal');
  if (modalRoot && modalEm) {
    const syncModal = () => modalEm.setActive(modalRoot.classList.contains('open'));
    syncModal();
    new MutationObserver(syncModal).observe(modalRoot, { attributes: true, attributeFilter: ['class'] });
  }

  // ---- Main loop
  let lastT = performance.now();
  function loop(t) {
    const dt = Math.min(0.033, (t - lastT) / 1000); // max 33ms
    lastT = t;

    if (hoverDirty) { syncHoverByHitTest(); hoverDirty = false; }

    modalEm && modalEm.tick(dt);
    cardEmitters.forEach(em => em.tick(dt));

    ctx.clearRect(0, 0, cvs.width / DPR, cvs.height / DPR);
    for (let i = particles.length - 1; i >= 0; --i) {
      const p = particles[i];
      p.age += dt;
      if (p.age >= p.life) { particles.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      const k = 1 - (p.age / p.life);
      ctx.globalAlpha = Math.max(0, Math.min(1, k));
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // API globale: segnala che il contenuto sotto il mouse è cambiato
  window.__edgeFx_markHoverDirty = () => { hoverDirty = true; };
})();






// === EFFERVESCENZA TOOLBAR (replica effetto galleria) ===
let toolbarFXActive = false;
let toolbarFXReq;

function startToolbarFX() {
  if (toolbarFXActive) return;
  toolbarFXActive = true;

  const canvas = document.getElementById('toolbar-fx-canvas');
  const ctx = canvas.getContext('2d');
  let w, h;
  let particles = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    w = canvas.offsetWidth;
    h = canvas.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
  }

  function initParticles() {
    const num = 90; // densità simile a quella della galleria
    particles = [];
    for (let i = 0; i < num; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.3,
        size: Math.random() * 1.2 + 0.6,
      });
    }
  }

  function animate() {
    if (!toolbarFXActive) return;

    ctx.fillStyle = 'rgba(255,255,255,0.05)'; // scia leggera
    ctx.fillRect(0, 0, w, h);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // bordi morbidi (ricompare dall'altro lato)
      if (p.x < 0) p.x = w;
      if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h;
      if (p.y > h) p.y = 0;

      ctx.fillStyle = `rgba(0,0,0,${p.alpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    toolbarFXReq = requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  animate();
  window.addEventListener('resize', () => {
    resize();
    initParticles();
  });
}

function stopToolbarFX() {
  toolbarFXActive = false;
  cancelAnimationFrame(toolbarFXReq);
  const canvas = document.getElementById('toolbar-fx-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}


// === VIDEO FULLSCREEN CON AUDIO — FIX AUTOPLAY CHROME ===
document.addEventListener("click", async (e) => {
  const video = e.target.closest(".section.moodboard video");
  if (!video) return;

  // Ferma tutti gli altri video della moodboard
  document.querySelectorAll(".section.moodboard video").forEach((v) => {
    if (v !== video) {
      v.pause();
      v.muted = true;
      v.currentTime = 0;
    }
  });

  // Se è già in riproduzione, ferma e silenzia
  if (!video.paused) {
    video.pause();
    video.muted = true;
    return;
  }

  // Sblocca audio e prepara
  video.muted = false;
  video.currentTime = 0;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      // MOBILE — fullscreen nativo (iOS/Android)
      video.playsInline = false;
      await video.play();

      // Rientro silenzioso dopo fine o chiusura
      const stopAndMute = () => {
        video.pause();
        video.muted = true;
        video.playsInline = true;
        video.removeEventListener("ended", stopAndMute);
        document.removeEventListener("visibilitychange", stopAndMute);
      };
      video.addEventListener("ended", stopAndMute);
      document.addEventListener("visibilitychange", stopAndMute);
    } else {
      // DESKTOP — fullscreen standard
      await video.play();

      if (video.requestFullscreen) {
        await video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        await video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        await video.msRequestFullscreen();
      }

      const exitHandler = () => {
        if (
          !document.fullscreenElement &&
          !document.webkitFullscreenElement &&
          !document.msFullscreenElement
        ) {
          video.pause();
          video.muted = true;
          document.removeEventListener("fullscreenchange", exitHandler);
          document.removeEventListener("webkitfullscreenchange", exitHandler);
          document.removeEventListener("msfullscreenchange", exitHandler);
        }
      };
      document.addEventListener("fullscreenchange", exitHandler);
      document.addEventListener("webkitfullscreenchange", exitHandler);
      document.addEventListener("msfullscreenchange", exitHandler);
    }
  } catch (err) {
    // Se Chrome blocca la riproduzione, forziamo l'avvio mutato
    console.warn("Playback blocked, retrying muted:", err);
    video.muted = true;
    try {
      await video.play();
    } catch { }
  }
});
