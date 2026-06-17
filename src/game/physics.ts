import { GameState } from "./types";
import { spawnEndlessPattern, initGoalsStage } from "./spawning";
import { winWords } from "./utils";

export const updatePhysics = (
  state: GameState,
  timeScale: number,
  width: number,
  height: number,
) => {
  const { player, objects, joystick, keys } = state;

  const level = Math.floor(Math.log2(Math.max(1, player.targetRadius / 20)));

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
    (state.targetCameraScale - state.cameraScale) * (1 - Math.pow(0.95, timeScale));
  player.radius += (player.targetRadius - player.radius) * (1 - Math.pow(0.95, timeScale));

  let moveDX = joystick.dirX;
  let moveDY = joystick.dirY;

  if (!joystick.active) {
    let kdx = 0;
    let kdy = 0;
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) kdy -= 1;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) kdy += 1;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) kdx -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) kdx += 1;

    const kmag = Math.sqrt(kdx * kdx + kdy * kdy);
    if (kmag > 0) {
      moveDX = kdx / kmag;
      moveDY = kdy / kmag;
    }
  }

  const dirMag = Math.sqrt(moveDX * moveDX + moveDY * moveDY);
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

  const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
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
      obj.radius += (obj.originalRadius - obj.radius) * (1 - Math.pow(0.9, timeScale));
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dSq = dx * dx + dy * dy;
      const threshold = player.radius - obj.radius * 0.2;
      if (
        obj.radius < player.radius &&
        threshold > 0 &&
        dSq < threshold * threshold
      ) {
        obj.falling = true;
      }
    }

    if (obj.falling) {
      const dX = player.x - obj.x;
      const dY = player.y - obj.y;
      const d = Math.sqrt(dX * dX + dY * dY);

      if (d > 0) {
        const pullSpeed =
          Math.max(obj.originalRadius * 0.4, player.radius * 0.1) * timeScale;
        obj.x += (dX / d) * pullSpeed;
        obj.y += (dY / d) * pullSpeed;
      }

      obj.spin = (Math.sign(obj.spin) || 1) * Math.min(1.5, Math.abs(obj.spin) + 0.15 * timeScale);
      obj.radius *= Math.pow(0.92, timeScale);
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
  const viewRadius = Math.sqrt(
    viewHWidth * viewHWidth + viewHHeight * viewHHeight,
  );

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
      const dx = obj.x - player.x;
      const dy = obj.y - player.y;
      const dSq = dx * dx + dy * dy;
      const threshold = viewRadius * 4;
      return dSq < threshold * threshold;
    }
    return true;
  });

  if (state.mode === "endless") {
    while (state.objects.length < 250) {
      spawnEndlessPattern(state, width, height, false);
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
};

export const updateTimers = (state: GameState, timeScale: number) => {
  if (state.showRebirthFlash > 0) {
    state.showRebirthFlash -= timeScale;
  }
  if (state.levelUpTextTimer > 0) {
    state.levelUpTextTimer -= timeScale;
  }
};
