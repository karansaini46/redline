"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Contract, ContractStatus } from "@prisma/client";
import {
  Search,
  FileText,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface ContractsTableProps {
  contracts: Contract[];
  hasMore: boolean;
  totalCount: number;
}

export function ContractsTable({
  contracts,
  hasMore,
  totalCount,
}: ContractsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(searchParams.get("q") || "");
  const [isPending, setIsPending] = React.useTransition();

  // Debounced Search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query === searchParams.get("q") || (!query && !searchParams.has("q")))
        return;

      const params = new URLSearchParams(searchParams.toString());
      if (query) {
        params.set("q", query);
      } else {
        params.delete("q");
      }

      // Reset pagination when searching
      params.delete("cursor");

      setIsPending(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router, pathname, searchParams]);

  const createQueryString = React.useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset pagination when filtering/sorting changes
      if (name !== "cursor") {
        params.delete("cursor");
      }
      return params.toString();
    },
    [searchParams],
  );

  const handleFilterChange = (key: string, value: string) => {
    // Select components might pass "all" or "" as the clear value
    const finalValue = value === "all" ? "" : value;
    setIsPending(() => {
      router.push(`${pathname}?${createQueryString(key, finalValue)}`);
    });
  };

  const handleSort = (field: string) => {
    const currentSort = searchParams.get("sortBy") || "created_at";
    const currentDir = searchParams.get("sortDir") || "desc";

    let newDir = "desc";
    if (currentSort === field && currentDir === "desc") {
      newDir = "asc";
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", field);
    params.set("sortDir", newDir);
    params.delete("cursor"); // Reset to page 1 on sort change

    setIsPending(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const getSortIcon = (field: string) => {
    const currentSort = searchParams.get("sortBy") || "created_at";
    const currentDir = searchParams.get("sortDir") || "desc";

    if (currentSort !== field)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return currentDir === "desc" ? (
      <ArrowDown className="ml-2 h-4 w-4" />
    ) : (
      <ArrowUp className="ml-2 h-4 w-4" />
    );
  };

  const handleNextPage = () => {
    if (!hasMore || contracts.length === 0) return;
    const lastContract = contracts[contracts.length - 1];
    setIsPending(() => {
      router.push(
        `${pathname}?${createQueryString("cursor", lastContract.id)}`,
      );
    });
  };

  const getRiskBadge = (score: number | null) => {
    if (score === null)
      return (
        <Badge
          variant="secondary"
          className="font-normal text-muted-foreground bg-gray-100"
        >
          Unscored
        </Badge>
      );
    if (score >= 70)
      return (
        <Badge variant="destructive" className="font-medium shadow-sm">
          High Risk
        </Badge>
      );
    if (score >= 40)
      return (
        <Badge
          variant="default"
          className="font-medium bg-amber-500 hover:bg-amber-600 shadow-sm text-white"
        >
          Medium Risk
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="font-medium border-emerald-500 text-emerald-600 bg-emerald-50"
      >
        Low Risk
      </Badge>
    );
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "IN_REVIEW":
        return (
          <Badge
            variant="outline"
            className="border-blue-200 bg-blue-50 text-blue-700"
          >
            In Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="border-red-200 bg-red-50 text-red-700"
          >
            Rejected
          </Badge>
        );
      case "EXECUTED":
        return (
          <Badge variant="default" className="bg-slate-800 text-slate-100">
            Executed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("status") ||
    searchParams.has("risk") ||
    searchParams.has("expires");

  return (
    <div className="space-y-4">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contracts..."
            className="pl-9 bg-white shadow-sm transition-all focus-visible:ring-primary/20"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(val) => handleFilterChange("status", val || "")}
          >
            <SelectTrigger className="w-[130px] bg-white shadow-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="EXECUTED">Executed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("risk") || "all"}
            onValueChange={(val) => handleFilterChange("risk", val || "")}
          >
            <SelectTrigger className="w-[130px] bg-white shadow-sm">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="HIGH">High Risk</SelectItem>
              <SelectItem value="MEDIUM">Medium Risk</SelectItem>
              <SelectItem value="LOW">Low Risk</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("expires") || "all"}
            onValueChange={(val) => handleFilterChange("expires", val || "")}
          >
            <SelectTrigger className="w-[130px] bg-white shadow-sm">
              <SelectValue placeholder="Expiring" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any time</SelectItem>
              <SelectItem value="30">Within 30 days</SelectItem>
              <SelectItem value="60">Within 60 days</SelectItem>
              <SelectItem value="90">Within 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Area */}
      <div
        className={`rounded-md border bg-white shadow-sm overflow-hidden transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        <Table>
          <TableHeader className="bg-muted/50 hover:bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Contract Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort("risk_score")}
              >
                <div className="flex items-center">
                  Risk Level
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity data-[active=true]:opacity-100"
                    data-active={searchParams.get("sortBy") === "risk_score"}
                  >
                    {getSortIcon("risk_score")}
                  </span>
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none group"
                onClick={() => handleSort("due_date")}
              >
                <div className="flex items-center">
                  Due Date
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity data-[active=true]:opacity-100"
                    data-active={searchParams.get("sortBy") === "due_date"}
                  >
                    {getSortIcon("due_date")}
                  </span>
                </div>
              </TableHead>
              <TableHead
                className="text-right cursor-pointer select-none group"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center justify-end">
                  Created At
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity data-[active=true]:opacity-100"
                    data-active={
                      !searchParams.get("sortBy") ||
                      searchParams.get("sortBy") === "created_at"
                    }
                  >
                    {getSortIcon("created_at")}
                  </span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    {totalCount === 0 ? (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-medium">
                            No contracts yet
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Upload your first contract to get started.
                          </p>
                        </div>
                        <Link
                          href="/contracts/upload"
                          className={buttonVariants({ className: "mt-4" })}
                        >
                          Upload Contract
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-lg font-medium">
                            No matching contracts found
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Try adjusting your filters or search query.
                          </p>
                        </div>
                        {hasFilters && (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => {
                              setQuery("");
                              router.push(pathname);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Clear filters
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  className="h-16 group hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                    {contract.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>{getRiskBadge(contract.risk_score)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.due_date
                      ? new Date(contract.due_date).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasMore || isPending}
          className="shadow-sm"
        >
          Next Page
        </Button>
      </div>
    </div>
  );
}
