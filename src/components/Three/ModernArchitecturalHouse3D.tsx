import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface ModernHouse3DProps {
  className?: string;
}

export const ModernArchitecturalHouse3D: React.FC<ModernHouse3DProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Check WebGL availability
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

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 540;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Architectural Perspective Camera
    // Positioned at a modern 3/4 isometric architectural viewpoint
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(7.5, 4.8, 7.8);
    camera.lookAt(0.3, 1.2, 0);

    // 3. Renderer with antialiasing and alpha transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Studio Architectural Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    // Soft warm sun directional light
    const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.2);
    sunLight.position.set(10, 14, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Secondary sky fill light (cool daylight blue)
    const skyFillLight = new THREE.DirectionalLight(0xe0f2fe, 0.9);
    skyFillLight.position.set(-8, 6, -6);
    scene.add(skyFillLight);

    // Subtle Vivibox red architectural cove accent light
    const redAccent = new THREE.PointLight(0xed1c24, 2.5, 8);
    redAccent.position.set(2.0, 1.8, 1.8);
    scene.add(redAccent);

    // Vivibox check blue soft ambient glow underneath cantilever
    const blueAccent = new THREE.PointLight(0x1877f2, 2.0, 9);
    blueAccent.position.set(-1.8, 1.0, 2.2);
    scene.add(blueAccent);

    // 5. Main Modern Architectural House Group
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // --- MATERIALS (Contemporary architectural palette) ---
    // Pure white architectural render / stucco
    const whiteStuccoMat = new THREE.MeshStandardMaterial({
      color: 0xfbfbfe,
      roughness: 0.35,
      metalness: 0.02,
    });

    // Dark graphite architectural panels
    const darkGraphiteMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.45,
      metalness: 0.25,
    });

    // Warm natural cedar wood slats
    const cedarWoodMat = new THREE.MeshStandardMaterial({
      color: 0xbf8252,
      roughness: 0.65,
      metalness: 0.05,
    });

    // Modern architectural glass (with light sky reflectivity)
    const architecturalGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x60a5fa,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.65,
      transparent: true,
      opacity: 0.85,
    });

    // Black aluminum window framing
    const blackFrameMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.2,
      metalness: 0.6,
    });

    // Ground platform / floating concrete deck
    const concreteDeckMat = new THREE.MeshStandardMaterial({
      color: 0xeeeef2,
      roughness: 0.8,
      metalness: 0.05,
    });

    // --- GEOMETRIES & VOLUMES ---
    // A. Stepped Concrete Foundation Platform
    const deckGeo = new THREE.BoxGeometry(7.2, 0.22, 6.2);
    const deckMesh = new THREE.Mesh(deckGeo, concreteDeckMat);
    deckMesh.position.set(0.2, -0.11, 0);
    deckMesh.receiveShadow = true;
    houseGroup.add(deckMesh);

    // Subtle edge rim in Vivibox blue line
    const deckEdgeGeo = new THREE.BoxGeometry(7.25, 0.04, 6.25);
    const deckEdgeMat = new THREE.MeshStandardMaterial({
      color: 0x1877f2,
      roughness: 0.3,
      metalness: 0.4,
    });
    const deckEdgeMesh = new THREE.Mesh(deckEdgeGeo, deckEdgeMat);
    deckEdgeMesh.position.set(0.2, -0.22, 0);
    houseGroup.add(deckEdgeMesh);

    // B. Ground Floor Volume (Living & Gallery, Modern Glass & White Stucco)
    const groundFloorGeo = new THREE.BoxGeometry(3.6, 1.8, 3.4);
    const groundFloorMesh = new THREE.Mesh(groundFloorGeo, whiteStuccoMat);
    groundFloorMesh.position.set(-0.4, 0.9, -0.1);
    groundFloorMesh.castShadow = true;
    groundFloorMesh.receiveShadow = true;
    houseGroup.add(groundFloorMesh);

    // Large floor-to-ceiling panoramic glass facade on ground floor
    const groundGlassGeo = new THREE.BoxGeometry(2.4, 1.5, 0.06);
    const groundGlassMesh = new THREE.Mesh(groundGlassGeo, architecturalGlassMat);
    groundGlassMesh.position.set(-0.4, 0.85, 1.62);
    houseGroup.add(groundGlassMesh);

    // Minimal black mullions/frames for glass
    const mullionHGeo = new THREE.BoxGeometry(2.42, 0.04, 0.08);
    const mullionH = new THREE.Mesh(mullionHGeo, blackFrameMat);
    mullionH.position.set(-0.4, 0.85, 1.63);
    houseGroup.add(mullionH);

    const mullionVGeo = new THREE.BoxGeometry(0.04, 1.52, 0.08);
    const mullionV = new THREE.Mesh(mullionVGeo, blackFrameMat);
    mullionV.position.set(-0.4, 0.85, 1.63);
    houseGroup.add(mullionV);

    // C. Upper Floor Cantilevered Volume (Modern architectural hallmark)
    // Shifted forward and rightwards, creating dynamic contemporary tension
    const upperFloorGeo = new THREE.BoxGeometry(4.0, 1.7, 3.2);
    const upperFloorMesh = new THREE.Mesh(upperFloorGeo, darkGraphiteMat);
    upperFloorMesh.position.set(0.8, 2.65, 0.4);
    upperFloorMesh.castShadow = true;
    upperFloorMesh.receiveShadow = true;
    houseGroup.add(upperFloorMesh);

    // Accent wood slat cladding on upper floor front return
    const woodAccentGeo = new THREE.BoxGeometry(1.6, 1.5, 0.08);
    const woodAccentMesh = new THREE.Mesh(woodAccentGeo, cedarWoodMat);
    woodAccentMesh.position.set(1.8, 2.65, 2.03);
    woodAccentMesh.castShadow = true;
    houseGroup.add(woodAccentMesh);

    // Upper floor corner glass ribbon window
    const upperGlassGeo = new THREE.BoxGeometry(2.0, 1.2, 0.06);
    const upperGlassMesh = new THREE.Mesh(upperGlassGeo, architecturalGlassMat);
    upperGlassMesh.position.set(-0.1, 2.7, 2.02);
    houseGroup.add(upperGlassMesh);

    // Modern flat overhanging roof slab with crisp shadow line
    const roofSlabGeo = new THREE.BoxGeometry(4.6, 0.16, 3.8);
    const roofSlabMesh = new THREE.Mesh(roofSlabGeo, whiteStuccoMat);
    roofSlabMesh.position.set(0.8, 3.55, 0.4);
    roofSlabMesh.castShadow = true;
    houseGroup.add(roofSlabMesh);

    // Under-roof subtle red accent reveal (Vivibox signature)
    const roofRevealGeo = new THREE.BoxGeometry(4.62, 0.03, 3.82);
    const roofRevealMat = new THREE.MeshStandardMaterial({
      color: 0xed1c24,
      emissive: 0xed1c24,
      emissiveIntensity: 0.4,
      roughness: 0.2,
    });
    const roofRevealMesh = new THREE.Mesh(roofRevealGeo, roofRevealMat);
    roofRevealMesh.position.set(0.8, 3.46, 0.4);
    houseGroup.add(roofRevealMesh);

    // D. Cantilever Support Pillar (Thin architectural steel pilotis)
    const columnGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 16);
    const columnMesh = new THREE.Mesh(columnGeo, blackFrameMat);
    columnMesh.position.set(2.4, 0.9, 1.7);
    columnMesh.castShadow = true;
    houseGroup.add(columnMesh);

    // E. Entrance Pergola / Wooden Screen
    const pergolaBeamGeo = new THREE.BoxGeometry(1.8, 0.08, 0.12);
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(pergolaBeamGeo, cedarWoodMat);
      beam.position.set(1.6, 1.75, 0.8 + i * 0.3);
      beam.castShadow = true;
      houseGroup.add(beam);
    }

    // F. Modern Terrace Planter with minimal architectural greenery
    const planterGeo = new THREE.BoxGeometry(2.0, 0.4, 0.5);
    const planterMesh = new THREE.Mesh(planterGeo, whiteStuccoMat);
    planterMesh.position.set(-1.8, 0.2, 2.0);
    planterMesh.castShadow = true;
    houseGroup.add(planterMesh);

    // Minimalist foliage / landscape cubes
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      roughness: 0.8,
    });
    const foliageGeo = new THREE.BoxGeometry(1.8, 0.35, 0.35);
    const foliageMesh = new THREE.Mesh(folioliGeoFallback(foliageGeo), foliageMat);
    foliageMesh.position.set(-1.8, 0.5, 2.0);
    houseGroup.add(foliageMesh);

    function folioliGeoFallback(g: THREE.BoxGeometry) {
      return g;
    }

    // 6. Animation Loop with Performance Optimization
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let isVisible = true;

    // Check visibility to pause rendering when tab is in background
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        clock.start();
      } else {
        clock.stop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Smooth ambient idle rotation (slow, non-intrusive)
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Subtle breathing motion
      houseGroup.position.y = Math.sin(elapsed * 0.6) * 0.06;

      // Ultra slow architectural pan (smooth angle transition)
      houseGroup.rotation.y = Math.sin(elapsed * 0.15) * 0.08 + 0.15;
      houseGroup.rotation.x = Math.sin(elapsed * 0.12) * 0.03;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Responsive Resizing
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 8. Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  if (!webglSupported) {
    // Fallback static architectural silhouette
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <div className="w-72 h-64 rounded-3xl bg-gradient-to-tr from-slate-200 to-slate-100 border border-white/60 shadow-inner flex items-center justify-center">
          <span className="text-xs font-bold text-slate-400">Vivibox Arquitectura 3D</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};
