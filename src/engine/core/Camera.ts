/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Camera
   Orthographic 2D camera with pan & zoom.
   ════════════════════════════════════════════════════════════════════════ */

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  private targetZoom = 1;
  private viewportWidth = 800;
  private viewportHeight = 600;

  /** Update viewport dimensions (call on resize) */
  setViewport(w: number, h: number): void {
    this.viewportWidth = w;
    this.viewportHeight = h;
  }

  getViewportWidth(): number { return this.viewportWidth; }
  getViewportHeight(): number { return this.viewportHeight; }

  /** Pan the camera by delta pixels (in screen space) */
  pan(dx: number, dy: number): void {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
  }

  /** Set zoom with smooth interpolation target */
  setZoom(z: number): void {
    this.targetZoom = Math.max(0.1, Math.min(10, z));
  }

  /** Immediately set zoom */
  setZoomImmediate(z: number): void {
    this.zoom = Math.max(0.1, Math.min(10, z));
    this.targetZoom = this.zoom;
  }

  /** Zoom towards a point in screen space */
  zoomAt(screenX: number, screenY: number, factor: number): void {
    const worldBefore = this.screenToWorld(screenX, screenY);
    this.zoom = Math.max(0.1, Math.min(10, this.zoom * factor));
    this.targetZoom = this.zoom;
    const worldAfter = this.screenToWorld(screenX, screenY);
    this.x += worldBefore.x - worldAfter.x;
    this.y += worldBefore.y - worldAfter.y;
  }

  /** Smooth zoom interpolation (call each frame) */
  update(): void {
    const diff = this.targetZoom - this.zoom;
    if (Math.abs(diff) > 0.001) {
      this.zoom += diff * 0.15;
    } else {
      this.zoom = this.targetZoom;
    }
  }

  /** Convert screen coordinates to world coordinates */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.viewportWidth / 2) / this.zoom + this.x,
      y: (screenY - this.viewportHeight / 2) / this.zoom + this.y,
    };
  }

  /** Convert world coordinates to screen coordinates */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this.x) * this.zoom + this.viewportWidth / 2,
      y: (worldY - this.y) * this.zoom + this.viewportHeight / 2,
    };
  }

  /**
   * Get the 3x3 view matrix as a flat Float32Array (column-major).
   * Used by the WebGL renderer.
   *
   * The matrix transforms world coords to clip space:
   *   [2*zoom/w,     0,     -2*zoom*cx/w]
   *   [0,       -2*zoom/h,   2*zoom*cy/h]  (Y flipped for WebGL)
   *   [0,            0,            1     ]
   */
  getViewMatrix(): Float32Array {
    const sx = (2 * this.zoom) / this.viewportWidth;
    const sy = (2 * this.zoom) / this.viewportHeight;
    // prettier-ignore
    return new Float32Array([
      sx,   0,    0,
      0,   -sy,   0,
      -sx * this.x,  sy * this.y,  1,
    ]);
  }
}
