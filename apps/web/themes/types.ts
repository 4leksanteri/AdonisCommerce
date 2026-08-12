/**
 * A skin is a named look for the storefront, defined in the codebase rather
 * than configured by anyone at runtime.
 *
 * Called a *skin* and not a *theme* on purpose: HeroUI has already claimed
 * `data-theme` for light/dark, and these are two independent axes — every
 * skin has to work in both colour schemes. Overloading one attribute for
 * both would make "minimal" and "dark" mutually exclusive, which is wrong.
 *
 * Deliberately thin for now. Everything a skin currently controls is a CSS
 * custom property in its own `skin.css`, because CSS does that job better
 * than JavaScript can: no runtime cost, no flash before hydration, and the
 * cascade already handles light/dark. This object exists for the decisions
 * CSS *cannot* express — which blocks the home page is built from, how many
 * columns a grid gets, whether a price sits above or below a title. Those
 * arrive with the first design that needs them, not before.
 */
export type Skin = {
  /** Matches the directory name and the `data-skin` attribute value. */
  id: string;
  /** For the developer-facing listing; never shown to shoppers. */
  name: string;
  /** One line on what this skin is for, so the next person knows. */
  description: string;
};
