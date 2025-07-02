import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// CONTENITORE CANVAS
const container = document.getElementById('viewport-container');

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// SCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// CAMERA
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 2, 6);

// CAMERA TARGET E FOV
const cameraTarget = new THREE.Vector3(0, 2, 6);
const lookTarget = new THREE.Vector3(0, 1.5, 0);
let fovTarget = 75;

// LUCE
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
scene.add(light);

// MODELLO E ANIMAZIONE
let trackedModel;
let mixer;
let targetRotationX = 0;
let targetRotationY = 0;

const loader = new GLTFLoader();
loader.load('model.glb', function (gltf) {
  const model = gltf.scene;
  model.scale.set(2.5, 2.5, 2.5);
  model.position.set(0, 0, 0);
  scene.add(model);
  trackedModel = model;

  mixer = new THREE.AnimationMixer(trackedModel);
  const animLoader = new GLTFLoader();

  const animations = {}; // cache animazioni

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

  function playSequence(names) {
    if (!names.length) return;

    const [current, ...rest] = names;
    loadClip(current).then(clip => {
      const action = mixer.clipAction(clip);
      action.reset();
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
      action.play();

      mixer.addEventListener('finished', function onEnd() {
        mixer.removeEventListener('finished', onEnd);
        playSequence(rest);
      });
    });
  }

  // 👉 Sequenza iniziale: standing_up → stretch → point
  playSequence(['standing_up', 'stretch', 'point']);

  // Inactivity logic
  let inactivityTimeout;
  function resetInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = setTimeout(() => {
      playSequence(['stretch', 'point']);
    }, 10000); // 10 sec
  }

  // Interazione = resetta timer
  ['mousemove', 'click', 'keydown', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer);
  });

  resetInactivityTimer(); // avvia timer iniziale
});

// ANIMAZIONE
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

// RESIZE
window.addEventListener('resize', () => {
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
});

// UI INTERACTION
document.querySelectorAll('#ui a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;

    if (section === 'cv') {
      allowRotation = true;
      container.classList.add('compact');
      cameraTarget.set(0, 2.5, 2);
      lookTarget.set(0, 2.5, 0);
      fovTarget = 45;
    } else {
      allowRotation = false;
      container.classList.remove('compact');
      cameraTarget.set(0, 2, 6);
      lookTarget.set(0, 1.5, 0);
      fovTarget = 75;
    }

    document.querySelectorAll('.section-text').forEach(el => el.classList.remove('active'));
    const current = document.querySelector(`.${section}-text`);
    if (current) current.classList.add('active');
  });
});

// CURSORE (DESKTOP)
let allowRotation = false; // controllo attivo

document.addEventListener('mousemove', (e) => {
  if (!allowRotation) return;

  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;

  targetRotationY = THREE.MathUtils.clamp(x * Math.PI / 4, -Math.PI / 4, Math.PI / 4);
  targetRotationX = THREE.MathUtils.clamp(y * Math.PI / 4, -Math.PI / 4, Math.PI / 4);
});

// TILT (MOBILE)
if (
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission === 'function'
) {
  const button = document.createElement('button');
  button.innerText = 'Attiva movimento';
  button.style.position = 'absolute';
  button.style.top = '20px';
  button.style.left = '20px';
  button.style.zIndex = 100;
  document.body.appendChild(button);

  button.addEventListener('click', () => {
    DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          button.remove();
        } else {
          alert('Permesso non concesso per usare il giroscopio');
        }
      })
      .catch(console.error);
  });
} else {
  window.addEventListener('deviceorientation', handleOrientation);
}

function handleOrientation(event) {
  const gamma = event.gamma || 0;
  const beta = event.beta || 0;

  const x = THREE.MathUtils.clamp(gamma / 45, -1, 1);
  const y = THREE.MathUtils.clamp((beta - 45) / 45, -1, 1);

  targetRotationY = x * Math.PI / 4;
  targetRotationX = y * Math.PI / 4;
}