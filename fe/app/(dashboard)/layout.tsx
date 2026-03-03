"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/sidebar";

const PUBLIC_PATHS = ["/login", "/register"];

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!isPublic && !isAuthenticated) {
      router.replace("/login");
      return;
    }
  }, [isReady, isAuthenticated, pathname, router]);

  const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
  if (isPublic) {
    return <>{children}</>;
  }

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col sm:flex-row">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden bg-zinc-50">
        {children}
      </main>
    </div>
  );
}
