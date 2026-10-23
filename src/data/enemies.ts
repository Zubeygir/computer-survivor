export interface EnemyDef {
  id: string;
  /** Pixels per second. */
  speed: number;
  radius: number;
  hp: number;
  color: number;
}

export const ENEMIES = {
  basic: { id: 'basic', speed: 80, radius: 14, hp: 10, color: 0xe53935 },
} satisfies Record<string, EnemyDef>;
