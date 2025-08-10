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
  // RESET GENERALE
  sectionTextEls.forEach(el => el.classList.remove('active'));
  projectsGrid.classList.add('hidden');
  viewport.classList.remove('compact');
  viewport.classList.remove('hidden');
  toolbar.classList.add('hidden');

  // Nascondi i testi extra
  document.getElementById('about-text')?.classList.add('hidden');
  document.getElementById('home-text')?.classList.remove('active');

  // HOME: viewport normale + toolbar visibile
  if (section === 'home') {
    toolbar.classList.remove('hidden');
    cameraTarget.set(0, 4, 6);
    lookTarget.set(0, 2, 0);
    scene.background = null;
    fovTarget = 75;

    const homeTextEl = document.getElementById('home-text');
    homeTextEl?.classList.add('active');
    typeWriter("Hi! I'm Fabrizio, a communication designer blending clarity, visuals and just enough chaos.", 'typewriter-text');


    // PROJECTS: griglia progetti visibile, tutto il resto no
  } else if (section === 'progetti' || section === 'video' || section === 'works') {
    projectsGrid.classList.remove('hidden');
    viewport.classList.remove('compact');
    viewport.classList.add('hidden');

    // ABOUT: testo segnaposto visibile
  } else if (section === 'about') {
    document.getElementById('about-text')?.classList.remove('hidden');
    cameraTarget.set(0, 4, 6);
    lookTarget.set(0, 2, 0);
    scene.background = null;
    fovTarget = 75;

    // CV / CONTACTS: testo + viewport compatto
  } else if (section === 'cv' || section === 'contacts') {
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

