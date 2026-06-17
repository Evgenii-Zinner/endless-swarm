## 2024-05-24 - Frame-Rate Independent Physics Scaling
**UX/Gameplay Gap:** Movement, scaling, and growth logic was frame-dependent (using simple multipliers like `* 0.05 * timeScale`), causing game behavior to feel differently across diverse monitor refresh rates.
**Learning:** For delta-time scaling in smooth canvas animation loops, a static multiplier combined with `timeScale` introduces inaccuracies. When `timeScale` is a frame multiplier (e.g. ~1.0 at 60fps), you should use `1 - Math.pow(ratio, timeScale)` to correctly implement frame-rate independence while retaining the same lerp values.
**Prevention:** Replaced linear frame-dependent lerping with proper exponential decay functions based on `timeScale`: `current += (target - current) * (1 - Math.pow(1 - rate, timeScale))`.

## 2024-05-24 - Visual Affordances for Edible Objects
**UX/Gameplay Gap:** Players could not easily distinguish between objects that were edible and those that were too large to swallow, leading to a stiff and unintuitive game feel.
**Learning:** Visual clarity in mechanics ("affordances") reduces player cognitive load. Color alone is sometimes insufficient. Opacity changes act as strong indicators.
**Prevention:** Implemented a visual affordance where non-edible objects are drawn "ghosted" (lowered opacity to 40%).

## 2024-05-24 - Screen Shake Juice and "Gulp" Affordance
**UX/Gameplay Gap:** When the black hole devours objects, there was minimal visceral feedback. The removal of the object felt static, lacking the impact expected from an arcade game.
**Learning:** Screen space considerations are crucial when adding juice to scaling games. Adding a flat radius bump or screen shake value without accounting for camera zoom creates wildly inconsistent game feel across different tiers. Also, slightly increasing the player's radius when consuming creates an organic "gulp" effect that communicates the action viscerally.
**Prevention:** Scaled camera shake intensity relative to the original size of the object multiplied by the current `cameraScale`. Also decayed the screen shake exponentially over delta time using `timeScale` to preserve frame-rate independence.
