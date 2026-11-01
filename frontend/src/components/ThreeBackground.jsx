import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 32;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. High-Energy 3D Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0x8b5cf6, 4, 120);
    purpleLight.position.set(-25, 25, 25);
    scene.add(purpleLight);

    const skyLight = new THREE.PointLight(0x38bdf8, 3.5, 120);
    skyLight.position.set(25, -20, 20);
    scene.add(skyLight);

    const coralLight = new THREE.PointLight(0xfb7185, 3, 100);
    coralLight.position.set(0, 30, -15);
    scene.add(coralLight);

    const emeraldLight = new THREE.PointLight(0x10b981, 2.5, 100);
    emeraldLight.position.set(15, 25, 15);
    scene.add(emeraldLight);

    // 3. Floating 3D Geometric Blockchain Group
    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    const items = [];
    const count = 28;

    // Palette: Purple (#8B5CF6), Sky Blue (#38BDF8), Coral (#FB7185), Emerald (#10B981), Gold (#F59E0B)
    const colorPalette = [0x8b5cf6, 0x38bdf8, 0xfb7185, 0x10b981, 0xf59e0b];

    for (let i = 0; i < count; i++) {
      const size = 1.0 + Math.random() * 2.2;
      let geometry;
      const type = i % 4;

      if (type === 0) {
        // Ethereum Diamond (Octahedron)
        geometry = new THREE.OctahedronGeometry(size, 0);
      } else if (type === 1) {
        // Blockchain Block (Cube with beveled edge)
        geometry = new THREE.BoxGeometry(size, size, size);
      } else if (type === 2) {
        // Futuristic Crystal (Icosahedron)
        geometry = new THREE.IcosahedronGeometry(size * 0.9, 0);
      } else {
        // Torus / Token Ring
        geometry = new THREE.TorusGeometry(size * 0.7, size * 0.2, 12, 24);
      }

      const color = colorPalette[i % colorPalette.length];

      // Glassy, translucent 3D Web3 material
      const material = new THREE.MeshPhysicalMaterial({
        color: color,
        transparent: true,
        opacity: 0.35,
        roughness: 0.15,
        metalness: 0.3,
        transmission: 0.7,
        thickness: 1.5,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Glowing Wireframe Overlay
      const wireframeGeom = new THREE.WireframeGeometry(geometry);
      const wireframeMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.65,
      });
      const wireframe = new THREE.LineSegments(wireframeGeom, wireframeMat);
      mesh.add(wireframe);

      // Distribute in 3D space
      mesh.position.x = (Math.random() - 0.5) * 75;
      mesh.position.y = (Math.random() - 0.5) * 55;
      mesh.position.z = (Math.random() - 0.5) * 35;

      // Assign rotation & float speeds
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.016,
        rotY: (Math.random() - 0.5) * 0.02,
        rotZ: (Math.random() - 0.5) * 0.014,
        speedY: (Math.random() - 0.5) * 0.01,
        initialY: mesh.position.y,
      };

      floatGroup.add(mesh);
      items.push(mesh);
    }

    // 4. 3D Floating Particle Field (Glowing Stardust / Data Nodes)
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 90;
      positions[i + 1] = (Math.random() - 0.5) * 70;
      positions[i + 2] = (Math.random() - 0.5) * 45;

      // Colorful particle points
      const c = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
      particleColors[i] = c.r;
      particleColors[i + 1] = c.g;
      particleColors[i + 2] = c.b;
    }

    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.55,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Interactive Mouse Parallax (Tilts 3D scene on cursor movement)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event) => {
      mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // 6. Resize Handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // 7. Render & Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth camera interpolation
      targetX += (mouseX * 5 - targetX) * 0.05;
      targetY += (-mouseY * 5 - targetY) * 0.05;
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      // Spin and float 3D objects
      items.forEach((item) => {
        item.rotation.x += item.userData.rotX;
        item.rotation.y += item.userData.rotY;
        item.rotation.z += item.userData.rotZ;
        item.position.y += item.userData.speedY;

        if (item.position.y > 30) item.position.y = -30;
        if (item.position.y < -30) item.position.y = 30;
      });

      // Ambient group rotation
      floatGroup.rotation.y += 0.0006;
      particles.rotation.y += 0.0008;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
