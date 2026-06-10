## 2024-05-24 - Frame-Rate Independent Physics Scaling
**UX/Gameplay Gap:** Movement, scaling, and growth logic was frame-dependent (using simple multipliers like `* 0.05 * timeScale`), causing game behavior to feel differently across diverse monitor refresh rates.
**Learning:** For delta-time scaling in smooth canvas animation loops, a static multiplier combined with `timeScale` introduces inaccuracies. When `timeScale` is a frame multiplier (e.g. ~1.0 at 60fps), you should use `1 - Math.pow(ratio, timeScale)` to correctly implement frame-rate independence while retaining the same lerp values.
**Prevention:** Replaced linear frame-dependent lerping with proper exponential decay functions based on `timeScale`: `current += (target - current) * (1 - Math.pow(1 - rate, timeScale))`.

## 2024-05-24 - Visual Affordances for Edible Objects
**UX/Gameplay Gap:** Players could not easily distinguish between objects that were edible and those that were too large to swallow, leading to a stiff and unintuitive game feel.
**Learning:** Visual clarity in mechanics ("affordances") reduces player cognitive load. Color alone is sometimes insufficient. Opacity changes act as strong indicators.
**Prevention:** Implemented a visual affordance where non-edible objects are drawn "ghosted" (lowered opacity to 40%).
