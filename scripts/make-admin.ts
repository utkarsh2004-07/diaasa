import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PHONE = process.argv[2];

async function main() {
  if (!PHONE) {
    console.error("Usage: npx ts-node scripts/make-admin.ts <phone>");
    process.exit(1);
  }
  const user = await prisma.user.update({
    where: { phone: PHONE },
    data: { role: "ADMIN" },
    select: { id: true, phone: true, name: true, role: true },
  });
  console.log("Updated:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
