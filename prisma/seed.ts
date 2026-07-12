import {
  Role,
  ClauseType,
  ContractStatus,
  RiskSeverity,
} from "@prisma/client";

import { prisma } from "../src/lib/prisma";

// Helper to generate a fake 768d embedding in string format recognized by vector extension
const generateFakeEmbedding = () => {
  const vector = Array.from({ length: 768 }, () => Math.random() * 2 - 1);
  return `[${vector.join(",")}]`;
};

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
      name: "Acme Corp",
    },
  });
  console.log(`Created organization: ${org.name}`);

  // 2. Create Users & Memberships (One per role)
  const roles: Role[] = [Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER];
  await Promise.all(
    roles.map((role) =>
      prisma.user.create({
        data: {
          email: `${role.toLowerCase()}@acmecorp.com`,
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

  // 3. Create 3 Contracts with 2 Versions each
  const contracts = [];
  for (let i = 1; i <= 3; i++) {
    const contract = await prisma.contract.create({
      data: {
        org_id: org.id,
        title: `Master Service Agreement v${i}`,
        status: ContractStatus.DRAFT,
        due_date: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // In 7 days
      },
    });

    // Version 1
    const v1 = await prisma.contractVersion.create({
      data: {
        contract_id: contract.id,
        version_number: 1,
        content_text: `This is the initial draft of the agreement for ${contract.title}.`,
      },
    });

    // Version 2
    const v2 = await prisma.contractVersion.create({
      data: {
        contract_id: contract.id,
        version_number: 2,
        content_text: `This is the revised draft of the agreement for ${contract.title} with additional clauses.`,
      },
    });

    contracts.push({ contract, versions: [v1, v2] });
  }
  console.log(`Created 3 contracts, each with 2 versions`);

  // 4. Create 5 sample Clauses with fake embeddings for the latest version of the first contract
  const targetVersionId = contracts[0].versions[1].id;

  const sampleClauses = [
    {
      type: ClauseType.CONFIDENTIALITY,
      text: "The Receiving Party shall keep all Confidential Information strictly confidential.",
    },
    {
      type: ClauseType.TERMINATION,
      text: "Either party may terminate this Agreement with 30 days written notice.",
    },
    {
      type: ClauseType.LIABILITY_CAP,
      text: "In no event shall either party be liable for any indirect, special, or consequential damages.",
    },
    {
      type: ClauseType.PAYMENT_TERMS,
      text: "Payment shall be made within net 30 days from the receipt of the invoice.",
    },
    {
      type: ClauseType.GOVERNING_LAW,
      text: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
    },
  ];

  for (let i = 0; i < sampleClauses.length; i++) {
    const clauseData = sampleClauses[i];
    // Create the clause (Note: we use a raw query because Prisma does not support writing Unsupported types via regular create)
    const newClauseId = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO "Clause" (id, contract_version_id, clause_type, text, embedding, char_start, char_end, is_standard, created_at, updated_at)
      VALUES (
        ${newClauseId},
        ${targetVersionId},
        ${clauseData.type}::"ClauseType",
        ${clauseData.text},
        ${generateFakeEmbedding()}::vector,
        ${i * 100},
        ${i * 100 + clauseData.text.length},
        true,
        NOW(),
        NOW()
      )
    `;
    // Add some sample risk flags and obligations to the first few clauses
    if (i === 1) {
      // TERMINATION
      await prisma.obligation.create({
        data: {
          contract_id: contracts[0].contract.id,
          clause_id: newClauseId,
          description: "Provide 30 days written notice before termination",
          status: "OPEN",
        },
      });
    }
    if (i === 2) {
      // LIABILITY
      await prisma.riskFlag.create({
        data: {
          clause_id: newClauseId,
          severity: RiskSeverity.MEDIUM,
          description:
            "Broad limitation of liability may pose a risk in certain jurisdictions.",
          category: "Broad Liability Scope",
          suggested_action:
            "Review jurisdictional constraints on liability limitations.",
        },
      });
    }
  }

  console.log(`Created 5 sample clauses with fake embeddings`);
  console.log("Database seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
