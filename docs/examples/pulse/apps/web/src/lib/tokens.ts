/**
 * Warm Forest design tokens — single source of truth for CSS variables in `globals.css`.
 *
 * **shadcn HSL format:** store only the inner components (`"H S% L%"`) without an `hsl()`
 * wrapper. In CSS, reference as `hsl(var(--primary))` or `hsl(var(--primary) / 50%)`.
 * Saturation and lightness use `%`; hue is a plain number (0–360).
 */
export const TOKENS = {
  light: {
    prototype: {
      colorPrimary: "145 33% 26%", // #2D5A40
      colorPrimaryHover: "158 30% 15%", // #1A3028
      colorPrimaryLight: "147 33% 36%", // #3D7A58
      colorPrimaryContainer: "140 29% 92%", // #E4F0E8
      colorOnPrimaryContainer: "158 30% 15%", // #1A3028
      colorSecondary: "40 54% 50%", // #C4973A
      colorSecondaryHover: "41 61% 40%", // #A37D28
      colorSecondaryLight: "40 72% 67%", // #E8C070
      colorSecondaryContainer: "40 69% 87%", // #F5E6C8
      colorOnSecondaryContainer: "37 64% 22%", // #5C4014
      colorBg: "37 39% 94%", // #F5F0E8
      colorSurface: "0 0% 100%", // #FFFFFF
      colorSurfaceVariant: "41 41% 88%", // #EDE5D4
      colorSurfaceContainer: "41 39% 84%", // #E6DCC6
      colorSurfaceDim: "40 32% 78%", // #D8CCB4
      colorInk: "158 30% 15%", // #1A3028
      colorInk2: "142 10% 32%", // #4A5A50
      colorInk3: "43 7% 51%", // #8A8578
      colorSuccess: "142 56% 23%", // #1A5C32
      colorSuccessContainer: "140 29% 92%", // #E4F0E8
      colorError: "0 51% 46%", // #B23A3A
      colorErrorContainer: "0 51% 92%", // #F5E0E0
      colorWarning: "32 63% 42%", // #B07028
      colorWarningContainer: "40 69% 87%", // #F5E6C8
      colorInfo: "198 42% 30%", // #2D5A6E
      colorInfoContainer: "203 35% 91%", // #E0EAF0
      colorBrandBand: "158 30% 15%", // #1A3028
      colorOnBrandBand: "0 0% 100%", // white
      colorBrandBandMuted: "140 22% 78%",
      colorBrandCtaBand: "145 33% 26%", // --color-primary
      colorOnBrandCtaBand: "0 0% 100%", // white
      colorHeroGlow: "140 29% 92%", // --color-primary-container
    },
    shadcn: {
      background: "37 39% 94%", // --color-bg
      foreground: "158 30% 15%", // --color-ink
      card: "0 0% 100%", // --color-surface
      cardForeground: "158 30% 15%", // --color-ink
      popover: "0 0% 100%", // --color-surface
      popoverForeground: "158 30% 15%", // --color-ink
      primary: "145 33% 26%", // --color-primary
      primaryForeground: "0 0% 100%", // white
      secondary: "40 69% 87%", // --color-secondary-container
      secondaryForeground: "37 64% 22%", // --color-on-secondary-container
      muted: "41 41% 88%", // --color-surface-variant
      mutedForeground: "142 10% 32%", // --color-ink-2
      accent: "140 29% 92%", // --color-primary-container
      accentForeground: "158 30% 15%", // --color-on-primary-container
      destructive: "0 51% 46%", // --color-error
      destructiveForeground: "0 0% 100%", // white
      border: "40 32% 78%", // --color-surface-dim
      input: "40 32% 78%", // --color-surface-dim
      ring: "145 33% 26%", // --color-primary
      radius: "0.75rem", // --radius-md (12px)
    },
  },
  dark: {
    prototype: {
      colorPrimary: "145 25% 55%", // #6EA886
      colorPrimaryHover: "145 31% 64%", // #87C09F
      colorPrimaryLight: "145 31% 64%", // #87C09F
      colorPrimaryContainer: "144 30% 17%", // #1F3A2A
      colorOnPrimaryContainer: "140 30% 83%", // #C5E0CE
      colorSecondary: "40 72% 67%", // #E8C070
      colorSecondaryHover: "41 82% 78%", // #F5D89A
      colorSecondaryLight: "41 82% 78%", // #F5D89A
      colorSecondaryContainer: "38 51% 16%", // #3D2E14
      colorOnSecondaryContainer: "40 69% 87%", // #F5E6C8
      colorBg: "156 26% 7%", // #0E1814
      colorSurface: "146 21% 13%", // #1A2820
      colorSurfaceVariant: "140 17% 17%", // #243329
      colorSurfaceContainer: "142 17% 21%", // #2D4034
      colorSurfaceDim: "147 19% 30%", // #3D5A4A
      colorInk: "45 44% 89%", // #F0EAD8
      colorInk2: "138 10% 74%", // #B5C2B9
      colorInk3: "138 8% 62%", // bumped for small-text AA on dark surfaces
      colorSuccess: "145 72% 67%", // #6EE7A0
      colorSuccessContainer: "131 30% 17%", // #1F3A24
      colorError: "0 100% 76%", // #FF8585
      colorErrorContainer: "0 30% 17%", // #3A1F1F
      colorWarning: "38 87% 69%", // #F5C26B
      colorWarningContainer: "39 38% 16%", // #3A2F1A
      colorInfo: "202 80% 71%", // #7AC4F0
      colorInfoContainer: "203 38% 16%", // #1A2E3A
      colorBrandBand: "146 21% 13%", // --color-surface
      colorOnBrandBand: "45 44% 89%", // --color-ink
      colorBrandBandMuted: "138 10% 74%", // --color-ink-2
      colorBrandCtaBand: "142 17% 21%", // --color-surface-container
      colorOnBrandCtaBand: "45 44% 89%", // --color-ink
      colorHeroGlow: "145 25% 55%", // --color-primary
    },
    shadcn: {
      background: "156 26% 7%", // --color-bg
      foreground: "45 44% 89%", // --color-ink
      card: "146 21% 13%", // --color-surface
      cardForeground: "45 44% 89%", // --color-ink
      popover: "146 21% 13%", // --color-surface
      popoverForeground: "45 44% 89%", // --color-ink
      primary: "145 25% 55%", // --color-primary
      primaryForeground: "45 44% 89%", // --color-ink
      secondary: "38 51% 16%", // --color-secondary-container
      secondaryForeground: "40 69% 87%", // --color-on-secondary-container
      muted: "140 17% 17%", // --color-surface-variant
      mutedForeground: "138 10% 74%", // --color-ink-2
      accent: "144 30% 17%", // --color-primary-container
      accentForeground: "140 30% 83%", // --color-on-primary-container
      destructive: "0 100% 76%", // --color-error
      destructiveForeground: "0 0% 100%", // white
      border: "147 19% 30%", // --color-surface-dim
      input: "147 19% 30%", // --color-surface-dim
      ring: "145 25% 55%", // --color-primary
      radius: "0.75rem", // --radius-md (12px)
    },
  },
} as const;

export type ThemeMode = keyof typeof TOKENS;
export type PrototypeTokenKey = keyof typeof TOKENS.light.prototype;
export type ShadcnTokenKey = keyof typeof TOKENS.light.shadcn;
export type TokenKey = PrototypeTokenKey | ShadcnTokenKey;
