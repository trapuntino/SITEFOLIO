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
const camera = new THREE.PerspectiveCamera(
  75,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 6);

// TARGET CAMERA E FOV
const cameraTarget = new THREE.Vector3(0, 2, 6);
const lookTarget = new THREE.Vector3(0, 1.5, 0);
let fovTarget = 75;

// LUCI
const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
scene.add(light);

// MODELLO
let trackedModel; // riferimento globale al modello

const loader = new GLTFLoader();
loader.load(
  './male.glb',
  function (gltf) {
    const model = gltf.scene;
    model.scale.set(0.8, 0.8, 0.8);
    model.position.set(0, 2, 0);
    scene.add(model);
    trackedModel = model;
  },
  undefined,
  function (error) {
    console.error('Errore nel caricamento del modello:', error);
  }
);

// ANIMAZIONE
function animate() {
  requestAnimationFrame(animate);

  // MOVIMENTO CAMERA
  camera.position.lerp(cameraTarget, 0.05);
  camera.fov += (fovTarget - camera.fov) * 0.05;
  camera.updateProjectionMatrix();
  camera.lookAt(lookTarget);

  // RENDER
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
      container.classList.add('compact');
      cameraTarget.set(0, 2.5, 2);
      lookTarget.set(0, 2.5, 0);
      fovTarget = 45;
    }

    if (section === 'bio') {
      container.classList.remove('compact');
      cameraTarget.set(0, 2, 6);
      lookTarget.set(0, 1.5, 0);
      fovTarget = 75;
    }

    // MOSTRA TESTO CORRISPONDENTE
    document.querySelectorAll('.section-text').forEach(el => el.classList.remove('active'));
    const current = document.querySelector(`.${section}-text`);
    if (current) current.classList.add('active');
  });
});

// CURSORE (DESKTOP)
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 2;
  const y = (e.clientY / window.innerHeight - 0.5) * 2;

  if (trackedModel) {
    trackedModel.rotation.y = THREE.MathUtils.clamp(x * Math.PI / 4, -Math.PI / 4, Math.PI / 4);
    trackedModel.rotation.x = THREE.MathUtils.clamp(y * Math.PI / 4, -Math.PI / 4, Math.PI / 4);
  }
});

// TILT (MOBILE)
window.addEventListener('deviceorientation', (event) => {
  const gamma = event.gamma || 0; // sinistra/destra
  const beta = event.beta || 0;   // su/giù

  const x = THREE.MathUtils.clamp(gamma / 45, -1, 1);
  const y = THREE.MathUtils.clamp((beta - 90) / 45, -1, 1);

  if (trackedModel) {
    trackedModel.rotation.y = x * Math.PI / 4;
    trackedModel.rotation.x = y * Math.PI / 4;
  }
});