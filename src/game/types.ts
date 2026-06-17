export type CelestialType =
  | "dust"
  | "asteroid"
  | "planet"
  | "star"
  | "system"
  | "galaxy"
  | "pulsar"
  | "nebula"
  | "darkhole";

export type GameObject = {
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

export type GameState = {
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
  screenShake: number;
};
