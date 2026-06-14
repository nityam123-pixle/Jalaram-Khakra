import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Inspecting _prisma_migrations...")
  try {
    const result = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`
    console.log(result)
    
    // We only want to delete it if it's the 0_init that failed. 
    // I will just log for now to see what's in there.
  } catch(e) {
    console.log("No _prisma_migrations table yet or error: ", e.message)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
