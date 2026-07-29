import "dotenv/config";
import { prisma } from "./src/lib/prisma";
import { scoreClauseQueue } from "./src/server/queues/scoreClause.queue";

async function main() {
  const clauses = await prisma.clause.findMany({
    where: {
      risk_score: null,
    },
  });

  console.log(`Found ${clauses.length} unscored clauses. Enqueuing...`);

  for (const clause of clauses) {
    if (scoreClauseQueue) {
      await scoreClauseQueue.add("score-clause", { clauseId: clause.id });
    }
  }

  console.log("Done.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 1000);
  });
