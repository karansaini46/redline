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

export function Sidebar() {
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
            <h3 className="font-medium text-sm truncate text-foreground">Acme Corp</h3>
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
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-md bg-primary/10 dark:bg-primary/20 z-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <item.icon className="size-4 relative z-10" />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Footer Area */}
      <div className="mt-auto p-4 flex flex-col gap-4">
        {/* Storage */}
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 relative overflow-hidden group hover:border-border/80 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="size-3.5 text-muted-foreground" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Storage</span>
            </div>
            <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">75%</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "75%" }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
              className="h-full bg-primary" 
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">7.5 GB of 10 GB used</p>
        </div>
        
        {/* Premium Active Indicator */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/5 border border-primary/10">
          <Activity className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Enterprise Active</span>
        </div>
      </div>
    </div>
  );
}
