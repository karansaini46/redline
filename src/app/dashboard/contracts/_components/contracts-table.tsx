"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Contract, ContractStatus, ContractVersion, ProcessingStatus } from "@prisma/client";
import {
  Search,
  FileText,
  XCircle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Loader2,
  CheckCircle2,
  FolderOpen,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerContainer, StaggerItem, ScaleHover } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";
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
import { toast } from "sonner";
import { deleteContractAction } from "@/app/actions/contractActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ContractWithVersion = Contract & {
  versions?: ContractVersion[];
};

interface ContractsTableProps {
  contracts: ContractWithVersion[];
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
  const [contractToDelete, setContractToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteContractAction(contractToDelete);
      toast.success("Contract deleted successfully");
    } catch (error) {
      toast.error("Failed to delete contract");
    } finally {
      setIsDeleting(false);
      setContractToDelete(null);
    }
  };

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

  // Polling for pending contracts
  React.useEffect(() => {
    const hasPendingContracts = contracts.some((c) => {
      const status = c.versions?.[0]?.processing_status;
      return status === "PENDING" || status === "EXTRACTING";
    });

    if (hasPendingContracts) {
      const interval = setInterval(() => {
        router.refresh();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [contracts, router]);

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
          className="font-medium text-muted-foreground bg-muted hover:bg-muted"
        >
          Unscored
        </Badge>
      );
    if (score >= 70)
      return (
        <Badge variant="outline" className="font-medium bg-destructive/10 text-destructive border-transparent hover:bg-destructive/20">
          High Risk
        </Badge>
      );
    if (score >= 40)
      return (
        <Badge
          variant="outline"
          className="font-medium bg-warning/10 text-warning border-transparent hover:bg-warning/20"
        >
          Medium Risk
        </Badge>
      );
    return (
      <Badge
        variant="outline"
        className="font-medium bg-success/10 text-success border-transparent hover:bg-success/20"
      >
        Low Risk
      </Badge>
    );
  };

  const getStatusBadge = (status: ContractStatus) => {
    switch (status) {
      case "DRAFT":
        return <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">Draft</Badge>;
      case "IN_REVIEW":
        return (
          <Badge
            variant="outline"
            className="border-transparent bg-primary/10 text-primary hover:bg-primary/20"
          >
            In Review
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="border-transparent bg-success/10 text-success hover:bg-success/20"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20"
          >
            Rejected
          </Badge>
        );
      case "EXECUTED":
        return (
          <Badge variant="default" className="bg-primary text-primary-foreground shadow-sm">
            Executed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProcessingBadge = (status?: ProcessingStatus) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary" className="text-muted-foreground bg-muted hover:bg-muted"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Pending</Badge>;
      case "EXTRACTING":
        return <Badge variant="outline" className="border-transparent bg-primary/10 text-primary hover:bg-primary/20"><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing...</Badge>;
      case "EXTRACTED":
        return <Badge variant="outline" className="border-transparent bg-success/10 text-success hover:bg-success/20"><CheckCircle2 className="mr-1 h-3 w-3" /> Complete</Badge>;
      case "FAILED":
        return <Badge variant="outline" className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20"><XCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">Unknown</Badge>;
    }
  };

  const hasFilters =
    searchParams.has("q") ||
    searchParams.has("status") ||
    searchParams.has("risk") ||
    searchParams.has("expires");

  return (
    <FadeIn className="space-y-6 w-full">
      {/* Filters Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search contracts..."
            className="pl-9 bg-surface shadow-sm transition-all focus-visible:ring-primary/20 h-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(val) => handleFilterChange("status", val || "")}
          >
            <SelectTrigger className="w-[130px] bg-surface shadow-sm h-9">
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
            <SelectTrigger className="w-[130px] bg-surface shadow-sm h-9">
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
            <SelectTrigger className="w-[130px] bg-surface shadow-sm h-9">
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
        className={`rounded-md border bg-background shadow-sm overflow-hidden transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        <Table>
          <TableHeader className="bg-muted/50 hover:bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">Contract Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>AI Analysis</TableHead>
              <TableHead
                className="cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                tabIndex={0}
                onClick={() => handleSort("risk_score")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSort("risk_score");
                }}
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
                className="cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                tabIndex={0}
                onClick={() => handleSort("due_date")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSort("due_date");
                }}
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
                className="text-right cursor-pointer select-none group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                tabIndex={0}
                onClick={() => handleSort("created_at")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSort("created_at");
                }}
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex justify-center p-4">
                    {totalCount === 0 ? (
                      <EmptyState
                        icon={FolderOpen}
                        title="No contracts yet"
                        description="Upload your first contract to get started with AI analysis."
                        primaryAction={{
                          label: "Upload Contract",
                          onClick: () => router.push("/dashboard/contracts/upload")
                        }}
                      />
                    ) : (
                      <EmptyState
                        icon={Search}
                        title="No matching contracts found"
                        description="Try adjusting your filters or search query."
                        primaryAction={hasFilters ? {
                          label: "Clear filters",
                          onClick: () => {
                            setQuery("");
                            router.push(pathname);
                          }
                        } : undefined}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow
                  key={contract.id}
                  onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
                  className="h-16 group hover:bg-muted/50 hover:shadow-sm cursor-pointer transition-all duration-200"
                >
                  <TableCell className="font-medium group-hover:text-primary transition-colors">
                    {contract.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell>{getProcessingBadge(contract.versions?.[0]?.processing_status)}</TableCell>
                  <TableCell>{getRiskBadge(contract.risk_score)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {contract.due_date
                      ? format(new Date(contract.due_date), "MMM d, yyyy")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {format(new Date(contract.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setContractToDelete(contract.id);
                      }}
                      disabled={isDeleting && contractToDelete === contract.id}
                    >
                      {isDeleting && contractToDelete === contract.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasMore || isPending}
          className="shadow-sm rounded-full px-6"
        >
          {isPending ? "Loading..." : "Load More"}
        </Button>
      </div>
      <Dialog open={!!contractToDelete} onOpenChange={(open) => !open && setContractToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contract? This action cannot be undone and will permanently delete all associated data, clauses, and risk assessments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContractToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FadeIn>
  );
}
