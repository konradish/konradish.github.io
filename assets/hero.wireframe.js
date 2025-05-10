import * as THREE from 'https://unpkg.com/three@^0.164/build/three.module.js';

// handles scene injection into #hero-canvas (make that elem in HTML)
export function loadHero() {
  const canvas = document.getElementById('hero-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true });
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, canvas.clientWidth/canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 3);

  // lighting (subtle rim)
  scene.add(new THREE.DirectionalLight(0xffffff, .8));

  // geometry: plane subdivided for displacement
  const texLoader = new THREE.TextureLoader();
  const face = texLoader.load('assets/me.jpg');
  const depth = texLoader.load('assets/depth.png', t => (t.minFilter = THREE.LinearFilter));

  const width = 1.5;           // tweak to match aspect
  const height = width * (face.image.height / face.image.width);

  const geo = new THREE.PlaneGeometry(width, height, 128, 128);
  const mat = new THREE.MeshBasicMaterial({ map: face, wireframe: true });
  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // displace vertices using depth texture
  const positions = geo.attributes.position;
  const uvs = geo.attributes.uv;
  depth.needsUpdate = true;

  const strength = .4; // depth exaggeration
  for (let i = 0; i < positions.count; i++) {
    const u = uvs.getX(i), v = 1 - uvs.getY(i);
    const col = new THREE.Color(depth.image);
    // quick pixel lookup
    const x = Math.floor(u * depth.image.width);
    const y = Math.floor(v * depth.image.height);
    const idx = (y * depth.image.width + x) * 4;
    const z = depth.image.data[idx] / 255; // 0‑1
    positions.setZ(i, z * strength);
  }
  positions.needsUpdate = true;

  // rotate loop
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    mesh.rotation.y = t * 0.3;
    if (canvas.width !== canvas.clientWidth) renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.render(scene, camera);
  });
}