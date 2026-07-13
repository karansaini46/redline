import {
  Role,
} from "@prisma/client";

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding database...");

  // Clean up existing data to ensure idempotent seed
  await prisma.auditLogEntry.deleteMany();
  await prisma.versionComparison.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.obligation.deleteMany();
  await prisma.riskFlag.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: "Demo Organization",
    },
  });
  console.log(`Created organization: ${org.name}`);

  // 2. Create Users & Memberships (One per role)
  const roles: Role[] = [Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER];
  await Promise.all(
    roles.map((role) =>
      prisma.user.create({
        data: {
          email: `${role.toLowerCase()}@demo.com`,
          name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
          memberships: {
            create: {
              org_id: org.id,
              role: role,
            },
          },
        },
      }),
    ),
  );
  console.log(`Created 4 users with respective roles`);

  console.log("Database seeding completed. Note: Fake contracts and clauses have been removed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
