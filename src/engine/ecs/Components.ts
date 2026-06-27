/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Component Definitions
   All component types used by the engine systems.
   ════════════════════════════════════════════════════════════════════════ */

// ─── COMPONENT NAMES (string keys for the ECS) ─────────────────────
export const TRANSFORM  = 'Transform';
export const SPRITE     = 'Sprite';
export const RIGID_BODY = 'RigidBody';
export const COLLIDER   = 'Collider';
export const ANIMATOR   = 'Animator';
export const TAG        = 'Tag';

// ─── Transform ──────────────────────────────────────────────────────
export interface Transform {
  x: number;
  y: number;
  rotation: number;   // radians
  scaleX: number;
  scaleY: number;
}

export function createTransform(x = 0, y = 0): Transform {
  return { x, y, rotation: 0, scaleX: 1, scaleY: 1 };
}

// ─── Sprite ─────────────────────────────────────────────────────────
export interface Sprite {
  textureId: string;    // key into the texture atlas
  width: number;        // display width in world units
  height: number;       // display height in world units
  tint: [number, number, number, number]; // RGBA 0-1
  /** UV coordinates within the atlas (set by animation system or manually) */
  u0: number; v0: number;
  u1: number; v1: number;
  visible: boolean;
  zIndex: number;
}

export function createSprite(
  textureId: string,
  width: number,
  height: number,
  tint: [number, number, number, number] = [1, 1, 1, 1]
): Sprite {
  return {
    textureId,
    width,
    height,
    tint,
    u0: 0, v0: 0, u1: 1, v1: 1,
    visible: true,
    zIndex: 0,
  };
}

// ─── RigidBody ──────────────────────────────────────────────────────
export type BodyType = 'dynamic' | 'static' | 'kinematic';

export interface RigidBody {
  type: BodyType;
  velocityX: number;
  velocityY: number;
  mass: number;
  gravityScale: number;
  friction: number;
  restitution: number; // bounciness 0-1
}

export function createRigidBody(type: BodyType = 'dynamic'): RigidBody {
  return {
    type,
    velocityX: 0,
    velocityY: 0,
    mass: 1,
    gravityScale: 1,
    friction: 0.3,
    restitution: 0.2,
  };
}

// ─── Collider (AABB) ────────────────────────────────────────────────
export interface Collider {
  /** Offset from the entity's Transform position */
  offsetX: number;
  offsetY: number;
  /** Size of the AABB */
  width: number;
  height: number;
  /** Whether this collider triggers events but doesn't resolve */
  isTrigger: boolean;
}

export function createCollider(width: number, height: number): Collider {
  return {
    offsetX: 0,
    offsetY: 0,
    width,
    height,
    isTrigger: false,
  };
}

// ─── Animator ───────────────────────────────────────────────────────
export interface AnimationClip {
  name: string;
  /** Array of frame UVs: [u0, v0, u1, v1] */
  frames: [number, number, number, number][];
  /** Duration per frame in seconds */
  frameDuration: number;
  loop: boolean;
}

export interface Animator {
  clips: Record<string, AnimationClip>;
  currentClip: string;
  currentFrame: number;
  elapsed: number;
  playing: boolean;
}

export function createAnimator(): Animator {
  return {
    clips: {},
    currentClip: '',
    currentFrame: 0,
    elapsed: 0,
    playing: false,
  };
}

// ─── Tag ────────────────────────────────────────────────────────────
export interface Tag {
  tags: string[];
}

export function createTag(...tags: string[]): Tag {
  return { tags };
}
