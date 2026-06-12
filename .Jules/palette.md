## 2024-05-18 - [Accessibility on decorative characters in UI]
**Learning:** Screen readers will vocalize decorative Unicode characters (like `&#8592;` / left arrow) making labels sound confusing ("leftward arrow menu").
**Action:** Always wrap decorative Unicode characters in `<span aria-hidden="true">` when inside interactive elements like buttons, and provide a clear `aria-label` on the parent button.
