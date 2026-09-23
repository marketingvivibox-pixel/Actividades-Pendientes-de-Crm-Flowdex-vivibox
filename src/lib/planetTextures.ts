import * as THREE from 'three';
import { CRMTask, FunctionalFocus } from '../types';

/**
 * Creates high-detail procedural canvas textures for 3D planets.
 * Avoids external image loading dependencies and works 100% offline.
 */
export function createPlanetTexture(
  task: CRMTask,
  focus: FunctionalFocus,
  colorHex: string
): { map: THREE.CanvasTexture; bumpMap?: THREE.CanvasTexture } {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = 64;
    fallbackCanvas.height = 64;
    return { map: new THREE.CanvasTexture(fallbackCanvas) };
  }

  const score = task.criticalityScore;

  // Background base gradient
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 256);
  
  if (focus === 'infraestructura' || score >= 85) {
    // Gas Giant Jovian / Volcanic Style with atmospheric bands
    baseGrad.addColorStop(0, '#450a0a');
    baseGrad.addColorStop(0.2, '#7f1d1d');
    baseGrad.addColorStop(0.4, '#b91c1c');
    baseGrad.addColorStop(0.5, '#f97316');
    baseGrad.addColorStop(0.7, '#991b1b');
    baseGrad.addColorStop(0.85, '#dc2626');
    baseGrad.addColorStop(1, '#450a0a');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Draw turbulent atmospheric bands & storms
    for (let y = 10; y < 250; y += 12) {
      ctx.beginPath();
      ctx.strokeStyle = y % 24 === 0 ? 'rgba(254, 240, 138, 0.45)' : 'rgba(30, 0, 0, 0.4)';
      ctx.lineWidth = 4 + (y % 6);
      ctx.moveTo(0, y);
      for (let x = 0; x <= 512; x += 16) {
        const wave = Math.sin((x + y * 4) * 0.04) * 4 + Math.cos(x * 0.08) * 2;
        ctx.lineTo(x, y + wave);
      }
      ctx.stroke();
    }

    // Great Red/Orange Storm Spot
    const stormX = 180 + (task.id * 37) % 200;
    const stormY = 140 + (task.id * 17) % 50;
    const stormGrad = ctx.createRadialGradient(stormX, stormY, 2, stormX, stormY, 26);
    stormGrad.addColorStop(0, '#fef08a');
    stormGrad.addColorStop(0.4, '#ea580c');
    stormGrad.addColorStop(0.8, '#7f1d1d');
    stormGrad.addColorStop(1, 'rgba(127, 29, 29, 0)');
    ctx.fillStyle = stormGrad;
    ctx.beginPath();
    ctx.ellipse(stormX, stormY, 32, 18, 0.1, 0, Math.PI * 2);
    ctx.fill();

  } else if (focus === 'ventas_supervision') {
    // Terrestrial / Continental Planet with oceans and lands
    baseGrad.addColorStop(0, '#0c4a6e');
    baseGrad.addColorStop(0.5, '#0284c7');
    baseGrad.addColorStop(1, '#082f49');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Continents
    ctx.fillStyle = '#b45309';
    for (let c = 0; c < 5; c++) {
      const cx = 60 + c * 95;
      const cy = 60 + ((c * 43) % 130);
      ctx.beginPath();
      ctx.arc(cx, cy, 38 + (c % 3) * 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cloud swirls
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const cy = 40 + i * 26;
      ctx.ellipse(256 + Math.sin(i) * 100, cy, 140, 9, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (focus === 'ia_analitica') {
    // Cybernetic / Pulsing Bioluminescent Gas World
    baseGrad.addColorStop(0, '#1e1b4b');
    baseGrad.addColorStop(0.5, '#4338ca');
    baseGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Glowing coordinate lines / auroras
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < 512; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    for (let y = 0; y < 256; y += 42) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Aurora wave
    ctx.fillStyle = 'rgba(167, 139, 250, 0.35)';
    ctx.beginPath();
    ctx.ellipse(256, 30, 200, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(256, 226, 200, 18, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (focus === 'multimedia_voz') {
    // Gas / Desert / Acoustic Resonance Waves
    baseGrad.addColorStop(0, '#78350f');
    baseGrad.addColorStop(0.5, '#d97706');
    baseGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Harmonic ring waves
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
    ctx.lineWidth = 3;
    for (let w = 0; w < 6; w++) {
      ctx.beginPath();
      const waveY = 30 + w * 38;
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= 512; x += 10) {
        ctx.lineTo(x, waveY + Math.sin(x * 0.05 + w) * 12);
      }
      ctx.stroke();
    }

  } else if (focus === 'protocolo_resuelto') {
    // Peaceful Crystal / Ice World (Calm, settled)
    baseGrad.addColorStop(0, '#334155');
    baseGrad.addColorStop(0.5, '#64748b');
    baseGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Polar ice caps
    ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
    ctx.fillRect(0, 0, 512, 35);
    ctx.fillRect(0, 221, 512, 35);

    // Craters
    ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
    for (let i = 0; i < 12; i++) {
      const cx = (i * 73 + 20) % 500;
      const cy = 50 + (i * 37) % 150;
      ctx.beginPath();
      ctx.arc(cx, cy, 6 + (i % 5) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

  } else {
    // UX / Taxonomy Sandstone Golden World
    baseGrad.addColorStop(0, '#713f12');
    baseGrad.addColorStop(0.5, '#ca8a04');
    baseGrad.addColorStop(1, '#3f2508');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 256);

    // Dune ridges
    ctx.fillStyle = 'rgba(254, 249, 195, 0.3)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(256, 40 + i * 36, 240, 14, -0.05, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Accent border rim
  ctx.fillStyle = `${colorHex}33`;
  ctx.fillRect(0, 0, 512, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return { map: texture };
}

/**
 * Creates a Saturn-like planetary ring system for high-criticality planets.
 */
export function createPlanetaryRingMesh(
  radius: number,
  colorHex: string
): THREE.Mesh {
  const innerRadius = radius * 1.35;
  const outerRadius = radius * 2.2;
  const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
  
  // Ring texture with radial grooves
  const ringCanvas = document.createElement('canvas');
  ringCanvas.width = 256;
  ringCanvas.height = 1;
  const rCtx = ringCanvas.getContext('2d');
  if (rCtx) {
    const rGrad = rCtx.createLinearGradient(0, 0, 256, 0);
    rGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    rGrad.addColorStop(0.2, `${colorHex}bb`);
    rGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
    rGrad.addColorStop(0.7, `${colorHex}88`);
    rGrad.addColorStop(0.9, `${colorHex}44`);
    rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 256, 1);
  }
  const ringTex = new THREE.CanvasTexture(ringCanvas);

  const material = new THREE.MeshStandardMaterial({
    map: ringTex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
    roughness: 0.5,
    metalness: 0.1,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2 + 0.35; // Celestial tilt
  mesh.rotation.y = 0.2;
  return mesh;
}
