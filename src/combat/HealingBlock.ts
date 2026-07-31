export class HealingBlock {
  private blockedUntil = 0;

  block(until: number) { this.blockedUntil = Math.max(this.blockedUntil, until); }
  isBlocked(time: number) { return time < this.blockedUntil; }
}
