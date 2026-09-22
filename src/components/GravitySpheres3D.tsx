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
  Tag
} from 'lucide-react';
import { CRMTask, FunctionalFocus } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';

interface GravitySpheres3DProps {
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  onToggleTask: (id: number) => void;
  onSelectTask: (task: CRMTask) => void;
  onEditTask?: (task: CRMTask) => void;
  onToggleAll?: (activate: boolean) => void;
  selectedFocus?: FunctionalFocus | 'all';
}

interface SpherePhysicsNode {
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
  const [dampingFactor, setDampingFactor] = useState<number>(0.92);
  const [showFilaments, setShowFilaments] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [screenPositions, setScreenPositions] = useState<Record<number, { x: number; y: number; visible: boolean; dist: number }>>({});

  // Real-time coordinates HUD of selected node
  const [selectedCoords, setSelectedCoords] = useState<{ x: number; y: number; z: number } | null>(null);

  // References for Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const nodesRef = useRef<SpherePhysicsNode[]>([]);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Dragging state in 3D
  const draggingNodeRef = useRef<SpherePhysicsNode | null>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane());
  const dragIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());

  // Camera Orbit control state
  const isOrbitingRef = useRef<boolean>(false);
  const previousPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraSphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 460,
    theta: 0.25,
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
      cameraSphericalRef.current = { radius: 460, theta: 0.25, phi: 1.15 };
    } else if (preset === 'top') {
      // Look from top along Y axis (viewing X-Z)
      cameraSphericalRef.current = { radius: 520, theta: 0.001, phi: 0.001 };
    } else if (preset === 'front') {
      // Look from front along Z axis (viewing X-Y)
      cameraSphericalRef.current = { radius: 480, theta: 0, phi: Math.PI / 2 };
    } else if (preset === 'side') {
      // Look from side along X axis (viewing Y-Z)
      cameraSphericalRef.current = { radius: 480, theta: Math.PI / 2, phi: Math.PI / 2 };
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
    setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
  };

  // Setup Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#f7f4ee'); // Warm sandstone ambient canvas
    scene.fog = new THREE.FogExp2('#f7f4ee', 0.0009);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 10, 2000);
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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff8f0, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffbf5, 2.0);
    dirLight.position.set(180, 320, 220);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 1000;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe4d8c5, 0.8);
    fillLight.position.set(-200, -50, -200);
    scene.add(fillLight);

    const softBlueBack = new THREE.PointLight(0xa5c4d4, 0.9, 800);
    softBlueBack.position.set(0, 200, -300);
    scene.add(softBlueBack);

    // Floor Grid Helper (at ground height Y = -170)
    const groundY = -170;
    const gridHelper = new THREE.GridHelper(800, 32, 0xb8a892, 0xdcd3c4);
    gridHelper.position.y = groundY;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Floor Plane to receive shadows
    const floorGeo = new THREE.PlaneGeometry(1200, 1200);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = groundY - 0.5;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Central Equilibrium Orbit Guide (dotted ring in X-Z plane)
    const ringGeo = new THREE.RingGeometry(150, 151, 64);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0xc8bcab, 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35 
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 15;
    scene.add(ringMesh);

    // Dynamic Line Segments for 3D Magnetic Filaments
    const maxLines = 100;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.NormalBlending,
    });
    const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
    lineSegmentsRef.current = lineSegments;
    scene.add(lineSegments);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Synchronize Tasks and Spheres with Three.js Scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous nodes
    nodesRef.current.forEach((n) => {
      scene.remove(n.mesh);
      scene.remove(n.haloMesh);
      n.mesh.geometry.dispose();
      (n.mesh.material as THREE.Material).dispose();
      n.haloMesh.geometry.dispose();
      (n.haloMesh.material as THREE.Material).dispose();
    });

    const total = tasks.length;
    const newNodes: SpherePhysicsNode[] = [];

    tasks.forEach((task, idx) => {
      const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;
      const colorHex = focus.accentHex;
      const isAct = taskStates[task.id] !== false;

      // Calculate radius based on criticality and proportional units
      const radius = 16 + (task.criticalityScore / 100) * 16 + (task.proportionalUnits - 1) * 3;
      const mass = radius * 1.5;

      // Initial 3D placement in an orbital ellipsoid ring
      const angle = (idx / total) * Math.PI * 2;
      const ringRadius = 140 + (idx % 3) * 35;
      const heightOffset = Math.sin(idx * 1.8) * 45 + 20;
      const depthZ = Math.cos(idx * 2.2) * 90;

      const initX = Math.cos(angle) * ringRadius;
      const initY = isAct ? heightOffset : -170 + radius;
      const initZ = depthZ;

      // Main Sphere Geometry & Material
      const sphereGeo = new THREE.SphereGeometry(radius, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colorHex),
        roughness: 0.28,
        metalness: 0.18,
        emissive: new THREE.Color(colorHex),
        emissiveIntensity: isAct ? 0.22 : 0.02,
        transparent: true,
        opacity: isAct ? 0.95 : 0.35,
      });

      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.set(initX, initY, initZ);
      sphereMesh.castShadow = isAct;
      sphereMesh.receiveShadow = true;
      sphereMesh.userData = { taskId: task.id };
      scene.add(sphereMesh);

      // Inner Core Accent Ring / Halo
      const haloGeo = new THREE.SphereGeometry(radius * 1.14, 24, 24);
      const haloMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: isAct ? 0.18 : 0.04,
        wireframe: true,
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.set(initX, initY, initZ);
      scene.add(haloMesh);

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
        colorHex,
      });
    });

    nodesRef.current = newNodes;
  }, [tasks]);

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

      const groundY = -170;
      const centerPull = 0.45;
      const linePositions: number[] = [];
      const lineColors: number[] = [];

      // 1. Calculate 3D forces and gravity
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const isAct = taskStates[node.id] !== false;
        const isBeingDragged = draggingNodeRef.current === node;

        if (!isBeingDragged) {
          if (isAct) {
            // Gentle 3D orbital floating
            const angle = time * 0.00035 + (node.id * 0.4);
            const floatOffsetY = Math.sin(time * 0.0015 + node.id) * 6;
            
            // Soft center attraction in 3D
            const dx = (node.targetX - node.x);
            const dy = (node.targetY + floatOffsetY - node.y);
            const dz = (node.targetZ - node.z);

            node.vx += dx * centerPull * dt;
            node.vy += dy * centerPull * dt;
            node.vz += dz * centerPull * dt;
          } else {
            // DEACTIVATED: 3D Gravity pull downwards to the ground grid!
            const gravity3D = -180;
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

          // 2. Pairwise 3D Magnetism and Viscoelastic Collisions
          for (let j = i + 1; j < nodes.length; j++) {
            const other = nodes[j];
            const otherAct = taskStates[other.id] !== false;

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

              // Viscoelastic 3D collision damping
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
            if (sameFocus && isAct && otherAct && dist < 320 && dist > minDist) {
              const force = (magnetismStrength * 350) / (distSq + 500);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              const fz = (dz / dist) * force;

              node.vx += fx * dt;
              node.vy += fy * dt;
              node.vz += fz * dt;
              other.vx -= fx * dt;
              other.vy -= fy * dt;
              other.vz -= fz * dt;

              // Render magnetic 3D filament
              if (showFilaments && linePositions.length < 500) {
                linePositions.push(node.x, node.y, node.z, other.x, other.y, other.z);
                const c = new THREE.Color(node.colorHex);
                lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
              }
            }
          }

          // Apply velocity & damping
          node.vx *= dampingFactor;
          node.vy *= dampingFactor;
          node.vz *= dampingFactor;

          node.x += node.vx;
          node.y += node.vy;
          node.z += node.vz;
        }

        // Sync Three.js mesh positions
        node.mesh.position.set(node.x, node.y, node.z);
        node.haloMesh.position.set(node.x, node.y, node.z);

        // Visual selection glow
        const isSelected = selectedTaskId === node.id;
        const isHovered = hoveredTaskId === node.id;
        const mat = node.mesh.material as THREE.MeshStandardMaterial;
        const haloMat = node.haloMesh.material as THREE.MeshBasicMaterial;

        if (isSelected) {
          mat.emissiveIntensity = 0.55;
          node.haloMesh.scale.set(1.28, 1.28, 1.28);
          haloMat.opacity = 0.45;
        } else if (isHovered) {
          mat.emissiveIntensity = 0.38;
          node.haloMesh.scale.set(1.18, 1.18, 1.18);
          haloMat.opacity = 0.28;
        } else {
          mat.emissiveIntensity = isAct ? 0.22 : 0.02;
          node.haloMesh.scale.set(1.08, 1.08, 1.08);
          haloMat.opacity = isAct ? 0.16 : 0.03;
        }
        mat.opacity = isAct ? 0.95 : 0.32;
      }

      // Update 3D magnetic filaments buffer
      if (lineSegments && lineSegments.geometry) {
        const geo = lineSegments.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
        const colAttr = geo.getAttribute('color') as THREE.BufferAttribute;

        if (showFilaments && linePositions.length > 0) {
          for (let k = 0; k < linePositions.length; k++) {
            posAttr.setXYZ(k, linePositions[k * 3], linePositions[k * 3 + 1], linePositions[k * 3 + 2]);
          }
          geo.setDrawRange(0, linePositions.length / 3);
          posAttr.needsUpdate = true;
          colAttr.needsUpdate = true;
          lineSegments.visible = true;
        } else {
          lineSegments.visible = false;
        }
      }

      // Update Screen space coordinates for 2D tag overlays (only if enabled)
      if (showLabels && camera && containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const newScreenPos: Record<number, { x: number; y: number; visible: boolean; dist: number }> = {};

        const tempVec = new THREE.Vector3();
        nodes.forEach((n) => {
          tempVec.set(n.x, n.y + n.radius + 6, n.z);
          const dist = tempVec.distanceTo(camera.position);
          tempVec.project(camera);

          const isBehind = tempVec.z > 1;
          const sx = (tempVec.x * 0.5 + 0.5) * width;
          const sy = (-tempVec.y * 0.5 + 0.5) * height;

          newScreenPos[n.id] = {
            x: sx,
            y: sy,
            visible: !isBehind && sx >= -40 && sx <= width + 40 && sy >= -40 && sy <= height + 40,
            dist,
          };
        });
        setScreenPositions(newScreenPos);
      }

      // Render Three.js Scene
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [taskStates, magnetismStrength, dampingFactor, showFilaments, selectedTaskId, hoveredTaskId, showLabels]);

  // Pointer Interaction Handlers (Raycasting, 3D Dragging & Camera Orbit)
  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      normX: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      normY: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y, normX, normY } = getPointerPos(e);
    previousPointerPosRef.current = { x, y };

    if (!cameraRef.current || !sceneRef.current) return;

    mouseRef.current.set(normX, normY);
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const meshes = nodesRef.current.map((n) => n.mesh);
    const intersects = raycasterRef.current.intersectObjects(meshes, false);

    if (intersects.length > 0 && e.button === 0) {
      // Clicked a 3D sphere: start dragging sphere in 3D
      const hitMesh = intersects[0].object as THREE.Mesh;
      const taskId = hitMesh.userData.taskId;
      const targetNode = nodesRef.current.find((n) => n.id === taskId);

      if (targetNode) {
        draggingNodeRef.current = targetNode;
        setSelectedTaskId(targetNode.id);
        setSelectedCoords({
          x: Math.round(targetNode.x),
          y: Math.round(targetNode.y),
          z: Math.round(targetNode.z),
        });

        // Set drag plane parallel to camera viewport passing through node position
        const cameraDir = new THREE.Vector3();
        cameraRef.current.getWorldDirection(cameraDir);
        dragPlaneRef.current.setFromNormalAndCoplanarPoint(
          cameraDir.negate(),
          new THREE.Vector3(targetNode.x, targetNode.y, targetNode.z)
        );
        return;
      }
    }

    // Clicked empty background: start orbit rotation or panning
    isOrbitingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y, normX, normY } = getPointerPos(e);
    const dx = x - previousPointerPosRef.current.x;
    const dy = y - previousPointerPosRef.current.y;
    previousPointerPosRef.current = { x, y };

    // Case 1: Dragging a Sphere in 3D
    if (draggingNodeRef.current && cameraRef.current) {
      mouseRef.current.set(normX, normY);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      if (isShiftPressed) {
        // Holding Shift while dragging moves the sphere forward/backward along the Z depth axis!
        const node = draggingNodeRef.current;
        const zChange = -dy * 1.5;
        node.z += zChange;
        node.targetZ += zChange;
        node.vz = 0;
        setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
      } else {
        // Normal drag: moves sphere in screen plane
        if (raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, dragIntersectionRef.current)) {
          const node = draggingNodeRef.current;
          node.x = dragIntersectionRef.current.x;
          node.y = dragIntersectionRef.current.y;
          node.z = dragIntersectionRef.current.z;
          node.targetX = node.x;
          node.targetY = node.y;
          node.targetZ = node.z;
          node.vx = 0;
          node.vy = 0;
          node.vz = 0;
          setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
        }
      }
      return;
    }

    // Case 2: Orbiting Camera in 3D
    if (isOrbitingRef.current && cameraRef.current) {
      if (e.buttons === 2 || e.buttons === 4) {
        // Right-click or middle drag: Pan camera
        const panSpeed = 0.45;
        cameraTargetRef.current.x -= dx * panSpeed;
        cameraTargetRef.current.y += dy * panSpeed;
      } else {
        // Left drag: Rotate orbit in 360 degrees
        const rotSpeed = 0.006;
        cameraSphericalRef.current.theta -= dx * rotSpeed;
        cameraSphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, cameraSphericalRef.current.phi - dy * rotSpeed)
        );
      }
      updateCameraFromSpherical();
      return;
    }

    // Case 3: Hover detection
    if (cameraRef.current && sceneRef.current) {
      mouseRef.current.set(normX, normY);
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const meshes = nodesRef.current.map((n) => n.mesh);
      const intersects = raycasterRef.current.intersectObjects(meshes, false);

      if (intersects.length > 0) {
        const taskId = (intersects[0].object as THREE.Mesh).userData.taskId;
        setHoveredTaskId(taskId);
      } else {
        setHoveredTaskId(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    draggingNodeRef.current = null;
    isOrbitingRef.current = false;
  };

  // Wheel to Zoom camera or Adjust Z-Depth
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (draggingNodeRef.current) {
      // If dragging a sphere, wheel adjusts its Z depth directly
      const node = draggingNodeRef.current;
      node.z += e.deltaY * 0.4;
      node.targetZ = node.z;
      setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
      return;
    }

    // Otherwise zoom camera
    const zoomSpeed = 0.4;
    cameraSphericalRef.current.radius = Math.max(
      180,
      Math.min(950, cameraSphericalRef.current.radius + e.deltaY * zoomSpeed)
    );
    updateCameraFromSpherical();
  };

  const selectedTask = useMemo(() => {
    return tasks.find((t) => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  const hoveredTask = useMemo(() => {
    if (!hoveredTaskId) return null;
    return tasks.find((t) => t.id === hoveredTaskId) || null;
  }, [tasks, hoveredTaskId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[640px] sm:h-[700px] rounded-3xl border border-[#e5dfd2] bg-gradient-to-b from-[#fcfbfa] to-[#f4eee4] shadow-inner overflow-hidden select-none"
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

      {/* Floating 2D Screen-Projected HTML Tags (Disabled by default so floating globes are clean) */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {nodesRef.current.map((node) => {
            const sPos = screenPositions[node.id];
            if (!sPos || !sPos.visible) return null;

            const isAct = taskStates[node.id] !== false;
            const isSelected = selectedTaskId === node.id;
            const isHovered = hoveredTaskId === node.id;

            // Fade with 3D depth distance
            const opacity = Math.max(0.2, Math.min(1, 1 - (sPos.dist - 300) / 450));

            return (
              <div
                key={node.id}
                style={{
                  transform: `translate(-50%, -100%) translate(${sPos.x}px, ${sPos.y}px)`,
                  opacity,
                }}
                className={`absolute transition-transform duration-75 pointer-events-auto ${
                  isSelected ? 'z-30' : isHovered ? 'z-20' : 'z-10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(node.id);
                    setSelectedCoords({ x: Math.round(node.x), y: Math.round(node.y), z: Math.round(node.z) });
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-md cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#1c1917] text-white border-amber-400 ring-2 ring-amber-400/50 scale-105'
                      : isHovered
                      ? 'bg-white text-[#1c1917] border-[#b09e86] scale-105'
                      : isAct
                      ? 'bg-white/92 text-[#3c342a] border-[#e2d8ca]'
                      : 'bg-[#ebe5dc]/80 text-[#857b6f] border-[#d4cbbe]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: node.colorHex }}
                  />
                  <span className="font-mono">#{node.task.originalNumber}</span>
                  <span className="truncate max-w-[130px] hidden sm:inline">
                    {node.task.pendiente}
                  </span>
                  <span className="font-mono text-[10px] text-rose-700">
                    {node.task.criticalityScore}pts
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Left: 3D Universe Title & Controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#e4dccf] shadow-xs">
          <Rotate3d className="w-4 h-4 text-amber-700 animate-spin-slow" />
          <span className="text-xs font-bold font-serif-warm text-[#292524]">
            Universo 3D Gravitacional & Afinidad
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
            3D Físico
          </span>
        </div>

        {/* Hovered Sphere Live Indicator (Discreet preview without cluttering floating globes) */}
        {hoveredTask && !selectedTask && (
          <div className="flex items-center gap-2 bg-[#292524]/95 text-white px-3 py-1.5 rounded-2xl text-xs shadow-lg backdrop-blur-sm border border-stone-700 pointer-events-none">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: FOCUS_DEFINITIONS[hoveredTask.functionalFocus]?.accentHex }}
            />
            <span className="font-mono text-amber-300 font-bold">Ticket #{hoveredTask.originalNumber}</span>
            <span className="truncate max-w-[180px] sm:max-w-xs">{hoveredTask.pendiente}</span>
            <span className="text-[10px] text-amber-300 font-mono">({hoveredTask.criticalityScore} pts)</span>
          </div>
        )}

        {/* Camera Views Quick Selector */}
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-[#e4dccf] shadow-xs text-xs">
          <button
            type="button"
            onClick={() => handleApplyPreset('orbit')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'orbit' ? 'bg-[#292524] text-white shadow-2xs' : 'text-[#64594c] hover:bg-[#f4efe6]'
            }`}
            title="Órbita 3D Libre (360°)"
          >
            3D Órbita
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('top')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'top' ? 'bg-[#292524] text-white shadow-2xs' : 'text-[#64594c] hover:bg-[#f4efe6]'
            }`}
            title="Vista Superior Planta (Plano X-Z)"
          >
            Planta (X-Z)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('front')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'front' ? 'bg-[#292524] text-white shadow-2xs' : 'text-[#64594c] hover:bg-[#f4efe6]'
            }`}
            title="Vista Frontal (Plano X-Y)"
          >
            Frontal (X-Y)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('side')}
            className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
              cameraPreset === 'side' ? 'bg-[#292524] text-white shadow-2xs' : 'text-[#64594c] hover:bg-[#f4efe6]'
            }`}
            title="Vista Lateral (Plano Y-Z)"
          >
            Lateral (Y-Z)
          </button>
        </div>
      </div>

      {/* Top Right: Helper Instructions & 3D Parameters */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
        <div className="hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-[#e4dccf] text-[11px] text-[#6b5f50] shadow-xs">
          <Info className="w-3.5 h-3.5 text-amber-700" />
          <span>Arrastra esferas en (X, Y) • Mantén <kbd className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-300 font-mono font-bold text-[#1c1917]">Shift</kbd> para profundidad Z</span>
        </div>

        {/* Physics Controls Toggles */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#e4dccf] shadow-xs text-xs">
          <button
            type="button"
            onClick={() => setShowFilaments(!showFilaments)}
            className={`px-2 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              showFilaments ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-[#786d5f] hover:bg-[#f4efe6]'
            }`}
            title="Alternar filamentos magnéticos entre esferas afines"
          >
            Filamentos 3D
          </button>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              showLabels ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-[#786d5f] hover:bg-[#f4efe6]'
            }`}
            title="Alternar etiquetas flotantes sobre los globos 3D (Desactivadas por defecto)"
          >
            <Tag className="w-3 h-3" />
            <span>{showLabels ? 'Etiquetas: Sí' : 'Etiquetas: No'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              cameraSphericalRef.current = { radius: 460, theta: 0.25, phi: 1.15 };
              cameraTargetRef.current.set(0, 10, 0);
              updateCameraFromSpherical();
            }}
            className="p-1.5 rounded-xl text-[#786d5f] hover:bg-[#f4efe6] hover:text-[#1c1917] transition-all cursor-pointer"
            title="Restablecer Cámara 3D"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Selected Sphere 3D Gizmo & Editor HUD */}
      {selectedTask && (
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-4xl mx-auto bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-[#d8cdbd] shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#ebd8c4]">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-[#292524] text-amber-300 font-mono text-xs font-bold">
                Ticket #{selectedTask.originalNumber}
              </span>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1c1917] truncate max-w-xs sm:max-w-md">
                  {selectedTask.pendiente}
                </h4>
                <div className="flex items-center gap-2 text-[11px] text-[#786d5f]">
                  <span>{selectedTask.responsable}</span>
                  <span>•</span>
                  <span className="font-bold text-rose-700">Criticidad: {selectedTask.criticalityScore}/100</span>
                  <span>•</span>
                  <span className="capitalize">{selectedTask.prioridad}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleTask(selectedTask.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  taskStates[selectedTask.id] !== false
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{taskStates[selectedTask.id] !== false ? 'Opacar (Suelo 3D)' : 'Activar (Órbita 3D)'}</span>
              </button>

              {onEditTask && (
                <button
                  type="button"
                  onClick={() => onEditTask(selectedTask)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#292524] text-white hover:bg-[#44403c] transition-all cursor-pointer shadow-2xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar Parámetros</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onSelectTask(selectedTask)}
                className="p-1.5 rounded-xl text-[#786d5f] hover:bg-[#f4efe6] hover:text-[#1c1917] transition-all cursor-pointer"
                title="Ver Ficha Técnica Completa"
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-xl text-[#786d5f] hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer"
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a7c6c] flex items-center gap-1">
                <Move className="w-3.5 h-3.5 text-amber-700" />
                Coordenadas 3D:
              </span>
              <div className="font-mono text-xs flex items-center gap-2 bg-[#faf7f2] px-2.5 py-1 rounded-xl border border-[#e4dccf]">
                <span className="text-red-700 font-bold">X: {selectedCoords?.x ?? 0}</span>
                <span className="text-emerald-700 font-bold">Y: {selectedCoords?.y ?? 0}</span>
                <span className="text-blue-700 font-bold">Z: {selectedCoords?.z ?? 0}</span>
              </div>
            </div>

            {/* Direct 3-Dimensional Movement Nudge Controls */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#8a7c6c] mr-1">Mover en 3D:</span>
              
              {/* X Axis */}
              <button
                type="button"
                onClick={() => handleNudgeNode('x', -25)}
                className="px-2 py-1 rounded-lg bg-[#faf7f2] hover:bg-[#efe7da] border border-[#e2d8c9] font-bold text-[11px] cursor-pointer"
                title="Mover hacia la Izquierda (-X)"
              >
                -X
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('x', 25)}
                className="px-2 py-1 rounded-lg bg-[#faf7f2] hover:bg-[#efe7da] border border-[#e2d8c9] font-bold text-[11px] cursor-pointer"
                title="Mover hacia la Derecha (+X)"
              >
                +X
              </button>

              {/* Y Axis */}
              <button
                type="button"
                onClick={() => handleNudgeNode('y', 25)}
                className="px-2 py-1 rounded-lg bg-[#faf7f2] hover:bg-[#efe7da] border border-[#e2d8c9] font-bold text-[11px] text-emerald-800 cursor-pointer"
                title="Elevar en Altura (+Y)"
              >
                +Y (Subir)
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('y', -25)}
                className="px-2 py-1 rounded-lg bg-[#faf7f2] hover:bg-[#efe7da] border border-[#e2d8c9] font-bold text-[11px] text-emerald-800 cursor-pointer"
                title="Bajar en Altura (-Y)"
              >
                -Y (Bajar)
              </button>

              {/* Z Axis (Profundidad) */}
              <button
                type="button"
                onClick={() => handleNudgeNode('z', -35)}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] text-blue-900 cursor-pointer"
                title="Traer al frente / acercar (-Z)"
              >
                -Z (Frente)
              </button>
              <button
                type="button"
                onClick={() => handleNudgeNode('z', 35)}
                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 font-bold text-[11px] text-blue-900 cursor-pointer"
                title="Enviar al fondo / alejar (+Z)"
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
