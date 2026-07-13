"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Settings,
  HardDrive,
  Building2,
  ChevronDown,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar({ orgName = "Organization" }: { orgName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Contracts", href: "/dashboard/contracts", icon: FileText },
    { name: "Obligations", href: "/dashboard/obligations", icon: Calendar },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r border-border/40 bg-surface/50 backdrop-blur-xl transition-all duration-300">
      {/* Org Switcher */}
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center gap-3 w-full p-1.5 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group">
          <div className="size-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
            <Building2 className="size-3.5" />
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-medium text-sm truncate text-foreground">{orgName}</h3>
          </div>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </div>
      </div>
      
      <div className="flex-1 overflow-auto py-4 px-3 flex flex-col gap-6">
        <div>
          <div className="px-3 mb-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Workspace
          </div>
          <nav className="grid items-start gap-0.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive 
                      ? "text-foreground bg-muted/50 shadow-sm border-l-2 border-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <item.icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Footer Area */}
      <div className="mt-auto p-4 border-t border-border/40 space-y-4">
        {/* Premium Active Indicator */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
          <Activity className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Enterprise Active</span>
        </div>
      </div>
    </div>
  );
}
