"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useUnsavedChanges(isDirty: boolean) {
  // Warn on browser tab close / refresh
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Wrap router.push to confirm before navigating
  const router = useRouter();

  const safeNavigate = useCallback(
    (href: string) => {
      if (!isDirty) {
        router.push(href);
        return;
      }
      const ok = window.confirm(
        "You have unsaved changes. Leave without saving?"
      );
      if (ok) router.push(href);
    },
    [isDirty, router]
  );

  return { safeNavigate };
}