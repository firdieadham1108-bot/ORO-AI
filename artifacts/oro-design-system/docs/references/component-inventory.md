# ORO AI component inventory

Source-backed extraction. Pilot: five source families. Later chunks require pilot approval. Existing app must not be migrated until required families are implemented. App-specific shell, pricing, voice, wallet, role checks and quote documents remain product compositions, not reusable library primitives.

License: Apache-2.0 (source project). Shared dependencies: React, lucide-react; UI primitives retain their existing Radix/CVA dependencies when ported.

| Family | Reference | Source / usage evidence | Dependencies | Chunk | Status |
|---|---|---|---|---|---|
| Status badges | [Build reference](components/status-badges.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Page header | [Build reference](components/page-header.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Empty state | [Build reference](components/empty-state.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Skeleton rows | [Build reference](components/skeleton-rows.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Button | [Build reference](components/button.md) | artifacts/oro-ai/src/components/ui/button.tsx | React, Radix Slot, CVA, cn | 1 | implemented |
| accordion | [Build reference](components/accordion.md) | artifacts/oro-ai/src/components/ui/accordion.tsx | Original source dependencies; resolve before port | 2 | pending |
| alert dialog | [Build reference](components/alert-dialog.md) | artifacts/oro-ai/src/components/ui/alert-dialog.tsx | Original source dependencies; resolve before port | 2 | pending |
| alert | [Build reference](components/alert.md) | artifacts/oro-ai/src/components/ui/alert.tsx | Original source dependencies; resolve before port | 2 | pending |
| aspect ratio | [Build reference](components/aspect-ratio.md) | artifacts/oro-ai/src/components/ui/aspect-ratio.tsx | Original source dependencies; resolve before port | 2 | pending |
| avatar | [Build reference](components/avatar.md) | artifacts/oro-ai/src/components/ui/avatar.tsx | Original source dependencies; resolve before port | 2 | pending |
| badge | [Build reference](components/badge.md) | artifacts/oro-ai/src/components/ui/badge.tsx | Original source dependencies; resolve before port | 3 | pending |
| breadcrumb | [Build reference](components/breadcrumb.md) | artifacts/oro-ai/src/components/ui/breadcrumb.tsx | Original source dependencies; resolve before port | 3 | pending |
| button group | [Build reference](components/button-group.md) | artifacts/oro-ai/src/components/ui/button-group.tsx | Original source dependencies; resolve before port | 3 | pending |
| calendar | [Build reference](components/calendar.md) | artifacts/oro-ai/src/components/ui/calendar.tsx | Original source dependencies; resolve before port | 3 | pending |
| card | [Build reference](components/card.md) | artifacts/oro-ai/src/components/ui/card.tsx | Original source dependencies; resolve before port | 3 | pending |
| carousel | [Build reference](components/carousel.md) | artifacts/oro-ai/src/components/ui/carousel.tsx | Original source dependencies; resolve before port | 4 | pending |
| chart | [Build reference](components/chart.md) | artifacts/oro-ai/src/components/ui/chart.tsx | Original source dependencies; resolve before port | 4 | pending |
| checkbox | [Build reference](components/checkbox.md) | artifacts/oro-ai/src/components/ui/checkbox.tsx | Original source dependencies; resolve before port | 4 | pending |
| collapsible | [Build reference](components/collapsible.md) | artifacts/oro-ai/src/components/ui/collapsible.tsx | Original source dependencies; resolve before port | 4 | pending |
| command | [Build reference](components/command.md) | artifacts/oro-ai/src/components/ui/command.tsx | Original source dependencies; resolve before port | 4 | pending |
| context menu | [Build reference](components/context-menu.md) | artifacts/oro-ai/src/components/ui/context-menu.tsx | Original source dependencies; resolve before port | 5 | pending |
| dialog | [Build reference](components/dialog.md) | artifacts/oro-ai/src/components/ui/dialog.tsx | Original source dependencies; resolve before port | 5 | pending |
| drawer | [Build reference](components/drawer.md) | artifacts/oro-ai/src/components/ui/drawer.tsx | Original source dependencies; resolve before port | 5 | pending |
| dropdown menu | [Build reference](components/dropdown-menu.md) | artifacts/oro-ai/src/components/ui/dropdown-menu.tsx | Original source dependencies; resolve before port | 5 | pending |
| empty | [Build reference](components/empty.md) | artifacts/oro-ai/src/components/ui/empty.tsx | Original source dependencies; resolve before port | 5 | pending |
| field | [Build reference](components/field.md) | artifacts/oro-ai/src/components/ui/field.tsx | Original source dependencies; resolve before port | 6 | pending |
| form | [Build reference](components/form.md) | artifacts/oro-ai/src/components/ui/form.tsx | Original source dependencies; resolve before port | 6 | pending |
| hover card | [Build reference](components/hover-card.md) | artifacts/oro-ai/src/components/ui/hover-card.tsx | Original source dependencies; resolve before port | 6 | pending |
| input group | [Build reference](components/input-group.md) | artifacts/oro-ai/src/components/ui/input-group.tsx | Original source dependencies; resolve before port | 6 | pending |
| input otp | [Build reference](components/input-otp.md) | artifacts/oro-ai/src/components/ui/input-otp.tsx | Original source dependencies; resolve before port | 6 | pending |
| input | [Build reference](components/input.md) | artifacts/oro-ai/src/components/ui/input.tsx | Original source dependencies; resolve before port | 7 | pending |
| item | [Build reference](components/item.md) | artifacts/oro-ai/src/components/ui/item.tsx | Original source dependencies; resolve before port | 7 | pending |
| kbd | [Build reference](components/kbd.md) | artifacts/oro-ai/src/components/ui/kbd.tsx | Original source dependencies; resolve before port | 7 | pending |
| label | [Build reference](components/label.md) | artifacts/oro-ai/src/components/ui/label.tsx | Original source dependencies; resolve before port | 7 | pending |
| menubar | [Build reference](components/menubar.md) | artifacts/oro-ai/src/components/ui/menubar.tsx | Original source dependencies; resolve before port | 7 | pending |
| navigation menu | [Build reference](components/navigation-menu.md) | artifacts/oro-ai/src/components/ui/navigation-menu.tsx | Original source dependencies; resolve before port | 8 | pending |
| pagination | [Build reference](components/pagination.md) | artifacts/oro-ai/src/components/ui/pagination.tsx | Original source dependencies; resolve before port | 8 | pending |
| popover | [Build reference](components/popover.md) | artifacts/oro-ai/src/components/ui/popover.tsx | Original source dependencies; resolve before port | 8 | pending |
| progress | [Build reference](components/progress.md) | artifacts/oro-ai/src/components/ui/progress.tsx | Original source dependencies; resolve before port | 8 | pending |
| radio group | [Build reference](components/radio-group.md) | artifacts/oro-ai/src/components/ui/radio-group.tsx | Original source dependencies; resolve before port | 8 | pending |
| resizable | [Build reference](components/resizable.md) | artifacts/oro-ai/src/components/ui/resizable.tsx | Original source dependencies; resolve before port | 9 | pending |
| scroll area | [Build reference](components/scroll-area.md) | artifacts/oro-ai/src/components/ui/scroll-area.tsx | Original source dependencies; resolve before port | 9 | pending |
| select | [Build reference](components/select.md) | artifacts/oro-ai/src/components/ui/select.tsx | Original source dependencies; resolve before port | 9 | pending |
| separator | [Build reference](components/separator.md) | artifacts/oro-ai/src/components/ui/separator.tsx | Original source dependencies; resolve before port | 9 | pending |
| sheet | [Build reference](components/sheet.md) | artifacts/oro-ai/src/components/ui/sheet.tsx | Original source dependencies; resolve before port | 9 | pending |
| sidebar | [Build reference](components/sidebar.md) | artifacts/oro-ai/src/components/ui/sidebar.tsx | Original source dependencies; resolve before port | 10 | pending |
| skeleton | [Build reference](components/skeleton.md) | artifacts/oro-ai/src/components/ui/skeleton.tsx | Original source dependencies; resolve before port | 10 | pending |
| slider | [Build reference](components/slider.md) | artifacts/oro-ai/src/components/ui/slider.tsx | Original source dependencies; resolve before port | 10 | pending |
| sonner | [Build reference](components/sonner.md) | artifacts/oro-ai/src/components/ui/sonner.tsx | Original source dependencies; resolve before port | 10 | pending |
| spinner | [Build reference](components/spinner.md) | artifacts/oro-ai/src/components/ui/spinner.tsx | Original source dependencies; resolve before port | 10 | pending |
| switch | [Build reference](components/switch.md) | artifacts/oro-ai/src/components/ui/switch.tsx | Original source dependencies; resolve before port | 11 | pending |
| table | [Build reference](components/table.md) | artifacts/oro-ai/src/components/ui/table.tsx | Original source dependencies; resolve before port | 11 | pending |
| tabs | [Build reference](components/tabs.md) | artifacts/oro-ai/src/components/ui/tabs.tsx | Original source dependencies; resolve before port | 11 | pending |
| textarea | [Build reference](components/textarea.md) | artifacts/oro-ai/src/components/ui/textarea.tsx | Original source dependencies; resolve before port | 11 | pending |
| toast | [Build reference](components/toast.md) | artifacts/oro-ai/src/components/ui/toast.tsx | Original source dependencies; resolve before port | 11 | pending |
| toggle group | [Build reference](components/toggle-group.md) | artifacts/oro-ai/src/components/ui/toggle-group.tsx | Original source dependencies; resolve before port | 12 | pending |
| toggle | [Build reference](components/toggle.md) | artifacts/oro-ai/src/components/ui/toggle.tsx | Original source dependencies; resolve before port | 12 | pending |
| tooltip | [Build reference](components/tooltip.md) | artifacts/oro-ai/src/components/ui/tooltip.tsx | Original source dependencies; resolve before port | 12 | pending |