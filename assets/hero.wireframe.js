// Three.js with GLTFLoader for 3D model
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// handles scene injection into #hero-canvas
export function loadHero() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) {
    return;
  }

  // Basic Three.js setup
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  // Lighting setup for 3D model - brighter for glass effect
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
  keyLight.position.set(2, 2, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x88ccff, 1.0);
  fillLight.position.set(-2, 1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(0, 0, -2);
  scene.add(rimLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
  topLight.position.set(0, 3, 0);
  scene.add(topLight);

  // Loading indicator - spinning wireframe cube
  const loadingCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 0.5),
    new THREE.MeshBasicMaterial({ color: 0x58a6ff, wireframe: true })
  );
  scene.add(loadingCube);

  // Store mouse position for tracking
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    updateRate: 0.08
  };

  // Mouse tracking
  let mouseUpdateScheduled = false;
  document.addEventListener('mousemove', (event) => {
    if (!mouseUpdateScheduled) {
      mouseUpdateScheduled = true;
      requestAnimationFrame(() => {
        mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
        mouseUpdateScheduled = false;
      });
    }
  });

  // Track the loaded model
  let model = null;

  // Load GLB model
  const loader = new GLTFLoader();
  loader.load(
    'assets/me-lowpoly.glb',
    (gltf) => {
      model = gltf.scene;

      // Remove loading cube
      scene.remove(loadingCube);

      // Apply stylized teal/cyan material with rim lighting effect
      model.traverse((child) => {
        if (child.isMesh) {
          // Compute vertex normals for better shading
          if (child.geometry) {
            child.geometry.computeVertexNormals();
          }
          child.material = new THREE.MeshStandardMaterial({
            color: 0x4db8cc,
            emissive: 0x1a6680,
            emissiveIntensity: 0.5,
            metalness: 0.2,
            roughness: 0.3,
            flatShading: true, // Low-poly look
            side: THREE.DoubleSide
          });
        }
      });

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model
      model.position.sub(center);

      // Scale to fit nicely in view (target ~1.5 units tall)
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 1.5 / maxDim;
      model.scale.setScalar(scale);

      // Position slightly lower to show head/face area
      model.position.y -= 0.1;

      scene.add(model);
    },
    (progress) => {
      // Loading progress - rotate the cube
      if (loadingCube) {
        loadingCube.rotation.x += 0.02;
        loadingCube.rotation.y += 0.03;
      }
    },
    (error) => {
      console.error('Failed to load GLB model:', error);
      // Keep the cube as a fallback indicator
      loadingCube.material.color.setHex(0xff6666);
    }
  );

  // Animation loop
  const clock = new THREE.Clock();
  let animationRunning = true;

  // Visibility detection
  const observer = new IntersectionObserver((entries) => {
    const isVisible = entries[0].isIntersecting;
    if (!isVisible) {
      animationRunning = false;
    } else if (!animationRunning) {
      animationRunning = true;
      animate();
    }
  }, { threshold: 0.1 });
  observer.observe(canvas);

  function animate() {
    if (!animationRunning) return;

    // Resize handling
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    // Smooth mouse tracking
    mouse.x += (mouse.targetX - mouse.x) * mouse.updateRate;
    mouse.y += (mouse.targetY - mouse.y) * mouse.updateRate;

    const t = clock.getElapsedTime();

    // Animate loading cube while waiting
    if (loadingCube.parent) {
      loadingCube.rotation.x = t * 0.5;
      loadingCube.rotation.y = t * 0.7;
    }

    // Animate the loaded model
    if (model) {
      // Gentle idle animation + mouse tracking (inverted Y for natural feel)
      model.rotation.y = Math.sin(t * 0.15) * 0.08 + (mouse.x * 0.3);
      model.rotation.x = Math.cos(t * 0.1) * 0.03 - (mouse.y * 0.15);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
  renderer.render(scene, camera);
}
