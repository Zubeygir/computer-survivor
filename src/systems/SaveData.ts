import { STARTING_WEAPONS } from '../data/meta';

const KEY = 'computer-survivor-save';

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
  };
}

// Storage can be blocked or wiped; the game must still run, just without progress
export function loadSave(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaultSave(), ...(JSON.parse(raw) as Partial<SaveState>) } : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(state: SaveState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Same as above: losing a save beats crashing the run end
  }
}
