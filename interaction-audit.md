# Interaction State Audit

> Covers: Default, Hover, Active/Press, Selected/Checked/Open, and Disabled states across all interactive UI atoms and molecules.

| Element                      | Default                                            | Hover                                                                   | Active / Press                                           | Selected / Checked / Open                               | Disabled                                           |
| ---------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------- |
| **Button** `primary`         | `bg-slate-600`, white text                         | `brightness-125`                                                        | `scale-[0.96]`                                           | —                                                       | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Button** `secondary`       | `bg-(--signature-color)`, white text               | `brightness-125`                                                        | `scale-[0.96]`                                           | —                                                       | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Button** `danger`          | `bg-slate-600`, white text                         | `brightness-125` + red bg + red glow                                    | `scale-[0.96]`                                           | —                                                       | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Button** `invisible`       | `bg-transparent`, `text-slate-600`                 | `text-slate-50` + `brightness-125`                                      | `scale-[0.96]`                                           | —                                                       | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Button** `flank`           | `bg-transparent`, `text-slate-50`, `opacity-60`    | `opacity-100` + `scale-[1.02]`                                          | `scale-[0.96]`                                           | —                                                       | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Dropdown trigger**         | `bg-(--signature-color)`, white text, `rounded-xl` | `brightness-125`                                                        | `scale-[0.96]`                                           | `brightness-110` (open)                                 | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Dropdown item**            | `bg-(--signature-color)`, `text-[#f2f7fa]`         | `brightness-125` + `text-white`                                         | —                                                        | `brightness-110`                                        | `opacity-30` + `grayscale` + `pointer-events-none` |
| **Toggle track** (unchecked) | `bg-neutral-900/60` = `rgb(23 23 23 / 0.6)`        | `brightness-125`                                                        | —                                                        | `bg-(--signature-color)`                                | `opacity-30` + `grayscale`                         |
| **Toggle track** (checked)   | `bg-(--signature-color)`                           | `brightness-125`                                                        | —                                                        | _(is the selected state)_                               | `opacity-30` + `grayscale`                         |
| **Toggle thumb**             | `bg-slate-50`, pill                                | —                                                                       | —                                                        | `bg-white` + white glow shadow                          | —                                                  |
| **Toggle label**             | `text-(--signature-color)` + text shadow           | `brightness-125`                                                        | —                                                        | —                                                       | —                                                  |
| **Slider label**             | `text-(--signature-color)` + text shadow           | `brightness-125`                                                        | —                                                        | —                                                       | `DISABLED` text shown                              |
| **Slider filled track**      | `var(--signature-color)` gradient portion          | `brightness-125`                                                        | —                                                        | _(is the filled state)_                                 | `opacity-30` + `grayscale`                         |
| **Slider empty track**       | `var(--empty-fill)` = `rgb(23 23 23 / 0.6)` ✅     | `brightness-125`                                                        | —                                                        | —                                                       | `opacity-30` + `grayscale`                         |
| **Slider thumb**             | `bg-slate-50` + drop shadow ✅                     | —                                                                       | —                                                        | —                                                       | `bg-[#555d66]` + `opacity-30`                      |
| **Color Swatch**             | Solid `background-color: var(--swatch-color)`      | `brightness-125` + shadow                                               | `scale-[0.96]` ✅                                        | `scale-[1.1]` + `brightness-110` + `outline-white` ring | `opacity-50` + `grayscale`                         |
| **Entity Card**              | Transparent border, flat                           | `scale-(--scale-lift)` + `brightness-(--brightness-glow)` + border glow | `scale-(--scale-sink)` + `brightness-(--brightness-dim)` | —                                                       | `opacity-50` + `brightness-75` + `grayscale`       |

---

## Key Gaps

| #   | Element           | Gap                                          | Suggested Fix                                                      |
| --- | ----------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| 1   | **Slider thumb**  | No selected/active state unlike Toggle thumb | Add `bg-white` when at non-zero value, like Toggle's checked state |
| 2   | **Toggle thumb**  | No hover or press state                      | Low priority — toggle pill hover covers it                         |
| 3   | **Dropdown item** | No active/press state                        | Consider `active:brightness-90`                                    |

---

## Consistency Notes

- **`cursor-not-allowed` vs `pointer-events-none`**: All buttons now use `pointer-events-none` on disabled, which suppresses cursor feedback entirely. These are mutually exclusive — pick one system-wide if you want `cursor-not-allowed` to be visible.
- **Brightness standard**: `brightness-125` on hover is now consistent across all buttons, dropdown, toggle, slider, and color swatch. ✅
- **Press standard**: `scale-[0.96]` is the universal press pattern for buttons, dropdown trigger, and now color swatches. Still absent from toggle and slider (low priority).
- **Selected standard**: No unified pattern — dropdown uses `brightness-110`, swatch uses `scale-[1.1]` + outline, toggle uses `bg-(--signature-color)`. Intentional since they serve different UX contexts.
- **Track default parity**: Toggle unchecked track and Slider empty track both use `rgb(23 23 23 / 0.6)`. ✅
- **Thumb parity**: Toggle thumb and Slider thumb both default to `bg-slate-50`. ✅
