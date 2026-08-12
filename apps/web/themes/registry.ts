import "server-only";
import type { Skin } from "./types";
import { defaultSkin } from "./default/theme";
import { minimalSkin } from "./minimal/theme";

/**
 * Static imports, not a dynamic `import()` by name. A skin resolved at
 * runtime is invisible to the bundler, which means every skin ships to every
 * visitor and none of them can be tree-shaken or typechecked as a unit.
 * Adding a skin is a one-line edit here — that is a feature, not friction.
 */
const SKINS: Record<string, Skin> = {
  [defaultSkin.id]: defaultSkin,
  [minimalSkin.id]: minimalSkin,
};

export const SKIN_IDS = Object.keys(SKINS);

/**
 * The skin this deployment renders. Set `SKIN` in the environment; an unknown
 * or missing value falls back to `default` rather than failing the render,
 * because a typo in an env var should not take the storefront down.
 */
export function activeSkin(): Skin {
  return SKINS[process.env.SKIN ?? ""] ?? defaultSkin;
}
