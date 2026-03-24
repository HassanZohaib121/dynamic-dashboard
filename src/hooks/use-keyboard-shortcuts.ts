"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Shortcut {
  key: string;
  meta?: boolean;   // Cmd on Mac, Ctrl on Windows
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire inside inputs / textareas / contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      for (const s of shortcuts) {
        const metaMatch  = s.meta  ? (e.metaKey || e.ctrlKey) : true;
        const shiftMatch = s.shift ? e.shiftKey               : !e.shiftKey;
        if (e.key.toLowerCase() === s.key.toLowerCase() && metaMatch && shiftMatch) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

// Pre-built shortcuts for the model page
export function useModelPageShortcuts(modelName: string) {
  const router = useRouter();

  useKeyboardShortcuts([
    {
      key: "n",
      description: "New record",
      handler: () => router.push(`/dashboard/${modelName}/new`),
    },
    {
      key: "f",
      description: "Go to fields",
      handler: () => router.push(`/dashboard/${modelName}/fields`),
    },
    {
      key: "/",
      description: "Focus search",
      handler: () => {
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder="Search records…"]'
        );
        input?.focus();
      },
    },
  ]);
}