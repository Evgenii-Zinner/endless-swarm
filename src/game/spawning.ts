import { CelestialType, GameObject, GameState } from "./types";
import { getEndlessCelestialType, getCelestialType, mulberry32 } from "./utils";

export const createObj = (
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

export const spawnEndlessPattern = (
  state: GameState,
  width: number,
  height: number,
  allowInsideView = false
) => {
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

export const initGoalsStage = (state: GameState) => {
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
