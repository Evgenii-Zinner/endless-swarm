import { GameState } from "./types";
import { mulberry32 } from "./utils";
import {
  drawDust,
  drawAsteroid,
  drawPlanet,
  drawStar,
  drawSystem,
  drawGalaxy,
  drawPulsar,
  drawNebula,
  drawDarkhole,
} from "./celestial";
import {
  drawGoalPointer,
  drawOffscreenIndicators,
  drawOverlayText,
  drawWinScreen,
  drawJoystick,
} from "./ui";

export const drawGrid = (
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

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  lastTime: number,
) => {
  const { player, objects, joystick } = state;

  ctx.clearRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width / 2, height * 0.7);
  ctx.scale(state.cameraScale, state.cameraScale);
  ctx.translate(-player.x, -player.y);

  drawGrid(ctx, state, width, height);

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

  // Draw Player / Black Hole
  ctx.save();
  const pr = Math.max(0.1, player.radius);
  ctx.translate(player.x, player.y);

  const accGrad = ctx.createRadialGradient(0, 0, pr * 0.8, 0, 0, pr * 1.8);
  accGrad.addColorStop(0, "rgba(56, 189, 248, 0.2)");
  accGrad.addColorStop(0.3, "rgba(56, 189, 248, 0.08)");
  accGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = accGrad;
  ctx.beginPath();
  ctx.arc(0, 0, pr * 1.8, 0, Math.PI * 2);
  ctx.fill();

  const diskParticles = 40;
  for (let i = 0; i < diskParticles; i++) {
    const pRng = mulberry32(12345 + i * 543);
    const randRadiusFactor = pRng();
    const randAngleOffset = pRng() * Math.PI * 2;
    const speedMultiplier = 0.5 + pRng() * 1.5;

    const t =
      ((lastTime / 1000) * 0.25 * speedMultiplier + randRadiusFactor) % 1.0;
    const minR = pr * 0.95;
    const maxR = pr * 1.7;
    const r = maxR - t * (maxR - minR);

    const orbitalAngle =
      randAngleOffset - (lastTime / 1000) * 1.5 * speedMultiplier - t * 4.5;
    const pX = Math.cos(orbitalAngle) * r;
    const pY = Math.sin(orbitalAngle) * r;

    const pSize = Math.max(0.4, pr * 0.045 * (1.1 - t * 0.4));

    ctx.beginPath();
    ctx.arc(pX, pY, pSize * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.25 * (1.0 - t * 0.7)})`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pX, pY, pSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1.0 - t * 0.5)})`;
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(0, 0, pr, 0, Math.PI * 2);
  ctx.fillStyle = "#000000";
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
  ctx.lineWidth = Math.max(0.8 / state.cameraScale, pr * 0.04);
  ctx.stroke();
  ctx.restore();

  // Draw Objects
  const viewHalfWidth = width / 2 / state.cameraScale;
  const viewYOffsetTop = (height * 0.7) / state.cameraScale;
  const viewYOffsetBottom = (height * 0.3) / state.cameraScale;

  const visibleLeft = player.x - viewHalfWidth;
  const visibleRight = player.x + viewHalfWidth;
  const visibleTop = player.y - viewYOffsetTop;
  const visibleBottom = player.y + viewYOffsetBottom;

  for (const obj of objects) {
    const objDrawRadius = Math.max(0.1, obj.radius);
    const cullingMargin = objDrawRadius * 3;

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
    const isEdible = obj.originalRadius < player.radius;
    let baseAlpha = obj.falling
      ? Math.max(0, obj.radius / obj.originalRadius)
      : 1.0;

    // Non-edible objects are drawn ghosted so players know they can't eat them yet.
    if (!isEdible) {
      baseAlpha *= 0.4;
    }

    for (let echoIdx = 0; echoIdx < totalDrawEchoes; echoIdx++) {
      ctx.save();
      ctx.globalAlpha = baseAlpha * Math.pow(0.55, echoIdx);

      if (obj.falling && echoIdx > 0) {
        const scaleVal = 1.0 - echoIdx * 0.28;
        ctx.scale(scaleVal * 0.5, scaleVal * 1.5);
        ctx.rotate(echoIdx * lastTime * 0.008);
      }

      const rng = mulberry32(obj.seed);

      if (obj.celestialType === "dust") drawDust(ctx, objDrawRadius);
      else if (obj.celestialType === "asteroid")
        drawAsteroid(ctx, objDrawRadius, obj, rng, state.cameraScale);
      else if (obj.celestialType === "planet")
        drawPlanet(ctx, objDrawRadius, obj);
      else if (obj.celestialType === "star") drawStar(ctx, objDrawRadius, obj);
      else if (obj.celestialType === "system")
        drawSystem(ctx, objDrawRadius, obj, rng, state.cameraScale, lastTime);
      else if (obj.celestialType === "galaxy")
        drawGalaxy(ctx, objDrawRadius, obj, rng, lastTime, mulberry32);
      else if (obj.celestialType === "pulsar")
        drawPulsar(ctx, objDrawRadius, obj, lastTime);
      else if (obj.celestialType === "nebula")
        drawNebula(ctx, objDrawRadius, obj, rng);
      else if (obj.celestialType === "darkhole")
        drawDarkhole(ctx, objDrawRadius, obj);

      ctx.restore();
    }
    ctx.restore();
  }
  ctx.restore();

  drawGoalPointer(ctx, state, width, height);
  drawOffscreenIndicators(ctx, state, width, height);
  drawOverlayText(ctx, state, width, height);
  drawWinScreen(ctx, state, width, height);
  drawJoystick(ctx, joystick);
};
