/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Viewport Component
   Central canvas area with mouse/touch camera controls.
   ════════════════════════════════════════════════════════════════════════ */

import { useRef, useEffect, useCallback } from 'react';
import type { Engine } from '../../engine/Engine';
import type { EngineMode } from '../../engine/Engine';

interface ViewportProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  engineRef: React.RefObject<Engine | null>;
  mode: EngineMode;
  fps: number;
}

export function Viewport({ canvasRef, engineRef, mode, fps }: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef(0);

  // ─── Mouse / Touch Camera Controls ──────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+Click = pan
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current || !engineRef.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    engineRef.current.camera.pan(dx, dy);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (mode === 'edit') engineRef.current.renderFrame();
  }, [engineRef, mode]);

  const onPointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!engineRef.current) return;
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    engineRef.current.camera.zoomAt(mx, my, factor);
    if (mode === 'edit') engineRef.current.renderFrame();
  }, [engineRef, mode]);

  // ─── Touch pan/zoom ─────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.hypot(dx, dy);
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        lastPointer.current = { x: mx, y: my };
      } else if (e.touches.length === 1) {
        lastPointer.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!engineRef.current) return;
      if (e.touches.length === 2) {
        e.preventDefault();
        // Pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist.current > 0) {
          const factor = dist / lastPinchDist.current;
          const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
          const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
          const rect = container.getBoundingClientRect();
          engineRef.current.camera.zoomAt(mx - rect.left, my - rect.top, factor);
        }
        lastPinchDist.current = dist;

        // Pan
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const panDx = mx - lastPointer.current.x;
        const panDy = my - lastPointer.current.y;
        engineRef.current.camera.pan(panDx, panDy);
        lastPointer.current = { x: mx, y: my };

        if (mode === 'edit') engineRef.current.renderFrame();
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
    };
  }, [engineRef, mode]);

  return (
    <div
      className="pe-viewport"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} />

      {/* Overlay badges */}
      <div className="pe-viewport__overlay">
        {mode === 'play' && (
          <span className="pe-viewport__badge pe-viewport__badge--play">
            Playing
          </span>
        )}
        {mode === 'edit' && (
          <span className="pe-viewport__badge">Edit Mode</span>
        )}
        <span className="pe-viewport__badge">{fps} FPS</span>
      </div>
    </div>
  );
}
