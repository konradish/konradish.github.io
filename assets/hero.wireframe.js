import * as THREE from 'https://unpkg.com/three@^0.164/build/three.module.js';

// handles scene injection into #hero-canvas (make that elem in HTML)
export function loadHero() {
  console.log("Initializing hero wireframe");
  
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  
  // Basic Three.js setup
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    alpha: true, 
    antialias: true 
  });
  
  // Set size immediately to prevent blank canvas
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  console.log(`Canvas size: ${canvas.clientWidth}x${canvas.clientHeight}`);
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  // Add light
  scene.add(new THREE.DirectionalLight(0xffffff, 0.8));
  
  // Start with a simple blue wireframe cube to test if rendering works
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ 
      color: 0x3498db, 
      wireframe: true 
    })
  );
  scene.add(cube);
  console.log("Added test cube to scene");
  
  // Simple wireframe sphere as a last resort fallback
  const fallbackHead = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 32, 32),
    new THREE.MeshBasicMaterial({ 
      color: 0x58a6ff, 
      wireframe: true 
    })
  );
  
  // Texture loader with crossOrigin
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';
  
  // Cache textures for use with the displacement material
  const textures = {};
  
  // Load face texture
  texLoader.load(
    'assets/me.jpg',
    texture => {
      console.log("Face texture loaded successfully");
      textures.face = texture;
      tryCreateHead();
    },
    undefined,
    err => {
      console.error("Failed to load face texture:", err);
      useFallbackHead();
    }
  );
  
  // Load depth texture
  texLoader.load(
    'assets/depth.png',
    texture => {
      console.log("Depth texture loaded successfully");
      textures.depth = texture;
      tryCreateHead();
    },
    undefined,
    err => {
      console.error("Failed to load depth texture:", err);
      useFallbackHead();
    }
  );
  
  // Try to create the head once both textures are loaded
  function tryCreateHead() {
    if (textures.face && textures.depth) {
      console.log("Both textures loaded, creating head");
      try {
        createSimpleHead(scene, textures.face);
        scene.remove(cube);
      } catch (e) {
        console.error("Error creating head:", e);
        useFallbackHead();
      }
    }
  }
  
  // Use fallback head if face creation fails
  function useFallbackHead() {
    console.log("Using fallback head");
    scene.add(fallbackHead);
    scene.remove(cube);
  }
  
  // Animation loop
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    
    // Rotate all meshes in the scene
    const t = clock.getElapsedTime();
    scene.traverse(obj => {
      if (obj.isMesh) {
        obj.rotation.y = t * 0.3;
      }
    });
    
    // Render
    renderer.render(scene, camera);
  });
}

// Create a simple head without relying on displacement
function createSimpleHead(scene, faceTexture) {
  console.log("Creating simple head wireframe");
  
  // Create geometry based on face aspect ratio
  const width = 1.5;
  const height = width * (faceTexture.image.height / faceTexture.image.width);
  
  // Use a finer geometry for better wireframe appearance
  const geo = new THREE.PlaneGeometry(width, height, 32, 32);
  
  // Manually displace some vertices to give a 3D effect without using the depth map
  const positions = geo.attributes.position;
  const count = positions.count;
  
  // Create a simple bulge in the middle
  for (let i = 0; i < count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    
    // Calculate distance from center
    const distanceFromCenter = Math.sqrt(x*x + y*y);
    const normalizedDistance = Math.min(distanceFromCenter / (width/2), 1);
    
    // Create a bulge that's highest in the center
    const bulge = 0.2 * (1 - normalizedDistance * normalizedDistance);
    
    // Apply the bulge
    positions.setZ(i, bulge);
  }
  
  positions.needsUpdate = true;
  
  // Create wireframe material
  const mat = new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 0xffffff
  });
  
  // Create and add mesh
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  console.log("Wireframe head added to scene");
  
  return mesh;
}