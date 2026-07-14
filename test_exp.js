/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function test() {
  const org = await prisma.organization.findFirst();

  const contract = await prisma.contract.create({
    data: {
      org_id: org.id,
      title: "Test Expiration Contract",
    },
  });

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 15);

  await prisma.obligation.create({
    data: {
      contract_id: contract.id,
      description: "Test expiration in 15 days",
      due_date: targetDate,
      status: "OPEN",
    },
  });

  console.log("Seeded obligation due in 15 days.");
}
test().finally(() => prisma.$disconnect());
