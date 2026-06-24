## 2024-05-24 - Frame-Rate Independent Physics Scaling
**UX/Gameplay Gap:** Movement, scaling, and growth logic was frame-dependent (using simple multipliers like `* 0.05 * timeScale`), causing game behavior to feel differently across diverse monitor refresh rates.
**Learning:** For delta-time scaling in smooth canvas animation loops, a static multiplier combined with `timeScale` introduces inaccuracies. When `timeScale` is a frame multiplier (e.g. ~1.0 at 60fps), you should use `1 - Math.pow(ratio, timeScale)` to correctly implement frame-rate independence while retaining the same lerp values.
**Prevention:** Replaced linear frame-dependent lerping with proper exponential decay functions based on `timeScale`: `current += (target - current) * (1 - Math.pow(1 - rate, timeScale))`.

## 2024-05-24 - Visual Affordances for Edible Objects
**UX/Gameplay Gap:** Players could not easily distinguish between objects that were edible and those that were too large to swallow, leading to a stiff and unintuitive game feel.
**Learning:** Visual clarity in mechanics ("affordances") reduces player cognitive load. Color alone is sometimes insufficient. Opacity changes act as strong indicators.
**Prevention:** Implemented a visual affordance where non-edible objects are drawn "ghosted" (lowered opacity to 40%).

## 2024-05-24 - Screen Shake Causes Dizziness
**UX/Gameplay Gap:** Constant screen shakes when swallowing multiple objects caused dizziness because in this dynamic arcade game the player is eating objects almost constantly.
**Learning:** For continuous mechanics (like eating in endless swarm), avoid screen shakes and global view disruption. Instead, focus on local object transformation and interactivity (like "spaghettification" and rapid spinning) to add impact without sickening the player.
**Prevention:** Avoid adding screen shakes to frequently occurring mechanics. Use local object-level transformations (like anisotropic scaling and extreme spinning).

## 2024-05-24 - Animation Duration and Spaghettification Direction
**UX/Gameplay Gap:** Complex local visual effects (spaghettification, spinning) were not noticeable by the player because the "falling" animation happened too fast, and the spaghettification stretched randomly rather than into the player.
**Learning:** Animation duration (i.e. shrinking speed) is just as important as the transformation logic itself. If an object disappears too fast, intricate animations will be missed entirely. Furthermore, transformation directions matter; objects must visually stretch toward the singularity (the player) to convey the "noodle effect" intuitively.
**Prevention:** Scaled down the shrinking rate (`obj.radius *= Math.pow(0.92, timeScale);`) slightly to allow visual effects time to play out. Calculated `angleToPlayer` during rendering to perfectly align the anisotropic scale transformation.

## 2024-05-18 - Camera Smoothing
**UX/Gameplay Gap:** Movement of the player creates instant camera snapping, causing motion sickness and jarring visuals.
**Learning:** The canvas was directly translating to `-player.x, -player.y`. This instantly reflects the physics object movement.
**Prevention:** Created a separate `camera` coordinate system that lerps towards the `player` position using delta-time safe exponential decay (`Math.pow(0.85, timeScale)`).
