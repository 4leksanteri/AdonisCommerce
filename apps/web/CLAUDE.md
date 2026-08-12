@AGENTS.md
@HEROUI_AGENTS.md

# Skins

`themes/` holds developer-defined looks. `SKIN` in the environment picks one;
`themes/registry.ts` resolves it through static imports.

**A skin is not light/dark.** HeroUI owns `data-theme` for colour scheme, so
skins live on `data-skin` and the two are independent — every skin has to
define its dark values too.

What a skin may change is exactly what `themes/skin.css` bridges into Tailwind
(`rounded-card`, `max-w-page`, `max-w-reading`, `font-sans`) plus HeroUI's
*unprefixed* colour variables (`--surface`, not `--color-surface` — the
library maps one to the other itself).

Anything hardcoded in a component is a thing a skin cannot change. When a
design needs a new axis, add a token to the bridge first; do not fork the
component. There is deliberately no per-skin `components/` directory.
