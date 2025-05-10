import * as THREE from 'https://unpkg.com/three@^0.164/build/three.module.js';

// handles scene injection into #hero-canvas (make that elem in HTML)
export function loadHero() {
  console.log("Initializing hero 3D photo");
  
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

  // Add lights for better texture appearance
  scene.add(new THREE.AmbientLight(0xffffff, 0.4)); // Adjusted ambient light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Adjusted directional light
  directionalLight.position.set(1, 1, 2);
  scene.add(directionalLight);
  
  // Add a rim light for better edge definition
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.3); // Adjusted rim light
  rimLight.position.set(-1, 0.5, -1);
  scene.add(rimLight);
  
  // Start with a temporary cube to ensure rendering works
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ 
      color: 0x3498db, 
      wireframe: true 
    })
  );
  scene.add(cube);
  console.log("Added temporary cube to scene");
  
  // Load textures
  const imageLoader = new THREE.ImageLoader();
  imageLoader.setCrossOrigin('anonymous');
  
  // Create a texture loader for the face texture
  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  
  // Create a cache for our loaded assets
  const assets = {
    depthImage: null,
    faceTexture: null
  };
  
  // Load the depth image
  imageLoader.load(
    'assets/depth.png',
    (depthImage) => {
      console.log("Depth image loaded as Image:", depthImage.width, "x", depthImage.height);
      assets.depthImage = depthImage;
      tryCreateMesh(scene, assets, cube);
    },
    undefined,
    (err) => {
      console.error("Failed to load depth image:", err);
    }
  );
  
  // Load the face texture
  textureLoader.load(
    'assets/me.jpg',
    (faceTexture) => {
      console.log("Face texture loaded:", faceTexture.image.width, "x", faceTexture.image.height);
      // Improve texture rendering
      faceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      
      // Enhance contrast by manipulating texture settings
      faceTexture.encoding = THREE.sRGBEncoding; // Better color encoding
      
      assets.faceTexture = faceTexture;
      tryCreateMesh(scene, assets, cube);
    },
    undefined,
    (err) => {
      console.error("Failed to load face texture:", err);
    }
  );
  
  // Store mouse position for tracking
  const mouse = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    updateRate: 0.1 // Controls how quickly the head follows the mouse
  };
  
  // Add mouse move listener for tracking
  document.addEventListener('mousemove', (event) => {
    // Calculate normalized coordinates (-1 to 1)
    mouse.targetX = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
  });
  
  // Animation loop
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    // Resize canvas if needed
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
    
    // Smoothly update mouse position (easing)
    mouse.x += (mouse.targetX - mouse.x) * mouse.updateRate;
    mouse.y += (mouse.targetY - mouse.y) * mouse.updateRate;
    
    // Apply mouse tracking rotation to all meshes in the scene
    scene.traverse(obj => {
      if (obj.isMesh || obj.isGroup) {
        // Apply mouse tracking with limits
        const t = clock.getElapsedTime();
        
        // Main rotation follows mouse horizontally (with subtle automatic movement)
        obj.rotation.y = Math.sin(t * 0.1) * 0.05 + (mouse.x * 0.075); // Further reduced horizontal rotation sensitivity
        
        // Subtle vertical tilt based on mouse position
        obj.rotation.x = -0.05 - (mouse.y * 0.05); // Inverted vertical rotation: up for mouse up, down for mouse down
      }
    });
    
    // Render
    renderer.render(scene, camera);
  });
  
  // Ensure we render once immediately
  renderer.render(scene, camera);
}

// Try to create the mesh when all assets are loaded
function tryCreateMesh(scene, assets, tempCube) {
  // Check if all assets are loaded
  if (assets.depthImage && assets.faceTexture) {
    console.log("All assets loaded, creating 3D photo");
    
    // Create the mesh with both depth and face texture
    const headMesh = create3DPhoto(scene, assets.depthImage, assets.faceTexture);
    
    // Remove the temp cube once the photo is created
    if (headMesh) {
      scene.remove(tempCube);
      console.log("Removed temporary cube, 3D photo is now visible");
    }
  }
}

// Create a 3D photo using the depth map and face texture
function create3DPhoto(scene, depthImage, faceTexture) {
  // Create a canvas to read depth data from the image
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set canvas size to match the depth image
  canvas.width = depthImage.width;
  canvas.height = depthImage.height;
  
  // Draw the depth image to the canvas so we can read its pixels
  ctx.drawImage(depthImage, 0, 0);
  
  try {
    // Try to get the pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    console.log("Successfully read depth data from canvas");
    
    // Create aspect-ratio-correct plane
    const width = 1.6; // Slightly smaller for better framing
    const height = width * (canvas.height / canvas.width);
    
    // Create a grid with enough segments to represent the detail
    const segmentsX = Math.min(128, canvas.width / 4);  // Don't need full resolution
    const segmentsY = Math.min(128, canvas.height / 4);
    const planeGeometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    
    // Function to get depth at a specific UV coordinate
    const getDepthAtUV = (u, v) => {
      // Convert UV to pixel coordinates
      const x = Math.floor(u * canvas.width); // Adjusted x-coordinate mapping
      const y = Math.floor((1 - v) * canvas.height); // v is flipped as texture v=0 is bottom, image y=0 is top
      
      // Get pixel index
      const index = (y * canvas.width + x) * 4;
      
      // Return normalized depth value (0-1)
      // Use only the red channel as grayscale images typically store values in the R channel
      return pixels[index] / 255;
    };
    
    // Process the displacement
    const positions = planeGeometry.attributes.position;
    const uvs = planeGeometry.attributes.uv;
    
    // Apply depth displacement
    for (let i = 0; i < positions.count; i++) {
      // Get UV coordinates
      const u = uvs.getX(i);
      const v = uvs.getY(i);
      
      // Get depth value from image
      const depth = getDepthAtUV(u, v);
      
      // Apply displacement
      const depthFactor = 0.7; // Increased depth effect
      positions.setZ(i, depth * depthFactor);
    }
    
    // Update normals for better lighting
    planeGeometry.computeVertexNormals();
    
    // Update geometry after changes
    positions.needsUpdate = true;
    
    // Create a main textured mesh with the photo
    const mainMaterial = new THREE.MeshStandardMaterial({
      map: faceTexture,
      // Enhanced material properties for better contrast
      roughness: 0.5,
      metalness: 0.1,
      side: THREE.DoubleSide, // Show both sides
      // Color adjustment for better contrast
      color: 0xffffff, // Base color
      emissive: 0x000000 // Removed emissive component
      // emissiveIntensity: 0.2 // Removed
    });
    
    // Create a subtle wireframe on top for depth perception
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x58a6ff,
      wireframe: true,
      transparent: true,
      opacity: 0.05 // More subtle wireframe
    });
    
    // Create the meshes
    const mainMesh = new THREE.Mesh(planeGeometry, mainMaterial);
    const wireframeMesh = new THREE.Mesh(planeGeometry.clone(), wireframeMaterial);
    
    // Position meshes
    mainMesh.position.set(0, 0, 0);
    wireframeMesh.position.set(0, 0, 0.005); // Tiny offset to prevent z-fighting
    
    // Create a group to manage both meshes
    const photoGroup = new THREE.Group();
    photoGroup.add(mainMesh);
    photoGroup.add(wireframeMesh);
    
    // Add a slight tilt for more natural look
    photoGroup.rotation.x = -0.05;
    
    // Add the group to the scene
    scene.add(photoGroup);
    
    console.log("Created and added 3D photo with depth displacement");
    
    return photoGroup;
  } catch (e) {
    console.error("Error creating 3D photo:", e);
    createFallbackPhoto(scene, faceTexture);
    return null;
  }
}

// Create a fallback flat photo if the depth map approach fails
function createFallbackPhoto(scene, faceTexture) {
  console.log("Creating fallback flat photo");
  
  // Calculate aspect ratio
  const aspect = faceTexture.image.height / faceTexture.image.width;
  const width = 1.6; // Slightly smaller for better framing
  const height = width * aspect;
  
  // Create a simple plane
  const geometry = new THREE.PlaneGeometry(width, height);
  
  // Rotate the geometry to match orientation
  // geometry.rotateZ(Math.PI); // Removed rotation
  
  const material = new THREE.MeshStandardMaterial({
    map: faceTexture,
    side: THREE.DoubleSide,
    // Enhanced material properties
    roughness: 0.5,
    metalness: 0.1,
    color: 0xffffff, // Base color
    emissive: 0x000000 // Removed emissive component
    // emissiveIntensity: 0.2 // Removed
  });
  
  const photoMesh = new THREE.Mesh(geometry, material);
  scene.add(photoMesh);
  
  return photoMesh;
}
