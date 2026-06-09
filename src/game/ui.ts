import { GameState } from "./types";

export const drawGoalPointer = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) => {
  if (state.mode !== "goals" || state.goalsWon) return;

  const dx = 0 - state.player.x;
  const dy = 0 - state.player.y;
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
};

export const drawOffscreenIndicators = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) => {
  if (state.mode !== "endless" && state.mode !== "goals") return;

  const borderPadding = 30;

  const halfWidth = width / 2 / state.cameraScale;
  const yOffsetTop = (height * 0.7) / state.cameraScale;
  const yOffsetBottom = (height * 0.3) / state.cameraScale;

  const visibleLeft = state.player.x - halfWidth;
  const visibleRight = state.player.x + halfWidth;
  const visibleTop = state.player.y - yOffsetTop;
  const visibleBottom = state.player.y + yOffsetBottom;

  const candidates = [];

  for (const obj of state.objects) {
    if (obj.falling || obj.eaten) continue;

    if (
      obj.radius < state.player.radius &&
      obj.originalRadius >= state.player.radius * 0.1
    ) {
      if (
        obj.x < visibleLeft - 20 ||
        obj.x > visibleRight + 20 ||
        obj.y < visibleTop - 20 ||
        obj.y > visibleBottom + 20
      ) {
        const dX = obj.x - state.player.x;
        const dY = obj.y - state.player.y;
        const dist = Math.hypot(dX, dY);

        const screenX = width / 2 + dX * state.cameraScale;
        const screenY = height * 0.7 + dY * state.cameraScale;

        candidates.push({ obj, dist, screenX, screenY });
      }
    }
  }

  candidates.sort((a, b) => a.dist - b.dist);
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

      const tx =
        dx !== 0
          ? ((dx > 0 ? width - borderPadding : borderPadding) - width / 2) / dx
          : Infinity;
      const ty =
        dy !== 0
          ? ((dy > 0 ? height - borderPadding : borderPadding) - height * 0.7) /
            dy
          : Infinity;
      const t = Math.min(tx, ty);

      const px = width / 2 + dx * Math.abs(t);
      const py = height * 0.7 + dy * Math.abs(t);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(dy, dx));

      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-6, 5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-6, -5);
      ctx.closePath();
      ctx.fillStyle = obj.color;
      ctx.globalAlpha = 0.1;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(-8, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
  ctx.restore();
};

export const drawOverlayText = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) => {
  if (state.showRebirthFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1.0, state.showRebirthFlash / 60)})`;
    ctx.fillRect(0, 0, width, height);

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
};

export const drawWinScreen = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
) => {
  if (state.mode !== "goals" || !state.goalsWon) return;

  ctx.save();
  const winProgress = 1 - state.winTimer / 240;

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
};

export const drawJoystick = (
  ctx: CanvasRenderingContext2D,
  joystick: GameState["joystick"],
) => {
  if (!joystick.active) return;

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
};
