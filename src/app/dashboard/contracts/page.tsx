import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ContractsTable } from "./_components/contracts-table";
import { ContractsSkeleton } from "./_components/contracts-skeleton";
import { ContractStatus, Prisma } from "@prisma/client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contracts Database",
  description:
    "Manage, filter, and review all active contracts and historical documents.",
};

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === "string" ? searchParams.q : undefined;
  const statusParam =
    typeof searchParams.status === "string" ? searchParams.status : undefined;
  const expiresParam =
    typeof searchParams.expires === "string" ? searchParams.expires : undefined;
  const riskParam =
    typeof searchParams.risk === "string" ? searchParams.risk : undefined;

  const cursor =
    typeof searchParams.cursor === "string" ? searchParams.cursor : undefined;
  const sortBy =
    typeof searchParams.sortBy === "string"
      ? searchParams.sortBy
      : "created_at";
  const sortDir =
    typeof searchParams.sortDir === "string" ? searchParams.sortDir : "desc";

  const where: Prisma.ContractWhereInput = {};

  if (q) {
    where.title = { contains: q, mode: "insensitive" };
  }

  if (statusParam) {
    where.status = statusParam as ContractStatus;
  }

  if (riskParam) {
    if (riskParam === "HIGH") {
      where.risk_score = { gte: 70 };
    } else if (riskParam === "MEDIUM") {
      where.risk_score = { gte: 40, lt: 70 };
    } else if (riskParam === "LOW") {
      where.risk_score = { lt: 40 };
    }
  }

  if (expiresParam) {
    const days = parseInt(expiresParam, 10);
    if (!isNaN(days)) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      where.obligations = {
        some: {
          due_date: {
            lte: targetDate,
            gte: new Date(),
          },
          status: "OPEN",
        },
      };
    }
  }

  const validSortFields = ["created_at", "due_date", "risk_score"];
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : "created_at";
  const finalSortDir = sortDir === "asc" ? "asc" : "desc";

  const orderBy: Prisma.ContractOrderByWithRelationInput[] = [];

  if (finalSortBy === "due_date") orderBy.push({ due_date: finalSortDir });
  else if (finalSortBy === "risk_score")
    orderBy.push({ risk_score: finalSortDir });
  else orderBy.push({ created_at: finalSortDir });

  orderBy.push({ id: "desc" });

  const totalCount = await prisma.contract.count();

  const take = 25;
  const contracts = await prisma.contract.findMany({
    where,
    take: take + 1, // Fetch one extra to know if there's a next page
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy,
    include: {
      versions: {
        orderBy: { version_number: "desc" },
        take: 1,
      },
    },
  });

  const hasMore = contracts.length > take;
  const dataToReturn = hasMore ? contracts.slice(0, take) : contracts;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
      </div>
      <Suspense fallback={<ContractsSkeleton />}>
        <ContractsTable
          contracts={dataToReturn}
          hasMore={hasMore}
          totalCount={totalCount}
        />
      </Suspense>
    </div>
  );
}
