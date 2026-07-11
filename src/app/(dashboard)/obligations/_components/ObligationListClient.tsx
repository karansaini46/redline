"use client";

import { useOptimistic, startTransition, useState, useMemo } from "react";
import { Obligation, Contract, User, ObligationStatus } from "@prisma/client";
import { updateObligationStatusAction } from "@/app/actions/obligationActions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ObligationWithRelations = Obligation & {
  contract: Contract;
  owner: User | null;
};

export function ObligationListClient({
  initialObligations,
  orgId,
}: {
  initialObligations: ObligationWithRelations[];
  orgId: string;
}) {
  const [optimisticObligations, addOptimistic] = useOptimistic(
    initialObligations,
    (state, { id, status }: { id: string; status: ObligationStatus }) => {
      return state.map((o) => (o.id === id ? { ...o, status } : o));
    },
  );

  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");

  const filtered = useMemo(() => {
    let res = optimisticObligations;
    if (ownerFilter !== "ALL") {
      res = res.filter((o) => o.owner_id === ownerFilter);
    }
    if (statusFilter !== "ALL") {
      res = res.filter((o) => o.status === statusFilter);
    }
    return res.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date.getTime() - b.due_date.getTime();
    });
  }, [optimisticObligations, ownerFilter, statusFilter]);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of initialObligations) {
      if (o.owner_id && o.owner) {
        map.set(o.owner_id, o.owner.email);
      }
    }
    return Array.from(map.entries());
  }, [initialObligations]);

  const handleStatusChange = (
    id: string,
    newStatus: ObligationStatus,
    oldStatus: ObligationStatus,
  ) => {
    startTransition(() => {
      addOptimistic({ id, status: newStatus });
    });

    updateObligationStatusAction(orgId, id, newStatus).catch(() => {
      toast.error("Failed to update obligation");
      startTransition(() => {
        addOptimistic({ id, status: oldStatus });
      });
    });

    toast.success(`Obligation marked as ${newStatus.toLowerCase()}`, {
      duration: 4000,
      action: {
        label: "Undo",
        onClick: () => {
          startTransition(() => {
            addOptimistic({ id, status: oldStatus });
          });
          updateObligationStatusAction(orgId, id, oldStatus).catch(() => {
            toast.error("Failed to undo");
          });
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
        >
          <option value="ALL">All Owners</option>
          {owners.map(([id, email]) => (
            <option key={id} value={id}>
              {email}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="DONE">Done</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filtered.map((obligation) => (
          <div
            key={obligation.id}
            className="flex flex-col gap-4 rounded-lg border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    obligation.status === "OPEN"
                      ? "default"
                      : obligation.status === "DONE"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {obligation.status}
                </Badge>
                <h3 className="font-semibold">{obligation.description}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {obligation.due_date
                    ? format(new Date(obligation.due_date), "MMM d, yyyy")
                    : "No Due Date"}
                </div>
                <div>Contract: {obligation.contract.title}</div>
                <div>Owner: {obligation.owner?.email || "Unassigned"}</div>
              </div>
            </div>

            {obligation.status === "OPEN" && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    handleStatusChange(obligation.id, "DONE", "OPEN")
                  }
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Done
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2 text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    handleStatusChange(obligation.id, "DISMISSED", "OPEN")
                  }
                >
                  <XCircle className="h-4 w-4" /> Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No obligations found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
}
