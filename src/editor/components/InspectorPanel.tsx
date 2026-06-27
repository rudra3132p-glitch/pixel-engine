/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Inspector Panel Component
   Right sidebar with Scene Graph + Component Inspector.
   ════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useEffect } from 'react';
import type { Engine } from '../../engine/Engine';
import {
  TRANSFORM, SPRITE, RIGID_BODY, COLLIDER,
  createTransform, createSprite, createRigidBody, createCollider,
  type Transform, type Sprite, type RigidBody, type Collider, type BodyType,
} from '../../engine/ecs/Components';

interface InspectorPanelProps {
  engineRef: React.RefObject<Engine | null>;
}

export function InspectorPanel({ engineRef }: InspectorPanelProps) {
  const [entities, setEntities] = useState<number[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<number | null>(null);
  const [, forceUpdate] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);

  // Refresh entity list
  const refreshEntities = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setEntities(engine.world.getEntities());
    forceUpdate(n => n + 1);
  }, [engineRef]);

  // Periodic refresh for play mode
  useEffect(() => {
    const interval = setInterval(refreshEntities, 200);
    return () => clearInterval(interval);
  }, [refreshEntities]);

  const engine = engineRef.current;
  const world = engine?.world;

  // ─── Add entity ─────────────────────────────────────────────────
  const addEntity = useCallback(() => {
    if (!engine) return;
    const e = engine.world.createEntity(`Object ${engine.world.getEntities().length + 1}`);
    engine.world.addComponent(e, TRANSFORM, createTransform(0, 0));
    engine.world.addComponent(e, SPRITE, createSprite('default', 50, 50, [0, 0.9, 1, 1]));
    engine.renderFrame();
    refreshEntities();
    setSelectedEntity(e);
  }, [engine, refreshEntities]);

  // ─── Add physics to selected entity ─────────────────────────────
  const addPhysics = useCallback(() => {
    if (!engine || selectedEntity === null) return;
    if (!engine.world.hasComponent(selectedEntity, RIGID_BODY)) {
      engine.world.addComponent(selectedEntity, RIGID_BODY, createRigidBody('dynamic'));
    }
    if (!engine.world.hasComponent(selectedEntity, COLLIDER)) {
      const sprite = engine.world.getComponent<Sprite>(selectedEntity, SPRITE);
      engine.world.addComponent(selectedEntity, COLLIDER,
        createCollider(sprite?.width ?? 50, sprite?.height ?? 50));
    }
    refreshEntities();
  }, [engine, selectedEntity, refreshEntities]);

  // ─── Delete selected entity ─────────────────────────────────────
  const deleteEntity = useCallback(() => {
    if (!engine || selectedEntity === null) return;
    engine.world.destroyEntity(selectedEntity);
    setSelectedEntity(null);
    engine.renderFrame();
    refreshEntities();
  }, [engine, selectedEntity, refreshEntities]);

  // ─── Component field updater ────────────────────────────────────
  const updateField = useCallback(<T,>(
    componentName: string,
    field: keyof T,
    value: T[keyof T]
  ) => {
    if (!engine || selectedEntity === null) return;
    const component = engine.world.getComponent<T>(selectedEntity, componentName);
    if (!component) return;
    (component as Record<string, unknown>)[field as string] = value;
    engine.renderFrame();
    forceUpdate(n => n + 1);
  }, [engine, selectedEntity]);

  // Get components of selected entity
  const transform = selectedEntity !== null
    ? world?.getComponent<Transform>(selectedEntity, TRANSFORM) : undefined;
  const sprite = selectedEntity !== null
    ? world?.getComponent<Sprite>(selectedEntity, SPRITE) : undefined;
  const rigidBody = selectedEntity !== null
    ? world?.getComponent<RigidBody>(selectedEntity, RIGID_BODY) : undefined;
  const collider = selectedEntity !== null
    ? world?.getComponent<Collider>(selectedEntity, COLLIDER) : undefined;

  return (
    <div className={`pe-panel ${panelOpen ? 'pe-panel--open' : ''}`}>

      {/* ─── Scene Graph ──────────────────────────────────────────── */}
      <div className="pe-panel__section">
        <div className="pe-panel__header" onClick={() => setPanelOpen(!panelOpen)}>
          <span className="pe-panel__title">Scene</span>
          <svg className={`pe-panel__chevron ${panelOpen ? 'pe-panel__chevron--open' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
        <div className="pe-panel__body">
          <ul className="pe-scene-list">
            {entities.map(eid => (
              <li
                key={eid}
                className={`pe-scene-item ${selectedEntity === eid ? 'pe-scene-item--selected' : ''}`}
                onClick={() => setSelectedEntity(eid)}
              >
                <svg className="pe-scene-item__icon" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
                {world?.getEntityName(eid)}
              </li>
            ))}
          </ul>
          <button className="pe-add-entity" onClick={addEntity}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Entity
          </button>
        </div>
      </div>

      {/* ─── Inspector ────────────────────────────────────────────── */}
      {selectedEntity !== null && (
        <div className="pe-panel__section">
          <div className="pe-panel__header">
            <span className="pe-panel__title">Inspector</span>
            <button className="pe-btn pe-btn--danger pe-btn--icon" onClick={deleteEntity} title="Delete">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
                stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              </svg>
            </button>
          </div>
          <div className="pe-panel__body">
            {/* Component badges */}
            <div>
              {transform && <span className="pe-component-badge pe-component-badge--transform">Transform</span>}
              {sprite && <span className="pe-component-badge pe-component-badge--sprite">Sprite</span>}
              {rigidBody && <span className="pe-component-badge pe-component-badge--rigidbody">RigidBody</span>}
              {collider && <span className="pe-component-badge pe-component-badge--collider">Collider</span>}
            </div>

            {/* Transform fields */}
            {transform && (
              <>
                <div className="pe-field">
                  <span className="pe-field__label">Pos</span>
                  <div className="pe-field__row">
                    <span className="pe-field__axis pe-field__axis--x">X</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      value={Math.round(transform.x)}
                      onChange={e => updateField<Transform>(TRANSFORM, 'x', parseFloat(e.target.value) || 0)}
                    />
                    <span className="pe-field__axis pe-field__axis--y">Y</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      value={Math.round(transform.y)}
                      onChange={e => updateField<Transform>(TRANSFORM, 'y', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="pe-field">
                  <span className="pe-field__label">Scale</span>
                  <div className="pe-field__row">
                    <span className="pe-field__axis pe-field__axis--x">X</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      step="0.1"
                      value={transform.scaleX}
                      onChange={e => updateField<Transform>(TRANSFORM, 'scaleX', parseFloat(e.target.value) || 1)}
                    />
                    <span className="pe-field__axis pe-field__axis--y">Y</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      step="0.1"
                      value={transform.scaleY}
                      onChange={e => updateField<Transform>(TRANSFORM, 'scaleY', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Sprite fields */}
            {sprite && (
              <>
                <div className="pe-field">
                  <span className="pe-field__label">Size</span>
                  <div className="pe-field__row">
                    <span className="pe-field__axis pe-field__axis--x">W</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      value={sprite.width}
                      onChange={e => updateField<Sprite>(SPRITE, 'width', parseFloat(e.target.value) || 10)}
                    />
                    <span className="pe-field__axis pe-field__axis--y">H</span>
                    <input
                      className="pe-field__input pe-field__input--small"
                      type="number"
                      value={sprite.height}
                      onChange={e => updateField<Sprite>(SPRITE, 'height', parseFloat(e.target.value) || 10)}
                    />
                  </div>
                </div>
                <div className="pe-field">
                  <span className="pe-field__label">Z</span>
                  <input
                    className="pe-field__input pe-field__input--small"
                    type="number"
                    value={sprite.zIndex}
                    onChange={e => updateField<Sprite>(SPRITE, 'zIndex', parseInt(e.target.value) || 0)}
                  />
                </div>
              </>
            )}

            {/* RigidBody fields */}
            {rigidBody && (
              <>
                <div className="pe-field">
                  <span className="pe-field__label">Type</span>
                  <select
                    className="pe-field__select"
                    value={rigidBody.type}
                    onChange={e => updateField<RigidBody>(RIGID_BODY, 'type', e.target.value as BodyType)}
                  >
                    <option value="dynamic">Dynamic</option>
                    <option value="static">Static</option>
                    <option value="kinematic">Kinematic</option>
                  </select>
                </div>
                <div className="pe-field">
                  <span className="pe-field__label">Mass</span>
                  <input
                    className="pe-field__input pe-field__input--small"
                    type="number"
                    step="0.1"
                    value={rigidBody.mass}
                    onChange={e => updateField<RigidBody>(RIGID_BODY, 'mass', parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="pe-field">
                  <span className="pe-field__label">Grav</span>
                  <input
                    className="pe-field__input pe-field__input--small"
                    type="number"
                    step="0.1"
                    value={rigidBody.gravityScale}
                    onChange={e => updateField<RigidBody>(RIGID_BODY, 'gravityScale', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="pe-field">
                  <span className="pe-field__label">Bounce</span>
                  <input
                    className="pe-field__input pe-field__input--small"
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={rigidBody.restitution}
                    onChange={e => updateField<RigidBody>(RIGID_BODY, 'restitution', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </>
            )}

            {/* Add physics button */}
            {!rigidBody && (
              <button className="pe-add-entity" onClick={addPhysics} style={{ marginTop: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Physics
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
