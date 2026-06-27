/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Engine Facade
   Top-level facade that wires together the ECS, renderer, physics,
   animation, and game loop into a single manageable object.
   ════════════════════════════════════════════════════════════════════════ */

import { World, type WorldSnapshot } from './ecs/World';
import { GameLoop } from './core/GameLoop';
import { Camera } from './core/Camera';
import { Renderer } from './renderer/Renderer';
import { PhysicsSystem } from './systems/PhysicsSystem';
import { AnimationSystem } from './systems/AnimationSystem';
import { RenderSystem } from './systems/RenderSystem';

export type EngineMode = 'edit' | 'play';

export class Engine {
  readonly world: World;
  readonly camera: Camera;
  readonly renderer: Renderer;
  readonly gameLoop: GameLoop;
  readonly physics: PhysicsSystem;
  readonly animation: AnimationSystem;
  readonly renderSystem: RenderSystem;

  private _mode: EngineMode = 'edit';
  private savedSnapshot: WorldSnapshot | null = null;

  // Callbacks for the editor
  onModeChange?: (mode: EngineMode) => void;
  onFrameEnd?: (fps: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.world = new World();
    this.camera = new Camera();
    this.renderer = new Renderer(canvas);
    this.gameLoop = new GameLoop();
    this.physics = new PhysicsSystem();
    this.animation = new AnimationSystem();
    this.renderSystem = new RenderSystem();

    // Register the main update loop
    this.gameLoop.addSystem(this.tick);
  }

  get mode(): EngineMode { return this._mode; }

  /** Resize the engine viewport */
  resize(width: number, height: number): void {
    this.renderer.resize(width, height);
    this.camera.setViewport(width, height);
  }

  /** Switch to Play mode: saves the world state and starts physics */
  play(): void {
    if (this._mode === 'play') return;
    this.savedSnapshot = this.world.serialize();
    this._mode = 'play';
    this.gameLoop.start();
    this.onModeChange?.('play');
  }

  /** Switch to Edit mode: restores the saved world state */
  stop(): void {
    if (this._mode === 'edit') return;
    this.gameLoop.stop();
    this._mode = 'edit';
    if (this.savedSnapshot) {
      this.world.deserialize(this.savedSnapshot);
      this.savedSnapshot = null;
    }
    // Render one frame so the editor view updates
    this.renderSystem.update(this.world, this.renderer, this.camera);
    this.onModeChange?.('edit');
  }

  /** Render a single frame (used in edit mode) */
  renderFrame(): void {
    this.renderSystem.update(this.world, this.renderer, this.camera);
  }

  /** Single physics step (for editor "step" button) */
  stepOnce(): void {
    if (this._mode !== 'play') {
      // Temporarily enter play-like mode for a single step
      this.physics.update(this.world, 1 / 60);
      this.animation.update(this.world, 1 / 60);
      this.renderFrame();
    }
  }

  /** Destroy the engine and clean up resources */
  destroy(): void {
    this.gameLoop.stop();
    this.renderer.destroy();
  }

  // ─── Main tick (called by GameLoop at fixed timestep) ─────────────
  private tick = (dt: number): void => {
    // Only run physics & animation in play mode
    if (this._mode === 'play') {
      this.physics.update(this.world, dt);
      this.animation.update(this.world, dt);
    }

    // Always render
    this.renderSystem.update(this.world, this.renderer, this.camera);

    this.onFrameEnd?.(this.gameLoop.fps);
  };
}

// Re-export everything for convenient access
export { World, type WorldSnapshot, type Entity } from './ecs/World';
export {
  TRANSFORM, SPRITE, RIGID_BODY, COLLIDER, ANIMATOR, TAG,
  createTransform, createSprite, createRigidBody, createCollider, createAnimator, createTag,
  type Transform, type Sprite, type RigidBody, type Collider, type Animator, type BodyType,
} from './ecs/Components';
export { Camera } from './core/Camera';
export { GameLoop } from './core/GameLoop';
export { Renderer } from './renderer/Renderer';
export { PhysicsSystem } from './systems/PhysicsSystem';
export { AnimationSystem } from './systems/AnimationSystem';
export { RenderSystem } from './systems/RenderSystem';
