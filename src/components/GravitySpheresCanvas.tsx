import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Sparkles, 
  ArrowDown, 
  RotateCcw, 
  Power, 
  Eye, 
  Flame, 
  Zap, 
  Info,
  Layers,
  ChevronDown,
  Magnet,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { CRMTask } from '../types';
import { FOCUS_DEFINITIONS } from '../data/crmTasksData';
import { TaskDetailModal } from './TaskDetailModal';

interface GravitySpheresCanvasProps {
  tasks: CRMTask[];
  taskStates: Record<number, boolean>;
  onToggleTask: (id: number) => void;
  onToggleAll: (activate: boolean) => void;
}

interface PhysicsCircle {
  id: number;
  task: CRMTask;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  accentHex: string;
  pulsePhase: number;
  isHovered: boolean;
}

interface MagneticLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  dist: number;
  alpha: number;
  isStrong: boolean;
  focusName: string;
}

interface ContactGlow {
  x: number;
  y: number;
  color: string;
  radius: number;
  intensity: number;
}

export const GravitySpheresCanvas: React.FC<GravitySpheresCanvasProps> = ({
  tasks,
  taskStates,
  onToggleTask,
  onToggleAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Physics World Entities Ref
  const circlesRef = useRef<PhysicsCircle[]>([]);

  // Dragging State Ref
  const dragRef = useRef<{
    isDragging: boolean;
    draggedCircleId: number | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    lastTime: number;
    dragVx: number;
    dragVy: number;
    hasMovedSignificantly: boolean;
  }>({
    isDragging: false,
    draggedCircleId: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    dragVx: 0,
    dragVy: 0,
    hasMovedSignificantly: false,
  });

  // Hovered Circle & Tooltip
  const [hoveredCircle, setHoveredCircle] = useState<{
    task: CRMTask;
    x: number;
    y: number;
    isActive: boolean;
  } | null>(null);

  // Selected Task for Detail Modal
  const [selectedTask, setSelectedTask] = useState<CRMTask | null>(null);

  // World dimensions tracked in state
  const [worldDim, setWorldDim] = useState<{ width: number; height: number; viewportH: number }>({
    width: 1200,
    height: 1800,
    viewportH: 900,
  });

  // Track if user has scrolled down to see bottom area
  const [scrollInfo, setScrollInfo] = useState({
    canScrollDown: true,
    dimmedCount: 0,
  });

  // Magnetism Level & Tuning
  const [magnetismStrength, setMagnetismStrength] = useState<'normal' | 'strong' | 'ultra'>('strong');
  const magnetismRef = useRef<'normal' | 'strong' | 'ultra'>('strong');
  useEffect(() => {
    magnetismRef.current = magnetismStrength;
  }, [magnetismStrength]);

  const [activeAffinityLinksCount, setActiveAffinityLinksCount] = useState(0);

  // Helper to evaluate similarity affinity between two tasks (stronger for same focus & category)
  const computeTaskAffinity = (t1: CRMTask, t2: CRMTask) => {
    const sameFocus = t1.functionalFocus === t2.functionalFocus;
    const sameCategory = t1.categoria === t2.categoria;
    const sameResponsible = t1.responsable === t2.responsable;

    let score = 0.22; // Base mutual attraction between any two circles
    let isStrong = false;

    if (sameFocus) {
      score += 1.85; // Strongest affinity between elements of the same functional focus!
      isStrong = true;
    }
    if (sameCategory) {
      score += 0.45;
    }
    if (sameResponsible) {
      score += 0.35;
    }

    // Reach distance: similar elements attract across a wider radius
    const reach = isStrong ? 280 : sameCategory ? 200 : 150;

    return { score, isStrong, reach };
  };

  // Helper to calculate radius based on criticality & screen size
  const computeRadius = (score: number, isMobile: boolean) => {
    const normalized = Math.min(100, Math.max(20, score)) / 100;
    if (isMobile) {
      return 32 + normalized * 18; // 32px to 50px
    }
    return 40 + normalized * 24; // 40px to 64px
  };

  // Synchronize circles array with tasks & taskStates
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const existingMap = new Map<number, PhysicsCircle>();
    circlesRef.current.forEach((c) => existingMap.set(c.id, c));

    const viewportH = window.innerHeight;
    const initialCenterX = (containerRef.current?.clientWidth || 1200) / 2;
    const initialCenterY = Math.min(viewportH * 0.45, 420);

    const updatedCircles: PhysicsCircle[] = tasks.map((task, idx) => {
      const existing = existingMap.get(task.id);
      const radius = computeRadius(task.criticalityScore, isMobile);
      const focus = FOCUS_DEFINITIONS[task.functionalFocus] || FOCUS_DEFINITIONS.protocolo_resuelto;

      if (existing) {
        existing.task = task;
        existing.radius = radius;
        existing.mass = Math.PI * radius * radius * 0.001;
        existing.accentHex = focus.accentHex;
        return existing;
      }

      // Distribute radially around visible center
      const angle = (idx / tasks.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = 60 + Math.random() * 180;
      const x = initialCenterX + Math.cos(angle) * dist;
      const y = initialCenterY + Math.sin(angle) * dist;

      return {
        id: task.id,
        task,
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius,
        mass: Math.PI * radius * radius * 0.001,
        accentHex: focus.accentHex,
        pulsePhase: Math.random() * Math.PI * 2,
        isHovered: false,
      };
    });

    circlesRef.current = updatedCircles;
  }, [tasks]);

  // Update counts
  useEffect(() => {
    const dimmed = tasks.filter((t) => taskStates[t.id] === false).length;
    setScrollInfo((prev) => ({ ...prev, dimmedCount: dimmed }));
  }, [tasks, taskStates]);

  // Main Canvas Setup and Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || 1200;
    // Exactly 150% of the visible viewport height (1.0 viewport visible + 0.5 viewport of scroll space)
    const viewportH = window.innerHeight;
    let height = Math.max(1100, Math.round(viewportH * 1.5));

    setWorldDim({ width, height, viewportH });

    // Handle HiDPI
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Resize Observer to keep dimensions responsive
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        if (newW > 0 && Math.abs(newW - width) > 10) {
          width = newW;
          const currentVpH = window.innerHeight;
          height = Math.max(1100, Math.round(currentVpH * 1.5));
          setWorldDim({ width, height, viewportH: currentVpH });

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
          ctx.scale(dpr, dpr);
        }
      }
    });
    ro.observe(container);

    let lastTimestamp = performance.now();
    let linkCountUpdateTimer = 0;

    // Physics Simulation Loop
    const runPhysics = (now: number) => {
      const dt = Math.min(32, now - lastTimestamp) / 16.666; // Normalized to 60fps
      lastTimestamp = now;

      const circles = circlesRef.current;
      const drag = dragRef.current;

      // Center of visible screen (top viewport area)
      const centerX = width / 2;
      const centerY = Math.min(viewportH * 0.44, 430);

      // Floor level in the 50% bottom scroll area
      const floorY = height - 48;

      // Magnetic & Contact visualization containers
      const magneticLinks: MagneticLink[] = [];
      const contactGlows: ContactGlow[] = [];

      // Current Magnetism Multiplier from state
      const magMultiplier = magnetismRef.current === 'ultra' ? 1.75 : magnetismRef.current === 'strong' ? 1.2 : 0.65;

      // 1. APPLY SINGLE-BODY FORCES (CENTRAL ORBIT OR GRAVITY FALL)
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        const isActive = taskStates[c.id] !== false;

        // If circle is actively being dragged, skip physics integration
        if (drag.isDragging && drag.draggedCircleId === c.id) {
          c.vx = drag.dragVx;
          c.vy = drag.dragVy;
          continue;
        }

        if (isActive) {
          // ACTIVE: Attraction to center of visible screen
          const dx = centerX - c.x;
          const dy = centerY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Gentle center gravity (Harmonic Spring)
          const centerGravityStrength = 0.0022;
          const pull = Math.min(dist * centerGravityStrength, 1.2);
          if (dist > 1) {
            c.vx += (dx / dist) * pull * dt;
            c.vy += (dy / dist) * pull * dt;
          }

          // Gentle slowed-down fluid wave/drift (organic breathing motion)
          const waveAngle = now * 0.0007 + c.pulsePhase;
          c.vx += Math.cos(waveAngle) * 0.035 * dt;
          c.vy += Math.sin(waveAngle) * 0.035 * dt;

          // If it was pushed below into the bottom scroll zone while active, apply buoyant lift
          if (c.y > viewportH * 0.75) {
            c.vy -= 0.32 * dt; // Strong buoyancy upwards to visible orbit
          }
        } else {
          // DEACTIVATED: DOWNWARD GRAVITY PULLS IT TO THE BOTTOM SCROLL SPACE!
          // Slowed-down gravitational acceleration ("movimientos ralentizados")
          const gravityAccel = 0.18 * dt;
          c.vy += gravityAccel;

          // Slight horizontal settling dampening
          c.vx *= Math.pow(0.95, dt);
        }

        // Viscous Fluid Resistance ("movimientos ralentizados" / calm damping)
        const damping = isActive ? 0.965 : 0.969;
        c.vx *= Math.pow(damping, dt);
        c.vy *= Math.pow(damping, dt);

        // Update positions
        c.x += c.vx * dt;
        c.y += c.vy * dt;

        // BOUNDARY COLLISIONS: Left, Right, Ceiling, Floor (with soft cushioned bounce)
        const pad = 16;
        if (c.x - c.radius < pad) {
          c.x = pad + c.radius;
          c.vx = -c.vx * 0.25;
        } else if (c.x + c.radius > width - pad) {
          c.x = width - pad - c.radius;
          c.vx = -c.vx * 0.25;
        }

        if (c.y - c.radius < 24) {
          c.y = 24 + c.radius;
          c.vy = -c.vy * 0.25;
        } else if (c.y + c.radius > floorY) {
          c.y = floorY - c.radius;
          c.vy = -c.vy * 0.2; // Soft, cushioned landing on ground
          c.vx *= 0.88; // Ground rolling friction
        }
      }

      // 2. MUTUAL MAGNETISM (Pull between elements, much stronger for similar elements)
      let strongLinkCounter = 0;
      for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
          const c1 = circles[i];
          const c2 = circles[j];
          const isC1Active = taskStates[c1.id] !== false;
          const isC2Active = taskStates[c2.id] !== false;

          // State affinity factor: elements in same state attract more strongly
          const crossStateFactor = (isC1Active === isC2Active) ? 1.0 : 0.35;

          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          const minDist = c1.radius + c2.radius;

          const affinity = computeTaskAffinity(c1.task, c2.task);
          const maxReach = affinity.reach;

          // Mutual magnetism when separated but within reach range
          if (dist > minDist && dist < maxReach && distSq > 0.001) {
            const normDist = (dist - minDist) / (maxReach - minDist);
            // Soft inverse-distance curve: smooth pull tapering gently at reach boundary
            const pullCurve = Math.pow(1 - normDist, 1.25);
            const forceMag = 0.045 * affinity.score * magMultiplier * crossStateFactor * pullCurve;

            const nx = dx / dist;
            const ny = dy / dist;

            const isC1Dragged = drag.isDragging && drag.draggedCircleId === c1.id;
            const isC2Dragged = drag.isDragging && drag.draggedCircleId === c2.id;

            const totalMass = c1.mass + c2.mass;
            const m1Ratio = c2.mass / totalMass;
            const m2Ratio = c1.mass / totalMass;

            if (!isC1Dragged) {
              c1.vx += nx * forceMag * m1Ratio * dt;
              c1.vy += ny * forceMag * m1Ratio * dt;
            }
            if (!isC2Dragged) {
              c2.vx -= nx * forceMag * m2Ratio * dt;
              c2.vy -= ny * forceMag * m2Ratio * dt;
            }

            // Record magnetic flux link for visualization
            if (affinity.isStrong && dist < 260) {
              strongLinkCounter++;
              const linkAlpha = Math.min(0.75, (1 - normDist) * 0.85);
              magneticLinks.push({
                x1: c1.x,
                y1: c1.y,
                x2: c2.x,
                y2: c2.y,
                color: c1.accentHex,
                dist,
                alpha: linkAlpha,
                isStrong: true,
                focusName: FOCUS_DEFINITIONS[c1.task.functionalFocus]?.name || '',
              });
            } else if (dist < 130 && affinity.score > 0.5) {
              const linkAlpha = Math.min(0.35, (1 - normDist) * 0.4);
              magneticLinks.push({
                x1: c1.x,
                y1: c1.y,
                x2: c2.x,
                y2: c2.y,
                color: '#a88c6e',
                dist,
                alpha: linkAlpha,
                isStrong: false,
                focusName: '',
              });
            }
          }
        }
      }

      // Update link count state every ~30 frames
      if (now - linkCountUpdateTimer > 500) {
        linkCountUpdateTimer = now;
        setActiveAffinityLinksCount(strongLinkCounter);
      }

      // 3. SLOW CUSHIONED COLLISIONS (Memory-foam shock absorption + progressive separation)
      const collisionPasses = 3;
      for (let p = 0; p < collisionPasses; p++) {
        for (let i = 0; i < circles.length; i++) {
          for (let j = i + 1; j < circles.length; j++) {
            const c1 = circles[i];
            const c2 = circles[j];

            const dx = c2.x - c1.x;
            const dy = c2.y - c1.y;
            const distSq = dx * dx + dy * dy;
            const minDist = c1.radius + c2.radius;

            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Mass ratios
              const totalMass = c1.mass + c2.mass;
              const r1 = c2.mass / totalMass;
              const r2 = c1.mass / totalMass;

              const isC1Dragged = drag.isDragging && drag.draggedCircleId === c1.id;
              const isC2Dragged = drag.isDragging && drag.draggedCircleId === c2.id;

              // Progressive, slow positional separation (relaxation factor 0.38 per pass avoids snappy kicks)
              const push = overlap * 0.38;
              if (!isC1Dragged && !isC2Dragged) {
                c1.x -= nx * push * r1;
                c1.y -= ny * push * r1;
                c2.x += nx * push * r2;
                c2.y += ny * push * r2;
              } else if (isC1Dragged) {
                c2.x += nx * push;
                c2.y += ny * push;
              } else if (isC2Dragged) {
                c1.x -= nx * push;
                c1.y -= ny * push;
              }

              // Contact Viscosity: Slow down velocities when touching (cushion damping)
              const contactViscosity = 0.93;
              if (!isC1Dragged) {
                c1.vx *= contactViscosity;
                c1.vy *= contactViscosity;
              }
              if (!isC2Dragged) {
                c2.vx *= contactViscosity;
                c2.vy *= contactViscosity;
              }

              // Velocity Impulse: Nearly zero restitution (e = 0.05) for slow, cushioned contact
              const kx = c1.vx - c2.vx;
              const ky = c1.vy - c2.vy;
              const normalVel = kx * nx + ky * ny;

              if (normalVel > 0) {
                const restitution = 0.05;
                const impulse = (normalVel * (1 + restitution)) / totalMass;

                if (!isC1Dragged) {
                  c1.vx -= impulse * c2.mass * nx;
                  c1.vy -= impulse * c2.mass * ny;
                }
                if (!isC2Dragged) {
                  c2.vx += impulse * c1.mass * nx;
                  c2.vy += impulse * c1.mass * ny;
                }
              }

              // Tangential rolling friction (prevents slipping or jerky spins)
              const tx = -ny;
              const ty = nx;
              const tangentVel = kx * tx + ky * ty;
              const frictionFactor = 0.16;
              if (!isC1Dragged) {
                c1.vx -= tangentVel * frictionFactor * tx;
                c1.vy -= tangentVel * frictionFactor * ty;
              }
              if (!isC2Dragged) {
                c2.vx += tangentVel * frictionFactor * tx;
                c2.vy += tangentVel * frictionFactor * ty;
              }

              // Visual compression cushion glow on initial pass
              if (p === 0 && overlap > 0.4) {
                const isAffinitySame = c1.task.functionalFocus === c2.task.functionalFocus;
                contactGlows.push({
                  x: (c1.x + c2.x) / 2,
                  y: (c1.y + c2.y) / 2,
                  color: isAffinitySame ? c1.accentHex : '#d97706',
                  radius: Math.max(9, (c1.radius + c2.radius) * 0.22),
                  intensity: Math.min(0.75, overlap / 4),
                });
              }
            }
          }
        }
      }

      // 4. CALM VELOCITY CLAMPING (Guarantees movements remain slow, graceful and fluid)
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        if (drag.isDragging && drag.draggedCircleId === c.id) continue;
        const maxSpeed = taskStates[c.id] !== false ? 2.6 : 3.2;
        const spd = Math.hypot(c.vx, c.vy);
        if (spd > maxSpeed) {
          c.vx = (c.vx / spd) * maxSpeed;
          c.vy = (c.vy / spd) * maxSpeed;
        }
      }

      // 5. CANVAS RENDERING
      ctx.clearRect(0, 0, width, height);

      // Render Ambient Grid / Sandy Texture
      drawCanvasBackground(ctx, width, height, viewportH, centerX, centerY, floorY);

      // Render Connections or Orbital Halo
      drawOrbitalCenter(ctx, centerX, centerY, now);

      // Render Magnetic Flux Lines between similar elements
      drawMagneticLinks(ctx, magneticLinks, now);

      // Render Horizon Divider (Indicating the 50% bottom scroll region)
      drawHorizonDivider(ctx, width, viewportH);

      // Render Sediment Floor
      drawSedimentFloor(ctx, width, floorY);

      // Render Circles
      for (let i = 0; i < circles.length; i++) {
        const c = circles[i];
        const isActive = taskStates[c.id] !== false;
        const isHovered = hoveredCircle?.task.id === c.id;
        const isDragged = drag.isDragging && drag.draggedCircleId === c.id;

        drawCircle(ctx, c, isActive, isHovered, isDragged, now);
      }

      // Render Soft Contact Compression Glows (Slow cushion collision feedback)
      drawContactGlows(ctx, contactGlows);

      animationFrameRef.current = requestAnimationFrame(runPhysics);
    };

    animationFrameRef.current = requestAnimationFrame(runPhysics);

    return () => {
      ro.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [taskStates, hoveredCircle]);

  // Drawing Canvas Background
  const drawCanvasBackground = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    vpH: number,
    cx: number,
    cy: number,
    floorY: number
  ) => {
    // Soft sandy warm gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#fbf8f2');
    bgGrad.addColorStop(0.55, '#f7f1e5');
    bgGrad.addColorStop(0.85, '#ede3d1');
    bgGrad.addColorStop(1, '#e4d6be');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Ambient Stippled Grid Dots
    ctx.fillStyle = 'rgba(168, 140, 110, 0.12)';
    const step = 48;
    for (let x = 24; x < w; x += step) {
      for (let y = 24; y < h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Drawing the Orbital Center of Gravity in the visible screen
  const drawOrbitalCenter = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    now: number
  ) => {
    // Soft radial aura around visible center
    const pulse = Math.sin(now * 0.0015) * 15;
    const auraRadius = 240 + pulse;

    const aura = ctx.createRadialGradient(cx, cy, 20, cx, cy, auraRadius);
    aura.addColorStop(0, 'rgba(217, 119, 6, 0.07)');
    aura.addColorStop(0.6, 'rgba(168, 121, 67, 0.03)');
    aura.addColorStop(1, 'rgba(247, 241, 229, 0)');

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
    ctx.fill();

    // Gentle orbital rings
    ctx.strokeStyle = 'rgba(168, 121, 67, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 260, 0, Math.PI * 2);
    ctx.stroke();

    ctx.setLineDash([]);

    // Small subtle center glyph
    ctx.fillStyle = 'rgba(120, 90, 50, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 10px monospace';
    ctx.fillStyle = 'rgba(120, 90, 50, 0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('ÓRBITA ACTIVA • VISIBLE', cx, cy - 148);
  };

  // Drawing Magnetic Flux Links between similar elements
  const drawMagneticLinks = (
    ctx: CanvasRenderingContext2D,
    links: MagneticLink[],
    now: number
  ) => {
    if (links.length === 0) return;

    ctx.save();
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const mx = (link.x1 + link.x2) / 2;
      const my = (link.y1 + link.y2) / 2;

      // Flow pulse along the magnetic filament
      const phase = (now * 0.003 + (link.x1 + link.y1) * 0.02) % (Math.PI * 2);
      const pulseWidth = 1 + Math.sin(phase) * 0.4;

      ctx.beginPath();
      ctx.moveTo(link.x1, link.y1);
      // Slight magnetic curved arc
      const dx = link.x2 - link.x1;
      const dy = link.y2 - link.y1;
      const bend = Math.sin(now * 0.002 + i) * 5;
      ctx.quadraticCurveTo(mx - (dy / (link.dist + 1)) * bend, my + (dx / (link.dist + 1)) * bend, link.x2, link.y2);

      if (link.isStrong) {
        ctx.strokeStyle = link.color;
        ctx.globalAlpha = Math.min(0.85, link.alpha * 1.15);
        ctx.lineWidth = 1.75 * pulseWidth;
        ctx.setLineDash([6, 4]);
        ctx.stroke();

        // Small magnetic attractor core dot in middle
        ctx.fillStyle = link.color;
        ctx.beginPath();
        ctx.arc(mx, my, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = link.color;
        ctx.globalAlpha = Math.min(0.35, link.alpha);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 5]);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;
    ctx.restore();
  };

  // Drawing Soft Compression Cushion Glows (Slow collision feedback)
  const drawContactGlows = (
    ctx: CanvasRenderingContext2D,
    glows: ContactGlow[]
  ) => {
    if (glows.length === 0) return;

    ctx.save();
    for (let i = 0; i < glows.length; i++) {
      const g = glows[i];
      const rad = Math.max(8, g.radius);
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, rad);
      grad.addColorStop(0, g.color);
      grad.addColorStop(0.5, 'rgba(217, 119, 6, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.globalAlpha = Math.min(0.65, g.intensity * 0.85);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    ctx.restore();
  };

  // Drawing the Horizon Divider (indicating the boundary where scroll down starts)
  const drawHorizonDivider = (
    ctx: CanvasRenderingContext2D,
    w: number,
    vpH: number
  ) => {
    const horizonY = vpH - 10;

    ctx.save();
    ctx.strokeStyle = 'rgba(180, 130, 80, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);

    ctx.beginPath();
    ctx.moveTo(32, horizonY);
    ctx.lineTo(w - 32, horizonY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Horizon badge in center
    const badgeW = 380;
    const badgeH = 24;
    const badgeX = (w - badgeW) / 2;
    const badgeY = horizonY - 12;

    ctx.fillStyle = '#faf5eb';
    ctx.strokeStyle = '#dfd2bf';
    ctx.lineWidth = 1;
    roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = '#7a664e';
    ctx.textAlign = 'center';
    ctx.fillText(
      '↓ Límite de Pantalla Inicial • Desplaza 50% abajo para ver Círculos Caídos',
      w / 2,
      badgeY + 16
    );
    ctx.restore();
  };

  // Drawing the Sediment Floor at the bottom of the 50% scroll area
  const drawSedimentFloor = (
    ctx: CanvasRenderingContext2D,
    w: number,
    floorY: number
  ) => {
    // Ground platform gradient
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 48);
    floorGrad.addColorStop(0, 'rgba(194, 170, 142, 0.7)');
    floorGrad.addColorStop(1, 'rgba(168, 140, 110, 0.95)');

    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, w, 48);

    // Floor top rim line
    ctx.strokeStyle = '#a88c6e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY);
    ctx.lineTo(w, floorY);
    ctx.stroke();

    // Floor textual label
    ctx.font = '700 11px system-ui, sans-serif';
    ctx.fillStyle = '#4a3d2e';
    ctx.textAlign = 'center';
    ctx.fillText(
      '🪨 SEDIMENTACIÓN POR GRAVEDAD (TICKETS OPACADOS / ATENDIDOS EN REPOSO)',
      w / 2,
      floorY + 28
    );
  };

  // Drawing Individual Circle Entity
  const drawCircle = (
    ctx: CanvasRenderingContext2D,
    c: PhysicsCircle,
    isActive: boolean,
    isHovered: boolean,
    isDragged: boolean,
    now: number
  ) => {
    const { x, y, radius, accentHex, task } = c;

    ctx.save();

    // Drop shadow
    ctx.shadowColor = isActive
      ? 'rgba(70, 50, 30, 0.18)'
      : 'rgba(50, 40, 30, 0.25)';
    ctx.shadowBlur = isHovered || isDragged ? 20 : 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = isHovered || isDragged ? 8 : 4;

    // Outer Glow if hovered or dragged
    if (isHovered || isDragged) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = `${accentHex}33`;
      ctx.fill();
    }

    // Sphere Body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (isActive) {
      // Light tactile radial gradient with focus accent tint
      const grad = ctx.createRadialGradient(
        x - radius * 0.35,
        y - radius * 0.35,
        radius * 0.1,
        x,
        y,
        radius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#fbf8f2');
      grad.addColorStop(0.9, '#f3ebd9');
      grad.addColorStop(1, '#e4d6be');
      ctx.fillStyle = grad;
    } else {
      // Inactive / Fallen: stone, muted sandstone texture
      const grad = ctx.createRadialGradient(
        x - radius * 0.3,
        y - radius * 0.3,
        radius * 0.1,
        x,
        y,
        radius
      );
      grad.addColorStop(0, '#e5ded2');
      grad.addColorStop(0.6, '#d3c7b5');
      grad.addColorStop(1, '#b5a691');
      ctx.fillStyle = grad;
    }
    ctx.fill();

    // Reset shadow for inner elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Sphere Border Rim
    ctx.lineWidth = isHovered ? 3 : 2;
    ctx.strokeStyle = isActive ? accentHex : '#8c7d6c';
    ctx.stroke();

    // Pulse Ring for Active high-priority tickets
    if (isActive && task.prioridad === 'Alta') {
      const pulseSize = (Math.sin(now * 0.003 + c.pulsePhase) + 1) * 0.5;
      ctx.strokeStyle = `${accentHex}${Math.round(pulseSize * 90).toString(16).padStart(2, '0')}`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, radius + 3 + pulseSize * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // TEXT & GRAPHICS INSIDE CIRCLE
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 1. Ticket Number Badge: #01, #02...
    const numText = `#${task.originalNumber < 10 ? `0${task.originalNumber}` : task.originalNumber}`;
    ctx.font = '700 13px ui-monospace, monospace';
    ctx.fillStyle = isActive ? '#1c1917' : '#574e42';
    ctx.fillText(numText, x, y - radius * 0.38);

    // 2. Score Badge or Focus Tag
    const scoreText = `${task.criticalityScore} pts`;
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillStyle = isActive ? accentHex : '#6b5e50';
    ctx.fillText(scoreText, x, y - radius * 0.14);

    // 3. Short Title (1 or 2 lines)
    const title = task.pendiente;
    ctx.font = '600 11px system-ui, sans-serif';
    ctx.fillStyle = isActive ? '#292524' : '#635647';

    // Measure and wrap or truncate
    const words = title.split(' ');
    let line1 = words.slice(0, 2).join(' ');
    let line2 = words.slice(2, 4).join(' ');
    if (words.length > 4) line2 += '…';

    ctx.fillText(line1, x, y + radius * 0.14);
    if (radius > 44) {
      ctx.font = '500 10px system-ui, sans-serif';
      ctx.fillText(line2, x, y + radius * 0.38);
    }

    // 4. Status Indicator Dot / Power Glyph
    const dotY = y + radius * 0.68;
    ctx.beginPath();
    ctx.arc(x, dotY, 4, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#10b981' : '#78716c';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  };

  // Helper for drawing rounded rectangles on canvas
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Pointer Event Handlers for Drag & Fling & Inspection
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const circles = circlesRef.current;

    // Check hit circle (reverse to pick top-drawn first)
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy <= c.radius * c.radius) {
        dragRef.current = {
          isDragging: true,
          draggedCircleId: c.id,
          startX: x,
          startY: y,
          lastX: x,
          lastY: y,
          lastTime: performance.now(),
          dragVx: 0,
          dragVy: 0,
          hasMovedSignificantly: false,
        };
        // Bring to front
        circles.splice(i, 1);
        circles.push(c);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const drag = dragRef.current;

    if (drag.isDragging && drag.draggedCircleId !== null) {
      const now = performance.now();
      const dt = Math.max(1, now - drag.lastTime);

      // Track drag velocity
      drag.dragVx = ((x - drag.lastX) / dt) * 16.666;
      drag.dragVy = ((y - drag.lastY) / dt) * 16.666;

      drag.lastX = x;
      drag.lastY = y;
      drag.lastTime = now;

      // Check moved distance
      const distMoved = Math.hypot(x - drag.startX, y - drag.startY);
      if (distMoved > 6) {
        drag.hasMovedSignificantly = true;
      }

      // Update circle position directly to pointer
      const c = circlesRef.current.find((item) => item.id === drag.draggedCircleId);
      if (c) {
        c.x = Math.max(c.radius + 10, Math.min(worldDim.width - c.radius - 10, x));
        c.y = Math.max(c.radius + 10, Math.min(worldDim.height - c.radius - 10, y));
      }
    } else {
      // Hover Detection
      const circles = circlesRef.current;
      let found: PhysicsCircle | null = null;
      for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i];
        const dx = x - c.x;
        const dy = y - c.y;
        if (dx * dx + dy * dy <= c.radius * c.radius) {
          found = c;
          break;
        }
      }

      if (found) {
        setHoveredCircle({
          task: found.task,
          x: found.x,
          y: found.y,
          isActive: taskStates[found.id] !== false,
        });
      } else {
        setHoveredCircle(null);
      }
    }
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (drag.isDragging && drag.draggedCircleId !== null) {
      const c = circlesRef.current.find((item) => item.id === drag.draggedCircleId);

      // If user did not drag significantly, it's a tap/click: open inspection modal!
      if (!drag.hasMovedSignificantly && c) {
        setSelectedTask(c.task);
      } else if (c) {
        // Apply fling velocity with clamping
        c.vx = Math.max(-14, Math.min(14, drag.dragVx * 0.8));
        c.vy = Math.max(-14, Math.min(14, drag.dragVy * 0.8));
      }

      drag.isDragging = false;
      drag.draggedCircleId = null;
    }
  };

  // Double click toggles active state directly
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const circles = circlesRef.current;
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      const dx = x - c.x;
      const dy = y - c.y;
      if (dx * dx + dy * dy <= c.radius * c.radius) {
        onToggleTask(c.id);
        break;
      }
    }
  };

  // Action: Recenter All Active Spheres with a smooth impulse
  const handleRecenter = () => {
    const centerX = worldDim.width / 2;
    const centerY = Math.min(worldDim.viewportH * 0.44, 430);

    circlesRef.current.forEach((c) => {
      if (taskStates[c.id] !== false) {
        const dx = centerX - c.x;
        const dy = centerY - c.y;
        const dist = Math.hypot(dx, dy);
        c.vx = (dx / (dist + 1)) * 3;
        c.vy = (dy / (dist + 1)) * 3;
      }
    });
  };

  // Action: Slow Cushioned Collision Test (gentle convergence to watch soft impact & magnetism)
  const handleSlowCollisionTest = () => {
    const centerX = worldDim.width / 2;
    const centerY = Math.min(worldDim.viewportH * 0.44, 430);

    circlesRef.current.forEach((c) => {
      // Gentle impulse towards center or opposite pair to cause slow cushioned collisions
      const dx = centerX - c.x;
      const dy = centerY - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 5) {
        c.vx = (dx / dist) * (1.2 + Math.random() * 0.8);
        c.vy = (dy / dist) * (1.2 + Math.random() * 0.8);
      }
    });
  };

  // Action: Cluster by Similarity Affinity (attracts same functional focus together)
  const handleClusterByAffinity = () => {
    // Calculate centroids for each functional focus group
    const groups: Record<string, { count: number; x: number; y: number }> = {};
    circlesRef.current.forEach((c) => {
      if (taskStates[c.id] !== false) {
        const focus = c.task.functionalFocus;
        if (!groups[focus]) {
          groups[focus] = { count: 0, x: 0, y: 0 };
        }
        groups[focus].count++;
        groups[focus].x += c.x;
        groups[focus].y += c.y;
      }
    });

    Object.keys(groups).forEach((k) => {
      groups[k].x /= groups[k].count;
      groups[k].y /= groups[k].count;
    });

    // Apply gentle velocity toward centroid of same group
    circlesRef.current.forEach((c) => {
      if (taskStates[c.id] !== false) {
        const g = groups[c.task.functionalFocus];
        if (g && g.count > 1) {
          const dx = g.x - c.x;
          const dy = g.y - c.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            c.vx += (dx / dist) * 1.5;
            c.vy += (dy / dist) * 1.5;
          }
        }
      }
    });
  };

  // Action: Cycle Magnetism Strength
  const cycleMagnetism = () => {
    setMagnetismStrength((prev) => {
      if (prev === 'normal') return 'strong';
      if (prev === 'strong') return 'ultra';
      return 'normal';
    });
  };

  // Scroll downwards to 50% bottom gravity area
  const handleScrollToBottomGravityZone = () => {
    const targetY = window.innerHeight * 0.55;
    window.scrollTo({
      top: window.scrollY + targetY,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-[#e5dfd3] shadow-[0_8px_30px_-6px_rgba(87,70,55,0.08)] bg-[#fbf8f2]">
      {/* Top Floating Physics Control Ribbon */}
      <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 p-3.5 px-5 bg-white/90 backdrop-blur-md border-b border-[#e8ded0]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#292524] text-amber-300 shadow-2xs">
            <Magnet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif-warm font-bold text-sm text-[#1c1917]">
                Universo Gravitacional & Magnetismo CRM
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Colisión Lenta Amortiguada
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1">
                <Magnet className="w-2.5 h-2.5" />
                Magnetismo Afín ({magnetismStrength.toUpperCase()})
              </span>
            </div>
            <p className="text-[11px] text-[#786d5f]">
              Atracción magnética reforzada entre tickets de la misma tipología y foco. Colisiones lentas con absorción viscoelástica.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Magnetism Strength Toggle */}
          <button
            type="button"
            onClick={cycleMagnetism}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 border border-purple-300 text-purple-900 transition-all cursor-pointer shadow-2xs"
            title="Cambia la intensidad del magnetismo entre elementos afines"
          >
            <Magnet className="w-3.5 h-3.5 text-purple-700" />
            <span>Magnetismo: {magnetismStrength === 'ultra' ? 'Ultra (+175%)' : magnetismStrength === 'strong' ? 'Fuerte (+120%)' : 'Normal'}</span>
          </button>

          {/* Cluster by Affinity button */}
          <button
            type="button"
            onClick={handleClusterByAffinity}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 transition-all cursor-pointer shadow-2xs"
            title="Atrae elementos similares hacia sus núcleos de afinidad"
          >
            <Compass className="w-3.5 h-3.5 text-amber-700" />
            <span>Agrupar Similares</span>
          </button>

          {/* Slow Collision Test button */}
          <button
            type="button"
            onClick={handleSlowCollisionTest}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#ede5d8] border border-[#e4dccf] text-[#574d3f] transition-all cursor-pointer shadow-2xs"
            title="Aplica un impulso suave y lento para observar el impacto viscoelástico amortiguado"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Probar Colisión Lenta</span>
          </button>

          {/* Recenter button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[#faf7f2] hover:bg-[#ede5d8] border border-[#e4dccf] text-[#574d3f] transition-all cursor-pointer shadow-2xs"
            title="Atrae todos los círculos activos al centro visible"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>Centrar</span>
          </button>

          {/* Activate all */}
          <button
            type="button"
            onClick={() => onToggleAll(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-all cursor-pointer"
            title="Eleva todos los círculos a la órbita visible"
          >
            <span>Activar Todos</span>
          </button>

          {/* Deactivate all (watch them all fall down) */}
          <button
            type="button"
            onClick={() => onToggleAll(false)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 transition-all cursor-pointer"
            title="Desactiva todos los círculos para ver la caída libre simultánea hacia el fondo"
          >
            <span>Caída Total</span>
          </button>
        </div>
      </div>

      {/* Notice Banner: 50% Scrollable Area Guide */}
      <div className="flex items-center justify-between gap-3 px-5 py-2 bg-[#f4ece0] text-[11px] text-[#6d5e4d] border-b border-[#e5dcce]">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>
            <strong>Instrucciones de interacción:</strong> Haz clic sobre cualquier círculo para ver su diagnóstico y cambiar su estado. Arrastra para lanzarlo.
          </span>
        </div>

        {scrollInfo.dimmedCount > 0 && (
          <button
            type="button"
            onClick={handleScrollToBottomGravityZone}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-700 text-amber-50 font-semibold hover:bg-amber-800 transition-colors cursor-pointer shrink-0"
          >
            <span>Ver {scrollInfo.dimmedCount} caídos abajo</span>
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </button>
        )}
      </div>

      {/* Physics Canvas Area */}
      <div 
        ref={containerRef} 
        className="relative w-full cursor-grab active:cursor-grabbing select-none"
        style={{ height: `${worldDim.height}px` }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onDoubleClick={handleDoubleClick}
          className="w-full h-full block"
        />

        {/* Interactive Hover Tooltip */}
        {hoveredCircle && (
          <div
            className="pointer-events-none absolute z-40 transform -translate-x-1/2 -translate-y-full mb-3 p-3 rounded-2xl bg-[#1c1917]/95 text-white shadow-xl backdrop-blur-md border border-stone-700 max-w-xs transition-all duration-100 text-left"
            style={{
              left: `${hoveredCircle.x}px`,
              top: `${hoveredCircle.y - 45}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-mono text-amber-400 font-bold text-xs">
                Ticket #{hoveredCircle.task.originalNumber}
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                hoveredCircle.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {hoveredCircle.isActive ? 'Activo (En Órbita)' : 'Opacado (Caído al Fondo)'}
              </span>
            </div>
            <div className="font-semibold text-xs leading-snug text-stone-100 mb-1">
              {hoveredCircle.task.pendiente}
            </div>
            <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800">
              <span>{hoveredCircle.task.responsable}</span>
              <span className="font-mono">{hoveredCircle.task.criticalityScore} pts</span>
            </div>
            <div className="mt-1.5 text-[9px] text-amber-300/80 font-mono text-center">
              Clic para inspeccionar ficha técnica
            </div>
          </div>
        )}
      </div>

      {/* Floating Prompt on Bottom Floor */}
      <div className="p-4 bg-[#ede4d4] border-t border-[#dfd4c0] text-center text-xs text-[#6d5e4d] flex flex-col sm:flex-row items-center justify-between gap-2 px-6">
        <span>
          Fondo del espacio de scroll (+50% espacio visible) • Los círculos permanecen en reposo hasta ser activados.
        </span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-3 py-1 rounded-xl bg-[#292524] text-white hover:bg-[#44403c] transition-colors cursor-pointer text-xs font-semibold"
        >
          Volver a la Órbita Superior ↑
        </button>
      </div>

      {/* Detail Modal for Selected Sphere */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        isActive={selectedTask ? taskStates[selectedTask.id] !== false : true}
        onToggle={(id) => {
          onToggleTask(id);
          // Update selected task reference if needed
          setSelectedTask((prev) => (prev && prev.id === id ? { ...prev } : prev));
        }}
      />
    </div>
  );
};
