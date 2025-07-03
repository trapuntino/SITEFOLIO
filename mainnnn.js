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
const lookTarget = new THREE.Vector3(0, 1.5, 0);
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

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const loader = new GLTFLoader();
loader.load('model.glb', function (gltf) {
  const model = gltf.scene;
  model.scale.set(2.5, 2.5, 2.5);
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
      try {
        // transizione fluida
        mixer._actions.forEach(action => {
          if (action.isRunning()) {
            action.fadeOut(0.2);
          }
        });

        const action = mixer.clipAction(clip);
        action.reset();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        isPlayingAnimation = true;
        action.fadeIn(0.2).play();

        mixer.addEventListener('finished', function onEndClip() {
          mixer.removeEventListener('finished', onEndClip);
          if (rest.length > 0) {
            playSequence(rest, onEnd);
          } else {
            isPlayingAnimation = false;
            if (onEnd) onEnd();
          }
        });
      } catch (error) {
        console.warn(`⚠️ Problema con fadeIn/fadeOut:`, error);
        mixer.stopAllAction(); // fallback
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
      }
    });
  }

  let inactivityTimeout;
  let fightInactivityTimeout;

  function clearInactivityTimer() {
    clearTimeout(inactivityTimeout);
    inactivityTimeout = null;
  }

  function clearFightInactivityTimer() {
    clearTimeout(fightInactivityTimeout);
    fightInactivityTimeout = null;
  }

  function resetNormalInactivityTimer() {
    if (isInFightMode || isPlayingAnimation) return;
    clearInactivityTimer();
    inactivityTimeout = setTimeout(() => {
      playSequence(['stretch', 'point']);
    }, 10000);
  }

  function resetFightIdleTimer() {
    clearFightInactivityTimer();
    fightInactivityTimeout = setTimeout(() => {
      playSequence(['fight_to_standing'], () => {
        isInFightMode = false;
        resetNormalInactivityTimer();
      });
    }, 10000);
  }

  function enterFightIdle() {
    playSequence(['fight_idle'], () => {
      resetFightIdleTimer();
    });
  }

  function enterFightMode() {
    if (isPlayingAnimation) return;
    isInFightMode = true;
    clearInactivityTimer();
    hitCount = 0;
    playSequence(['standing_to_fight'], () => {
      enterFightIdle();
    });
  }

  function registerHit() {
    if (!isInFightMode || isPlayingAnimation) return;
    clearFightInactivityTimer();
    hitCount += 1;

    if (hitCount === 1) {
      playSequence(['hit_1', 'punch_1'], () => {
        enterFightIdle();
      });
    } else if (hitCount === 2) {
      playSequence(['hit_2', 'punch_2'], () => {
        enterFightIdle();
      });
    } else {
      playSequence(['ko'], () => {
        playSequence(['getting_up'], () => {
          enterFightIdle();
        });
      });
    }
  }

  playSequence(['standing_up', 'stretch', 'point']);
  resetNormalInactivityTimer();

  ['mousemove', 'click', 'keydown', 'touchstart'].forEach(event => {
    window.addEventListener(event, () => {
      if (isInFightMode) {
        resetFightIdleTimer();
      } else {
        resetNormalInactivityTimer();
      }
    });
  });

  renderer.domElement.addEventListener('mousemove', (event) => {
    if (isInFightMode || isPlayingAnimation || !trackedModel) return;

    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(trackedModel, true);

    if (intersects.length > 0) {
      enterFightMode();
    }
  });

  renderer.domElement.addEventListener('click', () => {
    if (isInFightMode) registerHit();
  });
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

document.querySelectorAll('#ui a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;

    if (section === 'cv') {
      allowRotation = true;
      container.classList.add('compact');
      cameraTarget.set(0, 4.5, 2);
      lookTarget.set(0, 4, 0);
      fovTarget = 30;
      scene.background = new THREE.Color(0xffffff);
    } else {
      allowRotation = false;
      container.classList.remove('compact');
      cameraTarget.set(0, 4, 6);
      lookTarget.set(0, 1.5, 0);
      fovTarget = 75;
      scene.background = new THREE.Color(0x0000ff);
    }

    document.querySelectorAll('.section-text').forEach(el => el.classList.remove('active'));
    const current = document.querySelector(`.${section}-text`);
    if (current) current.classList.add('active');
  });
});

let allowRotation = false;