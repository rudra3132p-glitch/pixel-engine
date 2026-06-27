/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Render System
   Collects all renderable entities and pushes them to the WebGL batcher.
   ════════════════════════════════════════════════════════════════════════ */

import { World } from '../ecs/World';
import { TRANSFORM, SPRITE, COLLIDER, type Transform, type Sprite, type Collider } from '../ecs/Components';
import { Renderer } from '../renderer/Renderer';
import { Camera } from '../core/Camera';

export class RenderSystem {
  showColliders = false; // Debug toggle

  update(world: World, renderer: Renderer, camera: Camera): void {
    camera.update();
    renderer.beginFrame();

    // ── Render sprites ──────────────────────────────────────────────
    const renderables = world.query(TRANSFORM, SPRITE);

    // Sort by zIndex for correct layering
    renderables.sort((a, b) => {
      const sa = world.getComponent<Sprite>(a, SPRITE)!;
      const sb = world.getComponent<Sprite>(b, SPRITE)!;
      return sa.zIndex - sb.zIndex;
    });

    for (const entity of renderables) {
      const t = world.getComponent<Transform>(entity, TRANSFORM)!;
      const s = world.getComponent<Sprite>(entity, SPRITE)!;
      if (!s.visible) continue;

      renderer.drawSprite({
        x: t.x,
        y: t.y,
        width: s.width * t.scaleX,
        height: s.height * t.scaleY,
        rotation: t.rotation,
        u0: s.u0, v0: s.v0,
        u1: s.u1, v1: s.v1,
        tint: s.tint,
        zIndex: s.zIndex,
      });
    }

    // ── Debug: render colliders ─────────────────────────────────────
    if (this.showColliders) {
      const colliderEntities = world.query(TRANSFORM, COLLIDER);
      for (const entity of colliderEntities) {
        const t = world.getComponent<Transform>(entity, TRANSFORM)!;
        const c = world.getComponent<Collider>(entity, COLLIDER)!;
        renderer.drawRect(
          t.x + c.offsetX,
          t.y + c.offsetY,
          c.width,
          c.height,
          c.isTrigger
            ? [0, 1, 0.5, 0.25] // green for triggers
            : [0, 0.9, 1, 0.25] // cyan for solid
        );
      }
    }

    renderer.endFrame(camera);
  }
}
