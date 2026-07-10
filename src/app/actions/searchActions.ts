"use server";

import { ClauseType, ContractStatus } from "@prisma/client";
import {
  semanticSearchClauses,
  SemanticSearchResult,
} from "@/server/search/semanticSearch";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function searchClausesAction(
  query: string,
  filters?: { clauseType?: ClauseType; status?: ContractStatus },
): Promise<SemanticSearchResult[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const membership = await prisma.membership.findFirst({
    where: { user_id: session.user.id },
  });

  if (!membership) {
    throw new Error("No organization found for user");
  }

  return semanticSearchClauses({
    orgId: membership.org_id,
    query,
    filters,
  });
}
