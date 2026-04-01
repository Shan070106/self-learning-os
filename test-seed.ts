import { PrismaClient } from "./app/generated/prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = `${process.env.DATABASE_URL}`
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool as any)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Test User",
      email: `test_${Date.now()}@example.com`,
    }
  })
  
  const sessionToken = `test-token-${Date.now()}`
  const session = await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
    }
  })
  
  console.log(`USER_ID=${user.id}`)
  console.log(`SESSION_TOKEN=${sessionToken}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
