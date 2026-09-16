import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const House3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 320;
    const height = container.clientHeight || 280;

    // Scene
    const scene = new THREE.Scene();

    // Camera (Isometric angle)
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(5.5, 4.2, 5.5);
    camera.lookAt(0, 0.6, 0);

    // Renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(6, 10, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Blue fill light for Vivibox high-tech aesthetic
    const blueFill = new THREE.PointLight(0x1877f2, 2.5, 12);
    blueFill.position.set(-4, 2, -2);
    scene.add(blueFill);

    // Red accent light
    const redAccent = new THREE.PointLight(0xed1c24, 2.0, 10);
    redAccent.position.set(2, 4, 3);
    scene.add(redAccent);

    // Root House Group
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // 1. Base Platform (Pedestal)
    const baseGeo = new THREE.CylinderGeometry(2.3, 2.5, 0.25, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0xf1f3f9,
      roughness: 0.4,
      metalness: 0.1,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.12;
    baseMesh.receiveShadow = true;
    houseGroup.add(baseMesh);

    // Ring accent around pedestal in Vivibox Blue
    const ringGeo = new THREE.TorusGeometry(2.4, 0.04, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1877f2,
      emissive: 0x1877f2,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.02;
    houseGroup.add(ringMesh);

    // 2. Main House Body (White architectural clay)
    const bodyGeo = new THREE.BoxGeometry(2.0, 1.6, 2.0);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.05,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 0.85;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    houseGroup.add(bodyMesh);

    // 3. Iconic Vivibox Red Roof (Gabled Prism)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-1.2, 0);
    roofShape.lineTo(0, 1.1);
    roofShape.lineTo(1.2, 0);
    roofShape.closePath();

    const extrudeSettings = {
      depth: 2.2,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    };

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, extrudeSettings);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xed1c24, // Official Vivibox Red
      roughness: 0.3,
      metalness: 0.15,
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 1.65, -1.1);
    roofMesh.castShadow = true;
    houseGroup.add(roofMesh);

    // 4. Modern Architectural Chimney
    const chimneyGeo = new THREE.BoxGeometry(0.35, 0.9, 0.35);
    const chimneyMat = new THREE.MeshStandardMaterial({
      color: 0x1e2230,
      roughness: 0.5,
    });
    const chimneyMesh = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimneyMesh.position.set(0.65, 2.3, 0.4);
    chimneyMesh.castShadow = true;
    houseGroup.add(chimneyMesh);

    // 5. Front Entrance Door (Dark graphite modern door)
    const doorGeo = new THREE.BoxGeometry(0.5, 0.95, 0.06);
    const doorMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.3,
      metalness: 0.2,
    });
    const doorMesh = new THREE.Mesh(doorGeo, doorMat);
    doorMesh.position.set(0, 0.55, 1.02);
    houseGroup.add(doorMesh);

    // Door handle (Gold / Brass accent)
    const handleGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const handleMesh = new THREE.Mesh(handleGeo, handleMat);
    handleMesh.position.set(0.18, 0.55, 1.07);
    houseGroup.add(handleMesh);

    // 6. Windows with Glass Glow
    const windowMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.9,
    });

    // Front Window
    const winGeo = new THREE.BoxGeometry(0.5, 0.5, 0.04);
    const winMesh1 = new THREE.Mesh(winGeo, windowMat);
    winMesh1.position.set(0, 2.05, 1.03);
    houseGroup.add(winMesh1);

    // Side Window (Left)
    const winGeoSide = new THREE.BoxGeometry(0.04, 0.6, 0.8);
    const winMeshSide = new THREE.Mesh(winGeoSide, windowMat);
    winMeshSide.position.set(-1.02, 0.9, 0);
    houseGroup.add(winMeshSide);

    // 7. Decorative Floating Box ("Box" concept of Vivibox)
    const miniBoxGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const miniBoxMat = new THREE.MeshStandardMaterial({
      color: 0x1877f2,
      roughness: 0.2,
      metalness: 0.3,
    });
    const miniBox = new THREE.Mesh(miniBoxGeo, miniBoxMat);
    miniBox.position.set(1.4, 0.3, 0.8);
    miniBox.rotation.y = 0.4;
    miniBox.castShadow = true;
    houseGroup.add(miniBox);

    // Subtle checkmark badge floating above house
    const badgeGeo = new THREE.TorusGeometry(0.22, 0.05, 16, 32);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x1877f2,
      emissive: 0x1877f2,
      emissiveIntensity: 0.6,
      metalness: 0.5,
      roughness: 0.2,
    });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.set(0, 3.2, 0);
    houseGroup.add(badgeMesh);

    // Smoke particles from chimney
    const particleCount = 4;
    const particles: THREE.Mesh[] = [];
    const smokeGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const smokeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 1.0,
    });

    for (let i = 0; i < particleCount; i++) {
      const p = new THREE.Mesh(smokeGeo, smokeMat.clone());
      p.position.set(0.65, 2.8 + i * 0.25, 0.4);
      houseGroup.add(p);
      particles.push(p);
    }

    // Interactive pointer handling
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x * 0.4;
      mouseY = y * 0.3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Idle levitation
      houseGroup.position.y = Math.sin(elapsedTime * 1.6) * 0.12;

      // Base smooth rotation + mouse parallax lerp
      targetRotationY = elapsedTime * 0.35 + mouseX;
      targetRotationX = mouseY;

      houseGroup.rotation.y += (targetRotationY - houseGroup.rotation.y) * 0.05;
      houseGroup.rotation.x += (targetRotationX - houseGroup.rotation.x) * 0.05;

      // Badge rotation
      badgeMesh.rotation.y += 0.03;
      badgeMesh.rotation.z = Math.sin(elapsedTime * 2) * 0.2;

      // Smoke puff animation
      particles.forEach((p, idx) => {
        p.position.y += 0.008;
        p.position.x = 0.65 + Math.sin(elapsedTime * 2 + idx) * 0.06;
        (p.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.7 - (p.position.y - 2.8) * 0.8);

        if (p.position.y > 3.6) {
          p.position.y = 2.8;
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // Resize handling
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-48 sm:w-64 md:w-72 h-44 sm:h-56 md:h-64 mx-auto relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      title="Casa 3D interactiva Vivibox (Mueve el cursor para interactuar)"
    />
  );
};
