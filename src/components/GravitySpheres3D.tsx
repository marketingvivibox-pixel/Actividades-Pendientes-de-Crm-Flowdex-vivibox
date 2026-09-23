import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Rotate3d, 
  Layers, 
  Sparkles, 
  Power, 
  Flame, 
  Info, 
  Maximize2, 
  Sliders, 
  Move, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  ShieldCheck, 
  Edit3, 
  ChevronRight,
  Eye,
  X,
  Tag,
  Moon,
  Sun
} from 'lucide-react';
import { CRMTask, FunctionalFocus } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';
import { createPlanetTexture, createPlanetaryRingMesh } from '../lib/planetTextures';

interface GravitySpheres3DProps {
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  onToggleTask: (id: number) => void;
  onSelectTask: (task: CRMTask) => void;
  onEditTask?: (task: CRMTask) => void;
  onToggleAll?: (activate: boolean) => void;
  selectedFocus?: FunctionalFocus | 'all';
}

interface PlanetPhysicsNode {
  id: number;
  task: CRMTask;
  // Current 3D position
  x: number;
  y: number;
  z: number;
  // Velocity in 3D
  vx: number;
  vy: number;
  vz: number;
  // Target rest equilibrium in 3D
  targetX: number;
  targetY: number;
  targetZ: number;
  radius: number;
  mass: number;
  mesh: THREE.Mesh;
  haloMesh: THREE.Mesh;
  ringMesh?: THREE.Mesh | null;
  rotationSpeed: number;
  tilt: number;
  colorHex: string;
}

type CameraViewPreset = 'orbit' | 'top' | 'front' | 'side';

export const GravitySpheres3D: React.FC<GravitySpheres3DProps> = ({
  tasks,
  taskStates,
  onToggleTask,
  onSelectTask,
  onEditTask,
  onToggleAll,
  selectedFocus = 'all',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction & UI State
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraViewPreset>('orbit');
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [magnetismStrength, setMagnetismStrength] = useState<number>(0.85);
  const [showFilaments, setShowFilaments] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [screenPositions, setScreenPositions] = useState<Record<number, { x: number; y: number; visible: boolean; dist: number }>>({});
  const [spaceTheme, setSpaceTheme] = useState<'deep_space' | 'warm_sandstone'>('deep_space');
  const [webglError, setWebglError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState<boolean>(false);

  // Real-time coordinates HUD of selected node
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number; z: number } | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<PlanetPhysicsNode[]>([]);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const taskStatesRef = useRef<Record<number, boolean>>(taskStates);
  const starsRef = useRef<THREE.Points | null>(null);

  // Keep taskStatesRef synced
  useEffect(() => {
    taskStatesRef.current = taskStates;
  }, [taskStates]);

  // Dragging state in 3D
  const draggingNodeRef = useRef<PlanetPhysicsNode | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Camera Orbit control state
  const isOrbitingRef = useRef<boolean>(false);
  const previousPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 480,
    theta: 0.3,
    phi: 1.15,
  });
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 10, 0));

  // Key listener for Shift (to move in Z depth during drag)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update camera position from spherical coordinates
  const updateCameraFromSpherical = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = cameraSphericalRef.current;
    const x = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(
      x + cameraTargetRef.current.x,
      y + cameraTargetRef.current.y,
      z + cameraTargetRef.current.z
    );
    cameraRef.current.lookAt(cameraTargetRef.current);
  }, []);

  // Set Camera Preset
  const handleApplyPreset = (preset: CameraViewPreset) => {
    setCameraPreset(preset);
    if (!cameraSphericalRef.current) return;

    if (preset === 'orbit') {
      cameraSphericalRef.current = { radius: 480, theta: 0.3, phi: 1.15 };
    } else if (preset === 'top') {
      // Look from top along Y axis (viewing X-Z)
      cameraSphericalRef.current = { radius: 560, theta: 0.001, phi: 0.001 };
    } else if (preset === 'front') {
      // Look from front along Z axis (viewing X-Y)
      cameraSphericalRef.current = { radius: 520, theta: 0, phi: Math.PI / 2 };
    } else if (preset === 'side') {
      // Look from side along X axis (viewing Y-Z)
      cameraSphericalRef.current = { radius: 520, theta: Math.PI / 2, phi: Math.PI / 2 };
    }
    updateCameraFromSpherical();
  };

  // Adjust selected node's position directly along an axis
  const handleNudgeNode = (axis: 'x' | 'y' | 'z', delta: number) => {
    if (!selectedTaskId) return;
    const node = nodesRef.current.find((n) => n.id === selectedTaskId);
    if (!node) return;

    if (axis === 'x') {
      node.x += delta;
      node.targetX += delta;
      node.vx = 0;
    } else if (axis === 'y') {
      node.y += delta;
      node.targetY += delta;
      node.vy = 0;
    } else if (axis === 'z') {
      node.z += delta;
      node.targetZ += delta;
      node.vz = 0;
    }
    node.mesh.position.set(node.x, node.y, node.z);
    node.haloMesh.position.set(node.x, node.y, node.z);
    if (node.ringMesh) {
      node.ringMesh.position.set(node.x, node.y, node.z);
    }
    setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
  };

  // Setup Three.js scene safely
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    try {
      const width = Math.max(container.clientWidth || 800, 320);
      const height = Math.max(container.clientHeight || 640, 480);

      // Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const isSpace = spaceTheme === 'deep_space';
      scene.background = new THREE.Color(isSpace ? '#090d16' : '#f7f4ee');
      scene.fog = new THREE.FogExp2(isSpace ? '#090d16' : '#f7f4ee', 0.0008);

      // Camera
      const camera = new THREE.PerspectiveCamera(50, width / height, 10, 3000);
      cameraRef.current = camera;
      updateCameraFromSpherical();

      // Renderer
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Deep Space Starfield Particles
      const starGeo = new THREE.BufferGeometry();
      const starCount = 900;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPositions[i] = (Math.random() - 0.5) * 2200;
        starPositions[i + 1] = (Math.random() - 0.5) * 2200;
        starPositions[i + 2] = (Math.random() - 0.5) * 2200;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const starMat = new THREE.PointsMaterial({
        color: isSpace ? 0xffffff : 0xb8a892,
        size: isSpace ? 2.4 : 1.6,
        transparent: true,
        opacity: isSpace ? 0.85 : 0.4,
      });
      const stars = new THREE.Points(starGeo, starMat);
      starsRef.current = stars;
      scene.add(stars);

      // Celestial Lighting (Simulating central radiant sun and ambient cosmic light)
      const ambientLight = new THREE.AmbientLight(isSpace ? 0xd0e0ff : 0xfff8f0, isSpace ? 1.4 : 1.2);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfffbf5, 2.5);
      sunLight.position.set(240, 360, 260);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 1024;
      sunLight.shadow.mapSize.height = 1024;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 1200;
      sunLight.shadow.bias = -0.001;
      scene.add(sunLight);

      const secondaryStarlight = new THREE.DirectionalLight(0x7dd3fc, 0.9);
      secondaryStarlight.position.set(-220, -80, -220);
      scene.add(secondaryStarlight);

      // Floor Grid / Orbital Reference Plane
      const groundY = -180;
      const gridHelper = new THREE.GridHelper(900, 36, isSpace ? 0x223249 : 0xb8a892, isSpace ? 0x141f2f : 0xdcd3c4);
      gridHelper.position.y = groundY;
      gridHelperRef.current = gridHelper;
      scene.add(gridHelper);

      // Floor Shadow Receptor Plane
      const floorGeo = new THREE.PlaneGeometry(1400, 1400);
      const floorMat = new THREE.ShadowMaterial({ opacity: isSpace ? 0.35 : 0.18 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.position.y = groundY - 0.5;
      floorMesh.receiveShadow = true;
      scene.add(floorMesh);

      // Central Orbital Guide Ring (X-Z plane)
      const ringGeo = new THREE.RingGeometry(160, 161.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: isSpace ? 0x38bdf8 : 0xc8bcab, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isSpace ? 0.45 : 0.35 
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = 15;
      scene.add(ringMesh);

      // Dynamic Line Segments for 3D Gravitational Filaments
      const maxLines = 120;
      const linePositions = new Float32Array(maxLines * 6);
      const lineColors = new Float32Array(maxLines * 6);
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: isSpace ? 0.6 : 0.45,
        blending: THREE.NormalBlending,
      });
      const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
      lineSegmentsRef.current = lineSegments;
      scene.add(lineSegments);

      // Resize observer
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width: w, height: h } = entry.contentRect;
          if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
            cameraRef.current.aspect = w / h;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(w, h);
          }
        }
      });
      resizeObserver.observe(container);

      // Mark scene as ready to trigger planet creation
      setSceneReady(true);
      setWebglError(null);

      return () => {
        resizeObserver.disconnect();
        if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
        renderer.dispose();
      };
    } catch (err: any) {
      console.error('Failed to initialize Three.js WebGL in GravitySpheres3D:', err);
      setWebglError('El navegador o entorno gráfico no pudo inicializar WebGL para la vista 3D. Puedes utilizar la Vista de Tabla o Vista de Esferas 2D.');
    }
  }, [spaceTheme]);

  // Synchronize Tasks and PLANETS with Three.js Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !sceneReady) return;

    // Clean up previous planet meshes
    nodesRef.current.forEach((n) => {
      scene.remove(n.mesh);
      scene.remove(n.haloMesh);
      if (n.ringMesh) {
        scene.remove(n.ringMesh);
        n.ringMesh.geometry.dispose();
        if (Array.isArray(n.ringMesh.material)) {
          n.ringMesh.material.forEach((m) => m.dispose());
        } else {
          n.ringMesh.material.dispose();
        }
      }
      n.mesh.geometry.dispose();
      if (Array.isArray(n.mesh.material)) {
        n.mesh.material.forEach((m) => m.dispose());
      } else {
        (n.mesh.material as any).map?.dispose();
        n.mesh.material.dispose();
      }
      n.haloMesh.geometry.dispose();
      (n.haloMesh.material as THREE.Material).dispose();
    });

    const total = tasks.length;
    const newNodes: PlanetPhysicsNode[] = [];

    tasks.forEach((task, idx) => {
      const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;
      const colorHex = focus.accentHex;
      const isAct = taskStates[task.id] !== false;

      // 10%+ MORE DIFFERENCE IN PLANETARY SIZES (CRITICALITY SCALE EXPANDED)
      // Low criticality (score 6-10) -> radius ~11-12 (Dwarf / Terrestrial moon)
      // High criticality (score 100) -> radius ~52-56 (Giant Jovian Gas Planet)
      const critNorm = Math.max(0, Math.min(100, task.criticalityScore)) / 100;
      const radius = 11 + Math.pow(critNorm, 1.18) * 36 + (task.proportionalUnits - 1) * 3.5;
      const mass = radius * 1.6;

      // Initial orbital placement in 3D ellipsoid ring
      const angle = (idx / total) * Math.PI * 2;
      const ringRadius = 150 + (idx % 3) * 38;
      const heightOffset = Math.sin(idx * 1.8) * 48 + 20;
      const depthZ = Math.cos(idx * 2.2) * 95;

      const initX = Math.cos(angle) * ringRadius;
      const initY = isAct ? heightOffset : -180 + radius;
      const initZ = depthZ;

      // Create procedural planetary texture
      const { map: planetTexture } = createPlanetTexture(task, task.functionalFocus, colorHex);

      // Planet Sphere Geometry & Physical Material
      const sphereGeo = new THREE.SphereGeometry(radius, 40, 40);
      const sphereMat = new THREE.MeshStandardMaterial({
        map: planetTexture,
        roughness: 0.38,
        metalness: 0.12,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: isAct ? (spaceTheme === 'deep_space' ? 0.32 : 0.18) : 0.02,
        transparent: true,
        opacity: isAct ? 1.0 : 0.32,
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(initX, initY, initZ);
      sphereMesh.castShadow = isAct;
      sphereMesh.receiveShadow = true;
      sphereMesh.userData = { taskId: task.id };

      // Polar tilt and axial rotation speed
      const tilt = ((idx % 7) - 3) * 0.08;
      sphereMesh.rotation.z = tilt;
      scene.add(sphereMesh);

      // Planetary Atmospheric Glow / Halo Mesh
      const haloGeo = new THREE.SphereGeometry(radius * 1.12, 28, 28);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: isAct ? (spaceTheme === 'deep_space' ? 0.25 : 0.14) : 0.04,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(initX, initY, initZ);
      scene.add(haloMesh);

      // Saturn-like Celestial Rings for top criticality planets (Score >= 70)
      let ringMesh: THREE.Mesh | null = null;
      if (task.criticalityScore >= 70) {
        ringMesh = createPlanetaryRingMesh(radius, colorHex);
        ringMesh.position.set(initX, initY, initZ);
        ringMesh.castShadow = isAct;
        scene.add(ringMesh);
      }

      newNodes.push({
        id: task.id,
        task,
        x: initX,
        y: initY,
        z: initZ,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        targetX: initX,
        targetY: heightOffset,
        targetZ: depthZ,
        radius,
        mass,
        mesh: sphereMesh,
        haloMesh,
        ringMesh,
        rotationSpeed: 0.005 + (idx % 4) * 0.002,
        tilt,
        colorHex,
      });
    });

    nodesRef.current = newNodes;
  }, [tasks, sceneReady, spaceTheme]);

  // Main 3D Physics and Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const nodes = nodesRef.current;
      const camera = cameraRef.current;
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      const lineSegments = lineSegmentsRef.current;

      const groundY = -180;
      const centerPull = 0.45;
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      // 1. Calculate 3D forces and gravity
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isAct = taskStatesRef.current[node.id] !== false;
        const isBeingDragged = draggingNodeRef.current === node;

        // Continuous planetary axial rotation
        node.mesh.rotation.y += node.rotationSpeed;
        if (node.ringMesh) {
          node.ringMesh.rotation.z += node.rotationSpeed * 0.35;
        }

        if (!isBeingDragged) {
          if (isAct) {
            // Gentle 3D orbital floating
            const floatOffsetY = Math.sin(time * 0.0014 + node.id) * 7;
            
            // Soft center attraction in 3D
            const dx = (node.targetX - node.x);
            const dy = (node.targetY + floatOffsetY - node.y);
            const dz = (node.targetZ - node.z);

            node.vx += dx * centerPull * dt;
            node.vy += dy * centerPull * dt;
            node.vz += dz * centerPull * dt;
          } else {
            // DEACTIVATED: 3D Gravity pull downwards to the ground grid
            const gravity3D = -200;
            node.vy += gravity3D * dt;

            // Rest on floor
            const floorRest = groundY + node.radius;
            if (node.y < floorRest) {
              node.y = floorRest;
              node.vy = -node.vy * 0.12; // soft floor restitution
              node.vx *= 0.85; // floor friction
              node.vz *= 0.85;
            }
          }

          // 2. Pairwise 3D Collisions & Magnetism
          for (let j = i + 1; j < nodes.length; j++) {
            const other = nodes[j];
            const otherAct = taskStatesRef.current[other.id] !== false;

            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dz = other.z - node.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            const dist = Math.sqrt(distSq) || 0.001;

            const minDist = node.radius + other.radius;

            // 3D Soft Collisions
            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              const separationFactor = 0.5 * overlap;
              if (!isBeingDragged) {
                node.x -= nx * separationFactor;
                node.y -= ny * separationFactor;
                node.z -= nz * separationFactor;
              }
              if (draggingNodeRef.current !== other) {
                other.x += nx * separationFactor;
                other.y += ny * separationFactor;
                other.z += nz * separationFactor;
              }

              // Viscoelastic collision damping
              const relativeVx = other.vx - node.vx;
              const relativeVy = other.vy - node.vy;
              const relativeVz = other.vz - node.vz;
              const normalVelocity = relativeVx * nx + relativeVy * ny + relativeVz * nz;

              if (normalVelocity < 0) {
                const impulse = normalVelocity * 0.12;
                node.vx += nx * impulse;
                node.vy += ny * impulse;
                node.vz += nz * impulse;
                other.vx -= nx * impulse;
                other.vy -= ny * impulse;
                other.vz -= nz * impulse;
              }
            }

            // 3D Magnetism between same functional focus
            const sameFocus = node.task.functionalFocus === other.task.functionalFocus;
            if (sameFocus && isAct && otherAct && dist < 340 && dist > minDist) {
              const force = (magnetismStrength * 360) / (distSq + 500);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              const fz = (dz / dist) * force;

              node.vx += fx * dt;
              node.vy += fy * dt;
              node.vz += fz * dt;
              other.vx -= fx * dt;
              other.vy -= fy * dt;
              other.vz -= fz * dt;

              // Draw filaments between magnetic planets
              if (showFilaments && linePositions.length < 120 * 6) {
                linePositions.push(node.x, node.y, node.z, other.x, other.y, other.z);
                const c1 = new THREE.Color(node.colorHex);
                lineColors.push(c1.r, c1.g, c1.b, c1.r, c1.g, c1.b);
              }
            }
          }

          // Damping factor
          node.vx *= 0.92;
          node.vy *= 0.92;
          node.vz *= 0.92;

          node.x += node.vx;
          node.y += node.vy;
          node.z += node.vz;
        }

        // Apply position to Three.js meshes
        node.mesh.position.set(node.x, node.y, node.z);
        node.haloMesh.position.set(node.x, node.y, node.z);
        if (node.ringMesh) {
          node.ringMesh.position.set(node.x, node.y, node.z);
        }

        // Selected coordinates HUD update
        if (selectedTaskId === node.id) {
          setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
        }
      }

      // Update magnetic filaments buffer
      if (lineSegments) {
        const geo = lineSegments.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;

        const posArray = posAttr.array as Float32Array;
        const colArray = colAttr.array as Float32Array;

        const maxPoints = Math.min(linePositions.length, posArray.length);
        for (let k = 0; k < maxPoints; k++) {
          posArray[k] = linePositions[k];
          colArray[k] = lineColors[k];
        }
        for (let k = maxPoints; k < posArray.length; k++) {
          posArray[k] = 0;
          colArray[k] = 0;
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        geo.setDrawRange(0, linePositions.length / 3);
      }

      // Render 3D Scene
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [magnetismStrength, showFilaments, selectedTaskId]);

  // Pointer Interaction (Orbit, Selection, and 3D Dragging)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(x, y);

    previousPointerPosRef.current = { x: e.clientX, y: e.clientY };

    // Check intersection with planets
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const meshes = nodesRef.current.map((n) => n.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0 && e.button === 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const taskId = hitMesh.userData.taskId;
      const node = nodesRef.current.find((n) => n.id === taskId);

      if (node) {
        draggingNodeRef.current = node;
        setSelectedTaskId(node.id);
        setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });

        // Setup drag plane perpendicular to camera direction
        const cameraDir = new THREE.Vector3();
        camera.getWorldDirection(cameraDir);
        dragPlaneRef.current.setFromNormalAndCoplanarPoint(
          cameraDir.negate(),
          new THREE.Vector3(node.x, node.y, node.z)
        );

        canvas.setPointerCapture(e.pointerId);
        return;
      }
    }

    // Otherwise, start camera orbit rotation
    isOrbitingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    if (!canvas || !camera) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(x, y);

    // If dragging a planet in 3D
    if (draggingNodeRef.current) {
      const node = draggingNodeRef.current;
      raycasterRef.current.setFromCamera(mouseRef.current, camera);

      if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, dragIntersectionRef.current)) {
        if (isShiftPressed) {
          // Move in Z Depth when Shift is pressed
          const deltaY = (e.clientY - previousPointerPosRef.current.y) * 0.9;
          node.z += deltaY;
          node.targetZ = node.z;
        } else {
          // Move in X, Y plane
          node.x = dragIntersectionRef.current.x;
          node.y = dragIntersectionRef.current.y;
          node.targetX = node.x;
          node.targetY = node.y;
        }
        node.vx = 0;
        node.vy = 0;
        node.vz = 0;
        node.mesh.position.set(node.x, node.y, node.z);
        node.haloMesh.position.set(node.x, node.y, node.z);
        if (node.ringMesh) {
          node.ringMesh.position.set(node.x, node.y, node.z);
        }
        setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
      }

      previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // If orbiting camera
    if (isOrbitingRef.current) {
      const deltaX = e.clientX - previousPointerPosRef.current.x;
      const deltaY = e.clientY - previousPointerPosRef.current.y;

      const rotateSpeed = 0.005;
      cameraSphericalRef.current.theta -= deltaX * rotateSpeed;
      cameraSphericalRef.current.phi = Math.max(
        0.05,
        Math.min(Math.PI - 0.05, cameraSphericalRef.current.phi - deltaY * rotateSpeed)
      );

      updateCameraFromSpherical();
      previousPointerPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover detection over planets
    raycasterRef.current.setFromCamera(mouseRef.current, camera);
    const meshes = nodesRef.current.map((n) => n.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const taskId = intersects[0].object.userData.taskId;
      setHoveredTaskId(taskId);
      canvas.style.cursor = 'pointer';
    } else {
      setHoveredTaskId(null);
      canvas.style.cursor = 'grab';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    draggingNodeRef.current = null;
    isOrbitingRef.current = false;
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.35;
    cameraSphericalRef.current.radius = Math.max(
      150,
      Math.min(1200, cameraSphericalRef.current.radius + zoomFactor)
    );
    updateCameraFromSpherical();
  };

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const hoveredTask = useMemo(() => {
    if (!hoveredTaskId) return null;
    return tasks.find((t) => t.id === hoveredTaskId) || null;
  }, [tasks, hoveredTaskId]);

  if (webglError) {
    return (
      <div className="w-full h-[640px] rounded-3xl border border-rose-200 bg-rose-50/50 p-8 flex flex-col items-center justify-center text-center">
        <Rotate3d className="w-12 h-12 text-rose-500 mb-4 animate-spin-slow" />
        <h3 className="text-base font-bold text-stone-900 mb-2">Aceleración 3D WebGL</h3>
        <p className="text-xs text-stone-600 max-w-md mb-6">{webglError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 text-white cursor-pointer shadow-md"
        >
          Reintentar inicialización
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[640px] h-[72vh] rounded-3xl border shadow-inner overflow-hidden select-none transition-colors duration-300 ${
        spaceTheme === 'deep_space'
          ? 'border-stone-800 bg-[#090d16]'
          : 'border-[#e5dfd2] bg-gradient-to-b from-[#fcfbfa] to-[#f4eee4]'
      }`}
    >
      {/* Three.js 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Top Left: 3D Celestial Universe Title & Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border shadow-sm backdrop-blur-md ${
          spaceTheme === 'deep_space'
            ? 'bg-stone-900/90 text-white border-stone-700/80'
            : 'bg-white/90 text-[#292524] border-[#e4dccf]'
        }`}>
          <Rotate3d className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-xs font-bold font-serif-warm tracking-wide">
            Sistema Planetario 3D & Criticidad
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
            {nodesRef.current.length} Planetas
          </span>
        </div>

        {/* Hovered Planet Indicator HUD */}
        {hoveredTask && !selectedTask && (
          <div className="flex items-center gap-2 bg-[#1c1917]/95 text-white px-3 py-1.5 rounded-2xl text-xs shadow-lg backdrop-blur-sm border border-stone-700 pointer-events-none">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: FOCUS_DEFINITIONS[hoveredTask.functionalFocus]?.accentHex }}
            />
            <span className="font-mono text-amber-300 font-bold">Ticket #{hoveredTask.originalNumber}</span>
            <span className="truncate max-w-[180px] sm:max-w-xs">{hoveredTask.pendiente}</span>
            <span className="text-[10px] text-rose-400 font-mono font-bold">({hoveredTask.criticalityScore} pts)</span>
          </div>
        )}

        {/* Camera Views Quick Selector */}
        <div className={`flex items-center gap-1 p-1 rounded-2xl border shadow-xs text-xs backdrop-blur-md ${
          spaceTheme === 'deep_space'
            ? 'bg-stone-900/85 border-stone-700/70 text-stone-300'
            : 'bg-white/90 border-[#e4dccf] text-[#64594c]'
        }`}>
          <button
            type="button"
            onClick={() => handleApplyPreset('orbit')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'orbit'
                ? spaceTheme === 'deep_space' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-[#292524] text-white shadow-2xs'
                : 'hover:bg-white/10'
            }`}
            title="Órbita 3D Libre (360°)"
          >
            3D Órbita
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('top')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'top'
                ? spaceTheme === 'deep_space' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-[#292524] text-white shadow-2xs'
                : 'hover:bg-white/10'
            }`}
            title="Vista Superior Planta (Plano X-Z)"
          >
            Planta (X-Z)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('front')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'front'
                ? spaceTheme === 'deep_space' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-[#292524] text-white shadow-2xs'
                : 'hover:bg-white/10'
            }`}
            title="Vista Frontal (Plano X-Y)"
          >
            Frontal (X-Y)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('side')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'side'
                ? spaceTheme === 'deep_space' ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-[#292524] text-white shadow-2xs'
                : 'hover:bg-white/10'
            }`}
            title="Vista Lateral (Plano Y-Z)"
          >
            Lateral (Y-Z)
          </button>
        </div>
      </div>

      {/* Top Right: Theme Switcher & Physics Parameters */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-[11px] shadow-xs backdrop-blur-md ${
          spaceTheme === 'deep_space'
            ? 'bg-stone-900/85 border-stone-700/70 text-stone-300'
            : 'bg-white/90 border-[#e4dccf] text-[#6b5f50]'
        }`}>
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Arrastra planetas en 3D • Mantén <kbd className="px-1.5 py-0.5 rounded bg-black/40 border border-white/20 font-mono font-bold text-amber-300">Shift</kbd> para profundidad Z</span>
        </div>

        {/* Controls Bar */}
        <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-xs text-xs backdrop-blur-md ${
          spaceTheme === 'deep_space'
            ? 'bg-stone-900/85 border-stone-700/70'
            : 'bg-white/90 border-[#e4dccf]'
        }`}>
          {/* Space / Sandstone Theme Toggle */}
          <button
            type="button"
            onClick={() => setSpaceTheme(spaceTheme === 'deep_space' ? 'warm_sandstone' : 'deep_space')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              spaceTheme === 'deep_space'
                ? 'bg-indigo-950/80 text-amber-300 border border-indigo-700'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
            title="Cambiar entre espacio cósmico y fondo claro de estudio"
          >
            {spaceTheme === 'deep_space' ? <Moon className="w-3.5 h-3.5 text-amber-300" /> : <Sun className="w-3.5 h-3.5 text-amber-600" />}
            <span>{spaceTheme === 'deep_space' ? 'Cosmos Oscuro' : 'Estudio Claro'}</span>
          </button>

          {/* Filaments toggle */}
          <button
            type="button"
            onClick={() => setShowFilaments(!showFilaments)}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              showFilaments
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'text-stone-400 hover:bg-white/10'
            }`}
            title="Alternar filamentos magnéticos entre planetas del mismo enfoque"
          >
            Filamentos
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={() => {
              cameraSphericalRef.current = { radius: 480, theta: 0.3, phi: 1.15 };
              cameraTargetRef.current.set(0, 10, 0);
              updateCameraFromSpherical();
            }}
            className="p-1.5 rounded-xl text-stone-300 hover:bg-white/10 transition-all cursor-pointer"
            title="Centrar Cámara"
          >
            <Compass className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Bottom Selected Planet Gizmo & Editor HUD */}
      {selectedTask && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-4xl mx-auto bg-stone-900/95 text-white backdrop-blur-md p-4 rounded-3xl border border-stone-700/80 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-700">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-amber-400 text-stone-950 font-mono text-xs font-black shadow-xs">
                Ticket #{selectedTask.originalNumber}
              </span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-stone-100 truncate max-w-xs sm:max-w-md">
                  {selectedTask.pendiente}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-stone-300">
                  <span className="font-medium">{selectedTask.responsable}</span>
                  <span>•</span>
                  <span className="font-bold text-rose-400">Criticidad: {selectedTask.criticalityScore}/100</span>
                  <span>•</span>
                  <span className="capitalize">{selectedTask.prioridad}</span>
                  {selectedTask.criticalityScore >= 70 && (
                    <>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">🪐 Con Anillos Planetarios</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleTask(selectedTask.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  taskStates[selectedTask.id] !== false
                    ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700'
                    : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{taskStates[selectedTask.id] !== false ? 'Sedimentar (Suelo)' : 'Activar (Órbita 3D)'}</span>
              </button>

              {onEditTask && (
                <button
                  type="button"
                  onClick={() => onEditTask(selectedTask)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 text-stone-950 hover:bg-amber-300 transition-all cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Parámetros</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectTask(selectedTask)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-800 hover:text-white transition-all cursor-pointer"
                title="Ver Ficha Técnica Completa"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-xl text-stone-400 hover:bg-rose-950 hover:text-rose-300 transition-all cursor-pointer"
                title="Cerrar Ficha"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Coordinate Gizmo & Depth Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs">
            {/* Real-time 3D Coordinates */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Move className="w-3.5 h-3.5" />
                Coordenadas Planetarias 3D:
              </span>
              <div className="font-mono text-xs flex items-center gap-2.5 bg-black/50 px-2.5 py-1 rounded-xl border border-stone-700">
                <span className="text-rose-400 font-bold">X: {selectedCoords?.x ?? 0}</span>
                <span className="text-emerald-400 font-bold">Y: {selectedCoords?.y ?? 0}</span>
                <span className="text-sky-400 font-bold">Z: {selectedCoords?.z ?? 0}</span>
              </div>
            </div>

            {/* Direct 3-Dimensional Movement Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-stone-400 mr-1">Mover en 3D:</span>
              
              {/* X Axis */}
              <button
                type="button"
                onClick={() => handleNudgeNode('x', -25)}
                className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 font-bold text-[11px] cursor-pointer"
                title="Mover hacia la Izquierda (-X)"
              >
                -X
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('x', 25)}
                className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-600 font-bold text-[11px] cursor-pointer"
                title="Mover hacia la Derecha (+X)"
              >
                +X
              </button>

              {/* Y Axis */}
              <button
                type="button"
                onClick={() => handleNudgeNode('y', 25)}
                className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 font-bold text-[11px] text-emerald-300 cursor-pointer"
                title="Subir en Órbita (+Y)"
              >
                +Y (Subir)
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('y', -25)}
                className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 font-bold text-[11px] text-emerald-300 cursor-pointer"
                title="Bajar en Órbita (-Y)"
              >
                -Y (Bajar)
              </button>

              {/* Z Axis (Profundidad) */}
              <button
                type="button"
                onClick={() => handleNudgeNode('z', -35)}
                className="px-2 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-700 font-bold text-[11px] text-sky-300 cursor-pointer"
                title="Traer al frente (-Z)"
              >
                -Z (Frente)
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('z', 35)}
                className="px-2 py-1 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-700 font-bold text-[11px] text-sky-300 cursor-pointer"
                title="Alejar al fondo (+Z)"
              >
                +Z (Fondo)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
