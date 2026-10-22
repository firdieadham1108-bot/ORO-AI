# ORO AI component inventory

Source-backed extraction. The five-family pilot was approved; all remaining source families have now been ported in dependency-sorted chunks. Migration still requires separate user approval. App-specific shell, pricing, voice, wallet, role checks and quote documents remain product compositions, not reusable library primitives.

License: Apache-2.0 (source project). Shared dependencies: React, lucide-react; UI primitives retain their existing Radix/CVA dependencies when ported.

| Family | Reference | Source / usage evidence | Dependencies | Chunk | Status |
|---|---|---|---|---|---|
| Status badges | [Build reference](components/status-badges.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Page header | [Build reference](components/page-header.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Empty state | [Build reference](components/empty-state.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Skeleton rows | [Build reference](components/skeleton-rows.md) | artifacts/oro-ai/src/components/kit.tsx | React, lucide-react | 1 | implemented |
| Button | [Build reference](components/button.md) | artifacts/oro-ai/src/components/ui/button.tsx | React, Radix Slot, CVA, cn | 1 | implemented |
| accordion | [Build reference](components/accordion.md) | artifacts/oro-ai/src/components/ui/accordion.tsx | Source public runtime (see family reference) | 2 | implemented |
| alert dialog | [Build reference](components/alert-dialog.md) | artifacts/oro-ai/src/components/ui/alert-dialog.tsx | button | 2 | implemented |
| alert | [Build reference](components/alert.md) | artifacts/oro-ai/src/components/ui/alert.tsx | Source public runtime (see family reference) | 2 | implemented |
| aspect ratio | [Build reference](components/aspect-ratio.md) | artifacts/oro-ai/src/components/ui/aspect-ratio.tsx | Source public runtime (see family reference) | 2 | implemented |
| avatar | [Build reference](components/avatar.md) | artifacts/oro-ai/src/components/ui/avatar.tsx | Source public runtime (see family reference) | 2 | implemented |
| badge | [Build reference](components/badge.md) | artifacts/oro-ai/src/components/ui/badge.tsx | Source public runtime (see family reference) | 3 | implemented |
| breadcrumb | [Build reference](components/breadcrumb.md) | artifacts/oro-ai/src/components/ui/breadcrumb.tsx | Source public runtime (see family reference) | 3 | implemented |
| button group | [Build reference](components/button-group.md) | artifacts/oro-ai/src/components/ui/button-group.tsx | separator | 9 | implemented |
| calendar | [Build reference](components/calendar.md) | artifacts/oro-ai/src/components/ui/calendar.tsx | button | 3 | implemented |
| card | [Build reference](components/card.md) | artifacts/oro-ai/src/components/ui/card.tsx | Source public runtime (see family reference) | 3 | implemented |
| carousel | [Build reference](components/carousel.md) | artifacts/oro-ai/src/components/ui/carousel.tsx | button | 3 | implemented |
| chart | [Build reference](components/chart.md) | artifacts/oro-ai/src/components/ui/chart.tsx | Source public runtime (see family reference) | 4 | implemented |
| checkbox | [Build reference](components/checkbox.md) | artifacts/oro-ai/src/components/ui/checkbox.tsx | Source public runtime (see family reference) | 4 | implemented |
| collapsible | [Build reference](components/collapsible.md) | artifacts/oro-ai/src/components/ui/collapsible.tsx | Source public runtime (see family reference) | 4 | implemented |
| command | [Build reference](components/command.md) | artifacts/oro-ai/src/components/ui/command.tsx | dialog | 5 | implemented |
| context menu | [Build reference](components/context-menu.md) | artifacts/oro-ai/src/components/ui/context-menu.tsx | Source public runtime (see family reference) | 4 | implemented |
| dialog | [Build reference](components/dialog.md) | artifacts/oro-ai/src/components/ui/dialog.tsx | Source public runtime (see family reference) | 4 | implemented |
| drawer | [Build reference](components/drawer.md) | artifacts/oro-ai/src/components/ui/drawer.tsx | Source public runtime (see family reference) | 5 | implemented |
| dropdown menu | [Build reference](components/dropdown-menu.md) | artifacts/oro-ai/src/components/ui/dropdown-menu.tsx | Source public runtime (see family reference) | 5 | implemented |
| empty | [Build reference](components/empty.md) | artifacts/oro-ai/src/components/ui/empty.tsx | Source public runtime (see family reference) | 5 | implemented |
| field | [Build reference](components/field.md) | artifacts/oro-ai/src/components/ui/field.tsx | label, separator | 9 | implemented |
| form | [Build reference](components/form.md) | artifacts/oro-ai/src/components/ui/form.tsx | label | 6 | implemented |
| hover card | [Build reference](components/hover-card.md) | artifacts/oro-ai/src/components/ui/hover-card.tsx | Source public runtime (see family reference) | 5 | implemented |
| input group | [Build reference](components/input-group.md) | artifacts/oro-ai/src/components/ui/input-group.tsx | button, input, textarea | 11 | implemented |
| input otp | [Build reference](components/input-otp.md) | artifacts/oro-ai/src/components/ui/input-otp.tsx | Source public runtime (see family reference) | 6 | implemented |
| input | [Build reference](components/input.md) | artifacts/oro-ai/src/components/ui/input.tsx | Source public runtime (see family reference) | 6 | implemented |
| item | [Build reference](components/item.md) | artifacts/oro-ai/src/components/ui/item.tsx | separator | 9 | implemented |
| kbd | [Build reference](components/kbd.md) | artifacts/oro-ai/src/components/ui/kbd.tsx | Source public runtime (see family reference) | 6 | implemented |
| label | [Build reference](components/label.md) | artifacts/oro-ai/src/components/ui/label.tsx | Source public runtime (see family reference) | 6 | implemented |
| menubar | [Build reference](components/menubar.md) | artifacts/oro-ai/src/components/ui/menubar.tsx | Source public runtime (see family reference) | 7 | implemented |
| navigation menu | [Build reference](components/navigation-menu.md) | artifacts/oro-ai/src/components/ui/navigation-menu.tsx | Source public runtime (see family reference) | 7 | implemented |
| pagination | [Build reference](components/pagination.md) | artifacts/oro-ai/src/components/ui/pagination.tsx | button | 7 | implemented |
| popover | [Build reference](components/popover.md) | artifacts/oro-ai/src/components/ui/popover.tsx | Source public runtime (see family reference) | 7 | implemented |
| progress | [Build reference](components/progress.md) | artifacts/oro-ai/src/components/ui/progress.tsx | Source public runtime (see family reference) | 7 | implemented |
| radio group | [Build reference](components/radio-group.md) | artifacts/oro-ai/src/components/ui/radio-group.tsx | Source public runtime (see family reference) | 8 | implemented |
| resizable | [Build reference](components/resizable.md) | artifacts/oro-ai/src/components/ui/resizable.tsx | Source public runtime (see family reference) | 8 | implemented |
| scroll area | [Build reference](components/scroll-area.md) | artifacts/oro-ai/src/components/ui/scroll-area.tsx | Source public runtime (see family reference) | 8 | implemented |
| select | [Build reference](components/select.md) | artifacts/oro-ai/src/components/ui/select.tsx | Source public runtime (see family reference) | 8 | implemented |
| separator | [Build reference](components/separator.md) | artifacts/oro-ai/src/components/ui/separator.tsx | Source public runtime (see family reference) | 8 | implemented |
| sheet | [Build reference](components/sheet.md) | artifacts/oro-ai/src/components/ui/sheet.tsx | Source public runtime (see family reference) | 9 | implemented |
| sidebar | [Build reference](components/sidebar.md) | artifacts/oro-ai/src/components/ui/sidebar.tsx | button, input, separator, sheet, skeleton, tooltip | 12 | implemented |
| skeleton | [Build reference](components/skeleton.md) | artifacts/oro-ai/src/components/ui/skeleton.tsx | Source public runtime (see family reference) | 9 | implemented |
| slider | [Build reference](components/slider.md) | artifacts/oro-ai/src/components/ui/slider.tsx | Source public runtime (see family reference) | 10 | implemented |
| sonner | [Build reference](components/sonner.md) | artifacts/oro-ai/src/components/ui/sonner.tsx | Source public runtime (see family reference) | 10 | implemented |
| spinner | [Build reference](components/spinner.md) | artifacts/oro-ai/src/components/ui/spinner.tsx | Source public runtime (see family reference) | 10 | implemented |
| switch | [Build reference](components/switch.md) | artifacts/oro-ai/src/components/ui/switch.tsx | Source public runtime (see family reference) | 10 | implemented |
| table | [Build reference](components/table.md) | artifacts/oro-ai/src/components/ui/table.tsx | Source public runtime (see family reference) | 10 | implemented |
| tabs | [Build reference](components/tabs.md) | artifacts/oro-ai/src/components/ui/tabs.tsx | Source public runtime (see family reference) | 11 | implemented |
| textarea | [Build reference](components/textarea.md) | artifacts/oro-ai/src/components/ui/textarea.tsx | Source public runtime (see family reference) | 11 | implemented |
| toast | [Build reference](components/toast.md) | artifacts/oro-ai/src/components/ui/toast.tsx | Source public runtime (see family reference) | 11 | implemented |
| toggle group | [Build reference](components/toggle-group.md) | artifacts/oro-ai/src/components/ui/toggle-group.tsx | toggle | 12 | implemented |
| toggle | [Build reference](components/toggle.md) | artifacts/oro-ai/src/components/ui/toggle.tsx | Source public runtime (see family reference) | 12 | implemented |
| tooltip | [Build reference](components/tooltip.md) | artifacts/oro-ai/src/components/ui/tooltip.tsx | Source public runtime (see family reference) | 12 | implemented |