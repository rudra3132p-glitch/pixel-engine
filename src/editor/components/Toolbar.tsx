/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Toolbar Component
   Left-side (desktop) / bottom (mobile) tool selector.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback } from 'react';
import type { Engine } from '../../engine/Engine';

type EditorTool = 'select' | 'translate' | 'rotate' | 'scale';

interface ToolbarProps {
  engineRef: React.RefObject<Engine | null>;
}

const TOOLS: { id: EditorTool; label: string; icon: string }[] = [
  {
    id: 'select',
    label: 'Select',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>`,
  },
  {
    id: 'translate',
    label: 'Move',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>`,
  },
  {
    id: 'rotate',
    label: 'Rotate',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
  },
];

export function Toolbar({ engineRef }: ToolbarProps) {
  const [activeTool, setActiveTool] = useState<EditorTool>('select');

  const onToolClick = useCallback((toolId: EditorTool) => {
    setActiveTool(toolId);
  }, []);

  const toggleColliders = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.renderSystem.showColliders = !engine.renderSystem.showColliders;
    engine.renderFrame();
  }, [engineRef]);

  return (
    <aside className="pe-toolbar">
      <div className="pe-toolbar__group">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`pe-tool-btn ${activeTool === tool.id ? 'pe-tool-btn--active' : ''}`}
            title={tool.label}
            onClick={() => onToolClick(tool.id)}
            dangerouslySetInnerHTML={{ __html: tool.icon + `<span class="pe-tool-btn__label">${tool.label}</span>` }}
          />
        ))}
      </div>
      <div className="pe-toolbar__divider" />
      <div className="pe-toolbar__group">
        <button
          className="pe-tool-btn"
          title="Toggle Colliders"
          onClick={toggleColliders}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" />
          </svg>
          <span className="pe-tool-btn__label">Debug</span>
        </button>
      </div>
    </aside>
  );
}
