import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DecokasaHouse3DProps {
  className?: string;
  interactive?: boolean;
}

export const DecokasaHouse3D: React.FC<DecokasaHouse3DProps> = ({
  className = '',
  interactive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Test WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    let animationFrameId: number;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera: Isometric 3/4 perspective for architectural logo
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 8.5);
    camera.lookAt(0, 0.1, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. Lighting - Warm Studio Architecture with Decokasa Golden Accents
    const ambientLight = new THREE.AmbientLight(0xfffbeb, 1.4);
    scene.add(ambientLight);

    // Subtle atmospheric progressive depth fog matching canvas background (#f7f7f8)
    scene.fog = new THREE.FogExp2(0xf7f7f8, 0.016);

    // Key Light: Warm bright sunlight from top-left
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Rim Light: Golden warm backlight to give logo edges pop
    const rimLight = new THREE.DirectionalLight(0xfbbf24, 1.8);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    // Front soft fill
    const fillLight = new THREE.DirectionalLight(0xffedd5, 1.1);
    fillLight.position.set(0, -3, 5);
    scene.add(fillLight);

    // Subtle warm point light under the roof apex
    const warmGlow = new THREE.PointLight(0xf59e0b, 2.6, 9);
    warmGlow.position.set(0, 0.3, 1.2);
    scene.add(warmGlow);

    // 5. Main Logo Group (Scaled +50% for high-resolution 3D volume)
    const logoGroup = new THREE.Group();
    logoGroup.scale.set(1.5, 1.5, 1.5);
    scene.add(logoGroup);

    // --- DECOKASA BRAND GOLDEN MATERIALS ---
    // Primary warm golden-yellow architectural lacquer (Decokasa Brand Color)
    const decokasaGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Vibrant warm Decokasa yellow/gold
      roughness: 0.26,
      metalness: 0.18,
      bumpScale: 0.05,
    });

    // Slightly lighter gold for window panes to add contrast
    const windowPaneMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.22,
      metalness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.08,
    });

    // Darker accent for chimney top
    const chimneyCapMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.35,
      metalness: 0.2,
    });

    // --- CONSTRUCT THE DECOKASA HOUSE LOGO IN 3D ---
    // The logo consists strictly of:
    // 1. Gable roof canopy with angled apex and eave terminations
    // 2. Chimney on the right slope
    // 3. Exactly 4 square window panes in a 2x2 grid under the apex

    const roofDepth = 1.1; // Depth along Z-axis
    const roofThickness = 0.42; // Thickness of the roof beam
    const roofSlopeLength = 3.2; // Length of each roof slope
    const roofAngle = Math.PI / 4.8; // ~37.5 degrees slope angle

    // Left Roof Slope
    const leftSlopeGeom = new THREE.BoxGeometry(roofSlopeLength, roofThickness, roofDepth);
    const leftSlope = new THREE.Mesh(leftSlopeGeom, decokasaGoldMat);
    leftSlope.castShadow = true;
    leftSlope.receiveShadow = true;
    leftSlope.position.set(-1.18, 0.96, 0);
    leftSlope.rotation.z = roofAngle;
    logoGroup.add(leftSlope);

    // Right Roof Slope
    const rightSlopeGeom = new THREE.BoxGeometry(roofSlopeLength, roofThickness, roofDepth);
    const rightSlope = new THREE.Mesh(rightSlopeGeom, decokasaGoldMat);
    rightSlope.castShadow = true;
    rightSlope.receiveShadow = true;
    rightSlope.position.set(1.18, 0.96, 0);
    rightSlope.rotation.z = -roofAngle;
    logoGroup.add(rightSlope);

    // Apex Cap (Smooth connection at the ridge top)
    const apexGeom = new THREE.BoxGeometry(roofThickness * 1.35, roofThickness * 1.05, roofDepth);
    const apex = new THREE.Mesh(apexGeom, decokasaGoldMat);
    apex.castShadow = true;
    apex.receiveShadow = true;
    apex.position.set(0, 1.94, 0);
    logoGroup.add(apex);

    // Chimney on the right roof slope (Iconic Decokasa logo feature)
    const chimneyWidth = 0.46;
    const chimneyHeight = 0.95;
    const chimneyDepth = 0.72;
    const chimneyGeom = new THREE.BoxGeometry(chimneyWidth, chimneyHeight, chimneyDepth);
    const chimney = new THREE.Mesh(chimneyGeom, decokasaGoldMat);
    chimney.castShadow = true;
    chimney.receiveShadow = true;
    chimney.position.set(1.22, 1.78, 0);
    logoGroup.add(chimney);

    // Chimney top cap
    const chimneyCapGeom = new THREE.BoxGeometry(chimneyWidth * 1.15, 0.1, chimneyDepth * 1.15);
    const chimneyCap = new THREE.Mesh(chimneyCapGeom, chimneyCapMat);
    chimneyCap.position.set(1.22, 1.78 + chimneyHeight / 2 + 0.05, 0);
    logoGroup.add(chimneyCap);

    // 4 SQUARE WINDOW PANES (2x2 Grid under the roof apex)
    const paneSize = 0.44; // Width and height of each pane
    const paneDepth = 0.42; // Thickness in Z
    const paneGap = 0.12; // Gap between panes
    const paneCenterY = 0.78; // Y-position under apex

    const panePositions = [
      { x: -(paneSize / 2 + paneGap / 2), y: paneCenterY + paneSize / 2 + paneGap / 2 }, // Top-Left
      { x: +(paneSize / 2 + paneGap / 2), y: paneCenterY + paneSize / 2 + paneGap / 2 }, // Top-Right
      { x: -(paneSize / 2 + paneGap / 2), y: paneCenterY - (paneSize / 2 + paneGap / 2) }, // Bottom-Left
      { x: +(paneSize / 2 + paneGap / 2), y: paneCenterY - (paneSize / 2 + paneGap / 2) }, // Bottom-Right
    ];

    panePositions.forEach((pos) => {
      const paneGeom = new THREE.BoxGeometry(paneSize, paneSize, paneDepth);
      const pane = new THREE.Mesh(paneGeom, windowPaneMat);
      pane.castShadow = true;
      pane.receiveShadow = true;
      pane.position.set(pos.x, pos.y, 0.08); // Slightly forward
      logoGroup.add(pane);
    });

    // Soft architectural shadow floor disc (scaled with 3D model)
    const shadowDiscGeom = new THREE.CircleGeometry(2.8 * 1.5, 36);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.06,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeom, shadowDiscMat);
    shadowDisc.rotation.x = -Math.PI / 2;
    shadowDisc.position.set(0, -1.75, 0);
    scene.add(shadowDisc);

    // Initial orientation: slightly turned to showcase 3D volume
    logoGroup.rotation.y = -0.32;
    logoGroup.rotation.x = 0.14;

    // --- MOUSE & TOUCH INTERACTION ---
    let targetRotationY = -0.32;
    let targetRotationX = 0.14;
    let currentRotationY = -0.32;
    let currentRotationX = 0.14;
    let isDragging = false;
    let previousPointerX = 0;
    let previousPointerY = 0;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      setIsInteracting(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) {
        // Hover tilt when not dragging
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        const rect = container.getBoundingClientRect();
        const normX = ((clientX - rect.left) / rect.width) * 2 - 1;
        const normY = -(((clientY - rect.top) / rect.height) * 2 - 1);
        targetRotationY = -0.32 + normX * 0.45;
        targetRotationX = 0.14 - normY * 0.25;
        return;
      }

      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const deltaX = clientX - previousPointerX;
      const deltaY = clientY - previousPointerY;

      targetRotationY += deltaX * 0.012;
      targetRotationX += deltaY * 0.012;

      // Clamping vertical rotation
      targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    const handlePointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // --- RESIZE LISTENER ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 400;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- ANIMATION LOOP ---
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle continuous floating motion with lower baseline
      const floatOffsetY = Math.sin(elapsedTime * 1.5) * 0.08;
      logoGroup.position.y = -0.2 + floatOffsetY;

      // Auto rotation drift when user is not actively interacting
      if (!isDragging) {
        targetRotationY += 0.003;
      }

      // Smooth damping towards target rotation
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;
      currentRotationX += (targetRotationX - currentRotationX) * 0.08;

      logoGroup.rotation.y = currentRotationY;
      logoGroup.rotation.x = currentRotationX;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domEl.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      // Clean up geometries and materials
      [leftSlopeGeom, rightSlopeGeom, apexGeom, chimneyGeom, chimneyCapGeom, shadowDiscGeom].forEach(
        (g) => g.dispose()
      );
      [decokasaGoldMat, windowPaneMat, chimneyCapMat, shadowDiscMat].forEach((m) => m.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive]);

  if (!webglSupported) {
    return (
      <div className={`flex items-center justify-center bg-amber-50 rounded-2xl border border-amber-200 p-6 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 text-amber-500 font-black text-2xl">▲</div>
          <span className="text-xs font-bold text-amber-900">Logo Decokasa 3D</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ touchAction: 'none' }}
      title="Logo 3D Decokasa interactivo · Arrastra con el cursor o el dedo para rotar"
    >
      {/* Subtle interaction tip overlay */}
      {interactive && (
        <div
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-bold text-amber-200 border border-white/10 pointer-events-none transition-opacity duration-300 ${
            isInteracting ? 'opacity-0' : 'opacity-70 hover:opacity-100'
          }`}
        >
          <span>3D interactivo · Arrastra para girar</span>
        </div>
      )}
    </div>
  );
};
