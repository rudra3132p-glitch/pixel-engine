/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — App (Root Editor Component)
   Wires together all editor components and the engine.
   ════════════════════════════════════════════════════════════════════════ */

import { useRef, useEffect, useCallback, useState } from 'react';
import { useEngine } from './editor/hooks/useEngine';
import { Header } from './editor/components/Header';
import { Toolbar } from './editor/components/Toolbar';
import { Viewport } from './editor/components/Viewport';
import { InspectorPanel } from './editor/components/InspectorPanel';
import { TutorialOverlay } from './editor/components/TutorialOverlay';
import {
  TRANSFORM, SPRITE, RIGID_BODY, COLLIDER,
  createTransform, createSprite, createRigidBody, createCollider,
} from './engine/ecs/Components';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { engine, mode, fps, play, stop, stepOnce } = useEngine(canvasRef);
  const [showTutorial, setShowTutorial] = useState(true);

  // ─── Create a demo scene on first mount ─────────────────────────
  const demoLoaded = useRef(false);
  useEffect(() => {
    const eng = engine.current;
    if (!eng || demoLoaded.current) return;
    demoLoaded.current = true;

    const world = eng.world;

    // Floor (static)
    const floor = world.createEntity('Floor');
    world.addComponent(floor, TRANSFORM, createTransform(0, 280));
    world.addComponent(floor, SPRITE, createSprite('default', 600, 30, [0.15, 0.22, 0.35, 1]));
    world.addComponent(floor, RIGID_BODY, createRigidBody('static'));
    world.addComponent(floor, COLLIDER, createCollider(600, 30));

    // Left wall
    const wallL = world.createEntity('Left Wall');
    world.addComponent(wallL, TRANSFORM, createTransform(-310, 0));
    world.addComponent(wallL, SPRITE, createSprite('default', 20, 560, [0.15, 0.22, 0.35, 1]));
    world.addComponent(wallL, RIGID_BODY, createRigidBody('static'));
    world.addComponent(wallL, COLLIDER, createCollider(20, 560));

    // Right wall
    const wallR = world.createEntity('Right Wall');
    world.addComponent(wallR, TRANSFORM, createTransform(310, 0));
    world.addComponent(wallR, SPRITE, createSprite('default', 20, 560, [0.15, 0.22, 0.35, 1]));
    world.addComponent(wallR, RIGID_BODY, createRigidBody('static'));
    world.addComponent(wallR, COLLIDER, createCollider(20, 560));

    // Dynamic box 1
    const box1 = world.createEntity('Cyan Box');
    world.addComponent(box1, TRANSFORM, createTransform(-60, -150));
    world.addComponent(box1, SPRITE, createSprite('default', 45, 45, [0, 0.9, 1, 1]));
    world.addComponent(box1, RIGID_BODY, createRigidBody('dynamic'));
    world.addComponent(box1, COLLIDER, createCollider(45, 45));

    // Dynamic box 2
    const box2 = world.createEntity('Pink Box');
    world.addComponent(box2, TRANSFORM, createTransform(40, -250));
    world.addComponent(box2, SPRITE, createSprite('default', 55, 55, [1, 0.18, 0.47, 1]));
    const rb2 = createRigidBody('dynamic');
    rb2.restitution = 0.5;
    world.addComponent(box2, RIGID_BODY, rb2);
    world.addComponent(box2, COLLIDER, createCollider(55, 55));

    // Dynamic box 3
    const box3 = world.createEntity('Purple Box');
    world.addComponent(box3, TRANSFORM, createTransform(100, -100));
    world.addComponent(box3, SPRITE, createSprite('default', 35, 35, [0.66, 0.33, 0.97, 1]));
    const rb3 = createRigidBody('dynamic');
    rb3.restitution = 0.7;
    world.addComponent(box3, RIGID_BODY, rb3);
    world.addComponent(box3, COLLIDER, createCollider(35, 35));

    // Platform
    const platform = world.createEntity('Platform');
    world.addComponent(platform, TRANSFORM, createTransform(-80, 100));
    world.addComponent(platform, SPRITE, createSprite('default', 180, 18, [0.97, 0.8, 0.08, 0.8]));
    world.addComponent(platform, RIGID_BODY, createRigidBody('static'));
    world.addComponent(platform, COLLIDER, createCollider(180, 18));

    eng.renderSystem.showColliders = true;
    eng.renderFrame();
  }, [engine]);

  // ─── Keyboard shortcut: Space to toggle play/stop ───────────────
  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement)) {
      e.preventDefault();
      if (mode === 'edit') play();
      else stop();
    }
  }, [mode, play, stop]);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  return (
    <>
      <Header
        engineRef={engine}
        mode={mode}
        fps={fps}
        onPlay={play}
        onStop={stop}
        onStep={stepOnce}
        onHelp={() => setShowTutorial(true)}
      />
      <main className="pe-main">
        <Toolbar engineRef={engine} />
        <Viewport
          canvasRef={canvasRef}
          engineRef={engine}
          mode={mode}
          fps={fps}
        />
        <InspectorPanel engineRef={engine} />
      </main>
      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}
