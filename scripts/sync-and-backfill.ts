import { Pool } from 'pg';
import { calculateDynamicProfit, KHAKHRA_TYPES } from '../lib/supabase';

const pglitePool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable' });
const localPool = new Pool({ connectionString: 'postgresql://apple@localhost:5432/postgres' });

async function main() {
  console.log('--- STARTING SYNC & BACKFILL ---');

  // Truncate existing tables on 5432
  const tablesToTruncate = [
    'stock_receiving_logs',
    'stock_ledger',
    'incoming_shipments',
    'purchase_order_items',
    'purchase_orders',
    'suppliers',
    'invoices',
    'order_items',
    'khakhra_items',
    'orders',
    'customers',
    'product_pricing',
    'pricing_history',
    'inventory_levels',
    'product_variants',
    'products',
    'product_categories'
  ];

  for (const t of tablesToTruncate) {
    try {
      await localPool.query(`TRUNCATE TABLE "${t}" CASCADE;`);
    } catch (e) {
      // Table may not exist yet, ignore
    }
  }

  console.log('Truncated 5432 tables.');

  // Helper to copy table
  const copyTable = async (tableName: string) => {
    try {
      const res = await pglitePool.query(`SELECT * FROM "${tableName}"`);
      console.log(`Copying ${tableName}: ${res.rows.length} rows`);
      if (res.rows.length === 0) return;

      const cols = Object.keys(res.rows[0]);
      const colNames = cols.map(c => `"${c}"`).join(', ');

      // Batch insert in chunks of 50
      for (let i = 0; i < res.rows.length; i += 50) {
        const chunk = res.rows.slice(i, i + 50);
        const values: any[] = [];
        const placeholders: string[] = [];

        chunk.forEach((row, rIdx) => {
          cols.forEach(c => values.push(row[c]));
          placeholders.push(`(${cols.map((_, cIdx) => `$${rIdx * cols.length + cIdx + 1}`).join(', ')})`);
        });

        const q = `INSERT INTO "${tableName}" (${colNames}) VALUES ${placeholders.join(', ')}`;
        await localPool.query(q, values);
      }
    } catch (e: any) {
      console.log(`Skipping ${tableName} (not found in source):`, e.message);
    }
  };

  await copyTable('product_categories');
  await copyTable('products');
  await copyTable('product_variants');
  await copyTable('product_pricing');
  await copyTable('pricing_history');
  await copyTable('inventory_levels');
  await copyTable('customers');
  await copyTable('orders');
  await copyTable('order_items');
  await copyTable('suppliers');
  await copyTable('purchase_orders');
  await copyTable('purchase_order_items');
  await copyTable('incoming_shipments');
  await copyTable('stock_receiving_logs');
  await copyTable('stock_ledger');
  await copyTable('invoices');

  console.log('All tables copied to 5432!');

  // Now, let's backfill missing OrderItems in both databases!
  const backfillDatabase = async (pool: Pool, dbName: string) => {
    console.log(`\nBackfilling missing items in ${dbName}...`);
    const ordersRes = await pool.query('SELECT * FROM orders');
    const itemsRes = await pool.query('SELECT * FROM order_items');
    const variantsRes = await pool.query(`
      SELECT pv.*, p.name as product_name, pc.name as category_name 
      FROM product_variants pv
      JOIN products p ON pv."productId" = p.id
      JOIN product_categories pc ON p."categoryId" = pc.id
    `);

    const variants = variantsRes.rows;
    const findVariant = (catName: string, prodName: string, unitType: string) => {
      return variants.find(v => 
        (v.category_name.toLowerCase() === catName.toLowerCase() || v.category_name.toLowerCase().includes(catName.toLowerCase())) &&
        (v.product_name.toLowerCase() === prodName.toLowerCase() || v.product_name.toLowerCase().includes(prodName.toLowerCase())) &&
        v.unitType === unitType
      ) || variants.find(v => 
        v.category_name.toLowerCase().includes(catName.toLowerCase()) &&
        v.unitType === unitType
      );
    };

    const itemsByOrder = itemsRes.rows.reduce((acc: any, i: any) => {
      if (!acc[i.orderId]) acc[i.orderId] = [];
      acc[i.orderId].push(i);
      return acc;
    }, {});

    let addedItemsCount = 0;
    let addedRevenue = 0;

    for (const o of ordersRes.rows) {
      const existingItems = itemsByOrder[o.id] || [];
      const hasPatra = existingItems.some((i: any) => i.productName?.toLowerCase().includes('patra') || i.categoryName?.toLowerCase().includes('patra'));
      const hasFulvadi = existingItems.some((i: any) => i.productName?.toLowerCase().includes('fulvadi') || i.categoryName?.toLowerCase().includes('fulvadi'));
      const hasChikki = existingItems.some((i: any) => i.productName?.toLowerCase().includes('chikki') || i.categoryName?.toLowerCase().includes('chikki'));
      const hasBhakarwadi = existingItems.some((i: any) => i.productName?.toLowerCase().includes('bhakarwadi') || i.categoryName?.toLowerCase().includes('bhakarwadi'));

      const createdAt = o.created_at || new Date();

      // 1. Patra
      if (o.wants_patra && o.patra_packets > 0 && !hasPatra) {
        const variant = findVariant('Patra', 'Patra', 'PACKET') || variants.find(v => v.product_name?.toLowerCase().includes('patra'));
        if (variant) {
          const qty = Number(o.patra_packets);
          const price = Number(o.patra_price_per_packet) || 75;
          const costPrice = 67.75;
          const totalRev = qty * price;
          const totalCost = qty * costPrice;
          const totalProfit = totalRev - totalCost;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, qty, variant.product_name, variant.category_name, variant.name, costPrice, price, totalCost, totalRev, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += totalRev;
        }
      }

      // 2. Fulvadi
      if (o.wants_fulvadi && o.fulvadi_packets > 0 && !hasFulvadi) {
        const variant = findVariant('Fulvadi', 'Fulvadi', 'PACKET') || variants.find(v => v.product_name?.toLowerCase().includes('fulvadi'));
        if (variant) {
          const qty = Number(o.fulvadi_packets);
          const price = Number(o.fulvadi_price_per_packet) || 90;
          const costPrice = 80;
          const totalRev = qty * price;
          const totalCost = qty * costPrice;
          const totalProfit = totalRev - totalCost;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, qty, variant.product_name, variant.category_name, variant.name, costPrice, price, totalCost, totalRev, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += totalRev;
        }
      }

      // 3. Chikki
      if (o.wants_chikki && o.chikki_packets > 0 && !hasChikki) {
        const variant = findVariant('Chikki', 'Chikki', 'PACKET') || variants.find(v => v.product_name?.toLowerCase().includes('chikki'));
        if (variant) {
          const qty = Number(o.chikki_packets);
          const price = Number(o.chikki_price_per_packet) || 31;
          const costPrice = 27;
          const totalRev = qty * price;
          const totalCost = qty * costPrice;
          const totalProfit = totalRev - totalCost;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, qty, variant.product_name, variant.category_name, variant.name, costPrice, price, totalCost, totalRev, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += totalRev;
        }
      }

      // 4. Bhakarwadi
      if (o.wants_bhakarwadi && o.bhakarwadi_packets > 0 && !hasBhakarwadi) {
        const variant = findVariant('Bhakarwadi', 'Bhakarwadi', 'PACKET') || variants.find(v => v.product_name?.toLowerCase().includes('bhakarwadi'));
        if (variant) {
          const qty = Number(o.bhakarwadi_packets);
          const price = Number(o.bhakarwadi_price_per_packet) || 60;
          const costPrice = 27;
          const totalRev = qty * price;
          const totalCost = qty * costPrice;
          const totalProfit = totalRev - totalCost;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, qty, variant.product_name, variant.category_name, variant.name, costPrice, price, totalCost, totalRev, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += totalRev;
        }
      }

      // 5. Orders with total_khakhra_kg > 0 and no items at all
      if (existingItems.length === 0 && Number(o.total_khakhra_kg) > 0) {
        const variant = findVariant('Khakhra', 'Plain', 'KG') || variants.find(v => v.unitType === 'KG');
        if (variant) {
          const qty = Number(o.total_khakhra_kg);
          const totalAmt = Number(o.total_amount) || 0;
          // Calculate remaining revenue not covered by patra/fulvadi/chikki/bhakarwadi
          let otherRev = 0;
          if (o.wants_patra) otherRev += Number(o.patra_packets || 0) * (Number(o.patra_price_per_packet) || 75);
          if (o.wants_fulvadi) otherRev += Number(o.fulvadi_packets || 0) * (Number(o.fulvadi_price_per_packet) || 90);
          if (o.wants_chikki) otherRev += Number(o.chikki_packets || 0) * (Number(o.chikki_price_per_packet) || 31);
          if (o.wants_bhakarwadi) otherRev += Number(o.bhakarwadi_packets || 0) * (Number(o.bhakarwadi_price_per_packet) || 60);

          const khakhraRev = Math.max(0, totalAmt - otherRev);
          const unitPrice = qty > 0 ? khakhraRev / qty : 200;
          const costPrice = 180;
          const totalCost = qty * costPrice;
          const totalProfit = khakhraRev - totalCost;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, qty, 'Assorted Khakhra', variant.category_name, variant.name, costPrice, unitPrice, totalCost, khakhraRev, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += khakhraRev;
        }
      } else if (existingItems.length === 0 && Number(o.total_amount) > 0 && !o.wants_patra && !o.wants_fulvadi && !o.wants_chikki && !o.wants_bhakarwadi) {
        // Any legacy general order with total_amount but no items
        const variant = variants[0];
        if (variant) {
          const totalAmt = Number(o.total_amount);
          const totalCost = totalAmt * 0.85;
          const totalProfit = totalAmt * 0.15;

          await pool.query(`
            INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [o.id, variant.id, 1, 'General Order', 'General', 'Standard', totalCost, totalAmt, totalCost, totalAmt, totalProfit, createdAt, createdAt]);

          addedItemsCount++;
          addedRevenue += totalAmt;
        }
      }
    }

    console.log(`Backfill for ${dbName} complete! Added ${addedItemsCount} items, total backfilled revenue: ₹${Math.round(addedRevenue).toLocaleString('en-IN')}`);

    const finalSum = await pool.query('SELECT sum("totalRevenue") FROM order_items');
    const orderSum = await pool.query('SELECT sum(total_amount) FROM orders');
    console.log(`Final order_items totalRevenue in ${dbName}: ₹${Math.round(Number(finalSum.rows[0].sum)).toLocaleString('en-IN')}`);
    console.log(`Final orders total_amount in ${dbName}: ₹${Math.round(Number(orderSum.rows[0].sum)).toLocaleString('en-IN')}`);
  };

  await backfillDatabase(localPool, 'local postgres 5432');
  await backfillDatabase(pglitePool, 'pglite template1');

  await pglitePool.end();
  await localPool.end();
  console.log('\n--- SYNC & BACKFILL COMPLETED SUCCESSFULLY ---');
}

main().catch(console.error);
