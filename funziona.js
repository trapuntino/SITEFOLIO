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

  const loaderDuration = 4000; // durata totale del loader in ms
  let startTime = null;

  function animateProgress(timestamp) {
    if (!startTime) startTime = timestamp;

    const elapsed = timestamp - startTime;

    const rawProgress = Math.min(1, elapsed / loaderDuration);
    const eased = 1 - Math.pow(1 - rawProgress, 3); // ease-out
    percent = eased * 100;

    progressBar.style.width = percent + '%';

    if (percent < 25) loadingText.textContent = texts[0];
    else if (percent < 50) loadingText.textContent = texts[1];
    else if (percent < 75) loadingText.textContent = texts[2];
    else loadingText.textContent = texts[3];

    if (percent > 25 && !logo.classList.contains('visible')) {
      logo.classList.add('visible');
    }

    if (percent === 100) {
      clearInterval(interval);
      isLoaded = true;

      Promise.all([modelPromise, window.animationPreloadPromise]).then(() => {
        setTimeout(() => {
          loader.style.opacity = '0';
          loader.style.transition = 'opacity 0.6s ease';
          logo.remove();
          loader.remove();

          handleSectionChange('home'); // <-- qui fai partire l'home
          typeWriter(
            "Hi! I'm Fabrizio, a communication designer blending clarity, visuals and just enough chaos.",
            'typewriter-text'
          );

          playSequence(['standing_up', 'stretch', 'point']);
        }, 600);
      });
    }
    else {
      isLoaded = true;

      Promise.all([modelPromise, window.animationPreloadPromise]).then(() => {
        setTimeout(() => {
          loader.style.opacity = '0';
          loader.style.transition = 'opacity 0.6s ease';
          logo.remove();
          loader.remove();
          playSequence(['standing_up', 'stretch', 'point']);
        }, 600);
      });
    }
  }

  requestAnimationFrame(animateProgress);


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


const loader = new GLTFLoader();

const modelPromise = new Promise((resolve, reject) => {
  loader.load('model.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(3, 3, 3);
    model.position.set(0, 0, 0);
    scene.add(model);
    trackedModel = model;

    mixer = new THREE.AnimationMixer(trackedModel);
    const animLoader = new GLTFLoader();
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


// GESTIONE NAVIGAZIONE DA NAVBAR IN BASSO
const sectionTextEls = document.querySelectorAll('.section-text');
const projectsGrid = document.querySelector('.projects-grid');
const viewport = document.getElementById('viewport-container');
const toolbar = document.getElementById('toolbar');


function handleSectionChange(section) {
  // --- RESET GENERALE ---
  sectionTextEls.forEach(el => el.classList.remove('active'));
  projectsGrid?.classList.add('hidden');
  viewport?.classList.remove('compact');
  viewport?.classList.remove('hidden');
  toolbar?.classList.add('hidden');

  document.getElementById('about-text')?.classList.add('hidden');
  document.getElementById('home-text')?.classList.remove('active');
  document.getElementById('works-section')?.classList.add('hidden'); // nascondi sempre i Works

  // --- HOME ---
  if (section === 'home') {
    toolbar?.classList.remove('hidden');
    cameraTarget.set(0, 4, 6);
    lookTarget.set(0, 2, 0);
    scene.background = null;
    fovTarget = 75;

    document.getElementById('home-text')?.classList.add('active');
    typeWriter(
      "Hi! I'm Fabrizio, a communication designer blending clarity, visuals and just enough chaos.",
      'typewriter-text'
    );
    return;
  }

  // --- WORKS ---
  if (section === 'progetti' || section === 'works') {
    viewport?.classList.add('hidden');
    const ws = document.getElementById('works-section');
    if (ws) {
      ws.classList.remove('hidden');
      renderWorksTrack(projects);
      renderWorksList(projects);
      setupWorksPin(); // <— niente recalcWorksLayout / updateTrackTransform
    }
    return;
  }

  // --- ABOUT ---
  if (section === 'about') {
    document.getElementById('about-text')?.classList.remove('hidden');
    cameraTarget.set(0, 4, 6);
    lookTarget.set(0, 2, 0);
    scene.background = null;
    fovTarget = 75;
    return;
  }

  // --- CV / CONTACTS ---
  if (section === 'cv' || section === 'contacts') {
    document.querySelector('.cv-text')?.classList.add('active');
    container.classList.add('compact');
    cameraTarget.set(0, 5, 3);
    lookTarget.set(0, 5, 0);
    fovTarget = 30;
    scene.background = new THREE.Color(0xffffff);
  }
}





// Listener per i pulsanti del menu in basso
document.querySelectorAll('#bottom-navbar li').forEach(item => {
  item.addEventListener('click', () => {
    const section = item.getAttribute('data-section');
    handleSectionChange(section);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  handleSectionChange('home');
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


/* ===================== WORKS: dati, render, scroll orizzontale ===================== */

// opzionale ma consigliato con Vite/GH Pages
const BASE = (import.meta?.env?.BASE_URL) || '/';

const projects = [
  {
    id: "befest",
    titolo: "Befest",
    anno: 2025,
    ambito: "Branding",
    ruoli: ["Art Director", "Graphic Designer"],
    cover: { type: "image", src: `${BASE}portfolio/befest/cover.jpg`, alt: "Befest – identità visiva e applicazioni" },
    descrizione: "Identità e sistema visivo per Befest."
  },
  {
    id: "retrogusto",
    titolo: "Retrogusto",
    anno: 2024,
    ambito: "Web Design",
    ruoli: ["Graphic Designer", "Producer"],
    cover: {
      type: "video",
      src: `${BASE}portfolio/retrogusto/cover.mp4`,
      poster: `${BASE}portfolio/retrogusto/poster.jpg`
    },
    descrizione: "Sito vetrina con storytelling visivo."
  },
  {
    id: "sugo2025",
    titolo: "Sūgo 2025 – Event Identity",
    anno: 2025,
    ambito: "Eventi",
    ruoli: ["Art Director", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/sugo2025/cover.jpg`, alt: "Sūgo 2025 – identità evento" },
    descrizione: "Identità e materiali per l’evento freestyle."
  },

  {
    id: "summershred",
    titolo: "Summer Shred",
    anno: 2025,
    ambito: "Graphic Design",
    ruoli: ["Illustrazione", "Graphic Designer"],
    cover: { type: "image", src: `${BASE}portfolio/summer-shred/cover.jpg`, alt: "Summer Shred - Illustrazione" },
    descrizione: "Illustrazione e logotipo"
  },

  {
    id: "stelviopaddock",
    titolo: "Stelvio Paddock",
    anno: 2025,
    ambito: "Branding",
    ruoli: ["Art Director", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/stelvio-paddock/cover.jpg`, alt: "Stelvio Paddock - Branding" },
    descrizione: "Identità e materiali per l’evento freestyle."
  },

  {
    id: "sugo2025",
    titolo: "Sūgo 2025 – Event Identity",
    anno: 2025,
    ambito: "Eventi",
    ruoli: ["Art Director", "Producer"],
    cover: { type: "image", src: `${BASE}portfolio/sugo2025/cover.jpg`, alt: "Sūgo 2025 – identità evento" },
    descrizione: "Identità e materiali per l’evento freestyle."
  },
];


// Elementi base
const worksSection = document.getElementById('works-section');
const worksTrack = document.getElementById('works-track');
const worksList = document.getElementById('works-list');

// Render card orizzontali (desktop)
function renderWorksTrack(list) {
  worksTrack.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'work-card';
    card.dataset.id = p.id;

    let mediaEl;
    if (p.cover.type === 'video') {
      mediaEl = document.createElement('video');
      mediaEl.src = p.cover.src;
      mediaEl.poster = p.cover.poster || '';
      mediaEl.muted = true;           // requisito per autoplay mobile
      mediaEl.playsInline = true;     // iOS Safari
      mediaEl.loop = true;            // loop continuo
      mediaEl.autoplay = true;        // tenta autoplay subito
      mediaEl.preload = 'auto';       // carica per partire al volo
      mediaEl.controls = false;

      // appena abbiamo i metadata, forziamo play (iOS/Android)
      mediaEl.addEventListener('loadedmetadata', () => {
        const tryPlay = () => mediaEl.play().catch(() => { });
        // doppio tentativo: subito e al prossimo frame (alcuni browser gradiscono)
        tryPlay();
        requestAnimationFrame(tryPlay);
      });

      // NIENTE hover play/pause: deve partire da sola e restare in loop
    } else {
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
    card.addEventListener('click', () => openProjectModal(p.id));
    worksTrack.appendChild(card);
  });
}

// Render lista mobile
function renderWorksList(list) {
  worksList.innerHTML = '';
  list.forEach(p => {
    const row = document.createElement('div');
    row.className = 'work-row';
    row.dataset.id = p.id;
    row.innerHTML = `<div class="row-title">${p.titolo}</div><div class="row-sub">${p.anno} · ${p.ambito}</div>`;
    row.addEventListener('click', () => openProjectModal(p.id));
    worksList.appendChild(row);
  });
}

// Modal
const modal = document.getElementById('project-modal');
const modalClose = document.getElementById('project-modal-close');
const modalBack = document.getElementById('project-modal-backdrop');

function openProjectModal(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  document.getElementById('project-modal-title').textContent = p.titolo;
  document.getElementById('project-meta-year').textContent = p.anno;
  document.getElementById('project-meta-field').textContent = p.ambito;

  const mediaWrap = document.getElementById('project-modal-media');
  mediaWrap.innerHTML = '';
  if (p.cover.type === 'video') {
    const v = document.createElement('video');
    v.src = p.cover.src;
    v.poster = p.cover.poster || '';
    v.controls = true;
    v.playsInline = true;
    mediaWrap.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = p.cover.src;
    img.alt = p.cover.alt || p.titolo;
    img.style.maxWidth = '100%';
    mediaWrap.appendChild(img);
  }

  document.getElementById('project-modal-desc').textContent = p.descrizione || '';
  modal.classList.add('open');
}
function closeProjectModal() { modal.classList.remove('open'); }
[modalClose, modalBack].forEach(el => el && el.addEventListener('click', closeProjectModal));

// Filtri AND
const roleSel = document.getElementById('filter-role');
const yearSel = document.getElementById('filter-year');
const fieldSel = document.getElementById('filter-field');

function applyFilters() {
  const role = roleSel?.value || '';
  const year = yearSel?.value || '';
  const field = fieldSel?.value || '';

  const filtered = projects.filter(p => {
    const matchRole = !role || p.ruoli.includes(role);
    const matchYear = !year || String(p.anno) === String(year);
    const matchField = !field || p.ambito === field;
    return matchRole && matchYear && matchField;
  });

  renderWorksTrack(filtered);
  renderWorksList(filtered);
  setupWorksPin();                 // <— ricalcola dopo i filtri
}


[roleSel, yearSel, fieldSel].forEach(sel => sel && sel.addEventListener('change', applyFilters));


function activateWorks() {
  worksSection.classList.remove('hidden');
  renderWorksTrack(projects);
  renderWorksList(projects);
  setupWorksPin(); // <— basta questo
}


const navWorks = document.querySelector('#bottom-navbar [data-section="progetti"]');
if (navWorks) {
  navWorks.addEventListener('click', () => {
    document.getElementById('viewport-container')?.classList.add('hidden');
    document.getElementById('home-text')?.classList.remove('active');
    activateWorks();
    const y = worksSection.getBoundingClientRect().top + window.scrollY - 40;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
}

if (location.hash === '#works') {
  activateWorks();
  setTimeout(() => {
    const y = worksSection.getBoundingClientRect().top + window.scrollY - 40;
    window.scrollTo({ top: y, behavior: 'instant' });
  }, 0);
}


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
/* ===== WORKS: gestione scroll — Desktop blocco Y in sezione, Mobile libero ===== */
function setupWorksPin() {
  const section = document.getElementById('works-section');
  const pin = document.getElementById('works-pin');
  const track = document.getElementById('works-track');
  if (!section || !pin || !track) return;

  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const mqMobile = window.matchMedia('(max-width: 768px)');

  let lockActive = false;      // true quando (desktop) siamo in sezione e Y è bloccata
  let progress01 = 0;          // 0..1 posizione orizzontale
  let lastTouchY = 0;

  // isteresi anti-glitch agli estremi
  const EPS = 1e-4;
  const RELEASE_DELTA = 8;          // soglia “insistenza” per uscire dalla sezione
  let unlockCooldownUntil = 0;      // ms

  const ranges = () => {
    const pinH = pin.clientHeight;
    const totalWidth = track.scrollWidth;
    const overflowX = Math.max(0, totalWidth - window.innerWidth);
    const secTop = section.offsetTop;
    const secEnd = secTop + section.offsetHeight - pinH;
    const totalY = Math.max(1, secEnd - secTop);
    return { pinH, overflowX, secTop, secEnd, totalY };
  };

  // trova l'antenato più vicino che può scorrere in verticale
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
    progress01 = Math.max(0, Math.min(1, progress01));
    const x = -Math.round(progress01 * ox);
    track.style.transform = `translate3d(${x}px,0,0)`;
  };

  const enableLock = () => {
    if (lockActive || mqMobile.matches) return;
    lockActive = true;

    // blocca Y su root + body
    document.documentElement.classList.add('is-locking-works');
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';

    // inizializza progress in base alla Y attuale
    const { secTop, totalY } = ranges();
    const y = clamp(window.scrollY, secTop, secTop + totalY);
    progress01 = (y - secTop) / totalY;

    // ancora viewport per evitare jitter
    window.scrollTo(0, secTop);
    applyProgress();
  };

  const disableLock = () => {
    if (!lockActive) return;
    const { secTop, totalY } = ranges();
    lockActive = false;

    // sblocca Y su root + body
    document.documentElement.classList.remove('is-locking-works');
    document.documentElement.style.overflowY = '';
    document.body.style.overflowY = '';

    unlockCooldownUntil = Date.now() + 250; // cooldown per non rientrare subito

    // riallinea la Y alla progress orizzontale raggiunta
    const y = secTop + progress01 * totalY;
    window.scrollTo(0, y);
  };

  // Wheel → X con sblocco controllato agli estremi
  const onWheel = (e) => {
    const scroller = getScrollableAncestorY(e.target);
    if (scroller) return;                 // lascia scorrere il modale/inner scroller
    if (!lockActive) return;
    const { overflowX } = ranges();
    if (!overflowX) return;
    e.preventDefault();                   // blocca Y sul documento
    const delta = e.deltaY || e.wheelDelta || 0;
    progress01 = Math.max(0, Math.min(1, progress01 + (delta / overflowX)));
    applyProgress(overflowX);
    hoverDirty = true;
  };



  // Touch (tablet/desktop touch)
  let touchScrollTarget = null;

  const onTouchStart = (e) => {
    touchScrollTarget = getScrollableAncestorY(e.target);
    if (touchScrollTarget) return;        // sarà lo scroller interno a gestire la Y
    if (!lockActive || mqMobile.matches) return;
    lastTouchY = e.touches[0].clientY;
    hoverDirty = true;
  };

  const onTouchMove = (e) => {
    if (touchScrollTarget) return;        // lascia scorrere il modale
    if (!lockActive || mqMobile.matches) return;
    const { overflowX } = ranges();
    if (!overflowX) return;
    e.preventDefault();                   // blocca Y sul documento
    const y = e.touches[0].clientY;
    const dy = lastTouchY - y;
    lastTouchY = y;
    progress01 = Math.max(0, Math.min(1, progress01 + (dy / overflowX)));
    applyProgress(overflowX);
    hoverDirty = true;
  };

  const onTouchEnd = () => { touchScrollTarget = null; };



  // Tastiera
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

  // Attiva/disattiva lock quando entri/esci dalla sezione (solo desktop)
  const updateLockByScroll = () => {
    if (mqMobile.matches) { disableLock(); return; }
    if (Date.now() < unlockCooldownUntil) return; // isteresi
    const { secTop, secEnd } = ranges();
    const y = window.scrollY;
    const inSection = y >= (secTop - 1) && y <= (secEnd + 1);
    if (inSection) enableLock(); else disableLock();
  };

  async function recalc() {
    await setUniformWorkWidth();
    if (mqMobile.matches) {
      // mobile: nessun lock, nessun movimento orizzontale forzato
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


  window.reflowWorksScroller = recalc;
}

setupWorksPin();


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
    opts.rate *= EDGE_FX_DENSITY;   // <— scala la densità per tutti gli emettitori
    let boost = 1.0;

    return {
      boostUp() { boost = opts.pulseBoost; setTimeout(() => (boost = 1), 150); },
      setActive(v) { opts.active = !!v; },
      tick(dt) {
        if (!opts.active) return;
        const r = getRect();
        if (!r) return;

        const P = 2 * (r.width + r.height);           // perimetro
        const want = (opts.rate * boost) * dt;        // quante spawnare in questo frame
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
      prev.classList.remove('is-hover');   // << togli hover visivo dalla precedente
    }
    activeCard = card || null;
    if (activeCard) {
      ensureCardEmitter(activeCard);
      cardEmitters.get(activeCard)?.setActive(true);
      activeCard.classList.add('is-hover'); // << applica hover visivo alla nuova
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

  // ---- Emitter: perimetro del track (DISATTIVATO)
  const trackEl = document.getElementById('works-track');
  const trackEm = null; // placeholder

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

    // hover hit-test (se il contenuto si è mosso o il mouse si è spostato)
    if (hoverDirty) { syncHoverByHitTest(); hoverDirty = false; }

    // tick emitters
    trackEm && trackEm.tick(dt);
    modalEm && modalEm.tick(dt);
    cardEmitters.forEach(em => em.tick(dt));

    // draw
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

  // Segnala al sistema hover che il contenuto sotto il mouse è cambiato (chiamalo quando muovi il nastro)
  window.__edgeFx_markHoverDirty = () => { hoverDirty = true; };
})();

