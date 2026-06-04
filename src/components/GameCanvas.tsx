import { useEffect, useRef } from "react";

type CelestialType =
  | "dust"
  | "asteroid"
  | "planet"
  | "star"
  | "system"
  | "galaxy"
  | "pulsar"
  | "nebula"
  | "darkhole";

type GameObject = {
  id: string;
  x: number;
  y: number;
  radius: number;
  originalRadius: number;
  color: string;
  celestialType: CelestialType;
  angle: number;
  spin: number;
  falling: boolean;
  eaten: boolean;
  seed: number;
};

const getCelestialType = (radius: number): CelestialType => {
  if (radius < 5) return "dust";
  if (radius < 25) return "asteroid";
  if (radius < 100) return "planet";
  if (radius < 500) return "star";
  if (radius < 2000) return "system";
  return "galaxy";
};

const getEndlessCelestialType = (
  objRadius: number,
  playerRadius: number,
  playerLevel: number,
  baseSeed: number,
): CelestialType => {
  const ratio = objRadius / playerRadius;
  const levelOffset = Math.round(Math.log2(ratio));
  const objLevel = Math.max(0, playerLevel + levelOffset);
  const cycleIndex = objLevel % 9;

  switch (cycleIndex) {
    case 0:
      return Math.floor(objRadius + baseSeed) % 3 === 0 ? "dust" : "asteroid";
    case 1:
      return "planet";
    case 2:
      return "star";
    case 3:
      return "system";
    case 4:
    case 5:
    case 6:
      return "galaxy";
    case 7:
      return Math.floor(objRadius + baseSeed) % 2 === 0 ? "pulsar" : "nebula";
    case 8:
      return "darkhole";
    default:
      return "asteroid";
  }
};

type GameState = {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    targetRadius: number;
  };
  cameraScale: number;
  targetCameraScale: number;
  objects: GameObject[];
  joystick: {
    active: boolean;
    baseX: number;
    baseY: number;
    knobX: number;
    knobY: number;
    dirX: number;
    dirY: number;
  };
  keys: { [key: string]: boolean };
  level: number;
  levelUpTextTimer: number;

  mode: "endless" | "goals";
  goalsStage: number;
  goalsWon: boolean;
  winTimer: number;
  winWord: string;
  zoneRadius: number;
  rebirthCount: number;
  showRebirthFlash: number;
};

const formatMass = (value: number) => {
  if (value < 1000) return Math.floor(value).toString();
  const suffixes = [
    "",
    "K",
    "M",
    "B",
    "T",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
    "i",
    "j",
    "k",
    "l",
    "m",
    "n",
    "o",
    "p",
    "q",
    "r",
    "s",
    "t",
    "u",
    "v",
    "w",
    "x",
    "y",
    "z",
  ];
  let shortValue = value;
  let suffixIndex = 0;
  while (shortValue >= 1000 && suffixIndex < suffixes.length - 1) {
    shortValue /= 1000;
    suffixIndex++;
  }
  return shortValue.toFixed(1).replace(/\.0$/, "") + suffixes[suffixIndex];
};

const winWords = [
  "AWESOME!",
  "SPLENDID!",
  "FANTASTIC!",
  "STELLAR!",
  "MAGNIFICENT!",
  "BRILLIANT!",
  "INCREDIBLE!",
  "SUPERB!",
];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GameCanvas({ mode }: { mode: "endless" | "goals" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const massDisplayRef = useRef<HTMLDivElement>(null);
  const tierDisplayRef = useRef<HTMLSpanElement>(null);
  const sectorDisplayRef = useRef<HTMLSpanElement>(null);
  const eraDisplayRef = useRef<HTMLSpanElement>(null);

  const stateRef = useRef<GameState>({
    player: { x: 0, y: 0, vx: 0, vy: 0, radius: 20, targetRadius: 20 },
    cameraScale: 3,
    targetCameraScale: 3,
    objects: [],
    joystick: {
      active: false,
      baseX: 0,
      baseY: 0,
      knobX: 0,
      knobY: 0,
      dirX: 0,
      dirY: 0,
    },
    keys: {},
    level: 0,
    levelUpTextTimer: 0,
    mode,
    goalsStage: parseInt(
      localStorage.getItem("endlessSwarm_goalsStage") || "0",
    ),
    goalsWon: false,
    winTimer: 0,
    winWord: "",
    zoneRadius: 500,
    rebirthCount: 0,
    showRebirthFlash: 0,
  });

  useEffect(() => {
    stateRef.current.mode = mode; // Ensure mode is fresh
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);

    // -- CONTROLS --
    const handlePointerDown = (e: PointerEvent) => {
      const j = stateRef.current.joystick;
      j.active = true;
      j.baseX = e.clientX;
      j.baseY = e.clientY;
      j.knobX = e.clientX;
      j.knobY = e.clientY;
      j.dirX = 0;
      j.dirY = 0;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const j = stateRef.current.joystick;
      if (!j.active) return;
      j.knobX = e.clientX;
      j.knobY = e.clientY;

      const dx = j.knobX - j.baseX;
      const dy = j.knobY - j.baseY;
      const dist = Math.hypot(dx, dy);
      const maxDist = 50;

      if (dist > maxDist) {
        j.knobX = j.baseX + (dx / dist) * maxDist;
        j.knobY = j.baseY + (dy / dist) * maxDist;
        j.dirX = dx / dist;
        j.dirY = dy / dist;
      } else {
        j.dirX = dx / maxDist;
        j.dirY = dy / maxDist;
      }
    };

    const handlePointerUp = () => {
      const j = stateRef.current.joystick;
      j.active = false;
      j.dirX = 0;
      j.dirY = 0;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // -- SPAWNING --
    const createObj = (
      px: number,
      py: number,
      pr: number,
      pcl: number,
      type: CelestialType,
      rng: () => number,
      startRadius?: number,
    ): GameObject => ({
      id: Math.random().toString(36).substring(2, 9),
      x: px,
      y: py,
      radius: startRadius !== undefined ? startRadius : 0.1,
      originalRadius: pr,
      color: `hsl(${pcl % 360}, 80%, ${type === "star" ? 80 : 65}%)`,
      celestialType: type,
      angle: rng() * Math.PI * 2,
      spin: (rng() - 0.5) * 0.05,
      falling: false,
      eaten: false,
      seed: rng() * 4294967296,
    });

    const spawnEndlessPattern = (state: GameState, allowInsideView = false) => {
      const viewHWidth = width / 2 / state.cameraScale;
      const viewHHeight = (height * 0.7) / state.cameraScale;
      const viewRadius = Math.hypot(viewHWidth, viewHHeight);

      const angle = Math.random() * Math.PI * 2;

      const rRatio = allowInsideView
        ? Math.random() * 0.4 + 0.1
        : Math.random() * 1.8 + 0.1;
      const baseObjRadius = Math.max(state.player.targetRadius * rRatio, 5);

      let minDistance, maxDistance;
      if (allowInsideView) {
        minDistance = state.player.targetRadius * 2.5;
        maxDistance = Math.max(minDistance + 10, viewRadius);
      } else {
        // Ensure strictly outside view accounting for huge pattern clusters
        minDistance = viewRadius * 1.2 + baseObjRadius * 10;
        maxDistance = minDistance + viewRadius * 0.8 + baseObjRadius * 5;
      }

      const safeMin = Math.max(state.player.targetRadius * 2.5, minDistance);
      const safeMax = Math.max(
        safeMin + state.player.targetRadius,
        maxDistance,
      );
      const distance = safeMin + Math.random() * (safeMax - safeMin);

      const cx = state.player.x + Math.cos(angle) * distance;
      const cy = state.player.y + Math.sin(angle) * distance;

      const patternType = Math.floor(Math.random() * 4);
      const baseColor = Math.random() * 360;

      const rng = Math.random;
      const playerLevel = Math.floor(
        Math.log2(Math.max(1, state.player.targetRadius / 20)),
      );
      const getStartRad = (r: number) => (allowInsideView ? 0.1 : r);

      if (patternType === 0) {
        const count = 6 + Math.floor(Math.random() * 12);
        const ringRadius =
          baseObjRadius * 2 + Math.random() * baseObjRadius * 4;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const r = baseObjRadius;
          const type = getEndlessCelestialType(
            r,
            state.player.targetRadius,
            playerLevel,
            baseColor + i * 8,
          );
          state.objects.push(
            createObj(
              cx + Math.cos(a) * ringRadius,
              cy + Math.sin(a) * ringRadius,
              r,
              baseColor + i * 8,
              type,
              rng,
              getStartRad(r),
            ),
          );
        }
      } else if (patternType === 1) {
        const count = 12 + Math.floor(Math.random() * 20);
        for (let i = 0; i < count; i++) {
          const a = i * 0.6;
          const r = a * baseObjRadius * 0.6;
          const sz = baseObjRadius * (1 + i * 0.02);
          const type = getEndlessCelestialType(
            sz,
            state.player.targetRadius,
            playerLevel,
            baseColor - i * 3,
          );
          state.objects.push(
            createObj(
              cx + Math.cos(a) * r,
              cy + Math.sin(a) * r,
              sz,
              baseColor - i * 3,
              type,
              rng,
              getStartRad(sz),
            ),
          );
        }
      } else if (patternType === 2) {
        const dims = 3 + Math.floor(Math.random() * 3);
        const spacing = baseObjRadius * 2.2;
        for (let r = 0; r < dims; r++) {
          for (let c = 0; c < dims; c++) {
            const sz = baseObjRadius * (0.8 + Math.random() * 0.4);
            const type = getEndlessCelestialType(
              sz,
              state.player.targetRadius,
              playerLevel,
              baseColor + (r + c) * 12,
            );
            state.objects.push(
              createObj(
                cx + (c - dims / 2) * spacing,
                cy + (r - dims / 2) * spacing,
                sz,
                baseColor + (r + c) * 12,
                type,
                rng,
                getStartRad(sz),
              ),
            );
          }
        }
      } else {
        const count = 8 + Math.floor(Math.random() * 10);
        let currentAngle = Math.random() * Math.PI * 2;
        const curveDir = (Math.random() - 0.5) * 0.4;
        let px = cx;
        let py = cy;
        for (let i = 0; i < count; i++) {
          const type = getEndlessCelestialType(
            baseObjRadius,
            state.player.targetRadius,
            playerLevel,
            baseColor + i * 5,
          );
          state.objects.push(
            createObj(
              px,
              py,
              baseObjRadius,
              baseColor + i * 5,
              type,
              rng,
              getStartRad(baseObjRadius),
            ),
          );
          currentAngle += curveDir;
          px += Math.cos(currentAngle) * (baseObjRadius * 2.5);
          py += Math.sin(currentAngle) * (baseObjRadius * 2.5);
        }
      }
    };

    const initGoalsStage = (state: GameState) => {
      state.goalsWon = false;
      state.winTimer = 0;
      state.objects = [];
      state.player.x = 0;
      state.player.y = 0;
      state.player.vx = 0;
      state.player.vy = 0;

      state.player.radius = 20;
      state.player.targetRadius = 20;

      localStorage.setItem(
        "endlessSwarm_goalsStage",
        state.goalsStage.toString(),
      );
      const levelSeed = 1337 + state.goalsStage * 9991;
      const rng = mulberry32(levelSeed);

      const patternType = state.goalsStage % 4;
      const cx = 0;
      const cy = 0;
      const baseColor = rng() * 360;

      let maxRadius = 0;
      const baseCount = 50 + state.goalsStage * 30;
      const count = Math.min(baseCount, 1500);

      const maxObjRadius = 30 * Math.pow(1.5, state.goalsStage);
      const areaRadius = Math.sqrt(count) * 60 * (1 + state.goalsStage * 0.1);
      maxRadius = areaRadius;

      if (patternType === 0) {
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const a = i * 0.5;
          const r = a * (areaRadius / (count * 0.5));
          const sizeRng = Math.pow(rng(), 3);
          const size = 5 + sizeRng * maxObjRadius * (0.1 + r / areaRadius);
          const cType = getCelestialType(size);
          state.objects.push(
            createObj(
              cx + Math.cos(a) * r,
              cy + Math.sin(a) * r,
              size,
              baseColor - i * 2,
              cType,
              rng,
            ),
          );
        }
      } else if (patternType === 1) {
        for (let i = 0; i < count; i++) {
          const a = rng() * Math.PI * 2;
          const rSq = rng();
          const r = Math.sqrt(rSq) * areaRadius;
          const sizeRng = Math.pow(rng(), 3);
          const size = 5 + sizeRng * maxObjRadius;
          const cType = getCelestialType(size);
          state.objects.push(
            createObj(
              cx + Math.cos(a) * r,
              cy + Math.sin(a) * r,
              size,
              baseColor + rng() * 60,
              cType,
              rng,
            ),
          );
        }
      } else if (patternType === 2) {
        const points = 3 + Math.floor(rng() * 4);
        for (let i = 0; i < count; i++) {
          const p = Math.floor(rng() * points);
          const aBase = (p / points) * Math.PI * 2;
          const a = aBase + (rng() - 0.5) * 0.4;
          const rSq = rng();
          const r = Math.sqrt(rSq) * areaRadius;
          const sizeRng = Math.pow(rng(), 3);
          const size = 5 + sizeRng * maxObjRadius * (0.2 + r / areaRadius);
          const cType = getCelestialType(size);
          state.objects.push(
            createObj(
              cx + Math.cos(a) * r,
              cy + Math.sin(a) * r,
              size,
              baseColor + p * 20,
              cType,
              rng,
            ),
          );
        }
      } else {
        for (let i = 0; i < count; i++) {
          const x = (rng() - 0.5) * 2 * areaRadius;
          const y = (rng() - 0.5) * 2 * areaRadius;
          const dist = Math.hypot(x, y);
          if (dist > areaRadius) {
            i--;
            continue;
          }
          const sizeRng = Math.pow(rng(), 3);
          const size = 5 + sizeRng * maxObjRadius;
          const cType = getCelestialType(size);
          state.objects.push(
            createObj(
              cx + x,
              cy + y,
              size,
              baseColor + (x + y) * 0.01,
              cType,
              rng,
            ),
          );
        }
      }

      for (const o of state.objects) {
        const d = Math.hypot(o.x, o.y);
        if (d < 250) {
          o.originalRadius = Math.min(o.originalRadius, 15);
          o.radius = o.originalRadius;
          o.celestialType = getCelestialType(o.originalRadius);
        }
      }

      state.zoneRadius = areaRadius + 200;
    };

    if (stateRef.current.mode === "endless") {
      while (stateRef.current.objects.length < 250) {
        spawnEndlessPattern(stateRef.current, true);
      }
    } else {
      initGoalsStage(stateRef.current);
    }

    const drawGrid = (
      ctx: CanvasRenderingContext2D,
      state: GameState,
      w: number,
      h: number,
    ) => {
      const { cameraScale, player } = state;
      const v = Math.log2(1 / cameraScale);
      const baseLvl = Math.floor(v);
      const fract = v - baseLvl;

      const drawOctave = (offsetLvl: number, alphaMult: number) => {
        const spacing = 40 * Math.pow(2, baseLvl + offsetLvl);
        let alpha = 1;
        if (offsetLvl === 0) alpha = 1 - fract;
        if (offsetLvl === 2) alpha = fract;
        alpha *= alphaMult;

        if (alpha <= 0.01) return;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        const dotSize = 2 / cameraScale;

        const hw = w / 2 / cameraScale;
        const startX = player.x - hw;
        const endX = player.x + hw;
        const startY = player.y - (h * 0.7) / cameraScale;
        const endY = player.y + (h * 0.3) / cameraScale;

        const offX = ((startX % spacing) + spacing) % spacing;
        const offY = ((startY % spacing) + spacing) % spacing;

        const startDrawX = startX - offX;
        const startDrawY = startY - offY;

        ctx.beginPath();
        for (let x = startDrawX; x <= endX; x += spacing) {
          for (let y = startDrawY; y <= endY; y += spacing) {
            ctx.moveTo(x + dotSize, y);
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      };

      drawOctave(0, 0.15);
      drawOctave(1, 0.15);
      drawOctave(2, 0.15);
    };

    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (time: DOMHighResTimeStamp) => {
      const state = stateRef.current;
      const { player, objects, joystick, keys } = state;

      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const timeScale = dt > 0 ? Math.min(dt * 60, 3) : 1;

      const level = Math.floor(
        Math.log2(Math.max(1, player.targetRadius / 20)),
      );

      if (state.mode === "endless") {
        const cycleLength = 9;
        const mappedLevel = level % cycleLength;
        if (mappedLevel !== state.level) {
          state.level = mappedLevel;
          state.levelUpTextTimer = 60;
        }
        state.rebirthCount = Math.floor(level / cycleLength);
      } else {
        if (level > state.level) {
          state.level = level;
          state.levelUpTextTimer = 60;
        }
      }

      const milestone = Math.pow(2, level);
      state.targetCameraScale = 3 / milestone;
      state.cameraScale +=
        (state.targetCameraScale - state.cameraScale) * 0.05 * timeScale;
      player.radius += (player.targetRadius - player.radius) * 0.05 * timeScale;

      let moveDX = joystick.dirX;
      let moveDY = joystick.dirY;

      if (!joystick.active) {
        let kdx = 0;
        let kdy = 0;
        if (keys["ArrowUp"] || keys["w"] || keys["W"]) kdy -= 1;
        if (keys["ArrowDown"] || keys["s"] || keys["S"]) kdy += 1;
        if (keys["ArrowLeft"] || keys["a"] || keys["A"]) kdx -= 1;
        if (keys["ArrowRight"] || keys["d"] || keys["D"]) kdx += 1;

        const kmag = Math.hypot(kdx, kdy);
        if (kmag > 0) {
          moveDX = kdx / kmag;
          moveDY = kdy / kmag;
        }
      }

      const dirMag = Math.hypot(moveDX, moveDY);
      const mag = Math.min(dirMag, 1);

      const accelScreen = 0.6;
      const maxSpeedScreen = 6.0;
      const friction = 0.92;

      const accelWorld = (accelScreen * mag) / state.cameraScale;
      const maxSpeedWorld = maxSpeedScreen / state.cameraScale;

      if (!state.goalsWon && mag > 0) {
        player.vx += (moveDX / dirMag) * accelWorld * timeScale;
        player.vy += (moveDY / dirMag) * accelWorld * timeScale;
      }

      player.vx *= Math.pow(friction, timeScale);
      player.vy *= Math.pow(friction, timeScale);

      const currentSpeed = Math.hypot(player.vx, player.vy);
      if (currentSpeed > maxSpeedWorld) {
        player.vx = (player.vx / currentSpeed) * maxSpeedWorld;
        player.vy = (player.vy / currentSpeed) * maxSpeedWorld;
      }

      if (state.goalsWon) {
        player.vx = 0;
        player.vy = 0;
      } else {
        player.x += player.vx * timeScale;
        player.y += player.vy * timeScale;
      }

      // Physics & Interactions
      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];

        if (!obj.falling) {
          obj.radius += (obj.originalRadius - obj.radius) * 0.1 * timeScale;
          const d = Math.hypot(obj.x - player.x, obj.y - player.y);
          if (
            obj.radius < player.radius &&
            d < player.radius - obj.radius * 0.2
          ) {
            obj.falling = true;
          }
        }

        if (obj.falling) {
          const dX = player.x - obj.x;
          const dY = player.y - obj.y;
          const d = Math.hypot(dX, dY);

          if (d > 0) {
            const pullSpeed =
              Math.max(obj.originalRadius * 0.4, player.radius * 0.1) *
              timeScale;
            obj.x += (dX / d) * pullSpeed;
            obj.y += (dY / d) * pullSpeed;
          }

          obj.radius *= Math.pow(0.85, timeScale);
          obj.angle += obj.spin * 4 * timeScale;

          if (obj.radius < 0.5) {
            obj.eaten = true;
            const currentArea = player.targetRadius ** 2;
            const objArea = obj.originalRadius ** 2;
            player.targetRadius = Math.sqrt(currentArea + objArea * 0.15);
          }
        } else {
          obj.angle += obj.spin * timeScale;
        }
      }

      // Cleanup eaten and too-far objects
      const viewHWidth = width / 2 / state.cameraScale;
      const viewHHeight = (height * 0.7) / state.cameraScale;
      const viewRadius = Math.hypot(viewHWidth, viewHHeight);

      state.objects = objects.filter((obj) => {
        if (obj.eaten) return false;

        // Dynamic Garbage Collector: Dispose of anything 5+ tiers behind the player
        // to prevent microscopic asteroid noise and keep coordinates pristine.
        const playerCumulativeLevel = Math.floor(
          Math.log2(Math.max(1, player.targetRadius / 20)),
        );
        const objCumulativeLevel = Math.floor(
          Math.log2(Math.max(1, obj.originalRadius / 20)),
        );
        if (objCumulativeLevel < playerCumulativeLevel - 5) {
          return false;
        }

        if (state.mode === "endless") {
          if (obj.originalRadius < player.radius * 0.012) {
            return false;
          }
          const d = Math.hypot(obj.x - player.x, obj.y - player.y);
          return d < viewRadius * 4;
        }
        return true;
      });

      if (state.mode === "endless") {
        while (state.objects.length < 250) {
          spawnEndlessPattern(state, false);
        }
      } else {
        if (state.objects.length === 0 && !state.goalsWon) {
          state.goalsWon = true;
          state.winTimer = 240; // ~4 seconds at 60fps
          state.winWord = winWords[Math.floor(Math.random() * winWords.length)];
        }

        if (state.goalsWon) {
          state.winTimer -= timeScale;
          if (state.winTimer <= 0) {
            state.goalsStage++;
            initGoalsStage(state);
          }
        }
      }

      // ---- RENDER WORLD ----
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(width / 2, height * 0.7);
      ctx.scale(state.cameraScale, state.cameraScale);
      ctx.translate(-player.x, -player.y);

      // Draw Grid
      drawGrid(ctx, state, width, height);

      // Draw Goal Zone Background Mode
      if (state.mode === "goals") {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, state.zoneRadius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.015)";
        ctx.fill();
        ctx.strokeStyle = "rgba(56, 189, 248, 0.2)";
        ctx.lineWidth = 10 / state.cameraScale;
        ctx.stroke();
        ctx.restore();
      }

      // Draw Player / Black Hole (Underneath)
      ctx.save();
      const pr = Math.max(0.1, player.radius);
      ctx.translate(player.x, player.y);

      // 1. Soft gravitational lensing background glow
      const accGrad = ctx.createRadialGradient(0, 0, pr * 0.8, 0, 0, pr * 1.8);
      accGrad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
      accGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.08)");
      accGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = accGrad;
      ctx.beginPath();
      ctx.arc(0, 0, pr * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 2. Swirling accretion particles drawing matter into the event horizon (fast and extremely lightweight)
      const diskParticles = 40;
      for (let i = 0; i < diskParticles; i++) {
        const pRng = mulberry32(12345 + i * 543);
        const randRadiusFactor = pRng();
        const randAngleOffset = pRng() * Math.PI * 2;
        const speedMultiplier = 0.5 + pRng() * 1.5;

        // Matter spirals from outer limit down to the event horizon edge
        const t =
          ((lastTime / 1000) * 0.25 * speedMultiplier + randRadiusFactor) % 1.0;
        const minR = pr * 0.95;
        const maxR = pr * 1.7;
        const r = maxR - t * (maxR - minR);

        // Speeds up closer to the black hole (t increases as it falls in)
        const orbitalAngle =
          randAngleOffset - (lastTime / 1000) * 1.5 * speedMultiplier - t * 4.5;

        const pX = Math.cos(orbitalAngle) * r;
        const pY = Math.sin(orbitalAngle) * r;

        // Sparkle size (fades slightly as it crosses outer/inner gates)
        const pSize = Math.max(0.4, pr * 0.045 * (1.1 - t * 0.4));

        // Bloom/glow
        ctx.beginPath();
        ctx.arc(pX, pY, pSize * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.25 * (1.0 - t * 0.7)})`;
        ctx.fill();

        // White core with transparency
        ctx.beginPath();
        ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1.0 - t * 0.5)})`;
        ctx.fill();
      }

      // 3. Black sphere of event horizon (completely captures all light)
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.fill();

      // 4. Photonic boundary outline (light bending lens rim)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = Math.max(0.8 / state.cameraScale, pr * 0.04);
      ctx.stroke();
      ctx.restore();

      // Pre-calculate visible viewport world bounds for high-performance frustum culling
      const viewHalfWidth = width / 2 / state.cameraScale;
      const viewYOffsetTop = (height * 0.7) / state.cameraScale;
      const viewYOffsetBottom = (height * 0.3) / state.cameraScale;

      const visibleLeft = player.x - viewHalfWidth;
      const visibleRight = player.x + viewHalfWidth;
      const visibleTop = player.y - viewYOffsetTop;
      const visibleBottom = player.y + viewYOffsetBottom;

      // Draw Objects
      for (const obj of state.objects) {
        const objDrawRadius = Math.max(0.1, obj.radius);

        // Frustum Culling / Viewport clipping constraint:
        // Skip drawing entirely if the object boundary is fully outside the visible screen.
        // This stops CPU and GPU cycles from being wasted on off-screen transformations.
        const cullingMargin = objDrawRadius * 3; // Allow extra room for massive halos and planetary systems
        const isVisible =
          obj.x + cullingMargin >= visibleLeft &&
          obj.x - cullingMargin <= visibleRight &&
          obj.y + cullingMargin >= visibleTop &&
          obj.y - cullingMargin <= visibleBottom;
        if (!isVisible) continue;

        ctx.fillStyle = obj.color;
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.angle);

        const totalDrawEchoes = obj.falling ? 3 : 1;
        const baseAlpha = obj.falling
          ? Math.max(0, obj.radius / obj.originalRadius)
          : 1.0;

        for (let echoIdx = 0; echoIdx < totalDrawEchoes; echoIdx++) {
          ctx.save();
          ctx.globalAlpha = baseAlpha * Math.pow(0.55, echoIdx);

          if (obj.falling && echoIdx > 0) {
            const scaleVal = 1.0 - echoIdx * 0.28;
            ctx.scale(scaleVal, scaleVal);
            ctx.rotate(echoIdx * lastTime * 0.006);
          }

          const rng = mulberry32(obj.seed);

          if (obj.celestialType === "dust") {
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fill();
          } else if (obj.celestialType === "asteroid") {
            ctx.beginPath();
            const pCount = 7 + Math.floor(rng() * 5);
            for (let p = 0; p < pCount; p++) {
              const angle = (p / pCount) * Math.PI * 2;
              const r = objDrawRadius * (0.7 + rng() * 0.3);
              if (p === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
              else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fillStyle = obj.color;
            ctx.fill();
            ctx.lineWidth = Math.max(
              1 / state.cameraScale,
              objDrawRadius * 0.1,
            );
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.stroke();
          } else if (obj.celestialType === "planet") {
            const grad = ctx.createLinearGradient(
              -objDrawRadius,
              -objDrawRadius,
              objDrawRadius,
              objDrawRadius,
            );
            grad.addColorStop(0, obj.color);
            grad.addColorStop(1, "rgba(0,0,0,0.8)");

            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            const atm = ctx.createRadialGradient(
              0,
              0,
              objDrawRadius * 0.9,
              0,
              0,
              objDrawRadius * 1.2,
            );
            atm.addColorStop(
              0,
              obj.color.replace("hsl", "hsla").replace(")", ", 0.5)"),
            );
            atm.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = atm;
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius * 1.2, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.celestialType === "star") {
            const grad = ctx.createRadialGradient(
              0,
              0,
              objDrawRadius * 0.1,
              0,
              0,
              objDrawRadius * 1.5,
            );
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.2, obj.color);
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (obj.celestialType === "system") {
            const sgrad = ctx.createRadialGradient(
              0,
              0,
              objDrawRadius * 0.05,
              0,
              0,
              objDrawRadius * 0.3,
            );
            sgrad.addColorStop(0, "#ffffff");
            sgrad.addColorStop(0.5, obj.color);
            sgrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = sgrad;
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            const planetCount = 2 + Math.floor(rng() * 4);
            for (let i = 0; i < planetCount; i++) {
              const pDist = objDrawRadius * (0.4 + (i / planetCount) * 0.6);
              ctx.beginPath();
              ctx.arc(0, 0, pDist, 0, Math.PI * 2);
              ctx.strokeStyle = "rgba(255,255,255,0.1)";
              ctx.lineWidth = Math.max(
                0.5 / state.cameraScale,
                objDrawRadius * 0.01,
              );
              ctx.stroke();

              const pSize = Math.max(
                0.1,
                objDrawRadius * (0.04 + rng() * 0.04),
              );
              const pAngle =
                rng() * Math.PI * 2 + (lastTime / 1000) * (1 / (i + 1));
              ctx.beginPath();
              ctx.arc(
                Math.cos(pAngle) * pDist,
                Math.sin(pAngle) * pDist,
                pSize,
                0,
                Math.PI * 2,
              );
              ctx.fillStyle = `hsl(${rng() * 360}, 80%, 65%)`;
              ctx.fill();
            }
          } else if (obj.celestialType === "galaxy") {
            const arms = 2 + Math.floor(rng() * 3);
            const spinRate = rng() > 0.5 ? 1 : -1;
            // Gentle galaxy rotation
            const rot = rng() * Math.PI * 2 + (lastTime / 3000) * spinRate;
            ctx.rotate(rot);

            // Core glowing bulge
            const galGrad = ctx.createRadialGradient(
              0,
              0,
              0,
              0,
              0,
              objDrawRadius * 0.3,
            );
            galGrad.addColorStop(0, "#ffffff");
            galGrad.addColorStop(
              0.4,
              obj.color.replace("hsl", "hsla").replace(")", ", 0.7)"),
            );
            galGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = galGrad;
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Dynamic flowing spiral sparkles (smooth, memory-less particles)
            const starsPerArm = 16;
            for (let a = 0; a < arms; a++) {
              const baseAngle = (a / arms) * Math.PI * 2;
              for (let s = 0; s < starsPerArm; s++) {
                const tInit = s / starsPerArm;
                // Outward flowing particles along arm spiral paths
                const speed = 0.08;
                const t = (tInit + (lastTime / 1000) * speed) % 1.0;
                const dist = t * objDrawRadius;
                const spiralWrap = 3.5;
                const angle = baseAngle + t * spiralWrap;

                // Seed logic for micro-jitter
                const starSeed = obj.seed + a * 1000 + s * 17;
                const sRng = mulberry32(starSeed);
                const jitterX = (sRng() - 0.5) * objDrawRadius * 0.07;
                const jitterY = (sRng() - 0.5) * objDrawRadius * 0.07;

                const pX = Math.cos(angle) * dist + jitterX;
                const pY = Math.sin(angle) * dist + jitterY;

                // Size & glittering flicker
                const flicker =
                  0.4 + 0.6 * Math.sin(lastTime * 0.008 + sRng() * 100);
                const pSize = Math.max(
                  0.4,
                  objDrawRadius *
                    0.025 *
                    (1.2 - t * 0.5) *
                    (0.6 + sRng() * 0.8),
                );

                ctx.beginPath();
                ctx.arc(pX, pY, pSize * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = obj.color
                  .replace("hsl", "hsla")
                  .replace(")", `, ${0.45 * flicker * (1.0 - t * 0.4)})`);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(pX, pY, pSize * 0.9, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.95)";
                ctx.fill();
              }
            }
          } else if (obj.celestialType === "pulsar") {
            // Central ultra-glowing neutron star core
            const grad = ctx.createRadialGradient(
              0,
              0,
              objDrawRadius * 0.05,
              0,
              0,
              objDrawRadius * 1.5,
            );
            grad.addColorStop(0, "#ffffff");
            grad.addColorStop(0.2, obj.color);
            grad.addColorStop(0.5, "#60a5fa");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Magnetic Poles / Jet stream spins rapidly
            const baseAngle =
              Math.abs(obj.x * 2.71 + obj.y * 3.14) % (Math.PI * 2);
            const precession = Math.sin(lastTime * 0.003) * 0.05;
            const jetAngle = baseAngle + precession;
            ctx.save();
            ctx.rotate(jetAngle);

            // Draw two opposing beaming cones of light representing gamma rays
            // Utilizing a very soft linear gradient that fades completely into the dark space and eliminates hard edges
            const coneGradRight = ctx.createLinearGradient(
              0,
              0,
              objDrawRadius * 2.5,
              0,
            );
            coneGradRight.addColorStop(0, "rgba(186, 230, 253, 0.08)");
            coneGradRight.addColorStop(0.4, "rgba(96, 165, 250, 0.03)");
            coneGradRight.addColorStop(1, "rgba(0, 0, 0, 0)");

            const coneGradLeft = ctx.createLinearGradient(
              0,
              0,
              -objDrawRadius * 2.5,
              0,
            );
            coneGradLeft.addColorStop(0, "rgba(186, 230, 253, 0.08)");
            coneGradLeft.addColorStop(0.4, "rgba(96, 165, 250, 0.03)");
            coneGradLeft.addColorStop(1, "rgba(0, 0, 0, 0)");

            ctx.save();
            ctx.fillStyle = coneGradLeft;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-objDrawRadius * 2.5, -objDrawRadius * 0.45);
            ctx.lineTo(-objDrawRadius * 2.5, objDrawRadius * 0.45);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = coneGradRight;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(objDrawRadius * 2.5, -objDrawRadius * 0.45);
            ctx.lineTo(objDrawRadius * 2.5, objDrawRadius * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            // Dynamic flowing particle-based jet stream
            const particleCount = 9;
            for (let i = 0; i < particleCount; i++) {
              // Clean flowing progress from 0 (core exit) to 1 (outer boundary)
              const flowProgress = (lastTime * 0.002 + i / particleCount) % 1;
              const dist = (0.12 + flowProgress * 2.7) * objDrawRadius;

              // High-energy helical/spiral oscillation
              const spiralFreq = 10;
              const yOffset =
                Math.sin(flowProgress * spiralFreq - lastTime * 0.012) *
                (objDrawRadius * 0.08 * flowProgress);

              // Size and transparency tapering off smoothly toward the tips
              const pSize = Math.max(
                0.6,
                objDrawRadius * 0.05 * (1.2 - flowProgress * 0.6),
              );
              const opacity = (1.0 - flowProgress) * 0.45;

              // Particle Glow - Jet 1 (Positive direction)
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.beginPath();
              ctx.arc(dist, yOffset, pSize, 0, Math.PI * 2);
              ctx.fillStyle = "#ffffff";
              ctx.fill();

              // Blue/purple halo around the particle
              ctx.beginPath();
              ctx.arc(dist, yOffset, pSize * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(125, 211, 252, 0.18)";
              ctx.fill();
              ctx.restore();

              // Particle Glow - Jet 2 (Opposite negative direction)
              ctx.save();
              ctx.globalAlpha = opacity;
              ctx.beginPath();
              ctx.arc(-dist, -yOffset, pSize, 0, Math.PI * 2);
              ctx.fillStyle = "#ffffff";
              ctx.fill();

              // Blue/purple halo around the particle
              ctx.beginPath();
              ctx.arc(-dist, -yOffset, pSize * 2.2, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(125, 211, 252, 0.18)";
              ctx.fill();
              ctx.restore();
            }

            ctx.restore();
          } else if (obj.celestialType === "nebula") {
            // Interstellar dust cloud - multiple overlapping gaseous blobs
            for (let i = 0; i < 4; i++) {
              const blobX = (rng() - 0.5) * objDrawRadius * 0.8;
              const blobY = (rng() - 0.5) * objDrawRadius * 0.8;
              const blobR = objDrawRadius * (0.6 + rng() * 0.6);

              const nebGrad = ctx.createRadialGradient(
                blobX,
                blobY,
                0,
                blobX,
                blobY,
                blobR,
              );
              // Cycle through pink / purple / blue overlays based on color hue
              const hueMatch = obj.color.match(/\d+/);
              const hue =
                (parseInt(hueMatch ? hueMatch[0] : "0") + i * 40) % 360;
              nebGrad.addColorStop(0, `hsla(${hue}, 85%, 50%, 0.15)`);
              nebGrad.addColorStop(0.5, `hsla(${hue}, 70%, 40%, 0.05)`);
              nebGrad.addColorStop(1, "rgba(0,0,0,0)");

              ctx.fillStyle = nebGrad;
              ctx.beginPath();
              ctx.arc(blobX, blobY, blobR, 0, Math.PI * 2);
              ctx.fill();
            }

            // Glowing proto-stars incubating deep inside
            for (let i = 0; i < 3; i++) {
              const starX = (rng() - 0.5) * objDrawRadius * 0.6;
              const starY = (rng() - 0.5) * objDrawRadius * 0.6;
              const starSize = Math.max(1, objDrawRadius * 0.04);
              ctx.beginPath();
              ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
              ctx.fill();
            }
          } else if (obj.celestialType === "darkhole") {
            // A dwarf alternative black hole with a local swirling accretion disk
            const accretionR = objDrawRadius * 1.6;
            const diskGrad = ctx.createRadialGradient(
              0,
              0,
              objDrawRadius * 0.9,
              0,
              0,
              accretionR,
            );
            diskGrad.addColorStop(0, "#f97316"); // Fiery orange accretion inner rim
            diskGrad.addColorStop(0.4, obj.color); // Deep primary color match
            diskGrad.addColorStop(1, "rgba(0,0,0,0)");

            ctx.fillStyle = diskGrad;
            ctx.beginPath();
            ctx.arc(0, 0, accretionR, 0, Math.PI * 2);
            ctx.fill();

            // Black void core
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#111827";
            ctx.fill();

            // White photon ring outline
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = Math.max(0.5, objDrawRadius * 0.05);
            ctx.beginPath();
            ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          ctx.restore(); // Restore echo save
        } // End echoIdx loop

        ctx.restore(); // Restore translate save
      }

      ctx.restore(); // Restore from world translation

      // ---- RENDER UI ----

      // Pointer back to zone
      if (state.mode === "goals" && !state.goalsWon) {
        const dx = 0 - player.x;
        const dy = 0 - player.y;
        const distToCenter = Math.hypot(dx, dy);

        if (distToCenter > state.zoneRadius) {
          const cx = width / 2;
          const cy = height * 0.7;
          const dirX = dx / distToCenter;
          const dirY = dy / distToCenter;

          const padding = 60;
          const tX =
            dirX !== 0
              ? ((dirX > 0 ? width - padding : padding) - cx) / dirX
              : Infinity;
          const tY =
            dirY !== 0
              ? ((dirY > 0 ? height - padding : padding) - cy) / dirY
              : Infinity;
          const t = Math.min(tX, tY);

          const ptrX = cx + dirX * Math.abs(t);
          const ptrY = cy + dirY * Math.abs(t);

          ctx.save();
          ctx.translate(ptrX, ptrY);
          ctx.rotate(Math.atan2(dirY, dirX));

          ctx.beginPath();
          ctx.moveTo(20, 0);
          ctx.lineTo(-15, 15);
          ctx.lineTo(-5, 0);
          ctx.lineTo(-15, -15);
          ctx.closePath();
          ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
          ctx.shadowColor = "rgba(56, 189, 248, 1)";
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.restore();
        }
      }

      // Offscreen edible indicators for BOTH Endless & Goals modes (with 10% transparency as requested)
      if (state.mode === "endless" || state.mode === "goals") {
        const borderPadding = 30;

        // Find visible bounds to identify truly offscreen items
        const halfWidth = width / 2 / state.cameraScale;
        const yOffsetTop = (height * 0.7) / state.cameraScale;
        const yOffsetBottom = (height * 0.3) / state.cameraScale;

        const visibleLeft = player.x - halfWidth;
        const visibleRight = player.x + halfWidth;
        const visibleTop = player.y - yOffsetTop;
        const visibleBottom = player.y + yOffsetBottom;

        // Collect candidates
        const candidates: {
          obj: GameObject;
          dist: number;
          screenX: number;
          screenY: number;
        }[] = [];

        for (const obj of state.objects) {
          if (obj.falling || obj.eaten) continue;

          // Point only to consumable items that are substantial food sources (original radius is >= 10% of player target radius)
          if (
            obj.radius < player.radius &&
            obj.originalRadius >= player.radius * 0.1
          ) {
            // Check if off-screen (with a minor padding margin to handle border exit smoothly)
            if (
              obj.x < visibleLeft - 20 ||
              obj.x > visibleRight + 20 ||
              obj.y < visibleTop - 20 ||
              obj.y > visibleBottom + 20
            ) {
              const dX = obj.x - player.x;
              const dY = obj.y - player.y;
              const dist = Math.hypot(dX, dY);

              const screenX = width / 2 + dX * state.cameraScale;
              const screenY = height * 0.7 + dY * state.cameraScale;

              candidates.push({ obj, dist, screenX, screenY });
            }
          }
        }

        // Sort candidates by distance so we prioritize the closest, most attainable meals
        candidates.sort((a, b) => a.dist - b.dist);

        // Limit to top 12 nearest indicators to prevent overhead and screen edge clutter
        const indicatorsToDraw = candidates.slice(0, 12);

        ctx.save();
        for (const cand of indicatorsToDraw) {
          const { obj, screenX, screenY } = cand;

          const rx = screenX - width / 2;
          const ry = screenY - height * 0.7;
          const dist = Math.hypot(rx, ry);

          if (dist > 0) {
            const dx = rx / dist;
            const dy = ry / dist;

            // Map direction to screen border
            const tx =
              dx !== 0
                ? ((dx > 0 ? width - borderPadding : borderPadding) -
                    width / 2) /
                  dx
                : Infinity;
            const ty =
              dy !== 0
                ? ((dy > 0 ? height - borderPadding : borderPadding) -
                    height * 0.7) /
                  dy
                : Infinity;
            const t = Math.min(tx, ty);

            const px = width / 2 + dx * Math.abs(t);
            const py = height * 0.7 + dy * Math.abs(t);

            // Draw a faint 10% opacity indicator
            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(Math.atan2(dy, dx));

            // Caret shape
            ctx.beginPath();
            ctx.moveTo(8, 0);
            ctx.lineTo(-6, 5);
            ctx.lineTo(-3, 0);
            ctx.lineTo(-6, -5);
            ctx.closePath();
            ctx.fillStyle = obj.color;
            ctx.globalAlpha = 0.1; // Exactly 10% transparency as requested!
            ctx.fill();

            // Tiny helper dot behind the caret
            ctx.beginPath();
            ctx.arc(-8, 0, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
        ctx.restore();
      }

      // Draw Supernova / Rebirth White-out flash overlay
      if (state.showRebirthFlash > 0) {
        state.showRebirthFlash -= timeScale;
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, state.showRebirthFlash / 60)})`;
        ctx.fillRect(0, 0, width, height);

        // Draw big epic galactic announcement text
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = `rgba(14, 165, 233, ${Math.min(1.0, state.showRebirthFlash / 60)})`;
        ctx.font = "bold 36px monospace";
        ctx.shadowColor = "rgba(56, 189, 248, 0.4)";
        ctx.shadowBlur = 10;
        ctx.fillText("BIG CRUNCH • BRAND NEW ERA", width / 2, height / 2);
        ctx.restore();
      }

      if (state.levelUpTextTimer > 0) {
        state.levelUpTextTimer -= timeScale;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const alpha = Math.min(1, state.levelUpTextTimer / 20);
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        ctx.font = "bold 48px monospace";
        ctx.shadowColor = "rgba(56, 189, 248, 1)";
        ctx.shadowBlur = 10;
        ctx.fillText(
          "EVOLVED",
          width / 2,
          height / 2 - 100 - (60 - state.levelUpTextTimer),
        );
        ctx.restore();
      }

      if (state.mode === "goals" && state.goalsWon) {
        ctx.save();
        const winProgress = 1 - state.winTimer / 240; // 0 to 1

        ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.7, winProgress * 2)})`;
        ctx.fillRect(0, 0, width, height);

        ctx.translate(width / 2, height / 2);

        const wordScale = Math.min(1, winProgress * 4);
        ctx.scale(wordScale, wordScale);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 64px monospace";
        ctx.shadowColor = "#eab308";
        ctx.shadowBlur = 30;
        ctx.fillText(state.winWord, 0, 0);

        // 5 Stars
        for (let s = 0; s < 5; s++) {
          const starStartProgress = 0.2 + s * 0.1;
          if (winProgress > starStartProgress) {
            const starP = Math.min(1, (winProgress - starStartProgress) * 5);
            const size = starP + Math.sin(starP * Math.PI) * 0.5;
            ctx.save();
            const sx = (s - 2) * 100;
            const sy = 80 - Math.abs(s - 2) * 20;
            ctx.translate(sx, sy);
            ctx.scale(size, size);

            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
              const r = i % 2 === 0 ? 30 : 12;
              const a = (i * Math.PI) / 5 - Math.PI / 2;
              ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fillStyle = "#fbbf24";
            ctx.fill();
            ctx.restore();
          }
        }
        ctx.restore();
      }

      if (joystick.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(joystick.baseX, joystick.baseY, 50, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(joystick.knobX, joystick.knobY, 20, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.fill();
        ctx.restore();
      }

      // Update DOM UI
      if (massDisplayRef.current) {
        massDisplayRef.current.innerText = formatMass(player.targetRadius ** 2);
      }
      if (
        tierDisplayRef.current &&
        tierDisplayRef.current.innerText !== state.level.toString()
      ) {
        tierDisplayRef.current.innerText = state.level.toString();
      }
      if (eraDisplayRef.current && state.mode === "endless") {
        const currentEra = "ERA " + (state.rebirthCount + 1);
        if (eraDisplayRef.current.innerText !== currentEra) {
          eraDisplayRef.current.innerText = currentEra;
        }
      }
      if (sectorDisplayRef.current && state.mode === "goals") {
        const currentSector = (state.goalsStage + 1).toString();
        if (sectorDisplayRef.current.innerText !== currentSector) {
          sectorDisplayRef.current.innerText = currentSector;
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [mode]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="block w-full h-full touch-none" />

      {/* HUD overlay */}
      <div className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-2 text-white font-mono text-xl font-bold tracking-widest drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
          <span className="text-white/40 text-[10px] tracking-[0.15em] font-sans font-black pr-1">
            MASS
          </span>
          <span ref={massDisplayRef}>400</span>
        </div>
        {mode === "goals" && (
          <h2 className="text-white/30 text-[10px] font-sans font-black tracking-[0.2em] uppercase">
            Sector{" "}
            <span ref={sectorDisplayRef}>
              {stateRef.current.goalsStage + 1}
            </span>
          </h2>
        )}
      </div>

      {/* Bottom HUD bar */}
      <div className="pointer-events-none absolute bottom-8 left-8 right-8 flex items-end justify-between font-mono">
        {/* Left Side: Era */}
        <div className="flex flex-col items-start bg-slate-950/20 backdrop-blur-[2px] p-2 px-3 rounded border border-white/5">
          <span className="text-white/30 text-[9px] font-sans font-extrabold tracking-[0.2em] mb-0.5">
            SYSTEM TIME / PHASE
          </span>
          {mode === "endless" ? (
            <span
              ref={eraDisplayRef}
              className="text-sky-400 font-extrabold text-sm tracking-wider"
            >
              ERA 1
            </span>
          ) : (
            <span className="text-emerald-400 font-extrabold text-sm tracking-wider">
              CAMPAIGN
            </span>
          )}
        </div>

        {/* Right Side: Tier */}
        <div className="flex flex-col items-end bg-slate-950/20 backdrop-blur-[2px] p-2 px-3 rounded border border-white/5">
          <span className="text-white/30 text-[9px] font-sans font-extrabold tracking-[0.2em] mb-0.5">
            CELESTIAL SCALE
          </span>
          <div className="flex items-baseline gap-1 text-white text-sm font-extrabold tracking-wider">
            <span className="text-white/50 text-[10px]">TIER</span>
            <span ref={tierDisplayRef} className="text-white">
              0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
