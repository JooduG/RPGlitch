# UI Regression Fixes

This track focuses on bringing the UI back to the required standard as defined in `05-standards.md`, fixing regressions identified by comparing the live app with the `ui_fixes` reference images.

- [ ] Investigate and restore the **2% grain overlay** texture on backgrounds (Profile Card, App Background) per Visual Law 3.
- [ ] Investigate and restore **Soft Depth (Layered Shadows)** and remove borders on UI elements (Profile Card, pill, placeholders) per Visual Law 1 & 2.
- [ ] Fix the **Control Panel** interaction (Settings gear click on the Storyboard Pill is currently unresponsive).
- [ ] Fix the **Storyboard Pill** styling (currently a minimal dark capsule, needs to match `good_storyboard_pill.png` and add the Snappy Curve).
- [ ] Fix the **Skeleton State** for empty card slots (e.g., Select AI Character, Select Fractal) to match `good_skeleton.png`.
- [ ] Investigate why the **Left Wing** and **Dev Wing** panels are not rendering or are hidden, and restore them.
- [ ] Ensure **Snappy Curve** transitions are applied to interactive elements.
