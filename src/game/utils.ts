import { CelestialType } from "./types";

export const getCelestialType = (radius: number): CelestialType => {
  if (radius < 5) return "dust";
  if (radius < 25) return "asteroid";
  if (radius < 100) return "planet";
  if (radius < 500) return "star";
  if (radius < 2000) return "system";
  return "galaxy";
};

export const getEndlessCelestialType = (
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

export const formatMass = (value: number) => {
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

export const winWords = [
  "AWESOME!",
  "SPLENDID!",
  "FANTASTIC!",
  "STELLAR!",
  "MAGNIFICENT!",
  "BRILLIANT!",
  "INCREDIBLE!",
  "SUPERB!",
];

export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const safeGetItem = (
  key: string,
  defaultValue: string = "0",
): string => {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    console.warn("localStorage is not accessible:", e);
    return defaultValue;
  }
};

export const safeSetItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage is not accessible:", e);
  }
};
