import * as THREE from 'https://unpkg.com/three@^0.164/build/three.module.js';

// handles scene injection into #hero-canvas (make that elem in HTML)
export function loadHero() {
  console.log("Initializing hero wireframe");
  
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  
  // Make the canvas visible
  canvas.style.display = 'block';
  
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
  
  // Texture loader with crossOrigin
  const texLoader = new THREE.TextureLoader();
  texLoader.crossOrigin = 'anonymous';
  
  // Load textures
  texLoader.load(
    'assets/me.jpg',
    faceTexture => {
      console.log("Face texture loaded successfully");
      
      texLoader.load(
        'assets/depth.png',
        depthTexture => {
          console.log("Depth texture loaded successfully");
          
          // Now we have both textures, create the actual head wireframe
          createWireframeHead(scene, faceTexture, depthTexture);
          
          // Remove the test cube
          scene.remove(cube);
        },
        undefined,
        err => console.error("Failed to load depth texture:", err)
      );
    },
    undefined,
    err => console.error("Failed to load face texture:", err)
  );
  
  // Animation loop
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      console.log(`Canvas resized: ${canvas.clientWidth}x${canvas.clientHeight}`);
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
  
  // Ensure the renderer is actually rendering
  renderer.render(scene, camera);
}

// Function to create the actual head wireframe
function createWireframeHead(scene, faceTexture, depthTexture) {
  console.log("Creating wireframe head");
  
  // Ensure depth texture has the right filtering
  depthTexture.minFilter = THREE.LinearFilter;
  
  // Create plane geometry
  const width = 1.5;
  const height = width * (faceTexture.image.height / faceTexture.image.width);
  const geo = new THREE.PlaneGeometry(width, height, 128, 128);
  
  // Create simple wireframe material
  const mat = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    wireframe: true 
  });
  
  // Create mesh and add to scene
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);
  console.log("Wireframe head added to scene");
  
  // Try to apply depth map to geometry
  try {
    const positions = geo.attributes.position;
    const uvs = geo.attributes.uv;
    depthTexture.needsUpdate = true;
    
    const strength = 0.4; // depth exaggeration
    
    // Make sure we have image data
    if (depthTexture.image && depthTexture.image.data) {
      console.log("Applying depth map to geometry");
      
      for (let i = 0; i < positions.count; i++) {
        const u = uvs.getX(i);
        const v = 1 - uvs.getY(i);
        
        // Quick pixel lookup
        const x = Math.floor(u * depthTexture.image.width);
        const y = Math.floor(v * depthTexture.image.height);
        const idx = (y * depthTexture.image.width + x) * 4;
        const z = depthTexture.image.data[idx] / 255; // 0-1
        
        positions.setZ(i, z * strength);
      }
      positions.needsUpdate = true;
      console.log("Depth map applied successfully");
    } else {
      console.warn("Depth texture has no image data available");
    }
  } catch (e) {
    console.error("Error applying depth map:", e);
  }
}