import { useEffect, useRef } from "react";
import { GameState } from "../game/types";
import { spawnEndlessPattern, initGoalsStage } from "../game/spawning";
import { updatePhysics, updateTimers } from "../game/physics";
import { renderGame } from "../game/renderer";
import { formatMass, safeGetItem } from "../game/utils";

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
    goalsStage: parseInt(safeGetItem("endlessSwarm_goalsStage", "0")),
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

    if (stateRef.current.mode === "endless") {
      while (stateRef.current.objects.length < 250) {
        spawnEndlessPattern(stateRef.current, width, height, true);
      }
    } else {
      initGoalsStage(stateRef.current);
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (time: DOMHighResTimeStamp) => {
      const state = stateRef.current;
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const timeScale = dt > 0 ? Math.min(dt * 60, 3) : 1;

      // Update Phase
      updatePhysics(state, timeScale, width, height);
      updateTimers(state, timeScale);

      // Render Phase
      renderGame(ctx, state, width, height, lastTime);

      // Update DOM UI
      if (massDisplayRef.current) {
        massDisplayRef.current.innerText = formatMass(
          state.player.targetRadius ** 2,
        );
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
