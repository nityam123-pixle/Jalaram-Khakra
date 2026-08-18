# Workspace Guidelines

## Package Manager
- **Package Manager**: STRICTLY ONLY use `bun`. Do not use `npm`, `yarn`, or `pnpm`. For example, use `bun install`, `bun add`, `bun run`, `bunx`, etc.

## UI / UX Design Standards (Strict Orders Page Flow)
When creating or reworking ANY page (specifically all table-based and data-driven management pages like Orders, Purchase Orders, Incoming Stock, Current Inventory, Stock Ledger, Customers, Suppliers, etc.), STRICTLY follow the exact UI/UX architectural and visual patterns established in the Orders page (`components/orders/*`):

1. **Page Header**:
   - Title + clear sub-description.
   - Primary creation/action button (e.g. "New PO", "New Shipment", "Create Order").
   - Secondary actions: "Export CSV" / Quick report actions.

2. **KPI Stats Cards (Color / Metric Cards)**:
   - Responsive grid (2 cols mobile, 3–6 cols desktop) of `Card` components.
   - Header with uppercase tracking label + icon container.
   - Bold monospace key metric value (`font-mono font-extrabold text-2xl sm:text-3xl`).
   - Bottom summary pill with subtle background, description text, and color-coded status/accent badges.

3. **Quick Insights Strip**:
   - Compact banner/strip providing immediate operational context, active counts, pending approvals, or urgency flags.

4. **Filter & Search Bar**:
   - Search input (with clear button and shortcut indicator).
   - Status filters (All / specific statuses) with colored counters or clean select/pill controls.
   - Secondary filters (Supplier, Date Range, Category, etc.).
   - "Clear Filters" button when any filter is active.

5. **Data Presentation (Dual Responsive Layout)**:
   - **Desktop Table (`hidden md:block`)**:
     - Checkbox selection for individual and bulk actions.
     - Custom status badges with colored status dots (`h-1.5 w-1.5 rounded-full`) and muted pill background.
     - Monospace font for IDs, quantities, and currency (`₹` with `en-IN` formatting).
     - Hover cards / preview tooltips for line items and breakdown.
     - Working Actions Dropdown menu (View Details, Status Transitions, Edit, Delete).
   - **Mobile Cards (`md:hidden`)**:
     - Compact, touch-friendly card view for every record with status dot badge, key amounts, and quick actions.
   - **Empty States**:
     - Clean SVG icon, clear explanation, and action button to reset filters or create an item.
   - **Pagination**:
     - Clean pagination strip with record counts and page jump buttons.

6. **Floating Bulk Action Bar**:
   - Fixed bottom floating pill when rows are selected (`z-50`, backdrop blur, smooth slide-in animation).
   - Direct status updates and bulk delete with confirmations.

7. **Strict Action Handling & Feedback**:
   - Every action in dropdowns or buttons MUST be strictly wired to server actions using `useTransition` or `@tanstack/react-query` mutations.
   - Use `sonner` toast notifications for immediate user feedback on success and failure.
   - Destructive actions (like delete/cancel) MUST trigger `AlertDialog` confirmations with clear explanations.
