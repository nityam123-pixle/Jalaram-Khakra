import { Pool } from 'pg';

const pool = new Pool({ connectionString: 'postgresql://apple@localhost:5432/postgres' });

async function main() {
  console.log('--- RECONCILING CATALOG & ORDER ITEMS ---');

  // 1. Ensure Patra category, product, and variant exist
  let patraCat = (await pool.query("SELECT id FROM product_categories WHERE name = 'Patra'")).rows[0];
  if (!patraCat) {
    patraCat = (await pool.query(`
      INSERT INTO product_categories (id, name, slug, "displayOrder", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Patra', 'patra', 10, true, NOW(), NOW())
      RETURNING id
    `)).rows[0];
    console.log('Created Patra category:', patraCat.id);
  }

  let patraProd = (await pool.query("SELECT id FROM products WHERE name = 'Patra'")).rows[0];
  if (!patraProd) {
    patraProd = (await pool.query(`
      INSERT INTO products (id, "categoryId", name, slug, "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'Patra', 'patra', true, NOW(), NOW())
      RETURNING id
    `, [patraCat.id])).rows[0];
    console.log('Created Patra product:', patraProd.id);
  }

  let patraVar = (await pool.query("SELECT id FROM product_variants WHERE \"productId\" = $1", [patraProd.id])).rows[0];
  if (!patraVar) {
    patraVar = (await pool.query(`
      INSERT INTO product_variants (id, "productId", name, "weightKg", "unitType", "inventoryTracked", "isActive", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'Packet', 0.5, 'PACKET', true, true, NOW(), NOW())
      RETURNING id
    `, [patraProd.id])).rows[0];

    await pool.query(`
      INSERT INTO product_pricing (id, "variantId", "pricingType", "costPrice", "minSellingPrice", "maxSellingPrice", "effectiveFrom", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, 'RANGE', 67.75, 75, 95, NOW(), NOW(), NOW())
    `, [patraVar.id]);
    console.log('Created Patra variant & pricing:', patraVar.id);
  }

  // Fetch all variants
  const variantsRes = await pool.query(`
    SELECT pv.id, pv.name as variant_name, pv."unitType", p.name as product_name, pc.name as category_name,
           pp."costPrice", pp."minSellingPrice", pp."maxSellingPrice"
    FROM product_variants pv
    JOIN products p ON pv."productId" = p.id
    JOIN product_categories pc ON p."categoryId" = pc.id
    LEFT JOIN product_pricing pp ON pp."variantId" = pv.id
  `);
  const variants = variantsRes.rows;

  const getVariantByProduct = (name: string, unitType: string) => {
    return variants.find(v => v.product_name?.toLowerCase().includes(name.toLowerCase()) && v.unitType === unitType)
      || variants.find(v => v.product_name?.toLowerCase().includes(name.toLowerCase()));
  };

  const patraVariant = getVariantByProduct('Patra', 'PACKET')!;
  const fulvadiVariant = getVariantByProduct('Fulvadi', 'PACKET')!;
  const chikkiVariant = getVariantByProduct('Chikki', 'PACKET')!;
  const bhakarwadiVariant = getVariantByProduct('Bhakarwadi', 'PACKET') || getVariantByProduct('Bhakarwadi', 'KG')!;
  const defaultKhakhraVariant = variants.find(v => v.category_name === 'Khakhra' && v.unitType === 'KG')!;

  console.log('Using variants:', {
    patra: patraVariant.product_name,
    fulvadi: fulvadiVariant.product_name,
    chikki: chikkiVariant.product_name,
    bhakarwadi: bhakarwadiVariant.product_name,
    khakhra: defaultKhakhraVariant.product_name,
  });

  // Fetch all orders and items
  const orders = (await pool.query('SELECT * FROM orders ORDER BY created_at ASC')).rows;
  const items = (await pool.query('SELECT * FROM order_items')).rows;

  const itemsByOrder = items.reduce((acc: any, i: any) => {
    if (!acc[i.orderId]) acc[i.orderId] = [];
    acc[i.orderId].push(i);
    return acc;
  }, {});

  let insertedCount = 0;
  let backfilledRevenue = 0;

  for (const o of orders) {
    const oItems = itemsByOrder[o.id] || [];
    const totalAmount = Number(o.total_amount) || 0;
    const itemsRev = oItems.reduce((s: number, i: any) => s + (Number(i.totalRevenue) || 0), 0);
    const remainingToMap = totalAmount - itemsRev;

    const hasPatra = oItems.some((i: any) => i.productName?.toLowerCase().includes('patra') || i.categoryName?.toLowerCase().includes('patra'));
    const hasFulvadi = oItems.some((i: any) => i.productName?.toLowerCase().includes('fulvadi') || i.categoryName?.toLowerCase().includes('fulvadi'));
    const hasChikki = oItems.some((i: any) => i.productName?.toLowerCase().includes('chikki') || i.categoryName?.toLowerCase().includes('chikki'));
    const hasBhakarwadi = oItems.some((i: any) => i.productName?.toLowerCase().includes('bhakarwadi') || i.categoryName?.toLowerCase().includes('bhakarwadi'));

    const createdAt = o.created_at || new Date();

    // 1. Patra
    if (o.wants_patra && Number(o.patra_packets) > 0 && !hasPatra) {
      const qty = Number(o.patra_packets);
      const price = Number(o.patra_price_per_packet) || 75;
      const cost = 67.75;
      const rev = qty * price;
      const profit = qty * (price - cost);

      await pool.query(`
        INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [o.id, patraVariant.id, qty, patraVariant.product_name, patraVariant.category_name, patraVariant.variant_name, cost, price, qty * cost, rev, profit, createdAt, createdAt]);

      insertedCount++;
      backfilledRevenue += rev;
    }

    // 2. Fulvadi
    if (o.wants_fulvadi && Number(o.fulvadi_packets) > 0 && !hasFulvadi) {
      const qty = Number(o.fulvadi_packets);
      const price = Number(o.fulvadi_price_per_packet) || 90;
      const cost = 80;
      const rev = qty * price;
      const profit = qty * (price - cost);

      await pool.query(`
        INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [o.id, fulvadiVariant.id, qty, fulvadiVariant.product_name, fulvadiVariant.category_name, fulvadiVariant.variant_name, cost, price, qty * cost, rev, profit, createdAt, createdAt]);

      insertedCount++;
      backfilledRevenue += rev;
    }

    // 3. Chikki
    if (o.wants_chikki && Number(o.chikki_packets) > 0 && !hasChikki) {
      const qty = Number(o.chikki_packets);
      const price = Number(o.chikki_price_per_packet) || 31;
      const cost = 27;
      const rev = qty * price;
      const profit = qty * (price - cost);

      await pool.query(`
        INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [o.id, chikkiVariant.id, qty, chikkiVariant.product_name, chikkiVariant.category_name, chikkiVariant.variant_name, cost, price, qty * cost, rev, profit, createdAt, createdAt]);

      insertedCount++;
      backfilledRevenue += rev;
    }

    // 4. Bhakarwadi
    if (o.wants_bhakarwadi && Number(o.bhakarwadi_packets) > 0 && !hasBhakarwadi) {
      const qty = Number(o.bhakarwadi_packets);
      const price = Number(o.bhakarwadi_price_per_packet) || 60;
      const cost = 27;
      const rev = qty * price;
      const profit = qty * (price - cost);

      await pool.query(`
        INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [o.id, bhakarwadiVariant.id, qty, bhakarwadiVariant.product_name, bhakarwadiVariant.category_name, bhakarwadiVariant.variant_name, cost, price, qty * cost, rev, profit, createdAt, createdAt]);

      insertedCount++;
      backfilledRevenue += rev;
    }

    // 5. Check if order still has unmapped balance (e.g. Khakhra or general orders)
    const currentOrderItems = (await pool.query('SELECT * FROM order_items WHERE "orderId" = $1', [o.id])).rows;
    const currentRev = currentOrderItems.reduce((s: number, i: any) => s + Number(i.totalRevenue), 0);
    const gap = totalAmount - currentRev;

    if (gap > 1 && totalAmount > 0) {
      const khakhraKg = Number(o.total_khakhra_kg) || 0;
      const qty = khakhraKg > 0 ? khakhraKg : 1;
      const unitPrice = gap / qty;
      const costPrice = unitPrice * 0.85;
      const totalCost = qty * costPrice;
      const totalProfit = gap - totalCost;

      await pool.query(`
        INSERT INTO order_items ("id", "orderId", "variantId", quantity, "productName", "categoryName", "variantName", "unitCostPrice", "unitSellingPrice", "totalCost", "totalRevenue", "totalProfit", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [o.id, defaultKhakhraVariant.id, qty, 'Assorted Khakhra', defaultKhakhraVariant.category_name, defaultKhakhraVariant.variant_name, costPrice, unitPrice, totalCost, gap, totalProfit, createdAt, createdAt]);

      insertedCount++;
      backfilledRevenue += gap;
    }
  }

  console.log(`\nReconciliation finished!`);
  console.log(`Inserted ${insertedCount} line items, total backfilled: ₹${Math.round(backfilledRevenue).toLocaleString('en-IN')}`);

  const totalOrderSum = await pool.query('SELECT sum(total_amount) FROM orders');
  const totalItemSum = await pool.query('SELECT sum("totalRevenue") FROM order_items');
  const totalProfitSum = await pool.query('SELECT sum("totalProfit") FROM order_items');

  console.log('\n================ FINAL RESULTS ================');
  console.log('Total Orders count:', orders.length);
  console.log('SUM(orders.total_amount): ₹' + Math.round(Number(totalOrderSum.rows[0].sum)).toLocaleString('en-IN'));
  console.log('SUM(order_items.totalRevenue): ₹' + Math.round(Number(totalItemSum.rows[0].sum)).toLocaleString('en-IN'));
  console.log('SUM(order_items.totalProfit): ₹' + Math.round(Number(totalProfitSum.rows[0].sum)).toLocaleString('en-IN'));
  console.log('Difference (Gap): ₹' + Math.round(Number(totalOrderSum.rows[0].sum) - Number(totalItemSum.rows[0].sum)).toLocaleString('en-IN'));
  console.log('===============================================\n');

  await pool.end();
}

main().catch(console.error);
