import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const container = document.getElementById('viewport-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0000ff);

const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 4, 6);

const cameraTarget = new THREE.Vector3(0, 4, 6);
const lookTarget = new THREE.Vector3(0, 2, 0);
let fovTarget = 75;

const light = new THREE.HemisphereLight(0xffffff, 0x444444, 4);
scene.add(light);

let trackedModel;
let mixer;
let targetRotationX = 0;
let targetRotationY = 0;

let isInFightMode = false;
let hitCount = 0;
let isPlayingAnimation = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const loader = new GLTFLoader();
loader.load('model.glb', function (gltf) {
  const model = gltf.scene;
  model.scale.set(3, 3, 3);
  model.position.set(0, 0, 0);
  scene.add(model);
  trackedModel = model;

  mixer = new THREE.AnimationMixer(trackedModel);
  const animLoader = new GLTFLoader();
  const animations = {};

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

  function playSequence(names, onEnd) {
    if (!names.length) {
      isPlayingAnimation = false;
      if (onEnd) onEnd();
      return;
    }

    const [current, ...rest] = names;

    loadClip(current).then(clip => {
      mixer.stopAllAction();
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      isPlayingAnimation = true;
      action.play();

      mixer.addEventListener('finished', function onEndClip() {
        mixer.removeEventListener('finished', onEndClip);
        if (rest.length > 0) {
          playSequence(rest, onEnd);
        } else {
          isPlayingAnimation = false;
          if (onEnd) onEnd();
        }
      });
    });
  }

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
        playSequence(['getting_up']);
      });
    }
  }

  playSequence(['standing_up', 'stretch', 'point']);

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
});

function animate() {
  requestAnimationFrame(animate);

  if (mixer) mixer.update(0.016);

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

// ✅ Navigazione sezioni da #toolbar
document.querySelectorAll('#toolbar .tool[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;

    // Reset visibilità scena 3D
    container.classList.remove('compact');
    container.classList.remove('hidden');

    // Sezione CV
    if (section === 'cv') {
      allowRotation = true;
      container.classList.add('compact');
      cameraTarget.set(0, 5, 3);
      lookTarget.set(0, 5, 0);
      fovTarget = 30;
      scene.background = new THREE.Color(0xffffff);
    }

    // Sezione Progetti
    else if (section === 'progetti') {
      container.classList.add('hidden');

      // Rimuove classe .visible da tutte le card (reset)
      const cards = document.querySelectorAll('.project-card');
      cards.forEach(card => card.classList.remove('visible'));

      // Attiva le card una alla volta con delay
      setTimeout(() => {
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.classList.add('visible');
          }, i * 100);
        });
      }, 300); // attende leggermente l'attivazione visiva della sezione
    }

    // Tutte le altre sezioni
    else {
      allowRotation = false;
      cameraTarget.set(0, 4, 6);
      lookTarget.set(0, 1.5, 0);
      fovTarget = 75;
      scene.background = new THREE.Color(0x0000ff);
    }

    // Mostra la sezione attiva
    document.querySelectorAll('.section-text').forEach(el => el.classList.remove('active'));
    const current = document.querySelector(`.${section}-text`);
    if (current) current.classList.add('active');
  });
});

let allowRotation = false;

// FILTRO PROGETTI
const filterButtons = document.querySelectorAll('.filter-box button');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.getAttribute('data-filter');

    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    projectCards.forEach(card => {
      if (filter === 'all' || card.classList.contains(filter)) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});
