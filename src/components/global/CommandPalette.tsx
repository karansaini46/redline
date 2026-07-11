"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { searchGlobalContracts } from "@/server/contracts/search";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FileText,
  UploadCloud,
  LayoutDashboard,
  Calendar,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();

  const [query, setQuery] = React.useState("");
  const [contracts, setContracts] = React.useState<
    { id: string; title: string; status: string }[]
  >([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    const fetchContracts = async () => {
      if (query.trim().length === 0) {
        setContracts([]);
        return;
      }
      setLoading(true);
      const res = await searchGlobalContracts(query);
      if (res.success && res.contracts) {
        setContracts(res.contracts);
      }
      setLoading(false);
    };

    const debounce = setTimeout(() => {
      fetchContracts();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Type a command or search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {contracts.length > 0 && (
          <CommandGroup heading="Contracts">
            {contracts.map((contract) => (
              <CommandItem
                key={contract.id}
                value={contract.id}
                onSelect={() =>
                  runCommand(() => router.push(`/contracts/${contract.id}`))
                }
              >
                <FileText className="mr-2 h-4 w-4" />
                <span>{contract.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push("/contracts/upload"))}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            <span>New Upload</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push("/obligations"))}
          >
            <Calendar className="mr-2 h-4 w-4" />
            <span>Obligations</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
