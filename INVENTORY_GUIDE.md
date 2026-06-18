# Khakhra Orders: Inventory System User Manual

Welcome to the new Khakhra Orders Inventory System. This guide is designed to explain the entire system in simple terms. It covers every page, what it does, and how to think about it during your daily operations.

---

## 🧭 The Core Concept: How Stock Moves

The entire system is built on one simple rule: **The system does the math for you.**

- **Stock Goes UP ⬆️:** When you order products from your supplier and receive the shipment.
- **Stock Goes DOWN ⬇️:** When you create an order for a customer.
- **Adjustments 🔀:** When you manually add or remove stock because of damage, theft, or miscounts.

You never have to manually calculate how many boxes you have left after a sale. The system handles it automatically.

---

## 📊 1. Inventory Dashboard
**Where:** `Supply Chain > Dashboard`

**What to think:** *"How is the health of my warehouse right now?"*

This is your high-level overview. You don't take actions here; you just read the data. 
- **KPI Cards:** Instantly see your Total Inventory Value, how many items are running low, and how many shipments are pending.
- **Category Breakdown:** A quick chart showing what percentage of your warehouse is Khakhra, Peanuts, Fafda, etc.
- **Quick Links:** Small tables showing your most recent stock movements and shipments that are arriving soon.

---

## 📦 2. Current Stock
**Where:** `Supply Chain > Current Stock`

**What to think:** *"Exactly how much of [Product X] is sitting on my shelf right now?"*

This is your digital warehouse. It lists every single product you track.
- **Status Badges:** Instantly see if a product is `Healthy`, `Low Stock`, `Out of Stock`, or `Overstocked`.
- **Available vs Reserved:** "Available" is what you can sell. "Reserved" shows stock that is part of pending customer orders that haven't been completed yet.
- **The "Adjust" Button:** Use this button if you drop a box and it breaks, or if you find an extra box in the back room. You can type "-1" or "+1" and leave a note like "Damaged by water" or "Found in back". This keeps your numbers 100% accurate without faking an order.

---

## 🚨 3. Low Stock Center
**Where:** `Supply Chain > Low Stock`

**What to think:** *"What do I need to order from the factory today?"*

This is your daily To-Do list for purchasing. You should check this page every morning.
- **Urgency Levels:** The system flags items as `Critical`, `High`, or `Medium` based on how close you are to running out completely.
- **Days Left:** The system calculates your "Average Burn" (how many packets you sell per day) and estimates exactly how many days of stock you have left before the shelf is empty.
- **Action:** Click the "Create PO" button directly from this card to immediately start ordering that specific item.

---

## 🛒 4. Purchase Orders (POs)
**Where:** `Supply Chain > Purchase Orders`

**What to think:** *"What have I requested from my factories?"*

This is where you legally and officially request stock from your suppliers.
- **Lifecycle:** A PO goes from `Draft` → `Ordered` → `In Transit` → `Received`. 
- **Creating a PO:** Click "New PO", pick your supplier, and add the line items (e.g., 50 boxes of Methi Khakhra, 20 packets of Peanuts). 
- *Note: Creating a PO does NOT add stock to your inventory.* It just tells the system "I am expecting these items to arrive soon."

---

## 🚛 5. Incoming Shipments
**Where:** `Supply Chain > Incoming Stock`

**What to think:** *"The truck just pulled up to the shop. What is inside, and let's add it to the shelf."*

This page bridges the gap between ordering stock and actually having it.
- **Mark Arrived:** When the tempo driver calls to say he is 5 minutes away, you can mark the shipment as "Arrived & Ready".
- **Receive Stock:** This is the magic button. When you open the boxes, click this button. It asks you to verify the quantities. If you ordered 50 boxes but only got 48, you type 48. 
- *Action:* The moment you hit "Confirm Receipt" on this dialog, **your Current Stock numbers will instantly go up.**

---

## 🏭 6. Suppliers
**Where:** `Supply Chain > Suppliers`

**What to think:** *"Who are my business partners, and what is their contact info?"*

A simple directory of your factories and vendors.
- Add their Phone numbers, WhatsApp numbers, and GST details here.
- You can see how much money you've spent with them historically and how many orders are currently pending with them.

---

## 🔒 7. Stock Ledger
**Where:** `Supply Chain > Stock Ledger`

**What to think:** *"I need an unchangeable, legal record of every single item that ever entered or left my shop."*

This is for deep auditing. If you suspect theft or a major counting error, you come here.
- It records **Everything**. 
- If stock went up, it says exactly which PO it came from.
- If stock went down, it says exactly which Customer Order it went to.
- If someone manually adjusted the stock, it records the exact time, amount, and the excuse/note they typed in.
- **You cannot edit or delete entries here.** It is an immutable truth table.

---

## 📉 8. Movements Timeline
**Where:** `Supply Chain > Movements`

**What to think:** *"What happened in the warehouse yesterday?"*

This uses the exact same data as the Stock Ledger, but presents it beautifully. 
- Instead of a boring spreadsheet table, it shows a day-by-day vertical timeline of activity. 
- It is color-coded: Green means stock came in, Red means stock went out. It's the fastest way to casually review the day's activity.

---

## ⚙️ 9. Inventory Settings
**Where:** `Supply Chain > Settings`

**What to think:** *"How do I configure the rules for the system?"*

You don't need to visit this page often. It is for setup.
- **Tracking Toggle:** You don't have to track inventory for every single product. If there is a product you never want to track, flip the switch off here.
- **Reorder Points:** This is the most important setting. If you set Methi Khakhra's reorder point to `50`, the system will sound the alarm and put it in the "Low Stock Center" the moment your stock drops to 50 or below.

---

## 💡 Summary of a Perfect Daily Workflow

1. **Morning:** Open the **Low Stock Center**. See what's running out.
2. **Action:** Go to **Purchase Orders** and create a PO for those low items. Call the supplier.
3. **Mid-Day:** Customers call. You use the normal **Orders** page to sell Khakhra. Your stock automatically goes down in the background.
4. **Afternoon:** The supplier's truck arrives. Go to **Incoming Shipments**, click "Receive Stock", and your stock automatically goes back up.
5. **Evening:** Take a quick glance at the **Dashboard** to ensure everything looks healthy before closing the shop.
