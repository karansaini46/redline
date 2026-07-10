import { ClauseType, RiskSeverity } from "@prisma/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export interface DeterministicRiskResult {
  severity: RiskSeverity;
  flags: Array<{
    category: string;
    suggestedAction: string;
    severity: RiskSeverity;
  }>;
}

const wordToNum: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  sixty: 60,
  ninety: 90,
};

function parseDays(text: string): number | null {
  const match = text.match(
    /(?:(\d+)|(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|sixty|ninety))\s+days?/i,
  );
  if (match) {
    if (match[1]) return parseInt(match[1], 10);
    if (match[2]) return wordToNum[match[2].toLowerCase()] || null;
  }
  return null;
}

export function calculateDeterministicRisk(
  clauseType: ClauseType,
  text: string,
): DeterministicRiskResult {
  const flags: DeterministicRiskResult["flags"] = [];
  const lowerText = text.toLowerCase();

  switch (clauseType) {
    case ClauseType.AUTO_RENEWAL: {
      const days = parseDays(lowerText);
      if (days !== null && days < 30) {
        flags.push({
          category: "Notice Period Too Short",
          suggestedAction:
            "Increase the auto-renewal notice period to at least 30 days.",
          severity: RiskSeverity.MEDIUM,
        });
      } else if (
        lowerText.includes("without notice") ||
        lowerText.includes("automatically renews without")
      ) {
        flags.push({
          category: "Automatic Renewal Without Notice",
          suggestedAction:
            "Require explicit written notice before auto-renewal.",
          severity: RiskSeverity.HIGH,
        });
      }
      break;
    }
    case ClauseType.INDEMNIFICATION: {
      if (!lowerText.includes("mutual")) {
        flags.push({
          category: "One-Sided Indemnification",
          suggestedAction:
            "Make the indemnification clause mutual to protect both parties equally.",
          severity: RiskSeverity.HIGH,
        });
      }
      if (
        lowerText.includes("indirect") ||
        lowerText.includes("consequential")
      ) {
        flags.push({
          category: "Broad Indemnification Scope",
          suggestedAction:
            "Exclude indirect and consequential damages from the indemnification obligation.",
          severity: RiskSeverity.HIGH,
        });
      }
      break;
    }
    case ClauseType.LIABILITY_CAP: {
      if (
        lowerText.includes("unlimited") ||
        lowerText.includes("no limit") ||
        lowerText.includes("without limit")
      ) {
        flags.push({
          category: "Unlimited Liability",
          suggestedAction:
            "Insert a hard cap on liability, ideally tied to fees paid over a specific period.",
          severity: RiskSeverity.CRITICAL,
        });
      }
      break;
    }
    case ClauseType.PAYMENT_TERMS: {
      if (
        lowerText.includes("net 60") ||
        lowerText.includes("net 90") ||
        lowerText.includes("net 120")
      ) {
        flags.push({
          category: "Extended Payment Terms",
          suggestedAction: "Renegotiate payment terms to Net 30 or fewer days.",
          severity: RiskSeverity.MEDIUM,
        });
      }
      break;
    }
    case ClauseType.WARRANTY: {
      if (
        lowerText.includes("as is") ||
        lowerText.includes("as-is") ||
        lowerText.includes("without warranty")
      ) {
        flags.push({
          category: "Disclaimer of All Warranties",
          suggestedAction:
            "Require basic functional warranties and SLAs for the service.",
          severity: RiskSeverity.HIGH,
        });
      }
      break;
    }
  }

  // Determine overall severity ceiling
  let overallSeverity: RiskSeverity = RiskSeverity.LOW;
  const severityRank: Record<RiskSeverity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  for (const flag of flags) {
    if (severityRank[flag.severity] > severityRank[overallSeverity]) {
      overallSeverity = flag.severity;
    }
  }

  return { severity: overallSeverity, flags };
}

const LLMResponseSchema = z.object({
  risk_rationale: z
    .string()
    .describe(
      "A one-sentence rationale explaining the risk severity for this clause.",
    ),
  deviation_notes: z
    .string()
    .nullable()
    .optional()
    .describe(
      "If standardText is provided, a concise comparison explaining how the clause deviates from the standard library text. Otherwise null.",
    ),
});

export async function generateRiskRationaleAndDeviation(
  clauseType: ClauseType,
  text: string,
  standardText?: string,
) {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
    maxRetries: 1,
  });

  const structuredLlm = model.withStructuredOutput(LLMResponseSchema, {
    name: "generate_risk_rationale",
  });

  let prompt = `Analyze the following ${clauseType} clause and provide a one-sentence risk rationale.\n\nClause Text:\n${text}`;

  if (standardText) {
    prompt += `\n\nYou must also compare this clause to the organization's standard text for this clause type and provide deviation notes.\nStandard Text:\n${standardText}`;
  }

  const systemPrompt =
    "You are an expert legal contract risk analyzer. Be concise and objective. Return valid JSON matching the schema.";

  const response = await structuredLlm.invoke([
    ["system", systemPrompt],
    ["human", prompt],
  ]);

  return response;
}

export async function scoreClause(clauseId: string) {
  const clause = await prisma.clause.findUnique({
    where: { id: clauseId },
    include: {
      contract_version: {
        include: {
          contract: true,
        },
      },
    },
  });

  if (!clause) {
    throw new Error(`Clause not found: ${clauseId}`);
  }

  const orgId = clause.contract_version.contract.org_id;

  // 1. Run deterministic rule checks
  const ruleResult = calculateDeterministicRisk(
    clause.clause_type,
    clause.text,
  );

  const severityRank: Record<RiskSeverity, number> = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
    CRITICAL: 4,
  };

  // Set the severity ceiling and numeric score
  const finalSeverity = ruleResult.severity;
  const riskScore = severityRank[finalSeverity] * 25; // 25, 50, 75, 100

  // 2. Check for standard library entry
  const standardLibEntry = await prisma.standardClauseLibrary.findFirst({
    where: {
      org_id: orgId,
      clause_type: clause.clause_type,
    },
  });

  // 3. Call Gemini for rationale and deviation
  const llmResult = await generateRiskRationaleAndDeviation(
    clause.clause_type,
    clause.text,
    standardLibEntry?.text,
  );

  // 4. Update the Clause
  await prisma.clause.update({
    where: { id: clauseId },
    data: {
      risk_score: riskScore,
      risk_severity: finalSeverity,
      risk_rationale: llmResult.risk_rationale,
      deviation_notes: llmResult.deviation_notes ?? null,
    },
  });

  // 5. Create RiskFlags for Medium+ flags identified by deterministic rules
  // The rules set the severity ceiling, but we also create the flags here.
  for (const flag of ruleResult.flags) {
    if (severityRank[flag.severity] >= severityRank.MEDIUM) {
      await prisma.riskFlag.create({
        data: {
          clause_id: clauseId,
          severity: flag.severity,
          description: llmResult.risk_rationale, // Use LLM rationale or a default description
          category: flag.category,
          suggested_action: flag.suggestedAction,
        },
      });
    }
  }

  return {
    riskScore,
    riskSeverity: finalSeverity,
    riskRationale: llmResult.risk_rationale,
    deviationNotes: llmResult.deviation_notes,
    flagsGenerated: ruleResult.flags.length,
  };
}
