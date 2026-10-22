# Consuming ORO AI Design System in web apps

Read `artifacts/oro-design-system/docs/AGENTS.md` first. This guide covers
React/Vite and other shadcn/Tailwind web consumers. If the app already contains
a local theme or component library, also read
`artifacts/oro-design-system/docs/migrating-web.md` before writing UI.

The user has not yet approved applying this package to ORO AI. These instructions
are for use only after that separate approval.

## Theme

Import this package's theme once from the app's main CSS:

```css
@import "@workspace/oro-design-system/styles.css";
@import "@workspace/oro-design-system/oro.css";
```

Apply `oro-library` to the document body (or a wrapper containing the product
primitives). The extra stylesheet supplies the extracted status badges, headers,
empty states and loading rows. Its semantic tokens are generated from tokens.json.
Load Inter 400–700, Manrope 500–800 and IBM Plex Mono 400–600 through the same
Google Fonts URL used by this package's index.html.

`styles.css` already imports Tailwind, its plugins, and this package's token
theme. It also registers this package's component sources. Do not add a separate
Tailwind import or a `node_modules` source path in a Tailwind v4 consumer.
Tailwind v3 consumers keep their existing `@tailwind` directives and add
`node_modules/@workspace/oro-design-system/src/components` to `content`.

## Components and helpers

Import every provided primitive, `cn`, and toast API directly from this package:

```tsx
import { Button } from "@workspace/oro-design-system/components/ui/button";
import { StatusBadge, QuoteStatusBadge, RiskBadge } from "@workspace/oro-design-system/components/ui/status-badges";
import { PageHeader } from "@workspace/oro-design-system/components/ui/page-header";
import { Empty } from "@workspace/oro-design-system/components/ui/empty-state";
import { SkeletonRows } from "@workspace/oro-design-system/components/ui/skeleton-rows";
import { cn } from "@workspace/oro-design-system/lib/utils";
import {
  toast,
  useToast,
} from "@workspace/oro-design-system/hooks/use-toast";
```

Use the package component whenever it provides the required family. Keep
product-specific compositions in the app, but compose them from package
primitives rather than recreating those primitives locally.

The packaged `Toaster` and toast hook share one in-memory store. Do not call a
local toast hook while rendering the packaged `Toaster`.

Mount `components/ui/toaster` for the Radix toast store. The alternative
`components/ui/sonner` exports a separate Sonner `Toaster` and needs next-themes'
ThemeProvider; use sonner's own toast API with it. Do not mix the two stores.
Tooltip content needs TooltipProvider. Sidebar needs SidebarProvider and its
original mobile hook. Form composes React Hook Form's provider/control. All
headless dependencies are retained by this package.

## Verify

After wiring the workspace dependency, import and render
`@workspace/oro-design-system/components/ui/button`. Run the app's typecheck
and dev server. The import must resolve and the Button must use this package's
theme before broader UI work begins.

## Ongoing rules

- Keep one source of theme variables.
- Import package-provided primitives and helpers from the package path.
- Add reusable product-agnostic components to this package first.
- For a non-shadcn app, use the tokens as the source of truth and adapt existing
  components to the token CSS variables without copying token values.
