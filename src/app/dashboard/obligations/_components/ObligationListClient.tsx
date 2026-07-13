"use client";

import { useOptimistic, startTransition, useState, useMemo } from "react";
import { Obligation, Contract, User, ObligationStatus } from "@prisma/client";
import { updateObligationStatusAction } from "@/app/actions/obligationActions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { CheckCircle2, XCircle, Clock, CalendarIcon, AlertCircle, CalendarCheck, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FadeIn, StaggerContainer, StaggerItem, ScaleHover } from "@/components/ui/motion";
import { EmptyState } from "@/components/ui/empty-state";

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

  const getPriorityInfo = (date: Date | null) => {
    if (!date) return { color: "bg-muted text-muted-foreground", label: "No Date", icon: CalendarIcon };
    if (isPast(date) && !isToday(date)) return { color: "bg-destructive/10 text-destructive border-destructive/20", label: "Overdue", icon: AlertCircle };
    if (isToday(date)) return { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "Due Today", icon: Clock };
    if (isTomorrow(date)) return { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Due Tomorrow", icon: Clock };
    return { color: "bg-primary/10 text-primary border-primary/20", label: `In ${formatDistanceToNow(date)}`, icon: CalendarCheck };
  };

  return (
    <FadeIn className="space-y-8 w-full">
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-surface p-4 rounded-xl border border-border/40 shadow-sm">
        <div className="flex items-center gap-2 mr-auto">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Obligation Timeline</h2>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={ownerFilter} onValueChange={(val) => setOwnerFilter(val || "ALL")}>
            <SelectTrigger className="w-[180px] bg-surface h-9">
              <SelectValue placeholder="All Owners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Owners</SelectItem>
              {owners.map(([id, email]) => (
                <SelectItem key={id} value={id}>{email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "ALL")}>
            <SelectTrigger className="w-[150px] bg-surface h-9">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
              <SelectItem value="DISMISSED">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((obligation) => {
            const priority = getPriorityInfo(obligation.due_date);
            const isOpen = obligation.status === "OPEN";

            return (
              <StaggerItem key={obligation.id}>
                <ScaleHover className={`relative flex flex-col gap-4 rounded-xl border border-border/40 bg-surface p-6 shadow-sm h-full overflow-hidden transition-all duration-300 hover:shadow-md hover:border-border/80 ${!isOpen ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                  {/* Status Strip */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${isOpen ? (priority.label === 'Overdue' ? 'bg-destructive' : 'bg-primary') : 'bg-muted'}`} />
                  
                  <div className="flex items-start justify-between gap-4 ml-2">
                    <Badge
                      variant={isOpen ? "default" : obligation.status === "DONE" ? "secondary" : "outline"}
                      className={`font-medium ${isOpen ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                    >
                      {obligation.status}
                    </Badge>
                    {isOpen && obligation.due_date && (
                      <Badge variant="outline" className={`font-medium border ${priority.color} flex items-center gap-1 shadow-sm`}>
                        <priority.icon className="h-3 w-3" />
                        {priority.label}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-3 flex-1 ml-2 mt-2">
                    <h3 className="font-bold text-lg leading-tight text-foreground">{obligation.description}</h3>
                    
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/40">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium">Due: </span>
                        {obligation.due_date ? format(new Date(obligation.due_date), "MMM d, yyyy") : "No Due Date"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <div className="size-2 rounded-full bg-primary" />
                        </div>
                        <span className="font-medium truncate">{obligation.contract.title}</span>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="flex items-center gap-2 mt-4 ml-2 pt-4 border-t border-border/50">
                      <Button
                        size="sm"
                        className="flex-1 gap-2 rounded-full shadow-sm"
                        onClick={() => handleStatusChange(obligation.id, "DONE", "OPEN")}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-2 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={() => handleStatusChange(obligation.id, "DISMISSED", "OPEN")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </ScaleHover>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      ) : (
        <div className="pt-8">
          <EmptyState 
            icon={CalendarCheck} 
            title="No obligations found" 
            description="There are no obligations matching your current filters."
            primaryAction={statusFilter !== 'ALL' || ownerFilter !== 'ALL' ? {
              label: "Clear Filters",
              onClick: () => {
                setStatusFilter('ALL');
                setOwnerFilter('ALL');
              }
            } : undefined}
          />
        </div>
      )}
    </FadeIn>
  );
}
