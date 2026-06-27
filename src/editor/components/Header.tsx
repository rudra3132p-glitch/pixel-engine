/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Header Component
   Top bar with branding, play/stop, save/load, and FPS display.
   ════════════════════════════════════════════════════════════════════════ */

import { useCallback } from 'react';
import type { Engine } from '../../engine/Engine';
import type { EngineMode } from '../../engine/Engine';

interface HeaderProps {
  engineRef: React.RefObject<Engine | null>;
  mode: EngineMode;
  fps: number;
  onPlay: () => void;
  onStop: () => void;
  onStep: () => void;
  onHelp: () => void;
}

export function Header({ engineRef, mode, fps, onPlay, onStop, onStep, onHelp }: HeaderProps) {
  // ─── Save world to JSON file ───────────────────────────────────
  const onSave = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const snapshot = engine.world.serialize();
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [engineRef]);

  // ─── Load world from JSON file ─────────────────────────────────
  const onLoad = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const snapshot = JSON.parse(reader.result as string);
          engine.world.deserialize(snapshot);
          engine.renderFrame();
        } catch (err) {
          console.error('Failed to load level:', err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [engineRef]);

  return (
    <header className="pe-header">
      {/* ─── Brand ──────────────────────────────────────────────── */}
      <div className="pe-header__brand">
        <div className="pe-header__icon">PE</div>
        <h1 className="pe-header__title">Pixel Engine</h1>
        <button className="pe-btn pe-btn--help" onClick={onHelp} title="Show Tutorial">
          ?
        </button>
      </div>

      {/* ─── Play / Stop / Step ─────────────────────────────────── */}
      <div className="pe-header__center">
        {mode === 'edit' ? (
          <button className="pe-btn pe-btn--play" onClick={onPlay} title="Play (Space)">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            <span className="pe-btn__label">Play</span>
          </button>
        ) : (
          <button className="pe-btn pe-btn--stop" onClick={onStop} title="Stop (Space)">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            <span className="pe-btn__label">Stop</span>
          </button>
        )}
        <button className="pe-btn pe-btn--icon" onClick={onStep} title="Step One Frame">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5,4 15,12 5,20" fill="currentColor" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </button>
      </div>

      {/* ─── Right: Save / Load / FPS ──────────────────────────── */}
      <div className="pe-header__right">
        <button className="pe-btn pe-btn--accent" onClick={onSave} title="Save Level">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          <span className="pe-btn__label">Save</span>
        </button>
        <button className="pe-btn" onClick={onLoad} title="Load Level">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span className="pe-btn__label">Load</span>
        </button>
        <span className="pe-header__fps">{fps} FPS</span>
      </div>
    </header>
  );
}
