"use client";

import { useModels } from "@/hooks/use-models";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { models, loading, refresh } = useModels();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  // ⏳ prevent UI flicker
  if (isPending) {
    return <p className="p-6">Loading...</p>;
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screenbg-background">
      <Sidebar models={models} loading={loading} onModelCreated={refresh} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
