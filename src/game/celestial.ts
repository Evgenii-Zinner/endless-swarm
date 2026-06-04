import { GameObject } from "./types";

export const drawDust = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number
) => {
  ctx.beginPath();
  ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fill();
};

export const drawAsteroid = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject,
  rng: () => number,
  cameraScale: number
) => {
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
  ctx.lineWidth = Math.max(1 / cameraScale, objDrawRadius * 0.1);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.stroke();
};

export const drawPlanet = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject
) => {
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
  atm.addColorStop(0, obj.color.replace("hsl", "hsla").replace(")", ", 0.5)"));
  atm.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = atm;
  ctx.beginPath();
  ctx.arc(0, 0, objDrawRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();
};

export const drawStar = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject
) => {
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
};

export const drawSystem = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject,
  rng: () => number,
  cameraScale: number,
  lastTime: number
) => {
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
    ctx.lineWidth = Math.max(0.5 / cameraScale, objDrawRadius * 0.01);
    ctx.stroke();

    const pSize = Math.max(0.1, objDrawRadius * (0.04 + rng() * 0.04));
    const pAngle = rng() * Math.PI * 2 + (lastTime / 1000) * (1 / (i + 1));
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
};

export const drawGalaxy = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject,
  rng: () => number,
  lastTime: number,
  mulberry32: (seed: number) => () => number
) => {
  const arms = 2 + Math.floor(rng() * 3);
  const spinRate = rng() > 0.5 ? 1 : -1;
  const rot = rng() * Math.PI * 2 + (lastTime / 3000) * spinRate;
  ctx.rotate(rot);

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

  const starsPerArm = 16;
  for (let a = 0; a < arms; a++) {
    const baseAngle = (a / arms) * Math.PI * 2;
    for (let s = 0; s < starsPerArm; s++) {
      const tInit = s / starsPerArm;
      const speed = 0.08;
      const t = (tInit + (lastTime / 1000) * speed) % 1.0;
      const dist = t * objDrawRadius;
      const spiralWrap = 3.5;
      const angle = baseAngle + t * spiralWrap;

      const starSeed = obj.seed + a * 1000 + s * 17;
      const sRng = mulberry32(starSeed);
      const jitterX = (sRng() - 0.5) * objDrawRadius * 0.07;
      const jitterY = (sRng() - 0.5) * objDrawRadius * 0.07;

      const pX = Math.cos(angle) * dist + jitterX;
      const pY = Math.sin(angle) * dist + jitterY;

      const flicker = 0.4 + 0.6 * Math.sin(lastTime * 0.008 + sRng() * 100);
      const pSize = Math.max(
        0.4,
        objDrawRadius * 0.025 * (1.2 - t * 0.5) * (0.6 + sRng() * 0.8),
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
};

export const drawPulsar = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject,
  lastTime: number
) => {
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

  const baseAngle = Math.abs(obj.x * 2.71 + obj.y * 3.14) % (Math.PI * 2);
  const precession = Math.sin(lastTime * 0.003) * 0.05;
  const jetAngle = baseAngle + precession;
  ctx.save();
  ctx.rotate(jetAngle);

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

  const particleCount = 9;
  for (let i = 0; i < particleCount; i++) {
    const flowProgress = (lastTime * 0.002 + i / particleCount) % 1;
    const dist = (0.12 + flowProgress * 2.7) * objDrawRadius;

    const spiralFreq = 10;
    const yOffset =
      Math.sin(flowProgress * spiralFreq - lastTime * 0.012) *
      (objDrawRadius * 0.08 * flowProgress);

    const pSize = Math.max(
      0.6,
      objDrawRadius * 0.05 * (1.2 - flowProgress * 0.6),
    );
    const opacity = (1.0 - flowProgress) * 0.45;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(dist, yOffset, pSize, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(dist, yOffset, pSize * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(125, 211, 252, 0.18)";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(-dist, -yOffset, pSize, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(-dist, -yOffset, pSize * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(125, 211, 252, 0.18)";
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
};

export const drawNebula = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject,
  rng: () => number
) => {
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
    const hueMatch = obj.color.match(/\d+/);
    const hue = (parseInt(hueMatch ? hueMatch[0] : "0") + i * 40) % 360;
    nebGrad.addColorStop(0, `hsla(${hue}, 85%, 50%, 0.15)`);
    nebGrad.addColorStop(0.5, `hsla(${hue}, 70%, 40%, 0.05)`);
    nebGrad.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.arc(blobX, blobY, blobR, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3; i++) {
    const starX = (rng() - 0.5) * objDrawRadius * 0.6;
    const starY = (rng() - 0.5) * objDrawRadius * 0.6;
    const starSize = Math.max(1, objDrawRadius * 0.04);
    ctx.beginPath();
    ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fill();
  }
};

export const drawDarkhole = (
  ctx: CanvasRenderingContext2D,
  objDrawRadius: number,
  obj: GameObject
) => {
  const accretionR = objDrawRadius * 1.6;
  const diskGrad = ctx.createRadialGradient(
    0,
    0,
    objDrawRadius * 0.9,
    0,
    0,
    accretionR,
  );
  diskGrad.addColorStop(0, "#f97316");
  diskGrad.addColorStop(0.4, obj.color);
  diskGrad.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = diskGrad;
  ctx.beginPath();
  ctx.arc(0, 0, accretionR, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#111827";
  ctx.fill();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(0.5, objDrawRadius * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, objDrawRadius, 0, Math.PI * 2);
  ctx.stroke();
};
