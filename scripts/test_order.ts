import { createOrder } from "../app/actions/order"
import { prisma } from "../lib/prisma"

async function test() {
  try {
    const customer = await prisma.customer.findFirst({
      where: { shop_name: "Patel Mart", city: "Lathi" }
    })
    
    if (!customer) {
      console.log("Customer not found")
      return
    }

    const variant = await prisma.productVariant.findFirst({
      where: { name: "Patra Packet" }
    })

    if (!variant) {
      console.log("Variant not found")
      return
    }
    
    console.log("Customer:", customer)
    console.log("Creating order...")
    
    const res = await createOrder({
      customerId: customer.id,
      items: [
        {
          variantId: variant.id,
          quantity: 1,
          sellingPrice: 85
        }
      ]
    })
    console.log("Order created:", res)
  } catch (err) {
    console.error("Error creating order:", err)
  }
}

test()
