import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ArrowLeft, Construction, Clock } from 'lucide-react';

interface SuspensionDots3DProps {
  moduleTitle: string;
  subtitle: string;
  onBack: () => void;
}

export const SuspensionDots3D: React.FC<SuspensionDots3DProps> = ({
  moduleTitle,
  subtitle,
  onBack,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight1.position.set(5, 5, 6);
    scene.add(dirLight1);

    const redLight = new THREE.PointLight(0xed1c24, 3, 10);
    redLight.position.set(-3, -2, 2);
    scene.add(redLight);

    const blueLight = new THREE.PointLight(0x1877f2, 3.5, 10);
    blueLight.position.set(3, 2, 3);
    scene.add(blueLight);

    // Dots Group
    const dotsGroup = new THREE.Group();
    scene.add(dotsGroup);

    // 3 Sphere dots
    const sphereGeo = new THREE.SphereGeometry(0.72, 36, 36);

    // Three distinct glossy materials representing Vivibox palette
    const materials = [
      new THREE.MeshPhysicalMaterial({
        color: 0xed1c24, // Vivibox Red
        emissive: 0xed1c24,
        emissiveIntensity: 0.25,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff, // Crisp White
        emissive: 0x1877f2,
        emissiveIntensity: 0.2,
        roughness: 0.1,
        metalness: 0.3,
        clearcoat: 1.0,
      }),
      new THREE.MeshPhysicalMaterial({
        color: 0x1877f2, // Check Azul
        emissive: 0x1877f2,
        emissiveIntensity: 0.3,
        roughness: 0.15,
        metalness: 0.2,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
    ];

    const spheres: THREE.Mesh[] = [];
    const spacing = 2.1;

    for (let i = 0; i < 3; i++) {
      const mesh = new THREE.Mesh(sphereGeo, materials[i]);
      mesh.position.x = (i - 1) * spacing;
      dotsGroup.add(mesh);
      spheres.push(mesh);
    }

    // Interactive mouse movement
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = (((e.clientX - rect.left) / rect.width) * 2 - 1) * 0.3;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1) * 0.2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Bouncing wave for the 3 suspension dots
      spheres.forEach((sphere, index) => {
        sphere.position.y = Math.sin(time * 3.2 - index * 0.75) * 0.55;
        sphere.rotation.x = time * 0.8 + index;
        sphere.rotation.y = time * 1.2 + index;
        const scale = 1 + Math.sin(time * 3.2 - index * 0.75) * 0.08;
        sphere.scale.set(scale, scale, scale);
      });

      // Subtle group tilt
      dotsGroup.rotation.y += (mouseX - dotsGroup.rotation.y) * 0.06;
      dotsGroup.rotation.x += (mouseY - dotsGroup.rotation.x) * 0.06;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
    <div className="w-full min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Return Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#dedfe3] text-[#18181b] hover:bg-[#f4f4f6] text-sm font-bold shadow-xs transition-all cursor-pointer hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-4 h-4 text-[#ed1c24]" />
          <span>Volver al Centro de Análisis</span>
        </button>

        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f4f4f6] text-[#5f6470] border border-[#dedfe3]">
          Módulo Oficial Vivibox
        </span>
      </div>

      {/* Main 3D Card Container */}
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#dedfe3] p-8 sm:p-12 shadow-sm text-center flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#1877f2]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-60 h-60 bg-[#ed1c24]/5 rounded-full blur-2xl pointer-events-none" />

        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ed1c24]/10 border border-[#ed1c24]/20 text-[#ed1c24] text-xs font-black uppercase tracking-wider mb-2 z-10">
          <Construction className="w-3.5 h-3.5" />
          <span>{moduleTitle}</span>
        </div>

        {/* 3D Canvas Container for the 3 Dots */}
        <div
          ref={containerRef}
          className="w-full max-w-md h-44 sm:h-52 my-2 relative z-10 select-none cursor-grab active:cursor-grabbing"
          title="3 puntos suspensivos 3D interactivos"
        />

        {/* Text requested by user: 'en construccion' */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#18181b] tracking-tight mb-3 z-10">
          En construcción
        </h1>

        <p className="text-sm sm:text-base text-[#5f6470] max-w-md mb-8 leading-relaxed z-10">
          {subtitle}
        </p>

        {/* Status Badge with Live Pulse */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#f4f4f6] border border-[#dedfe3] text-xs font-bold text-[#18181b] mb-8 z-10">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1877f2] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#1877f2]"></span>
          </span>
          <Clock className="w-3.5 h-3.5 text-[#5f6470]" />
          <span>Próxima publicación programada · Ciclo operativo 2026</span>
        </div>

        {/* Return Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ed1c24] hover:bg-[#d6151c] text-white font-extrabold text-sm shadow-md transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 z-10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Regresar al Centro de Análisis</span>
        </button>
      </div>
    </div>
  );
};
