/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Physics System
   AABB collision detection and resolution, gravity, and velocity.
   Runs in the main thread (TypeScript) for now; designed for future
   migration to WASM (AssemblyScript).
   ════════════════════════════════════════════════════════════════════════ */

import { World, type Entity } from '../ecs/World';
import {
  TRANSFORM, RIGID_BODY, COLLIDER,
  type Transform, type RigidBody, type Collider,
} from '../ecs/Components';

// ─── CONSTANTS ──────────────────────────────────────────────────────
const GRAVITY = 980; // pixels/s² (similar to real-world feel at ~1px = 1cm)

// ─── AABB HELPERS ───────────────────────────────────────────────────
interface AABB {
  minX: number; minY: number;
  maxX: number; maxY: number;
}

function getAABB(t: Transform, c: Collider): AABB {
  const halfW = c.width / 2;
  const halfH = c.height / 2;
  const cx = t.x + c.offsetX;
  const cy = t.y + c.offsetY;
  return {
    minX: cx - halfW,
    minY: cy - halfH,
    maxX: cx + halfW,
    maxY: cy + halfH,
  };
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX &&
         a.minY < b.maxY && a.maxY > b.minY;
}

// ─── COLLISION INFO ─────────────────────────────────────────────────
interface CollisionInfo {
  entityA: Entity;
  entityB: Entity;
  overlapX: number;
  overlapY: number;
  normalX: number;
  normalY: number;
}

// ─── PHYSICS SYSTEM ─────────────────────────────────────────────────

export class PhysicsSystem {
  gravity = GRAVITY;
  private collisions: CollisionInfo[] = [];

  /** Run one physics step */
  update(world: World, dt: number): void {
    // 1. Apply gravity & integrate velocity
    this.integrateVelocities(world, dt);

    // 2. Detect & resolve collisions
    this.detectCollisions(world);
    this.resolveCollisions(world);
  }

  /** Get collisions from the last step (for debug rendering) */
  getCollisions(): ReadonlyArray<CollisionInfo> {
    return this.collisions;
  }

  // ─── Step 1: Integrate Velocities ─────────────────────────────────
  private integrateVelocities(world: World, dt: number): void {
    const entities = world.query(TRANSFORM, RIGID_BODY);
    for (const entity of entities) {
      const rb = world.getComponent<RigidBody>(entity, RIGID_BODY)!;
      if (rb.type === 'static') continue;

      const t = world.getComponent<Transform>(entity, TRANSFORM)!;

      // Apply gravity
      if (rb.type === 'dynamic') {
        rb.velocityY += this.gravity * rb.gravityScale * dt;
      }

      // Integrate position
      t.x += rb.velocityX * dt;
      t.y += rb.velocityY * dt;

      // Apply friction (simple damping)
      rb.velocityX *= (1 - rb.friction * dt);
    }
  }

  // ─── Step 2: Detect Collisions ────────────────────────────────────
  private detectCollisions(world: World): void {
    this.collisions = [];
    const entities = world.query(TRANSFORM, COLLIDER);

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const eA = entities[i];
        const eB = entities[j];

        const tA = world.getComponent<Transform>(eA, TRANSFORM)!;
        const tB = world.getComponent<Transform>(eB, TRANSFORM)!;
        const cA = world.getComponent<Collider>(eA, COLLIDER)!;
        const cB = world.getComponent<Collider>(eB, COLLIDER)!;

        const aabbA = getAABB(tA, cA);
        const aabbB = getAABB(tB, cB);

        if (!aabbOverlap(aabbA, aabbB)) continue;

        // Compute penetration
        const dx = (aabbA.minX + aabbA.maxX) / 2 - (aabbB.minX + aabbB.maxX) / 2;
        const dy = (aabbA.minY + aabbA.maxY) / 2 - (aabbB.minY + aabbB.maxY) / 2;
        const overlapX = (cA.width / 2 + cB.width / 2) - Math.abs(dx);
        const overlapY = (cA.height / 2 + cB.height / 2) - Math.abs(dy);

        if (overlapX <= 0 || overlapY <= 0) continue;

        // Find minimum penetration axis
        let normalX = 0, normalY = 0;
        if (overlapX < overlapY) {
          normalX = dx > 0 ? 1 : -1;
        } else {
          normalY = dy > 0 ? 1 : -1;
        }

        this.collisions.push({
          entityA: eA,
          entityB: eB,
          overlapX,
          overlapY,
          normalX,
          normalY,
        });
      }
    }
  }

  // ─── Step 3: Resolve Collisions ───────────────────────────────────
  private resolveCollisions(world: World): void {
    for (const col of this.collisions) {
      const tA = world.getComponent<Transform>(col.entityA, TRANSFORM)!;
      const tB = world.getComponent<Transform>(col.entityB, TRANSFORM)!;
      const cA = world.getComponent<Collider>(col.entityA, COLLIDER)!;
      const cB = world.getComponent<Collider>(col.entityB, COLLIDER)!;

      // Don't resolve if either is a trigger
      if (cA.isTrigger || cB.isTrigger) continue;

      const rbA = world.getComponent<RigidBody>(col.entityA, RIGID_BODY);
      const rbB = world.getComponent<RigidBody>(col.entityB, RIGID_BODY);

      const aIsDynamic = rbA && rbA.type === 'dynamic';
      const bIsDynamic = rbB && rbB.type === 'dynamic';

      // How much to push each body apart
      const separation = Math.abs(col.normalX) > 0 ? col.overlapX : col.overlapY;

      if (aIsDynamic && bIsDynamic) {
        // Both dynamic: split separation
        tA.x += col.normalX * separation * 0.5;
        tA.y += col.normalY * separation * 0.5;
        tB.x -= col.normalX * separation * 0.5;
        tB.y -= col.normalY * separation * 0.5;
      } else if (aIsDynamic) {
        tA.x += col.normalX * separation;
        tA.y += col.normalY * separation;
      } else if (bIsDynamic) {
        tB.x -= col.normalX * separation;
        tB.y -= col.normalY * separation;
      }

      // Velocity response
      if (aIsDynamic && rbA) {
        const restitution = rbA.restitution;
        if (col.normalX !== 0) rbA.velocityX = -rbA.velocityX * restitution;
        if (col.normalY !== 0) rbA.velocityY = -rbA.velocityY * restitution;
      }
      if (bIsDynamic && rbB) {
        const restitution = rbB.restitution;
        if (col.normalX !== 0) rbB.velocityX = -rbB.velocityX * restitution;
        if (col.normalY !== 0) rbB.velocityY = -rbB.velocityY * restitution;
      }
    }
  }
}
