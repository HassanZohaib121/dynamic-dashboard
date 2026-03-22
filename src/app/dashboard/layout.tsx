// app/dashboard/layout.tsx
"use client";

import { useModels } from "@/hooks/use-models";
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { models, loading, refresh } = useModels();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar models={models} loading={loading} onModelCreated={refresh} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
