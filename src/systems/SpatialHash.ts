// Power of two so the hash can be masked instead of using %
const BUCKETS = 4096;
const MASK = BUCKETS - 1;

/**
 * Uniform grid hashed into a fixed bucket table and rebuilt every frame with a counting sort.
 * Never allocates after construction. Distinct cells can share a bucket, so query results
 * may include far-away items: callers still do their own distance check.
 */
export class SpatialHash {
  private readonly bucketStart = new Int32Array(BUCKETS + 1);
  private readonly sorted: Int32Array;
  private readonly itemIds: Int32Array;
  private readonly itemBuckets: Int32Array;
  private readonly visited = new Int32Array(9);
  private count = 0;

  /** `cellSize` must be at least the largest interaction distance, since queries only cover the 3x3 neighbourhood. */
  constructor(
    private readonly cellSize: number,
    capacity: number,
  ) {
    this.sorted = new Int32Array(capacity);
    this.itemIds = new Int32Array(capacity);
    this.itemBuckets = new Int32Array(capacity);
  }

  clear() {
    this.count = 0;
  }

  insert(id: number, x: number, y: number) {
    this.itemIds[this.count] = id;
    this.itemBuckets[this.count] = this.bucketOf(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
    this.count++;
  }

  /** Call once after all inserts, before any query. */
  build() {
    const start = this.bucketStart;
    start.fill(0);
    for (let i = 0; i < this.count; i++) start[this.itemBuckets[i]]++;
    for (let b = 1; b < BUCKETS; b++) start[b] += start[b - 1];
    start[BUCKETS] = this.count;
    // Filling backwards by decrementing turns each running total into its bucket's start offset
    for (let i = this.count - 1; i >= 0; i--) {
      this.sorted[--start[this.itemBuckets[i]]] = this.itemIds[i];
    }
  }

  /** Writes ids around (x, y) into `out` and returns how many were written. */
  query(x: number, y: number, out: Int32Array): number {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const start = this.bucketStart;
    let n = 0;
    let visitedCount = 0;

    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const b = this.bucketOf(cx + ox, cy + oy);
        // Neighbouring cells can hash to the same bucket; skip it so items aren't reported twice
        let seen = false;
        for (let k = 0; k < visitedCount; k++) {
          if (this.visited[k] === b) {
            seen = true;
            break;
          }
        }
        if (seen) continue;
        this.visited[visitedCount++] = b;

        for (let k = start[b]; k < start[b + 1]; k++) out[n++] = this.sorted[k];
      }
    }
    return n;
  }

  private bucketOf(cx: number, cy: number): number {
    return (Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663)) & MASK;
  }
}
