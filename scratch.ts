import { prisma } from "./src/lib/prisma";
async function run() {
  try {
    const org = await prisma.organization.create({
      data: { name: "Test Org for Semantic Search" },
    });
    console.log("Created org:", org.id);
  } catch(e) {
    console.error("Failed to create org:", e);
  }
}
run();
