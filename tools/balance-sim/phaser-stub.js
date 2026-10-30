// Only what the game systems touch at runtime; rendering goes through the fake scene in game.js
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
}

export default { Math: { Vector2 } };
