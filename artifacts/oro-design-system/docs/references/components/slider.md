# slider

Source: artifacts/oro-ai/src/components/ui/slider.tsx
Provenance: ORO AI local component library; Apache-2.0.
Status: implemented. Chunk: 10.
Public exports: Slider.
Dependencies: react, @radix-ui/react-slider, @/lib/utils.

Full implementation evidence: ../source-ui/slider.tsx. Port reuses source verbatim, changing only package-safe imports. No styling or logic changes. Variants, keyboard/focus behavior, refs, context and underlying headless library remain original.

Shared dependencies are ported before consumers in the dependency-sorted chunk plan. Toast + Toaster share one family and the original use-toast store. Sonner requires next-themes provider; sidebar uses original use-mobile hook.

Validation contract: normalized port must exactly equal retained source; typecheck; story registered; variants/states represented; overlays start closed; bounded layout stories.
