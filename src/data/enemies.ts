export interface EnemyDef {
  id: string;
  /** Pixels per second. */
  speed: number;
  radius: number;
  color: number;
}

export const ENEMIES = {
  basic: { id: 'basic', speed: 80, radius: 14, color: 0xe53935 },
} satisfies Record<string, EnemyDef>;
