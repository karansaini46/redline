import { prisma } from "./src/lib/prisma";
async function run() {
  const org = await prisma.organization.create({
    data: { name: "Test Org for Semantic Search 2" },
  });
  console.log("org keys:", Object.keys(org));
}
run();
