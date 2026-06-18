# **INVENTORY SYSTEM + SIDEBAR + ORDERS PAGE UX OVERHAUL**

You are a Senior Staff Product Engineer and SaaS UX Architect.

The existing Khakhra Orders application has recently received a major Dashboard and Orders redesign and now looks very modern. Continue that same design language across the application.

Tech Stack:

* Next.js App Router
* TypeScript
* Prisma
* PostgreSQL
* Shadcn UI
* Tailwind CSS
* Recharts
* Lucide Icons

IMPORTANT:

Do NOT create placeholder UIs.

Everything must be production-ready and connected to real Prisma data structures.

Use native Shadcn components everywhere possible.

Also remove unused scripts from /scripts reports from /reports. (IMPORTANT TOO).

---

# **BUSINESS CONTEXT**

This is a real business.

Current flow:

1. Father places stock orders to factories via WhatsApp.
2. Factory prepares goods.
3. Factory sends handwritten bill/invoice.
4. Goods are sent through transport.
5. Goods arrive later.
6. Father manually receives stock.
7. Stock becomes available for selling.
8. Orders consume inventory.

We need a complete Inventory Management System around this workflow.

---

# **INVENTORY SYSTEM**

Create an enterprise-grade inventory module.

Think:

Shopify Inventory

Zoho Inventory

ERPNext Inventory

modern SaaS UI

---

# **INVENTORY NAVIGATION**

Add a dedicated Inventory section.

Inventory should contain:

Inventory Dashboard

Purchase Orders

Incoming Stock

Stock Ledger

Current Inventory

Low Stock Alerts

Suppliers

Stock Movements

Inventory Reports

Settings

---

# **INVENTORY DASHBOARD**

Create a modern dashboard.

Top metric cards:

Total Inventory Value

Total Units In Stock

Low Stock Products

Pending Deliveries

Incoming Inventory Value

Monthly Stock Consumption

Active Suppliers

Inventory Turnover Rate

---

# **INVENTORY HEALTH SECTION**

Show:

Inventory Health Score

Healthy

Attention Required

Critical

Use colored indicators.

NOT black progress bars.

Use gradient progress bars.

---

# **PURCHASE ORDERS SYSTEM**

Create complete Purchase Order flow.

Status:

Draft

Ordered

Invoice Received

In Transit

Partially Received

Received

Cancelled

---

Fields:

PO Number

Supplier

Created Date

Expected Delivery

Transport Details

Invoice Number

Invoice Image

Invoice Amount

Notes

Status

---

# **HANDWRITTEN BILL SUPPORT**

Allow:

Upload Image

Upload PDF

Store file URL

Preview invoice

Zoom invoice

Download invoice

---

# **INCOMING STOCK**

Create incoming shipment management.

Track:

Shipment Number

Supplier

Transport Name

Vehicle Number

Expected Arrival

Current Status

Arrival Delay

Stock Value

---

# **RECEIVING STOCK**

When stock arrives:

Open shipment

Mark items received

Receive partial quantities

Receive full quantities

Adjust damaged goods

Adjust missing goods

Add notes

Save receiving log

Automatically update inventory

---

# **STOCK LEDGER**

Every movement must be tracked.

Examples:

* Received from supplier
* Sold through order
* Damaged
* Manual adjustment
* Return received
* Return sent

---

Ledger columns:

Date

Action

Reference

Product

Quantity

Previous Stock

New Stock

User

Notes

---

# **CURRENT INVENTORY PAGE**

Modern inventory table.

Columns:

Product

Category

SKU

Current Stock

Reserved Stock

Available Stock

Reorder Point

Status

Inventory Value

Last Updated

Actions

---

Status badges:

Healthy

Low Stock

Out Of Stock

Overstocked

---

# **LOW STOCK CENTER**

Dedicated page.

Show:

Critical products

Days remaining

Reorder recommendations

Expected stockout date

Supplier quick reorder button

---

# **SUPPLIER MANAGEMENT**

Create supplier entity.

Fields:

Supplier Name

Phone

WhatsApp Number

City

Address

GST Number

Products Supplied

Total Purchases

Last Order Date

Current Outstanding Orders

---

Supplier detail page:

Order history

Total purchases

Delivery performance

Average delay

Inventory contribution

---

# **INVENTORY ANALYTICS**

Create charts:

Inventory Value Trend

Consumption Trend

Stock In vs Stock Out

Category Inventory Value

Top Moving Products

Slow Moving Products

Dead Stock

Supplier Performance

---

# **ORDER SYSTEM IMPROVEMENTS**

Current issue:

Only Khakhra products show:

3.0kg

6.0kg

14.0kg

badge.

This is incorrect.

---

Implement universal quantity badges.

Examples:

Khakhra:

3kg

5kg

10kg

Patra:

120 packets

Veti:

80 packets

Chikki:

60 packets

Bhakarwadi:

40 packets

Farali:

30 packets

---

Badge logic:

Weight products:

show KG badge

Packet products:

show Packet badge

Mixed products:

show both

Examples:

3kg

120 Packets

3kg + 40 Packets

---

# **ORDER ITEMS TOOLTIP**

Current hover card is good.

Improve it.

Requirements:

Cursor becomes:

help cursor

or

question cursor

on hover.

Use:

cursor-help

---

Hover card should show:

LINE ITEMS

Product Name

Quantity

Unit

Category

Subtotal

---

Use Shadcn:

HoverCard

---

Add smooth animation.

---

# **SIDEBAR RESTRUCTURE**

Current sidebar is flat.

Rebuild it category-wise.

Use collapsible groups.

---

OPERATIONS

Dashboard

Orders

Customers

Products

Inventory

---

ANALYTICS

Summary

Reports

Revenue

Profit

---

SUPPLY CHAIN

Purchase Orders

Incoming Stock

Suppliers

Stock Ledger

---

SYSTEM

Settings

Data Export

Backup

---

# **COLLAPSIBLE SIDEBAR FIX**

Current issue:

When sidebar collapses:

icons disappear.

This is wrong.

---

Expected behavior:

Expanded:

[Icon] Orders

Collapsed:

[Icon only]

---

Requirements:

Icons always visible

Tooltip on hover

Smooth width transition

Tooltip shows page name

Active page highlighted

---

Use:

Shadcn Tooltip

---

# **DARK MODE IMPROVEMENTS**

Current dark mode is already good.

Improve consistency.

Requirements:

No pure black

Use:

zinc-950

zinc-900

neutral-950

for backgrounds

---

Use colored progress bars.

No black progress bars anywhere.

---

# **RESPONSIVENESS**

Support:

Mobile

Tablet

Laptop

Desktop

Ultrawide

---

Tables:

Horizontal scroll

Sticky headers

Responsive actions

---

# **DESIGN RULES**

Follow existing Dashboard and Orders design language.

Use:

Cards

Badges

Hover Cards

Dropdown Menus

Tabs

Charts

Tooltips

Progress

Data Tables

Command Menus

Shadcn components only.

No generic admin template appearance.

Must feel like:

Linear

Stripe

Vercel

Modern SaaS ERP

built specifically for a food distribution business.

---

Before implementing:

1. Design Prisma schema changes.
2. Design relations.
3. Generate migrations.
4. Build backend actions.
5. Build dashboard analytics queries.
6. Build all UI pages.
7. Ensure TypeScript passes.
8. Ensure Prisma passes.
9. Ensure dark mode works.
10. Ensure mobile responsiveness works.

Implement completely.
