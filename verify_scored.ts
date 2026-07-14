import "dotenv/config";
import { prisma } from "./src/lib/prisma";

async function main() {
  const count = await prisma.clause.count({
    where: {
      risk_score: { not: null },
    },
  });

  console.log(`Number of scored clauses: ${count}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
