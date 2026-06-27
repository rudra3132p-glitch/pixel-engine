/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — Animation System
   Updates sprite UV coordinates based on animation clips.
   ════════════════════════════════════════════════════════════════════════ */

import { World } from '../ecs/World';
import { SPRITE, ANIMATOR, type Sprite, type Animator } from '../ecs/Components';

export class AnimationSystem {
  update(world: World, dt: number): void {
    const entities = world.query(SPRITE, ANIMATOR);

    for (const entity of entities) {
      const animator = world.getComponent<Animator>(entity, ANIMATOR)!;
      if (!animator.playing || !animator.currentClip) continue;

      const clip = animator.clips[animator.currentClip];
      if (!clip || clip.frames.length === 0) continue;

      // Advance time
      animator.elapsed += dt;

      // Check if frame needs to advance
      if (animator.elapsed >= clip.frameDuration) {
        animator.elapsed -= clip.frameDuration;
        animator.currentFrame++;

        if (animator.currentFrame >= clip.frames.length) {
          if (clip.loop) {
            animator.currentFrame = 0;
          } else {
            animator.currentFrame = clip.frames.length - 1;
            animator.playing = false;
          }
        }
      }

      // Update sprite UVs
      const frame = clip.frames[animator.currentFrame];
      const sprite = world.getComponent<Sprite>(entity, SPRITE)!;
      sprite.u0 = frame[0];
      sprite.v0 = frame[1];
      sprite.u1 = frame[2];
      sprite.v1 = frame[3];
    }
  }
}
