/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — React Editor: useEngine Hook
   Creates and manages the Engine instance lifecycle.
   ════════════════════════════════════════════════════════════════════════ */

import { useRef, useEffect, useCallback, useState } from 'react';
import { Engine, type EngineMode } from '../../engine/Engine';

export function useEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<Engine | null>(null);
  const [mode, setMode] = useState<EngineMode>('edit');
  const [fps, setFps] = useState(0);

  // Initialize engine when canvas is ready
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas);
    engineRef.current = engine;

    engine.onModeChange = (m) => setMode(m);
    engine.onFrameEnd = (f) => setFps(f);

    // Initial resize
    const parent = canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      engine.resize(rect.width, rect.height);
    }

    // Initial render
    engine.renderFrame();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [canvasRef]);

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && engineRef.current) {
          engineRef.current.resize(width, height);
          engineRef.current.renderFrame();
        }
      }
    });

    const parent = canvas.parentElement;
    if (parent) observer.observe(parent);

    return () => observer.disconnect();
  }, [canvasRef]);

  const play = useCallback(() => engineRef.current?.play(), []);
  const stop = useCallback(() => engineRef.current?.stop(), []);
  const stepOnce = useCallback(() => engineRef.current?.stepOnce(), []);

  return { engine: engineRef, mode, fps, play, stop, stepOnce };
}
