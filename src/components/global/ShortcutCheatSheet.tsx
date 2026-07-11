"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const shortcuts = [
  { keys: ["⌘", "K"], description: "Open Command Palette (or Ctrl+K)" },
  { keys: ["?"], description: "Show Keyboard Shortcuts" },
  { keys: ["Tab"], description: "Navigate Focus" },
  { keys: ["Enter"], description: "Submit / Select" },
  { keys: ["Esc"], description: "Close Modals / Palette" },
];

export function ShortcutCheatSheet() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.key === "?" && !e.shiftKey) {
        // Shift+? is often ?, but some keyboards it's just ?.
        // Let's just catch "?" character
      }

      if (e.key === "?") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {shortcuts.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, j) => (
                  <kbd
                    key={j}
                    className="pointer-events-none inline-flex h-6 items-center gap-1 rounded border bg-muted px-2 text-[10px] font-medium font-mono text-muted-foreground opacity-100"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
