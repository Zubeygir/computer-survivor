import {
  DAILY_ALL_DONE_BONUS,
  DAILY_TASK_COUNT,
  DAILY_TASK_REWARD,
  DAILY_TASKS,
  RUN_REWARDS,
  runData,
  WEAPON_PRICES,
  workshopBonus,
  type DailyTaskDef,
  type WorkshopDef,
} from '../data/meta';
import type { PlayerStats } from '../data/player';
import { EVOLUTIONS } from '../data/upgrades';
import type { WeaponId } from '../data/weapons';
import { loadSave, writeSave, type DailyTaskState } from './SaveData';

export interface RunSummary {
  /** Run clock seconds. */
  time: number;
  level: number;
  kills: number;
  bossKills: number;
  /** Bosses that pay the big reward; also counted in `bossKills`. */
  milestoneKills: number;
  /** Ids of the weapons held at the end, evolved forms included. */
  weapons: string[];
  /** Picked up during the run. */
  dataFound: number;
}

export interface RunReward {
  total: number;
  /** One line per earned bonus, for the result screen. */
  lines: string[];
  newRecord: boolean;
}

export interface DailyTaskView {
  text: string;
  progress: number;
  goal: number;
  done: boolean;
}

function today(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function baseWeaponId(id: string): string {
  return EVOLUTIONS.find((evolution) => evolution.into === id)?.base.weapon ?? id;
}

function taskDef(task: DailyTaskState): DailyTaskDef {
  return DAILY_TASKS.find((def) => def.id === task.id)!;
}

/** Everything that outlives a run: Data, unlocks, Workshop levels and daily tasks. */
class Progress {
  private readonly state = loadSave();

  get data(): number {
    return this.state.data;
  }

  isUnlocked(id: WeaponId): boolean {
    return this.state.unlockedWeapons.includes(id);
  }

  hasEvolved(id: WeaponId): boolean {
    return this.state.evolutions.includes(id);
  }

  workshopLevel(def: WorkshopDef): number {
    return this.state.workshop[def.id] ?? 0;
  }

  get bonus(): Partial<PlayerStats> {
    return workshopBonus(this.state.workshop);
  }

  get bestTime(): number {
    return this.state.bestTime;
  }

  get tutorialDone(): boolean {
    return this.state.tutorialDone;
  }

  markTutorialDone() {
    this.state.tutorialDone = true;
    writeSave(this.state);
  }

  /** Returns false when it can't be paid for. */
  buyWeapon(id: WeaponId): boolean {
    const price = WEAPON_PRICES[id];
    if (price === undefined || !this.pay(price)) return false;
    this.state.unlockedWeapons.push(id);
    writeSave(this.state);
    return true;
  }

  /** Returns false when it is maxed or can't be paid for. */
  buyWorkshop(def: WorkshopDef): boolean {
    const level = this.workshopLevel(def);
    if (level >= def.prices.length || !this.pay(def.prices[level])) return false;
    this.state.workshop[def.id] = level + 1;
    writeSave(this.state);
    return true;
  }

  /** Today's tasks, rolled on the first look of the day. */
  dailyTasks(): DailyTaskView[] {
    this.refreshDaily();
    return this.state.daily.tasks.map((task) => {
      const def = taskDef(task);
      return {
        text: taskText(task),
        progress: Math.min(task.progress, def.goal),
        goal: def.goal,
        done: task.done,
      };
    });
  }

  /** Pays out a finished run and saves. */
  settleRun(run: RunSummary): RunReward {
    const lines: string[] = [];
    let total = runData(run.time, run.kills, run.bossKills, run.milestoneKills, run.dataFound);
    if (run.dataFound > 0) lines.push(`Picked up ${run.dataFound} Data`);

    for (const evolution of EVOLUTIONS) {
      if (!run.weapons.includes(evolution.into) || this.state.evolutions.includes(evolution.into)) continue;
      this.state.evolutions.push(evolution.into);
      total += RUN_REWARDS.firstEvolution;
      lines.push(`New evolution: ${evolution.name}`);
    }

    total += this.advanceDaily(run, lines);
    this.state.data += total;
    const newRecord = run.time > this.state.bestTime;
    if (newRecord) this.state.bestTime = run.time;
    writeSave(this.state);
    return { total, lines, newRecord };
  }

  private pay(price: number): boolean {
    if (this.state.data < price) return false;
    this.state.data -= price;
    return true;
  }

  private refreshDaily() {
    const date = today();
    if (this.state.daily.date === date) return;
    const pool = [...DAILY_TASKS];
    const tasks: DailyTaskState[] = [];
    for (let i = 0; i < DAILY_TASK_COUNT; i++) {
      const [def] = pool.splice(Math.floor(Math.random() * pool.length), 1);
      const task: DailyTaskState = { id: def.id, progress: 0, done: false };
      if (def.kind === 'weapon') {
        const owned = this.state.unlockedWeapons;
        task.weapon = owned[Math.floor(Math.random() * owned.length)];
      }
      tasks.push(task);
    }
    this.state.daily = { date, tasks };
    writeSave(this.state);
  }

  /** Returns the Data earned from tasks finished by this run. */
  private advanceDaily(run: RunSummary, lines: string[]): number {
    this.refreshDaily();
    const tasks = this.state.daily.tasks;
    const wasAllDone = tasks.every((task) => task.done);
    let earned = 0;
    for (const task of tasks) {
      if (task.done) continue;
      const def = taskDef(task);
      task.progress = advancedProgress(task, def, run);
      if (task.progress < def.goal) continue;
      task.done = true;
      earned += DAILY_TASK_REWARD;
      lines.push(`Task done: ${taskText(task)}`);
    }
    if (!wasAllDone && tasks.every((task) => task.done)) {
      earned += DAILY_ALL_DONE_BONUS;
      lines.push('All daily tasks done');
    }
    return earned;
  }
}

function taskText(task: DailyTaskState): string {
  const text = taskDef(task).text;
  return task.weapon ? `${text} ${weaponName(task.weapon)}` : text;
}

function advancedProgress(task: DailyTaskState, def: DailyTaskDef, run: RunSummary): number {
  switch (def.kind) {
    case 'kills':
      return task.progress + run.kills;
    case 'bosses':
      return task.progress + run.bossKills;
    case 'evolve':
      return task.progress + run.weapons.filter((id) => baseWeaponId(id) !== id).length;
    case 'survive':
      return Math.max(task.progress, Math.floor(run.time));
    case 'level':
      return Math.max(task.progress, run.level);
    case 'weapon':
      return run.weapons.some((id) => baseWeaponId(id) === task.weapon) ? 1 : task.progress;
  }
}

function weaponName(id: string): string {
  return EVOLUTIONS.find((evolution) => evolution.base.weapon === id)?.base.name ?? id;
}

export const progress = new Progress();
