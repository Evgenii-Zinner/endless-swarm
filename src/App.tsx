/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import GameCanvas from "./components/GameCanvas";

export default function App() {
  const [gameState, setGameState] = useState<"menu" | "endless" | "goals">(
    "menu",
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && gameState !== "menu") {
        setGameState("menu");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState]);

  if (gameState === "menu") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-12 bg-[#020617] text-white">
        <h1 className="text-5xl md:text-7xl font-bold tracking-[0.2em] text-sky-400 drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">
          ENDLESS SWARM
        </h1>
        <div className="flex flex-col gap-6 w-full max-w-xs">
          <button
            onClick={() => setGameState("endless")}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-xl font-bold tracking-widest rounded-xl border-2 border-slate-700 hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
          >
            ENDLESS
          </button>
          <button
            onClick={() => setGameState("goals")}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-xl font-bold tracking-widest rounded-xl border-2 border-slate-700 hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]"
          >
            GOALS
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 text-white/50 text-sm font-medium tracking-wide">
          <p>CONTROLS</p>
          <div className="flex gap-4 items-center">
            <span className="bg-white/10 px-2 py-1 rounded text-white/80 border border-white/20">WASD</span>
            <span>or</span>
            <span className="bg-white/10 px-2 py-1 rounded text-white/80 border border-white/20">ARROWS</span>
            <span>or</span>
            <span className="bg-white/10 px-2 py-1 rounded text-white/80 border border-white/20">DRAG</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full h-full relative bg-[#020617]">
      <GameCanvas mode={gameState} />
      <button
        onClick={() => setGameState("menu")}
        aria-label="Return to menu"
        className="absolute top-8 left-8 text-white/50 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#020617] rounded text-sm font-bold tracking-widest transition-colors z-20 flex items-center"
      >
        <span aria-hidden="true" className="mr-1">&#8592;</span> MENU
        <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded border border-white/20 font-sans tracking-normal opacity-70">ESC</span>
      </button>
    </main>
  );
}
