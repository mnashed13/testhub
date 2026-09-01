import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Seed hidden test account
  const adminEmail = process.env.ADMIN_EMAIL ?? 'abacus-0a274c92@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Y@p8Ivj1im'
  const hashed = await bcrypt.hash(adminPassword, 12)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashed },
    create: { email: adminEmail, password: hashed, name: 'Admin' },
  })

  // Seed default settings row
  await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      webhookSecret: process.env.WEBHOOK_SECRET ?? null,
    },
  })

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
