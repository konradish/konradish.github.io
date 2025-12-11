// Three.js with GLTFLoader for 3D model
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Calculate sun color and intensity based on time of day
function getSunLighting() {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;

  // Normalize to 0-24 range with noon at center
  // 6am = sunrise, 12pm = noon (peak), 6pm = sunset, midnight = darkest

  // Intensity: peaks at noon, lowest at midnight
  // Using cosine curve shifted so noon = max
  const hourAngle = ((hours - 12) / 12) * Math.PI; // noon = 0, midnight = PI
  const intensity = Math.max(0.5, 0.75 + 0.25 * Math.cos(hourAngle)); // 0.5 to 1.0 range (brighter overall)

  // Color temperature: blue shift during day (sky scatter effect)
  // Morning/evening = warmer (more orange), midday = cooler (more blue)
  // At noon the sun appears slightly cooler due to shorter atmospheric path

  let r, g, b;

  if (hours >= 6 && hours < 8) {
    // Sunrise: warm golden
    const t = (hours - 6) / 2;
    r = 1.0;
    g = 0.7 + t * 0.2;
    b = 0.4 + t * 0.4;
  } else if (hours >= 8 && hours < 16) {
    // Daytime: blue-shifted white (sky scatter simulation)
    const t = Math.abs(hours - 12) / 4; // 0 at noon, 1 at 8am/4pm
    r = 0.95 - t * 0.1;
    g = 0.95;
    b = 1.0; // Blue boost for daytime
  } else if (hours >= 16 && hours < 18) {
    // Sunset: warm orange
    const t = (hours - 16) / 2;
    r = 1.0;
    g = 0.9 - t * 0.2;
    b = 0.8 - t * 0.4;
  } else {
    // Night: cool blue moonlight
    r = 0.6;
    g = 0.7;
    b = 0.9;
  }

  return {
    intensity: intensity * 5.0, // Scale to match original intensity range (bumped up significantly)
    color: new THREE.Color(r, g, b)
  };
}

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

  // Get initial sun lighting
  const sunLighting = getSunLighting();

  // Lighting setup for 3D model - ambient provides baseline illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // Subtle fill light from below/behind
  const fillLight = new THREE.DirectionalLight(0x4488cc, 0.4);
  fillLight.position.set(-1, -1, -1);
  scene.add(fillLight);

  // Mouse-controlled point light (main light source) - now with time-based color/intensity
  const mouseLight = new THREE.PointLight(sunLighting.color, sunLighting.intensity, 10);
  mouseLight.position.set(0, 0, 3);
  scene.add(mouseLight);

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

  // Track the loaded model and glasses meshes
  let model = null;
  let glassesMeshes = [];
  let glassesVisible = true;
  let glassesManualOverride = false; // Track if user manually toggled

  // Load GLB model
  const loader = new GLTFLoader();
  loader.load(
    'assets/me-cellshaded.glb',
    (gltf) => {
      model = gltf.scene;

      // Remove loading cube
      scene.remove(loadingCube);

      // Keep original materials/textures from the GLB
      // Track glasses meshes for toggle functionality
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
        }
        // Look for glasses-related mesh names (case-insensitive)
        if (child.isMesh) {
          const name = child.name.toLowerCase();
          if (name.includes('glass') || name.includes('lens') || name.includes('spectacle') || name.includes('eyewear')) {
            glassesMeshes.push(child);
          }
        }
      });

      // Log mesh names for debugging (can be removed later)
      console.log('Model meshes found:', gltf.scene.children.map(c => c.name));

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

      // Setup glasses toggle button
      const glassesToggle = document.getElementById('glasses-toggle');
      if (glassesToggle) {
        // Show/hide button based on whether glasses were found
        if (glassesMeshes.length === 0) {
          // Try finding by traversing all descendants
          model.traverse((child) => {
            const name = child.name.toLowerCase();
            if (name.includes('glass') || name.includes('lens') || name.includes('spectacle') || name.includes('eyewear') || name.includes('frame')) {
              glassesMeshes.push(child);
            }
          });
          console.log('Glasses meshes after deep search:', glassesMeshes.map(m => m.name));
        }

        glassesToggle.addEventListener('click', () => {
          glassesVisible = !glassesVisible;
          glassesManualOverride = true; // User manually toggled, disable auto
          glassesMeshes.forEach(mesh => {
            mesh.visible = glassesVisible;
          });
          glassesToggle.setAttribute('aria-pressed', glassesVisible.toString());
          glassesToggle.querySelector('span').textContent = glassesVisible ? 'Glasses' : 'No Glasses';
        });
      }
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
      // Slow continuous rotation (one full rotation every ~60 seconds)
      // Plus gentle idle wobble for organic feel
      const baseRotation = t * 0.1; // Slow spin
      const wobble = Math.sin(t * 0.15) * 0.05; // Subtle wobble
      model.rotation.y = baseRotation + wobble;
      model.rotation.x = Math.cos(t * 0.1) * 0.03;
    }

    // Update sun lighting every ~30 frames (roughly once per second at 30fps)
    if (Math.floor(t * 30) % 30 === 0) {
      const sunLighting = getSunLighting();
      mouseLight.color.copy(sunLighting.color);
      mouseLight.intensity = sunLighting.intensity;

      // Auto-remove glasses when light goes below 1 (evening/night)
      // Only if user hasn't manually overridden
      if (!glassesManualOverride) {
        const shouldHaveGlasses = sunLighting.intensity >= 1;
        if (glassesMeshes.length > 0 && glassesVisible !== shouldHaveGlasses) {
          glassesVisible = shouldHaveGlasses;
          glassesMeshes.forEach(mesh => {
            mesh.visible = glassesVisible;
          });
          // Update button state
          const glassesToggle = document.getElementById('glasses-toggle');
          if (glassesToggle) {
            glassesToggle.setAttribute('aria-pressed', glassesVisible.toString());
            glassesToggle.querySelector('span').textContent = glassesVisible ? 'Glasses' : 'No Glasses';
          }
        }
      }
    }

    // Move the mouse light to follow cursor position
    // Map mouse coordinates to 3D space around the model
    mouseLight.position.x = mouse.x * 2.5;
    mouseLight.position.y = mouse.y * 2.0;
    mouseLight.position.z = 2.5;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
  renderer.render(scene, camera);
}
