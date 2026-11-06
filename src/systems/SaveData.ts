import { HARD_UNLOCK_SECONDS, type DifficultyId } from '../data/difficulty';
import { STARTING_WEAPONS, WEAPON_PRICES, WORKSHOP } from '../data/meta';
import { EVOLUTIONS } from '../data/upgrades';

const KEY = 'computer-survivor-save';
/** The `?maxed` address plays on a fully bought account and never touches the real save. */
const MAXED_TEST = new URLSearchParams(location.search).has('maxed');

export interface DailyTaskState {
  id: string;
  progress: number;
  done: boolean;
  /** Weapon id, for "finish a run with" tasks. */
  weapon?: string;
}

export interface SaveState {
  /** Bump when the shape changes and migrate in `loadSave`. */
  version: 1;
  data: number;
  unlockedWeapons: string[];
  /** Bought level per Workshop upgrade id. */
  workshop: Record<string, number>;
  /** Evolved weapon ids reached at least once. */
  evolutions: string[];
  daily: { date: string; tasks: DailyTaskState[] };
  /** The first-run tutorial has played to the end. */
  tutorialDone: boolean;
  /** Longest normal run, in run clock seconds; reaching `HARD_UNLOCK_SECONDS` opens hard mode. */
  bestTime: number;
  bestTimeHard: number;
  /** The mode PLAY starts. */
  difficulty: DifficultyId;
}

function defaultSave(): SaveState {
  return {
    version: 1,
    data: 0,
    unlockedWeapons: [...STARTING_WEAPONS],
    workshop: {},
    evolutions: [],
    daily: { date: '', tasks: [] },
    tutorialDone: false,
    bestTime: 0,
    bestTimeHard: 0,
    difficulty: 'normal',
  };
}

function maxedSave(): SaveState {
  return {
    ...defaultSave(),
    data: 999_999,
    unlockedWeapons: [...STARTING_WEAPONS, ...Object.keys(WEAPON_PRICES)],
    workshop: Object.fromEntries(WORKSHOP.map((def) => [def.id, def.prices.length])),
    evolutions: EVOLUTIONS.map((evolution) => evolution.into),
    tutorialDone: true,
    bestTime: HARD_UNLOCK_SECONDS,
  };
}

// Storage can be blocked or wiped; the game must still run, just without progress
export function loadSave(): SaveState {
  if (MAXED_TEST) return maxedSave();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultSave(), ...(JSON.parse(raw) as Partial<SaveState>) } : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(state: SaveState) {
  if (MAXED_TEST) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Same as above: losing a save beats crashing the run end
  }
}
