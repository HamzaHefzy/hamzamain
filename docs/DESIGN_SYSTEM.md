# Anchor design system

This file is the contract for keeping Anchor visually intentional and avoiding rushed or inconsistent UI.

## Principles

- Clarity over novelty.
- Calm enterprise visual language.
- No decorative gradients, glow effects, sparkles, emoji-as-interface, or gratuitous motion.
- No fake testimonials, placeholder claims, decorative social icons, or non-functional controls.
- Student-support workflows stay visually and conceptually separate from aggregate finance scenarios.

## Spacing

Use the 4-point scale defined in `app/globals.css`:

- 4
- 8
- 12
- 16
- 24
- 32
- 40
- 48

Do not introduce arbitrary spacing unless a documented layout constraint requires it.

## Typography

Display/heading stack:
`Avenir Next`, `Helvetica Neue`, Arial, sans-serif.

Body stack:
system UI (`-apple-system`, BlinkMacSystemFont, `Segoe UI`, Helvetica, Arial, sans-serif).

Headings use a consistent hierarchy, restrained weight, and compact tracking. Body copy favors readable line length and 1.5–1.65 line height.

## Color

Primary surfaces are neutral light gray/white. The brand uses a restrained forest green and mint accent. Warning and danger colors are semantic only.

Do not add neon colors or novelty gradients.

## Components

Primary UI components use a 12px radius. Pill-shaped status indicators are an explicit exception. Cards use one subtle elevation token only.

Buttons and links must be functional. Never add a decorative control that does not perform an action.

## Motion

Motion is optional and minimal. Only use motion to communicate state or user intent. Respect `prefers-reduced-motion`.

## Loading and empty states

Async routes must surface a loading state. Empty or invalid routes must provide a clear recovery action.

## Responsive behavior

Build mobile behavior as part of each component, not as a final patch. Tables may scroll horizontally. Navigation becomes compact and horizontally scrollable. Multi-column analytical layouts collapse to one column.

## Accessibility

- Preserve visible keyboard focus.
- Use semantic headings and landmarks.
- Label tables and interactive controls.
- Maintain strong contrast.
- Never encode meaning through color alone.

## Metadata

Every production-facing route should have meaningful title/description metadata. The application includes a favicon and OpenGraph image. Remove placeholder text before release.
