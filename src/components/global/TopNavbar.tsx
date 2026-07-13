"use client";

import { Search, Bell, Moon, Sun, Plus, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function TopNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [avatar, setAvatar] = useState("https://api.dicebear.com/9.x/micah/svg?seed=Alexander&backgroundColor=transparent");
  const router = useRouter();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Load from localStorage if present
    const stored = localStorage.getItem("userAvatar");
    if (stored) {
      setAvatar(stored);
    }

    // Listen for custom event from Settings page
    const handleAvatarChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setAvatar(customEvent.detail);
      }
    };
    
    window.addEventListener("avatarChanged", handleAvatarChange);
    return () => window.removeEventListener("avatarChanged", handleAvatarChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center gap-4">
        <button className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50 w-64">
          <Search className="size-4" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/dashboard/contracts/upload")}
          className="h-8 gap-2 rounded-full hidden md:flex"
        >
          <Plus className="size-4" />
          <span>New</span>
        </Button>

        <div className="h-4 w-px bg-border mx-1 hidden md:block" />

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Bell className="size-4 text-muted-foreground" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            theme === "dark" ? (
              <Moon className="size-4 text-muted-foreground" />
            ) : (
              <Sun className="size-4 text-muted-foreground" />
            )
          ) : (
            <div className="size-4" />
          )}
        </Button>
        
        <div className="relative">
          <div onClick={() => setIsProfileOpen(!isProfileOpen)}>
            <Avatar className="size-8 cursor-pointer ring-1 ring-border ml-2 transition-transform hover:scale-105">
              <AvatarImage src={avatar} alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsProfileOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-border/50 bg-surface shadow-lg z-50 overflow-hidden origin-top-right"
                >
                  <div className="p-4 border-b border-border/50 bg-muted/10">
                    <p className="text-sm font-medium font-serif">Karan Saini</p>
                    <p className="text-xs text-muted-foreground truncate">karan@redline.com</p>
                  </div>
                  <div className="p-2 flex flex-col gap-1">
                    <Link 
                      href="/dashboard/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <UserIcon className="size-4 text-muted-foreground" />
                      <span>Profile</span>
                    </Link>
                    <Link 
                      href="/dashboard/settings" 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted/50 transition-colors text-foreground"
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      <span>Settings</span>
                    </Link>
                  </div>
                  <div className="p-2 border-t border-border/50">
                    <button 
                      onClick={() => setIsProfileOpen(false)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 hover:text-destructive text-foreground transition-colors"
                    >
                      <LogOut className="size-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
