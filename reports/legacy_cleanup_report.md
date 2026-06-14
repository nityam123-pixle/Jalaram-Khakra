# Legacy Cleanup Audit Report

Generated On: 2026-06-14T10:54:02.166Z

This report lists all remaining references to legacy hardcoded arrays, categories, and accounting logic in the application source code.

## Search Term: `wants_patra`
Found 9 references:

- **Still Referenced** | `components/order-card.tsx:93` | `{order.wants_patra && (`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:99` | `setWantsPatra(order.wants_patra)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:579` | `wants_patra: wantsPatra,`
- **Safe To Remove (Legacy Component being replaced)** | `components/khakhra-analytics-chart.tsx:35` | `if (order.wants_patra && order.patra_packets > 0) {`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:13` | `wants_patra: boolean`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:425` | `// Original Patra (order-level: wants_patra, patra_packets, patra_price_per_packet)`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:615` | `// Original Patra profit (order-level: wants_patra, patra_packets, patra_price_per_packet)`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:616` | `if (order.wants_patra) {`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:699` | `if (order.wants_patra) {`

---

## Search Term: `wants_chikki`
Found 4 references:

- **Still Referenced** | `components/order-card.tsx:101` | `{order.wants_chikki && (`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:19` | `wants_chikki?: boolean`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:634` | `if (order.wants_chikki && order.chikki_packets) {`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:711` | `if (order.wants_chikki && order.chikki_packets) {`

---

## Search Term: `wants_fulvadi`
Found 6 references:

- **Still Referenced** | `components/order-card.tsx:109` | `{order.wants_fulvadi && (`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:102` | `setWantsFulvadi(order.wants_fulvadi)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:582` | `wants_fulvadi: wantsFulvadi,`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:16` | `wants_fulvadi?: boolean`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:623` | `if (order.wants_fulvadi && order.fulvadi_packets) {`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:706` | `if (order.wants_fulvadi && order.fulvadi_packets) {`

---

## Search Term: `calculateOrderProfit`
Found 2 references:

- **Safe To Remove (Library definition)** | `lib/supabase.ts:552` | `// Update the calculateOrderProfit function to return separate profits`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:553` | `export const calculateOrderProfit = (`

---

## Search Term: `KHAKHRA_TYPES`
Found 38 references:

- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:15` | `KHAKHRA_TYPES,`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:108` | `const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:118` | `const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:123` | `const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:128` | `const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:133` | `const khakhraType = KHAKHRA_TYPES.find((t) => t.name === item.khakhra_type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:230` | `const newSelectedType = KHAKHRA_TYPES.find((t) => t.name === value)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:239` | `const selectedType = KHAKHRA_TYPES.find((t) => t.name === currentItem.type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:276` | `const bhakarwadiType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "bhakarwadi")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:318` | `const fulvadiType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "fulvadi")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:360` | `const sejwanType = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "sejwan")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:390` | `const mt = KHAKHRA_TYPES.find((t) => t.name === value && t.category === "mathiyaPuri")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:408` | `const mt = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "mathiyaPuri")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:567` | `const sejwanType = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "sejwan")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:619` | `price_per_kg: KHAKHRA_TYPES.find((t) => t.name === item.type)?.basePrice || 0,`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:690` | `const sejwanType = KHAKHRA_TYPES.find((t) => t.name === item.type && t.category === "sejwan")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:875` | `const fulvadiTypes = KHAKHRA_TYPES.filter((t) => t.category === "fulvadi")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:984` | `const sejwanTypes = KHAKHRA_TYPES.filter((t) => t.category === "sejwan")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:1097` | `const mathiyaTypes = KHAKHRA_TYPES.filter((t) => t.category === "mathiyaPuri")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:1207` | `const bhakarwadiTypes = KHAKHRA_TYPES.filter((t) => t.category === "bhakarwadi")`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:1323` | `const selectedType = KHAKHRA_TYPES.find((t) => t.name === item.type)`
- **Safe To Remove (Legacy Component being replaced)** | `components/edit-order-dialog.tsx:1339` | `{KHAKHRA_TYPES.filter(`
- **Safe To Remove (Legacy Component being replaced)** | `components/khakhra-analytics-chart.tsx:6` | `import { KHAKHRA_TYPES, calculatePatraProfit, type Order } from "@/lib/supabase"`
- **Safe To Remove (Legacy Component being replaced)** | `components/khakhra-analytics-chart.tsx:22` | `const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:44` | `export const KHAKHRA_TYPES = [`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:455` | `khakhraType: (typeof KHAKHRA_TYPES)[0],`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:493` | `export const getPriceRange = (khakhraType: (typeof KHAKHRA_TYPES)[0], isPacket = false): number[] => {`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:578` | `const khakhraType = KHAKHRA_TYPES.find((k) => k.name === item.khakhra_type)`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:626` | `KHAKHRA_TYPES.find((k) => k.category === "fulvadi")!,`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:655` | `const regular = KHAKHRA_TYPES.filter((k) => k.category === "regular")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:656` | `const premium = KHAKHRA_TYPES.filter((k) => k.category === "premium")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:657` | `const bhakri = KHAKHRA_TYPES.filter((k) => k.category === "bhakri")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:658` | `const farali = KHAKHRA_TYPES.filter((k) => k.category === "farali")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:659` | `const bhakarwadi = KHAKHRA_TYPES.filter((k) => k.category === "bhakarwadi")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:660` | `const fulvadi = KHAKHRA_TYPES.filter((k) => k.category === "fulvadi")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:661` | `const chikki = KHAKHRA_TYPES.filter((k) => k.category === "chikki")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:662` | `const sejwan = KHAKHRA_TYPES.filter((k) => k.category === "sejwan")`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:663` | `const mathiyaPuri = KHAKHRA_TYPES.filter((k) => k.category === "mathiyaPuri")`

---

## Search Term: `PATRA_COST`
No references found.

---

## Search Term: `CHIKKI_COST`
Found 2 references:

- **Safe To Remove (Library definition)** | `lib/supabase.ts:451` | `export const CHIKKI_COST_PER_PACKET = 27  // your cost used in profit calculation`
- **Safe To Remove (Library definition)** | `lib/supabase.ts:549` | `return Math.max(pricePerPacket - CHIKKI_COST_PER_PACKET, 0)`

---

## Search Term: `SEJWAN_COST`
No references found.

---

## Search Term: `KHAKHRA_COST`
No references found.

---

## Prisma Schema Legacy Fields
- **Requires Migration (Drop Column)** | `prisma/schema.prisma:173:  wants_patra                 Boolean?      @default(false)`
- **Requires Migration (Drop Column)** | `prisma/schema.prisma:184:  wants_fulvadi               Boolean?      @default(false)`
- **Requires Migration (Drop Column)** | `prisma/schema.prisma:187:  wants_chikki                Boolean?      @default(false)`
