"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useStore } from "zustand";
import Sidebar from "~/components/Sidebar";
import { useAuthStore } from "~/store/auth.store";
import { useStoreReady } from "~/store/useStore";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const accessToken = useStore(useAuthStore, (state) => state.accessToken);
  const storeReady = useStoreReady();
  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!storeReady) return;
    if (!accessToken) {
      console.error("Unauthorized, redirecting to login");
      queryClient.clear();
      router.push("/auth");
    }
  }, [storeReady, accessToken]);

  if (!accessToken) {
    return null; // Or a loading spinner if you prefer
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
