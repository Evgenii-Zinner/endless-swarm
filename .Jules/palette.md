## 2024-05-18 - [Accessibility on decorative characters in UI]
**Learning:** Screen readers will vocalize decorative Unicode characters (like `&#8592;` / left arrow) making labels sound confusing ("leftward arrow menu").
**Action:** Always wrap decorative Unicode characters in `<span aria-hidden="true">` when inside interactive elements like buttons, and provide a clear `aria-label` on the parent button.

## 2026-06-19 - Explicit visual cues for keyboard shortcuts
**Learning:** Power users often discover hidden keyboard shortcuts by trial and error, but adding explicit, low-opacity visual cues (like an `ESC` pill next to a menu button) makes these shortcuts discoverable for all users and establishes them as first-class citizens of the UI, rather than hidden developer features.
**Action:** When adding global keyboard shortcuts (like Escape to menu or enter to submit), provide a subtle visual hint in the corresponding UI element.
