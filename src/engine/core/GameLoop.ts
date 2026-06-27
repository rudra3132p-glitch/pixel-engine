/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Game Loop
   Fixed timestep game loop with requestAnimationFrame.
   ════════════════════════════════════════════════════════════════════════ */

export type SystemUpdateFn = (dt: number) => void;

export class GameLoop {
  private running = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private systems: SystemUpdateFn[] = [];
  private fixedDt = 1 / 60;        // 60 Hz fixed step
  private accumulator = 0;
  private maxDt = 0.1;              // clamp to prevent spiral of death

  // ─── Performance metrics ──────────────────────────────────────────
  private _fps = 0;
  private _frameCount = 0;
  private _fpsTimer = 0;

  get fps(): number { return this._fps; }
  get isRunning(): boolean { return this.running; }

  /** Register a system update function */
  addSystem(fn: SystemUpdateFn): void {
    this.systems.push(fn);
  }

  /** Remove a system */
  removeSystem(fn: SystemUpdateFn): void {
    const idx = this.systems.indexOf(fn);
    if (idx !== -1) this.systems.splice(idx, 1);
  }

  /** Clear all systems */
  clearSystems(): void {
    this.systems = [];
  }

  /** Start the loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this._fpsTimer = 0;
    this._frameCount = 0;
    this.tick(this.lastTime);
  }

  /** Stop the loop */
  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Single step (for editor "step" mode) */
  step(): void {
    for (const sys of this.systems) {
      sys(this.fixedDt);
    }
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.tick);

    let rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp to prevent spiral of death on tab switch
    if (rawDt > this.maxDt) rawDt = this.maxDt;

    this.accumulator += rawDt;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDt) {
      for (const sys of this.systems) {
        sys(this.fixedDt);
      }
      this.accumulator -= this.fixedDt;
    }

    // FPS counter
    this._frameCount++;
    this._fpsTimer += rawDt;
    if (this._fpsTimer >= 1) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._fpsTimer -= 1;
    }
  };
}
