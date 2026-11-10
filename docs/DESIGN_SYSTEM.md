# Happyforge interface design system

This is the visual source of truth for the Happyforge web workspace.

## Direction

**Graphite engineering studio** — an original, mobile-first interface for a serious AI coding environment. It should feel like a focused developer tool, not a generic AI landing page.

- Base: near-black graphite (#080a0d), with layered charcoal surfaces.
- Primary accent: restrained acid lime (#c2f970) for primary actions and active states.
- Secondary accent: muted cyan (#82d9e8) for depth and technical detail.
- Typography: system sans for interface text; compact uppercase labels only for metadata.
- Surface treatment: subtle translucent panels, fine borders, restrained blur and realistic shadow.
- Layout: compact persistent navigation, wide editorial workspace, responsive two-column cards.

## Interaction principles

- Every visible button needs a real action or a clear disabled/coming-soon state.
- Hover states should be subtle and purposeful; touch interactions must not depend on hover.
- Primary actions use clear contrast, pressed feedback and visible focus rings.
- Motion should communicate hierarchy or state, not decorate every element.
- Respect prefers-reduced-motion; the ambient scene becomes static when reduced motion is requested.
- Keep touch targets comfortable on small screens and avoid horizontal overflow.

## Motion language

The app uses the Motion for React package (motion/react).

- Page entrance: short opacity + vertical movement, with restrained stagger.
- Cards: small spring-based lift and slight 3D tilt on hover.
- Ambient scene: CSS-built orb/rings with pointer-reactive parallax, spring smoothing and no WebGL dependency.
- No perpetual high-frequency movement; no animation should block task entry or scrolling.

## Accessibility and responsive behavior

- Preserve semantic headings, button labels and form labels.
- Provide visible keyboard focus.
- Keep text readable against dark surfaces.
- Avoid communicating runtime state by color alone; pair indicators with text.
- Respect reduced motion.
- Validate at narrow mobile widths and desktop widths before release.

## Source inspiration

- Motion: https://github.com/motiondivision/motion
- UI/UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

These references inform implementation patterns; Happyforge keeps its own original visual identity.

## Shared sign-in and workspace identity

The sign-in and authenticated workspace use one shared identity mark: a four-tile forge symbol in lime, violet, cyan and graphite. Do not substitute unrelated icons for the brand mark on individual routes.

- **Display face:** Doto 900 for the main workspace and authentication story headlines only. Keep form headings and body copy in Geist.
- **Interface face:** Geist for labels, navigation, forms, body copy and controls.
- **Utility face:** Geist Mono for runtime status, technical metadata, terminal previews and compact labels.
- **Palette bridge:** retain the existing graphite/lime foundation, with violet and cyan as secondary accents. Status colors remain semantic and must always be paired with text.
- **Background signature:** the workspace keeps its existing ambient forge scene; authentication uses its dotted field and restrained orbit treatment. Both share the same dark surfaces and focus treatment.
- **Behavior boundary:** the static HTML references are visual references only. Authentication, recovery, projects, sessions, runtime status and navigation continue to use the existing Next.js/Supabase implementations. Never reintroduce preview-only auth or fabricated workspace data.
